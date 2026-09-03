# Урок 14. Конкурентность и блокировки

## Цель

После урока студент сможет: объяснять, как PG блокирует строки (row-level locking), находить и читать deadlock, использовать NOWAIT / SKIP LOCKED для «очередей» и мониторинга блокировок.

## Теория

PostgreSQL блокирует СТРОКИ (не страницы/таблицы — на уровне MVCC). Правила:
- UPDATE/DELETE строки — «исключительная» блокировка (X-lock) на строку: другие сессии не могут UPDATE/DELETE её, покуда транзакция жива.
- SELECT (обычный) — НЕ блокирует (читает «снапшот» — MVCC: каждая версия строки независима).
- SELECT ... FOR UPDATE / FOR SHARE — блокирует строку «вперёд» (для «забрать задачу из очереди»).

Deadlock (цикл): сессия A держит lock на строку 1 и просит строку 2; сессия B держит 2 и просит 1. Сервер «замечает» цикл и откатывает ОДНУ из сессий (ошибка: deadlock detected). Профилактика: единый «порядок» доступа к строкам (всегда «сначала по id ASC») — цикл «не замыкается».

Инструменты ожидания:
- SET lock_timeout = '2s' — «ждать lock не более 2 секунд» (ошибка 55P03 lock_not_available).
- UPDATE ... NOWAIT — «сразу либо не ждать вовсе» (ошибка, если занят).
- UPDATE ... SKIP LOCKED — «пропусти занятые» — канонический паттерн очередей: несколько воркеров берут разные свободные задачи без ожидания.

lock_timeout — «страховка» на уровне сессии: «если lock не отпустят за N секунд — не стоять, а упасть с ошибкой» (приложение решит: retry/отказ).

Мониторинг: pg_stat_activity (state, wait_event, query_start), pg_locks (кто держит/ждёт), pg_blocking_pids() — «кто блокирует меня».

## Пример

```sql
CREATE TABLE jobs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    payload TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new',
    worker TEXT
);
INSERT INTO jobs (payload) SELECT 'job ' || g FROM generate_series(1, 5) g;

-- воркер: «возьми одну свободную задачу» (не ждать чужие):
BEGIN;
UPDATE jobs SET worker = 'w1', status = 'taken'
WHERE id IN (SELECT id FROM jobs WHERE status = 'new' ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED)
RETURNING id, payload;
COMMIT;

-- lock_timeout против «медленного соседа»:
SET lock_timeout = '2s';
UPDATE jobs SET status = 'done' WHERE id = 1;   -- если 1 в чужом BEGIN — ошибка 55P03 за 2 с

-- кто кого блокирует:
SELECT blocked.pid AS blocked_pid, blocking.pid AS blocking_pid, blocked.query
FROM pg_stat_activity blocked
JOIN LATERAL (SELECT pid FROM pg_stat_activity
              WHERE pid = ANY (pg_blocking_pids(blocked.pid))) blocking ON true
WHERE blocked.state <> 'idle';
```

## Частые ошибки

WARN: «Сначала SELECT, потом UPDATE» без FOR UPDATE — две сессии одновременно «видят» строку свободной и обе её берут (двойная обработка задачи). Атомарно: UPDATE ... WHERE ... FOR UPDATE SKIP LOCKED или UPDATE с RETURNING.

WARN: Длинная транзакция держит X-lock «в подвешенном» состоянии: другие сессии стоят в lock-wait (state = active, wait_event = lock), а виновник — idle in transaction. Ищи в pg_stat_activity.

WARN: Deadlock «решает» retry — да, но без порядка доступа к строкам (всегда «сначала по id ASC») deadlock'и будут регулярными.

WARN: FOR UPDATE на «большом» SELECT (сотни тыс. строк) — «замораживает» выборку для других сессий до COMMIT. Минимизируй объём/длительность.

TIP: Для очередей — «захват» через `UPDATE ... WHERE status='new' AND id IN (SELECT ... FOR UPDATE SKIP LOCKED LIMIT k) RETURNING *` — без гонок, без ожидания.

## Практическое задание

1. Создай `queue (id PK, task TEXT, state TEXT DEFAULT 'new', worker TEXT)`; вставь 6 задач.
2. Сессия A: BEGIN; возьми задачу id=1 (UPDATE ... FOR UPDATE). Без COMMIT — сессия B: попробуй UPDATE той же строки (поставь `SET lock_timeout='1s'` и зафиксируй 55P03). COMMIT в A.
3. Сессия B: «возьми следующую свободную» через SKIP LOCKED (в A держи 1..2 задачи) — убедись, что B получила НЕ заблокированную.
4. Вызови deadlock вручную: A держит 1 и ждёт 2; B держит 2 и ждёт 1 — зафиксируй «deadlock detected» и откат одной сессии.
5. Ответь письменно: чем `FOR UPDATE` отличается от `FOR SHARE`? Когда достаточно SHARE?

Файл `queries.sql` — заполни TODO (две сессии пометками A/B).
