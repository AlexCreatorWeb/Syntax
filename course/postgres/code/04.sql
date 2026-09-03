-- Урок 4: ALTER, ENUM, schemas, COMMENT. Запуск: psql practice
DROP TABLE IF EXISTS plans_v2; DROP TABLE IF EXISTS plans;
DROP TYPE IF EXISTS plan_tier;

-- TODO: ENUM-тип планов
CREATE TYPE plan_tier AS ENUM ('free', 'pro', 'enterprise');

-- TODO: таблица plans
CREATE TABLE plans (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    tier plan_tier NOT NULL DEFAULT 'free',
    price NUMERIC(10, 2) NOT NULL DEFAULT 0
);

-- TODO: 3 валидных плана
INSERT INTO plans (name, tier, price) VALUES ('Старт', 'free', 0);
INSERT INTO plans (name, tier, price) VALUES ('Про', 'pro', 490);

-- TODO: tier 'gold' — ожидаемая ошибка
-- INSERT INTO plans (name, tier) VALUES ('Золото', 'gold');

-- TODO: добавить is_archived + RENAME TO plans_v2
-- ALTER TABLE plans ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT FALSE;
-- ALTER TABLE plans RENAME TO plans_v2;

-- TODO: COMMENT ON TABLE/COLUMN
-- COMMENT ON TABLE plans_v2 IS 'тарифные планы';
-- COMMENT ON COLUMN plans_v2.price IS 'цена в месяц, рубли';

-- TODO: схема demo + таблица + удаление
-- CREATE SCHEMA demo;
-- CREATE TABLE demo.t (id INT);
-- DROP SCHEMA demo CASCADE;

SELECT * FROM plans;
