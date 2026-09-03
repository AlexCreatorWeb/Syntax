# Урок 2. Типы данных: чисел, строк, дат, UUID и JSONB

## Цель

После урока студент сможет: подобрать правильный тип под задачу (целые/дробные/строки/даты/UUID/булевы/JSONB), понимать разницу INTEGER vs BIGINT, NUMERIC vs FLOAT, TEXT vs VARCHAR, DATE vs TIMESTAMP, и писать CAST'ы между типами.

## Теория

Выбор типа — решение на годы: сменить тип колонки в большой таблице = переписать её. Правила выбора:

Числа. INT (INTEGER, 32 бит, до ~2 млрд) — счётчики, ID (для маленьких систем), цены в центах. BIGINT (64 бит) — ID в нагруженных системах, большие суммы. NUMERIC(p,s) / DECIMAL — деньги и всё, где важна точка: FLOAT хранит 0.1 неточно (бинарные дроби), для финансов — только NUMERIC или целые «центы».

Строки. TEXT и VARCHAR(n) в PostgreSQL — один и тот же тип под капотом (нет разницы в скорости). TEXT — по умолчанию; VARCHAR(n) — только если ограничение длины — часть бизнес-логики (тогда лучше CHECK). CHAR(n) — почти никому не нужен (дополняет пробелами).

Время. DATE — только день. TIMESTAMP (без time zone) — момент без привязки к часовому поясу: «какого числа и в сколько по стене». TIMESTAMPTZ — момент в абсолютном времени (хранится в UTC, отображается в TZ сессии) — для created_at/updated_at по умолчанию TIMESTAMPTZ. INTERVAL — длительность («3 days 4 hours»).

Другое. BOOLEAN — да/нет (нет 0/1-хаков). UUID — 128-битный идентификатор: не выдаётся центральной очередью, идеален для ID, которые уходят в API/клиент; downside — 16 байт против 8 у BIGINT (индексы шире). JSONB — структурированные данные в бинарном JSON (урок 17).

CAST'ы: `value::type` (синтаксис PG) или `CAST(value AS type)`. `'42'::int`, `now()::date`, `'abc'::uuid`. Если строка не соответствует типу — ошибка 22P05 (invalid input syntax) в момент приведения.

Массивы и диапазоны существуют и в базовом PG (INT[], NUMRANGE, TSRANGE) — но в прикладных схемах их вытеснили JSONB и отдельные таблицы; для задач курса знать достаточно, что типы-массивы легитимны.

## Пример

```sql
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_name TEXT NOT NULL,
    balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
    price_hint FLOAT8,               -- пример НЕ для денег!
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    registered DATE NOT NULL DEFAULT CURRENT_DATE,
    last_seen TIMESTAMPTZ,
    meta JSONB NOT NULL DEFAULT '{}'::jsonb
);

INSERT INTO accounts (owner_name, balance, price_hint, meta)
VALUES ('Аня', 1234.56, 0.1, '{"plan": "pro"}'::jsonb);

SELECT id, balance, balance::int, last_seen IS NULL AS never_seen
FROM accounts;

SELECT now() AS t, now()::date AS d, '3'::int + 4;
```

## Частые ошибки

WARN: Хранил деньги в FLOAT/FLOAT8 — накапливается погрешность: 0.1 + 0.2 != 0.3. Для любых денег и «точных» величин — NUMERIC(p, s) или целые единицы (центы).

WARN: Писал VARCHAR(255) «как во всех туториалах» — в PG это не оптимизация, а самоограничение: при росте данных получишь обрезку. По умолчанию TEXT.

WARN: Сравнивал TIMESTAMPTZ и TIMESTAMP в WHERE — неявное приведение путает часовые пояса; колонки времени держать единым типом (TIMESTAMPTZ для моментов).

WARN: UUID как первичный ключ без понимания: индексы шире, вставка без «последовательности» хуже для сжатия. Для внутреннего PK часто достаточно BIGINT identity, UUID — для внешних ID.

TIP: Двойная проверка типов — `\d таблица`: в выводе видно точные типы (numeric(12,2), timestamp with time zone). Формат вывода дат меняется в TZ сессии: `SET TIME ZONE 'Europe/Moscow'` против 'UTC' — один и тот же момент, разное отображение.

## Практическое задание

1. Создай таблицу `inventory (id UUID PK DEFAULT gen_random_uuid(), sku TEXT NOT NULL UNIQUE, qty INT NOT NULL CHECK (qty >= 0), cost NUMERIC(14,3) NOT NULL, added_at TIMESTAMPTZ NOT NULL DEFAULT now())`.
2. Вставь 3 строки (sku 'SKU-1'..'SKU-3', разные qty/cost).
3. Найди sku с наибольшим qty (подсказка: ORDER BY qty DESC LIMIT 1).
4. Выведи cost как INT (потеря дробной) и qty::text (тип строки).
5. Ответь письменно: почему `CHECK (qty >= 0)` лучше, чем «проверять в приложении»?

Файл `queries.sql` — заполни TODO (таблица + вставки + запросы).
