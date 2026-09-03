---
id: pg-crud
track: postgres
type: guide
section: basics
order: 2
title:
  en: "CRUD in SQL"
  ru: "CRUD в SQL"
excerpt:
  en: "Create, read, update, delete: the four daily operations in PostgreSQL 17, with RETURNING, ON CONFLICT upserts and the transaction habits that keep your data safe."
  ru: "Создание, чтение, обновление, удаление: четыре ежедневные операции в PostgreSQL 17 — с RETURNING, upsert'ами через ON CONFLICT и транзакционными привычками, которые берегут данные."
version: "postgres 17"
updated: 2026-09-03
relatedTask: pg-002
---

CRUD — Create, Read, Update, Delete — is the daily work of every application that has a database. This page walks through all four operations in PostgreSQL 17, together with the two habits that separate careful engineers from accidental data loss: RETURNING clauses and explicit transactions.

## INSERT: creating rows

INSERT adds rows to a table. The list of columns and the list of values must have the same length, and any column you leave out of the list receives either its DEFAULT or NULL.

```sql
INSERT INTO products (name, price)
VALUES ('Hub', 25.00), ('Cable', 9.50), ('Dock', 120.00);
```

Omitting id is the right answer here: the column is GENERATED ALWAYS AS IDENTITY, so Postgres assigns the number itself. Writing one statement with three VALUES rows is also better than three separate statements: it is a single round trip, and the rows go in together or not at all.

If you need the new row right away — to create a related record, for instance — add RETURNING:

```sql
INSERT INTO products (name, price)
VALUES ('Hub', 25.00)
RETURNING id, name;
```

RETURNING * returns all columns of the inserted row. Without it, getting the generated id means a second SELECT — an extra round trip and a small race window in concurrent code.

### Upserts with ON CONFLICT

When an insert can legitimately repeat — a sync job, a retry after a network error — ON CONFLICT turns it into an idempotent upsert: insert if absent, update if present.

```sql
INSERT INTO products (sku, name, price)
VALUES ('HUB-1', 'Hub', 25.00)
ON CONFLICT (sku) DO UPDATE
SET name  = EXCLUDED.name,
    price = EXCLUDED.price;
```

If a row with the same sku exists, it is updated with the incoming values — reachable inside the statement through the pseudo-column EXCLUDED. If not, a new row is inserted. The simpler variant, ON CONFLICT (sku) DO NOTHING, silently skips duplicates. The conflict target (sku) must be a column or group of columns covered by a UNIQUE constraint or index, or Postgres will refuse the statement.

## SELECT: reading rows

Reading is the operation you will write the most, and its full skeleton — SELECT, FROM, WHERE, GROUP BY, ORDER BY, LIMIT — was covered in SQL Basics & Data Types. Here are the reading patterns specific to application work:

```sql
-- Projection: only the columns you actually need
SELECT name, price FROM products;

-- DISTINCT: collapse duplicate values into one
SELECT DISTINCT status FROM orders;

-- Aggregates: one summary row for the whole table
SELECT COUNT(*), AVG(price) FROM products;
```

COUNT(*) counts rows; COUNT(column) counts only the non-NULL values in that column, which is a handy way to measure how filled a column is. In application code, project only the columns you use: less data over the network, less work on the server, and a schema change cannot silently break your mapping.

GROUP BY is the half of SELECT this page skipped: it collapses rows into one row per group, and only the grouped columns and aggregates survive in the projection:

```sql
SELECT status, COUNT(*), MAX(placed_at)
FROM orders
GROUP BY status
HAVING COUNT(*) > 100;
```

HAVING filters the groups after aggregation, the way WHERE filters rows before aggregation — WHERE cannot reference an aggregate, and HAVING cannot reference a column that is neither grouped nor aggregated.

## UPDATE: changing rows

UPDATE changes values in existing rows. SET describes what to change, WHERE says which rows. Both parts matter.

```sql
UPDATE products
SET price = price * 1.10,
    is_active = false
WHERE price > 100
RETURNING id, name;
```

Watch the first line of SET: price = price * 1.10 is a relative change — ten percent on top of the current value. Writing price = 1.10 would have set every matched row to 1.10 instead. Relative and absolute changes look similar and behave very differently, so reread the SET list before running anything.

UPDATE without WHERE touches every row in the table — the classic way to "lose" data in one afternoon. Postgres reports how many rows it actually changed in the command tag (UPDATE 3) and in the driver's rowCount, so read that number before trusting the update. RETURNING gives you the affected rows themselves, which is exactly what the test harnesses in this track check.

Both SET and WHERE can read the row's current values, so one statement can express "increment", "double", or "clamp": SET qty = GREATEST(qty - 1, 0) is a decrement that can never go negative, and no second SELECT is needed to read the old value.

## DELETE: removing rows

DELETE removes the rows that match WHERE. Like UPDATE, without WHERE it clears the entire table.

```sql
DELETE FROM products
WHERE is_active = false;
```

TRUNCATE is the "remove everything" relative of DELETE: it empties the table in a single operation, is far faster on large tables because it does not process row by row, and resets identity counters. It has no WHERE clause at all. For a few rows, DELETE with a precise WHERE is the right tool; for the whole table, TRUNCATE.

In practice, "delete" is often softer than it looks. Many applications never physically remove a row — they set a flag (deleted_at = now() or is_deleted = true) and treat the row as gone. Physical DELETE then remains for archives and for hard compliance requirements.

## A complete CRUD cycle

All four operations in one session, each step handing us the row state through RETURNING instead of an extra SELECT:

```sql
INSERT INTO products (name, price)
VALUES ('Webcam', 60.00)
RETURNING *;

SELECT * FROM products WHERE name = 'Webcam';

UPDATE products
SET price = 55.00
WHERE name = 'Webcam'
RETURNING *;

DELETE FROM products WHERE name = 'Webcam';
```

In autocommit mode every line is its own transaction, and a crash halfway through leaves you with a half-finished state. For real work, wrap the cycle: BEGIN, the statements, a verifying SELECT, then COMMIT — or ROLLBACK if anything looked wrong. That is the subject of the Transactions & Concurrency page.

## Common mistakes

> **WARNING**
> UPDATE and DELETE without WHERE modify every row in the table. Before running a bulk change in psql, open a transaction: BEGIN, the statement, a SELECT to inspect the damage, and only then COMMIT — or ROLLBACK if it went wrong.

> **WARNING**
> ON CONFLICT (sku) needs a unique constraint or index on sku. Without one, Postgres answers with "there is no unique or exclusion constraint matching the ON CONFLICT specification" — create the constraint first, then the upsert.

> **TIP**
> In application code, pair INSERT / UPDATE / DELETE with RETURNING and positional parameters ($1, $2). One round trip, no SQL injection, and the row's fresh state in the same response.

<!-- RU -->

CRUD — Create, Read, Update, Delete — ежедневная работа любого приложения, у которого есть база данных. Эта страница проходит все четыре операции в PostgreSQL 17 вместе с двумя привычками, которые отличают аккуратную работу от случайной потери данных: клаузы RETURNING и явные транзакции.

## INSERT: создание строк

INSERT добавляет строки в таблицу. Список колонок и список значений должны быть одинаковой длины, а каждая колонка, которую вы не указали в списке, получает либо свой DEFAULT, либо NULL.

```sql
INSERT INTO products (name, price)
VALUES ('Hub', 25.00), ('Cable', 9.50), ('Dock', 120.00);
```

Не указывать id — правильный ответ: колонка GENERATED ALWAYS AS IDENTITY, так что Postgres назначает номер сам. Писать одно выражение с тремя строками VALUES тоже лучше, чем три отдельных: один round trip, и строки попадают вместе или не попадают вовсе.

Если новая строка нужна сразу — например, чтобы создать связанную запись, — добавьте RETURNING:

```sql
INSERT INTO products (name, price)
VALUES ('Hub', 25.00)
RETURNING id, name;
```

RETURNING * возвращает все колонки вставленной строки. Без него, чтобы получить сгенерированный id, нужен второй SELECT — лишний round trip и маленькое race-окно в конкурентном коде.

### Upsert'ы через ON CONFLICT

Когда вставка может законно повторяться — синк-задача, повтор после сетевой ошибки — ON CONFLICT превращает её в идемпотентный upsert: вставить, если нет; обновить, если есть.

```sql
INSERT INTO products (sku, name, price)
VALUES ('HUB-1', 'Hub', 25.00)
ON CONFLICT (sku) DO UPDATE
SET name  = EXCLUDED.name,
    price = EXCLUDED.price;
```

Если строка с таким sku уже есть, она обновляется пришедшими значениями — внутри выражения к ним обращаются через псевдоклонку EXCLUDED. Если нет — вставляется новая строка. Простой вариант, ON CONFLICT (sku) DO NOTHING, молча пропускает дубликаты. Цель конфликта (sku) должна быть колонкой или группой колонок, покрытых UNIQUE-ограничением или индексом, иначе Postgres откажет в выражении.

## SELECT: чтение строк

Чтение — операция, которую вы будете писать чаще всего, и её полный каркас — SELECT, FROM, WHERE, GROUP BY, ORDER BY, LIMIT — разобран на странице SQL-основы и типы данных. Вот читательские паттерны, специфичные для прикладной работы:

```sql
-- Проекция: только те колонки, которые реально нужны
SELECT name, price FROM products;

-- DISTINCT: схлопывает дублирующиеся значения
SELECT DISTINCT status FROM orders;

-- Агрегаты: одна сводная строка по всей таблице
SELECT COUNT(*), AVG(price) FROM products;
```

COUNT(*) считает строки; COUNT(column) считает только непустые (не NULL) значения в колонке — полезный способ измерить, насколько колонка заполнена. В коде приложения проецируйте только нужные колонки: меньше данных по сети, меньше работы на сервере, и изменение схемы не сломает маппинг незаметно.

GROUP BY — та половина SELECT, которую эта страница пропустила: она схлопывает строки в одну строку на группу, и в проекции выживают только сгруппированные колонки и агрегаты:

```sql
SELECT status, COUNT(*), MAX(placed_at)
FROM orders
GROUP BY status
HAVING COUNT(*) > 100;
```

HAVING фильтрует группы после агрегации, так же как WHERE фильтрует строки до агрегации: WHERE не может ссылаться на агрегат, а HAVING — на колонку, которая ни сгруппирована, ни не агрегирована.

## UPDATE: изменение строк

UPDATE меняет значения в существующих строках. SET описывает, что менять, WHERE — какие строки. Обе части важны.

```sql
UPDATE products
SET price = price * 1.10,
    is_active = false
WHERE price > 100
RETURNING id, name;
```

Посмотрите на первую строку SET: price = price * 1.10 — относительное изменение, десять процентов сверху от текущего значения. Написать price = 1.10 было бы означать, что каждая подходящая строка становится 1.10. Относительные и абсолютные изменения выглядят похоже и ведут себя по-разному, поэтому перечитывайте список SET перед запуском.

UPDATE без WHERE трогает каждую строку в таблице — классический способ «потерять» данные за один день. Postgres сообщает, сколько строк он реально изменил, в command tag (UPDATE 3) и в rowCount драйвера, — читайте это число, прежде чем доверять обновлению. RETURNING отдаёт сами затронутые строки — именно это проверяют тестовые harness'ы в этом треке.

И SET, и WHERE могут читать текущие значения строки, поэтому одно выражение выражает и «увеличение», и «удвоение», и «ограничение»: SET qty = GREATEST(qty - 1, 0) — это списание, которое никогда не уходит в минус, и второй SELECT для чтения старого значения не нужен.

## DELETE: удаление строк

DELETE удаляет строки, подходящие под WHERE. Как и UPDATE, без WHERE он очищает всю таблицу.

```sql
DELETE FROM products
WHERE is_active = false;
```

TRUNCATE — «удалить всё» родственник DELETE: он опустошает таблицу одной операцией, на больших таблицах заметно быстрее, потому что не обрабатывает строки по одной, и сбрасывает счётчики identity. У него вообще нет WHERE. Для нескольких строк — DELETE с точным WHERE; для всей таблицы — TRUNCATE.

На практике «удаление» часто мягче, чем кажется. Многие приложения физически строку не удаляют — они ставят флаг (deleted_at = now() или is_deleted = true) и считают строку исчезнувшей. Физический DELETE остаётся для архивов и твёрдых требований compliance.

## Полный CRUD-цикл

Все четыре операции в одной сессии; каждый шаг через RETURNING отдаёт нам состояние строки, а не требует лишнего SELECT:

```sql
INSERT INTO products (name, price)
VALUES ('Webcam', 60.00)
RETURNING *;

SELECT * FROM products WHERE name = 'Webcam';

UPDATE products
SET price = 55.00
WHERE name = 'Webcam'
RETURNING *;

DELETE FROM products WHERE name = 'Webcam';
```

В режиме autocommit каждая строка — отдельная транзакция, и сбой посередине оставит вас с недоделанным состоянием. Для реальной работы оборачивайте цикл: BEGIN, выражения, проверяющий SELECT, затем COMMIT — или ROLLBACK, если что-то выглядело не так. Эта тема раскрыта на странице Транзакции и конкурентность.

## Частые ошибки

> **WARNING**
> UPDATE и DELETE без WHERE меняют каждую строку в таблице. Перед массовым изменением в psql открывайте транзакцию: BEGIN, выражение, SELECT для осмотра того, что получилось, и только тогда COMMIT — или ROLLBACK, если всё пошло не так.

> **WARNING**
> ON CONFLICT (sku) требует UNIQUE-ограничения или индекс на sku. Без него Postgres отвечает «there is no unique or exclusion constraint matching the ON CONFLICT specification» — сначала создайте ограничение, потом upsert.

> **TIP**
> В коде приложения связывайте INSERT / UPDATE / DELETE с RETURNING и позиционными параметрами ($1, $2). Один round trip, защита от SQL-injection и свежее состояние строки в том же ответе.
