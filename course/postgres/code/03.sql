-- Урок 3: DDL + ограничения. Запуск: psql practice
DROP TABLE IF EXISTS users;

-- TODO: создай таблицу users (см. задание урока)
CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    login TEXT NOT NULL,
    email TEXT NOT NULL,
    age INT,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TODO: добавь UNIQUE на login и email + CHECK на age (через ALTER, см. урок 4)
-- ALTER TABLE users ADD CONSTRAINT users_login_unique UNIQUE (login);
-- ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
-- ALTER TABLE users ADD CONSTRAINT users_age_check CHECK (age BETWEEN 1 AND 120);

-- TODO: два валидных пользователя
INSERT INTO users (login, email, age) VALUES ('alice', 'alice@example.com', 30);
INSERT INTO users (login, email, age) VALUES ('bob', 'bob@example.com', 25);

-- TODO: дубль login (ожидаемая ошибка unique)
-- INSERT INTO users (login, email) VALUES ('alice', 'dup@example.com');

-- TODO: age = 150 (ожидаемая ошибка check)
-- INSERT INTO users (login, email, age) VALUES ('old', 'old@example.com', 150);

-- TODO: проверь \d users — секции Indexes / Check constraints
SELECT * FROM users;
