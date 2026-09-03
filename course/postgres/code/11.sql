-- Урок 11: подзапросы, CTE, LATERAL. Запуск: psql practice
DROP TABLE IF EXISTS logs, cities, regions CASCADE;

CREATE TABLE regions (id INT PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE cities (id INT PRIMARY KEY, region_id INT NOT NULL REFERENCES regions(id), population INT NOT NULL);
CREATE TABLE logs (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, city_id INT NOT NULL REFERENCES cities(id), level TEXT NOT NULL, ts TIMESTAMPTZ NOT NULL DEFAULT now());

INSERT INTO regions VALUES (1, 'Центр'), (2, 'Север');
INSERT INTO cities VALUES (1, 1, 500000), (2, 1, 120000), (3, 2, 80000);
INSERT INTO logs (city_id, level, ts) VALUES
    (1, 'error', now() - interval '5 hours'), (1, 'info', now() - interval '4 hours'),
    (2, 'info', now() - interval '3 hours'), (2, 'error', now() - interval '1 hour'),
    (3, 'info', now() - interval '2 hours');

-- TODO: EXISTS — города с error-логами

-- TODO: CTE — средний population по регионам; города выше среднего

-- TODO: LATERAL — для каждого региона последний лог его городов (1 строка/регион)
