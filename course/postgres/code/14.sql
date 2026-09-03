-- Урок 14: блокировки, SKIP LOCKED, deadlock. Запуск: ДВЕ сессии psql.
DROP TABLE IF EXISTS queue;
CREATE TABLE queue (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    task TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'new',
    worker TEXT
);
INSERT INTO queue (task) SELECT 'task ' || g FROM generate_series(1, 6) g;

-- ===== Сессия A =====
-- TODO: BEGIN; взять id=1 (FOR UPDATE); НЕ COMMIT
BEGIN;
UPDATE queue SET state = 'taken', worker = 'A' WHERE id = 1 FOR UPDATE;
-- (оставь транзакцию открытой, переключись в сессию B)

-- ===== Сессия B =====
-- TODO: SET lock_timeout='1s'; UPDATE id=1 -> ожидай 55P03
SET lock_timeout = '1s';
-- UPDATE queue SET state='taken', worker='B' WHERE id = 1;

-- TODO: взять следующую свободную через SKIP LOCKED
UPDATE queue SET state = 'taken', worker = 'B'
WHERE id IN (SELECT id FROM queue WHERE state = 'new' ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED)
RETURNING id, task;

-- ===== Сессия A (продолжение, для deadlock) =====
-- TODO: A просит id=3 (FOR UPDATE), B держит id=3 и просит id=1 -> deadlock detected
-- (B: BEGIN; UPDATE id=3 FOR UPDATE; A: UPDATE id=3 FOR UPDATE; -> одна сессия откатится)

-- ===== завершение =====
-- COMMIT в обеих; SELECT * FROM queue ORDER BY id;
