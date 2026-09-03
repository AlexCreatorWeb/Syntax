# Урок 4. ALTER, DROP, ENUM и структуры базы

## Цель

После урока студент сможет: изменять схему без потери данных (ADD/ALTER/DROP COLUMN, ограничения), работать с ENUM-типом, организовывать базу из нескольких схем (schema), писать COMMENT — и понимать, когда мигрировать таблицу, а когда — менять колонку.

## Теория

База (database) — отдельный каталог; подключение всегда к одной базе. Внутри — схемы (schema): «папки» объектов. public — схема по умолчанию; в проектах принято выносить код в свою схему (app, billing) — так две библиотеки не «сломаются» друг у друга одинаковыми именами.

ALTER TABLE — правка живой схемы: ADD COLUMN (новые значения — NULL или DEFAULT), DROP COLUMN (данные колонки теряются), SET DATA TYPE (перезапись таблицы), RENAME. Добавление ограничения к заполненной таблице проверяет все существующие строки — может быть медленно и упасть на «плохих» данных.

ENUM — перечисление: CREATE TYPE mood AS ENUM ('low','mid','high'). Плюсы: валидация на уровне типа, компактное хранение. Минусы: добавить значение — ALTER TYPE (блокирует сессию), удалить значение — почти невозможно (новый тип + конвертация). Современные предпочтения: TEXT + CHECK или отдельная справочная таблица (значения управляются данными, не схемой) — но ENUM в маленьких фиксированных списках легитимен.

COMMENT ON — «документация» объектов: COMMENT ON COLUMN orders.status IS '...'. Виден в \d и в IDE — единственный способ задокументировать БД «с ней самой». Комментарий не валидирует данные — только объясняет.

Миграции. В реальных проектах DDL не пишут «вручную» в проде — мигровочными инструментами (Flyway, Alembic, Supabase Migrations): каждая правка схемы — отдельный .sql-файл с номером, история изменений в таблице schema_migrations. Для курса достаточно: «каждая правка схемы — осмысленный шаг, который можно повторить на другой БД».

DROP — обратный DDL: DROP TABLE (каскад: REFERENCES — вместе с зависимыми, CASCADE — всё, что ссылается). DROP TYPE. Бывает страшно — тренируйся на практике.

## Пример

```sql
CREATE TYPE mood AS ENUM ('low', 'mid', 'high');

CREATE TABLE moods (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_name TEXT NOT NULL,
    today mood NOT NULL DEFAULT 'mid',
    note TEXT
);

INSERT INTO moods (user_name, today) VALUES ('Аня', 'high');
INSERT INTO moods (user_name, today) VALUES ('Игорь', 'calm');  -- ошибка: значение не в ENUM

ALTER TABLE moods ADD COLUMN score INT NOT NULL DEFAULT 0;     -- новые строки получат 0
ALTER TABLE moods ALTER COLUMN note TYPE TEXT;                  -- пример смены типа
COMMENT ON COLUMN moods.score IS 'модераторская оценка 0-10';

CREATE SCHEMA billing;
CREATE TABLE billing.fees (id BIGINT PRIMARY KEY, amount NUMERIC(12,2));
INSERT INTO billing.fees VALUES (1, 9.99);
SELECT * FROM billing.fees;

\d moods
DROP TABLE moods; DROP TYPE mood; DROP SCHEMA billing CASCADE;
```

## Частые ошибки

WARN: ENUM на «статусы» с горизонтом изменений: добавить статус «refunded» через год — ALTER TYPE + миграция, а удалить старый — пересоздание типа. Если список будет расти — TEXT + CHECK или справочник.

WARN: DROP COLUMN в проде — данные безвозвратно. Для «выключения поля» сначала RENAME COLUMN, неделю понаблюдай, потом DROP.

WARN: Создавал таблицы в public «как в туториале», а приложение пишет в схему app — «таблицы нет», хотя она есть. Проверяй `\dn` (схемы) и полное имя схема.таблица.

TIP: `SET search_path TO app, public;` в начале сессии (или на уровне БД: `ALTER DATABASE shop SET search_path TO app, public`) — и короткие имена работают с твоей схемой.

## Практическое задание

1. Создай ENUM `plan_tier ('free','pro','enterprise')` и таблицу `plans (id identity PK, name TEXT NOT NULL, tier plan_tier NOT NULL DEFAULT 'free', price NUMERIC(10,2) NOT NULL DEFAULT 0)`.
2. Вставь 3 плана; попробуй вставить tier 'gold' (зафиксируй ошибку).
3. ALTER: добавь колонку `is_archived BOOLEAN NOT NULL DEFAULT FALSE`, переназуй таблицу в `plans_v2` (ALTER ... RENAME TO).
4. Напиши COMMENT ON для таблицы и для колонки price; убедись, что он виден в `\d plans_v2`.
5. Создай схему `demo`, таблицу в ней, затем убери всё: DROP TABLE, DROP TYPE (для plan_tier — сначала DROP TABLE).

Файл `queries.sql` — заполни TODO.
