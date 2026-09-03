-- Урок 5: INSERT / ON CONFLICT / COPY. Запуск: psql practice
DROP TABLE IF EXISTS feed_backlog, feed;

-- TODO: таблица источников
CREATE TABLE feed (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    source TEXT NOT NULL UNIQUE,
    url TEXT NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TODO: 3 источника одной командой (VALUES, VALUES, VALUES)
INSERT INTO feed (source, url) VALUES
    ('github', 'https://github.com'),
    ('mdn', 'https://developer.mozilla.org'),
    ('postgres', 'https://www.postgresql.org');

-- TODO: повторная вставка 'github' с новым URL — DO NOTHING
-- затем DO UPDATE SET url = EXCLUDED.url, fetched_at = now()

-- TODO: вставка с RETURNING (новый источник 'hackernews')
INSERT INTO feed (source, url) VALUES ('hackernews', 'https://news.ycombinator.com')
RETURNING id, source;

-- TODO: SELECT INTO из запроса
CREATE TABLE feed_backlog AS
SELECT * FROM feed WHERE fetched_at > now() - interval '1 hour';

SELECT count(*) AS backlog FROM feed_backlog;
