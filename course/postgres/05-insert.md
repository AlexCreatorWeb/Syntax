# Урок 5. Вставка данных: INSERT, multi-row, ON CONFLICT

## Цель

После урока студент сможет: вставлять данные (одна строка, несколько строк, результат запроса), обрабатывать дубли через ON CONFLICT (UPSERT) и понимать COPY — правильный инструмент массовой загрузки.

## Теория

INSERT INTO table (cols) VALUES (...) — базовая форма. Список колонок указывай всегда: иначе вставка «по порядку колонок» ломается при изменении схемы.

Множественная вставка: VALUES ('a'), ('b'), ('c') — один INSERT на N строк. Быстрее, чем N отдельных: меньше раундов валидаций, один лог-запись транзакции. Для тысяч строк — COPY (из файла/STDIN): формат tab-separated, скорость в разы выше INSERT (минимум валидаций, прямой поток в таблицу).

SELECT INTO / INSERT ... SELECT: вставить результат запроса — «скопируй строки из другой таблицы». CREATE TABLE ... AS SELECT (CTAS) — «создай таблицу ИЗ запроса» (копии, snapshots, staging-данные).

ON CONFLICT — «вставь, но если столкнёшься с уникальностью — поступай так»:
- DO NOTHING — дубль просто пропускается (вставка «тихая»);
- DO UPDATE SET col = EXCLUDED.col — обновляем значения из вставляемой строки (EXCLUDED — виртуальная таблица «то, что хотели вставить»). Это UPSERT: «сделай или обнови» атомарно, без гонки «сначала SELECT, потом INSERT/UPDATE».

Целью конфликта может быть конкретное ограничение: ON CONFLICT ON CONSTRAINT users_email_unique.

Почему upsert «атомарный»: весь «нашёл/не нашёл» происходит внутри СУБД в рамках одной операции — другие сессии не могут «вклиниться» между SELECT и UPDATE. В приложении это убирает целый класс гонок (два запроса одновременно видят «строки нет» и вставляют дубль).

RETURNING в INSERT: `INSERT ... VALUES (...) RETURNING id` — сервер сразу возвращает сгенерированные значения (id, default-колонки). Без RETURNING пришлось бы «угадывать» id (currval / last_value / max(id)+1 — все хрупкие в конкурентной среде).

## Пример

```sql
CREATE TABLE cities (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    population INT NOT NULL DEFAULT 0
);

INSERT INTO cities (code, name, population)
VALUES ('MSK', 'Москва', 13150000), ('SPB', 'Санкт-Петербург', 5600000);

-- дубль PK — обычная вставка упала бы:
INSERT INTO cities (code, name) VALUES ('MSK', 'Москва (обновлённое)')
ON CONFLICT (code) DO NOTHING;

-- тот же код, но DO UPDATE:
INSERT INTO cities (code, name, population) VALUES ('MSK', 'Москва', 13100000)
ON CONFLICT (code) DO UPDATE SET population = EXCLUDED.population,
                                  name = EXCLUDED.name;

-- вставка из запроса:
CREATE TABLE big_cities AS SELECT * FROM cities WHERE population > 5000000;
SELECT * FROM big_cities;
```

## Частые ошибки

WARN: Паттерн «SELECT, если есть — UPDATE, иначе INSERT» без транзакции/лока — классическая гонка: два запроса одновременно видят «нет строки» и вставляют дубли (unique уронит один, но логика приложения ломается). UPSERT (ON CONFLICT DO UPDATE) — атомарный.

WARN: INSERT без списка колонок: `INSERT INTO t VALUES (1, 'a')` — добавишь колонку в середине таблицы, и вставка начнёт «сдвигаться». Список колонок — всегда.

WARN: COPY без `QUOTE`/формата и спецсимволов в данных — «extra data after last expected column». Для JSON/CSV удобнее COPY ... FROM STDIN WITH (FORMAT csv).

WARN: Вставил миллион строк через INSERT в цикле — медленно (каждая вставка = своя проверка ограничений + WAL). Пачки по 5–10 тыс. VALUES или COPY.

TIP: `INSERT ... RETURNING id, name` — сразу возвращает вставленное (сгенерированный ID!). Это стандарт для «создал сущность — нужен её id».

## Практическое задание

1. Создай `feed (id identity PK, source TEXT NOT NULL UNIQUE, url TEXT NOT NULL, fetched_at TIMESTAMPTZ NOT NULL DEFAULT now())`.
2. Вставь 3 источника одной multi-row-командой.
3. Повтори вставку с тем же source, но новым url — сначала ON CONFLICT DO NOTHING, затем DO UPDATE SET url = EXCLUDED.url, fetched_at = now().
4. Создай `feed_backlog` через CREATE TABLE AS SELECT (только свежие: fetched_at > now() - interval '1 hour').
5. Ответь письменно: почему RETURNING в паре с identity-колонкой удобнее, чем «SELECT currval('..._id_seq')»?

Файл `queries.sql` — заполни TODO.
