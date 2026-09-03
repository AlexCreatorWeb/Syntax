-- Урок 1: подключение, первая таблица, psql-команды.
-- Запуск: psql practice  (база practice создана командой createdb practice)

-- TODO: создай базу (в терминале, НЕ в psql): createdb practice
-- TODO: подключись: psql practice

-- TODO: создай таблицу заметок
CREATE TABLE notes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TODO: вставь 3 заметки (VALUES-строки)
INSERT INTO notes (body) VALUES ('первая');

-- TODO: выведи все заметки и проверь структуру через \d notes
SELECT * FROM notes;
-- \d notes
-- \dt
