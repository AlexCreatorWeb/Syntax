-- Урок 16: EXPLAIN. Запуск: psql practice (нужны tables из урока 15: events).
-- Если events нет — создай по скрипту урока 15 (10k строк).

-- TODO: (1) EXPLAIN (ANALYZE, BUFFERS) — «3 последних user 7»
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM events WHERE user_id = 7 ORDER BY created_at DESC LIMIT 3;

-- TODO: (2) Seq Scan — «нормальный» (count по всей таблице)
EXPLAIN (ANALYZE) SELECT count(*) FROM events;

-- TODO: (3) JOIN users × orders: Hash Join, затем enable_hashjoin=off
-- (создай users 1k, orders 100k, если нет)
-- EXPLAIN (ANALYZE) SELECT u.name, count(o.id) FROM users u JOIN orders o ON o.user_id = u.id GROUP BY u.name;
-- SET enable_hashjoin = off;
-- EXPLAIN SELECT u.name, count(o.id) FROM users u JOIN orders o ON o.user_id = u.id GROUP BY u.name;
-- SET enable_hashjoin = on;

-- TODO: (4) устаревшая статистика: 50k INSERT без ANALYZE -> «кривая» оценка -> ANALYZE -> повтор
-- INSERT INTO events (user_id, action) SELECT g, 'buy' FROM generate_series(1, 50000) g;
-- EXPLAIN SELECT count(*) FROM events WHERE action = 'buy';
-- ANALYZE events;
-- EXPLAIN SELECT count(*) FROM events WHERE action = 'buy';

-- pg_stat_statements (если расширение включено):
-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
-- SELECT query, calls, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;
