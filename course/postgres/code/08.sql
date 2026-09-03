-- Урок 8: GROUP BY, HAVING, FILTER. Запуск: psql practice
DROP TABLE IF EXISTS reviews;

-- TODO: таблица + 10 строк (2 с helpful NULL, rating 1..5, есть NULL rating)
CREATE TABLE reviews (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user TEXT NOT NULL,
    service TEXT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    helpful INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO reviews (user, service, rating, helpful) VALUES
    ('anna', 'taxi', 5, 3),
    ('anna', 'taxi', 4, NULL),
    ('anna', 'hotel', 3, 1),
    ('igor', 'taxi', 5, 7),
    ('igor', 'food', NULL, 0),
    ('igor', 'food', 4, 2),
    ('maria', 'hotel', 2, NULL),
    ('maria', 'hotel', 4, 5),
    ('maria', 'taxi', 5, 1),
    ('petr', 'food', 3, 0);

-- TODO: средний rating и count по сервисам; HAVING count(*) >= 2
-- TODO: по user: всего и сколько с rating >= 4 (FILTER)
-- TODO: sum(helpful) по сервисам
