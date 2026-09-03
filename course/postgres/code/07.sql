-- Урок 7: ORDER BY, LIMIT/OFFSET, keyset. Запуск: psql practice
DROP TABLE IF EXISTS posts;

-- TODO: таблица + 25 строк (generate_series + random-даты)
CREATE TABLE posts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    score INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL
);

INSERT INTO posts (title, author, score, created_at)
SELECT 'post ' || g, (ARRAY['anna','igor','maria'])[1 + g % 3], (g * 7) % 100,
       now() - ((g * 13) % 30) * interval '1 day'
FROM generate_series(1, 25) g;

-- TODO: топ-5 по score, при равенстве — новее сначала

-- TODO: OFFSET-пагинация: страница 2 по 5 (created_at DESC)

-- TODO: keyset — «ещё 5 после id = 10» (created_at DESC, id DESC)
