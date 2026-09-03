-- Урок 15: индексы. Запуск: psql practice
DROP TABLE IF EXISTS events;
CREATE TABLE events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INT NOT NULL,
    action TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO events (user_id, action, payload)
SELECT g, (ARRAY['login','buy','view'])[1 + g % 3],
       jsonb_build_object('plan', (ARRAY['free','pro'])[1 + g % 2])
FROM generate_series(1, 10000) g;
ANALYZE events;

-- TODO: составной (user_id, created_at DESC)
-- TODO: partial (user_id) WHERE action='buy'
-- TODO: covering (user_id) INCLUDE (action)
-- TODO: GIN на payload (jsonb_path_ops)

-- TODO: EXPLAIN (ANALYZE, BUFFERS) — «10 последних user 42» (до/после)
-- SELECT * FROM events WHERE user_id = 42 ORDER BY created_at DESC LIMIT 10;

-- TODO: EXPLAIN — partial-индекс (action='buy')
-- SELECT * FROM events WHERE user_id = 42 AND action = 'buy';

-- TODO: EXPLAIN — GIN по payload
-- SELECT count(*) FROM events WHERE payload ->> 'plan' = 'pro';

-- SELECT indexname FROM pg_indexes WHERE tablename = 'events';
