-- Урок 13: транзакции, SAVEPOINT, уровни изоляции. ДВЕ сессии psql.
DROP TABLE IF EXISTS accounts;
CREATE TABLE accounts (
    id INT PRIMARY KEY,
    balance NUMERIC(10, 2) NOT NULL
);
INSERT INTO accounts VALUES (1, 1000), (2, 1000);

-- ===== Сессия A =====
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
-- (НЕ COMMIT — проверь в сессии B, что значения «старые»)
SAVEPOINT sp1;
UPDATE accounts SET balance = balance + 10 WHERE id = 2;   -- «лишнее»
ROLLBACK TO sp1;                                            -- откат «лишнего»
COMMIT;

-- ===== Сессия B =====
-- TODO: SELECT * FROM accounts (до COMMIT A — старые значения)
-- TODO: после COMMIT A — пересмотри

-- ===== SERIALIZABLE + lock_timeout =====
-- Сессия A:
--   BEGIN ISOLATION LEVEL SERIALIZABLE;
--   UPDATE accounts SET balance = balance - 1 WHERE id = 1;  (не COMMIT)
-- Сессия B:
--   SET lock_timeout = '2s';
--   BEGIN ISOLATION LEVEL SERIALIZABLE;
--   UPDATE accounts SET balance = balance + 1 WHERE id = 1;  -- ожидает 2с -> 55P03
-- COMMIT/ROLLBACK в обеих.
