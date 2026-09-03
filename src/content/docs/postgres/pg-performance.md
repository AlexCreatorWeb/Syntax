---
id: pg-performance
track: postgres
type: guide
section: performance
order: 4
title:
  en: "Indexes & Query Performance"
  ru: "Индексы и производительность"
excerpt:
  en: "How B-tree indexes let PostgreSQL skip most of a table, which index to create (unique, multi-column, partial, covering) and how to read EXPLAIN plans to verify the index is actually used."
  ru: "Как B-tree-индексы позволяют PostgreSQL не читать почти всю таблицу, какой индекс создавать (unique, многоколоночный, частичный, covering) и как читать планы EXPLAIN, чтобы убедиться, что индекс реально используется."
version: "postgres 17"
updated: 2026-09-03
relatedTask: pg-008
---

An index is a separate data structure that lets PostgreSQL find rows without reading the whole table. This page explains how the default B-tree index works, which index variant to create for which problem, and how to read EXPLAIN plans to verify that the index is doing its job.

## How Postgres finds a row

Without an index, a WHERE on a column forces a sequential scan: the engine reads the table from beginning to end and tests every row. A million rows means a million tests. For small tables this is fast enough, and the planner often prefers a sequential scan even when an index exists — a few megabytes fit in the cache and cost less than bouncing between index and table.

An index is a much smaller structure built over one or several columns. The B-tree, the default index type in Postgres, keeps the values sorted, so a lookup takes logarithmic time: instead of testing a million rows, the engine takes a couple of dozen steps inside the tree and lands exactly on the row it needs.

Indexes pay off when the query touches a small, selective slice of the table. If the WHERE matches half the table, the planner will honestly read the table straight through — hopping through the index is more expensive than one clean sweep.

## Creating indexes

```sql
-- A plain B-tree over one column
CREATE INDEX idx_events_user ON events (user_id);

-- UNIQUE: the index doubles as a data constraint
CREATE UNIQUE INDEX idx_users_email ON users (email);

-- Multi-column: column order matters
CREATE INDEX idx_orders_user_date ON orders (user_id, created_at DESC);

-- Partial: covers only the rows matching the predicate
CREATE INDEX idx_active_sessions ON sessions (user_id) WHERE active = true;

-- Covering: the index also carries the column the query needs
CREATE INDEX idx_sessions_token ON sessions (token) INCLUDE (user_id);
```

Each variant solves a different problem. UNIQUE makes the index a constraint on the data — duplicates are refused at write time, and ON CONFLICT can target it. A multi-column index serves queries that filter on the first column, or on the first plus the second; the column used most selectively goes first, and a second column in the index is useful when the query filters on both. A partial index covers only part of the table, so it is smaller, cheaper to maintain, and the planner uses it only when the WHERE agrees with the predicate. INCLUDE adds extra columns to the index leaves, so the query can be answered from the index alone — an index-only scan — without touching the table at all.

The multi-column case has a name: the prefix rule. The index on (user_id, created_at) serves WHERE user_id = 5, and WHERE user_id = 5 AND created_at > x, but it does not serve WHERE created_at > x alone — the query skips the first column, and the sorted order the index provides is no longer there. When in doubt, write the WHERE and the index side by side and check the order.

Name your indexes (idx_table_column) rather than accepting the generated names: a few hundred tables later, the generated names stop being human-readable, and EXPLAIN output quotes the index name for every scan.

## Reading EXPLAIN

```sql
EXPLAIN ANALYZE
SELECT user_id
FROM sessions
WHERE token = 'alpha';
```

EXPLAIN shows the plan without executing the query; EXPLAIN ANALYZE runs it and appends real timings in milliseconds and row counts to every node. The plan is a tree: the bottom nodes produce rows, the top node returns the result. Reading it is mostly pattern matching: Seq Scan on sessions means the table is read end to end; Index Scan using idx_sessions_token means the index is working; rows=0 where you expected rows is usually a stale-statistics problem, fixed by ANALYZE.

The Execution Time line at the end of the plan is the wall-clock duration of the query. A healthy lookup by token is an index scan with one or two rows and a fraction of a millisecond; the same query as a sequential scan over a large table is the signal that something you expected to be indexed is not.

One more habit: sanity-check the plan's estimates against the table's actual size. If EXPLAIN predicts rows=100 for a filter on a random token, but the table holds a million rows and the token is unique, the estimate is wildly off — and ANALYZE on the table is the first move, because every decision the planner makes is built on top of those estimates.

Adding BUFFERS to the options (EXPLAIN (ANALYZE, BUFFERS)) shows how many disk pages each node read — the difference between a cached and a cold query can be an order of magnitude, and the buffer numbers make that visible.

## When an index is worse than useless

An index is not free. Every INSERT, UPDATE and DELETE on the table must also modify the index, so on write-heavy tables each extra index is a tax on writes. It is a second copy of the data that bloats the database. And the planner is not obliged to use it: a low-selectivity column (a status with two values out of a million rows), a function applied to the indexed column in the WHERE, or a cast that changes the type — all of these defeat the index, and EXPLAIN shows you the resulting sequential scan.

The discipline that keeps databases fast: create an index after you see a slow query in EXPLAIN, not before, for every column "just in case". pg_stat_user_indexes tells you how often each index is used through its idx_scan counter — an index that has not been used once in a month is a candidate for DROP INDEX, not for pride.

## Common mistakes

> **WARNING**
> A function around the indexed column in WHERE — WHERE upper(email) = '<ADA@X.COM>' — does not use the index on email. Rewrite the predicate against the raw column (WHERE email = '<ada@x.com>' with a case-insensitive collation or ILIKE), or create an expression index on upper(email).

> **WARNING**
> "The index exists, but EXPLAIN shows Seq Scan" is usually not a bug: on a small table a sequential scan is simply faster, or the planner does not trust outdated statistics. Run ANALYZE on the table and look at the plan again.

> **TIP**
> For hot lookups like token to user_id, a covering index (token) INCLUDE (user_id) is the ideal shape: the answer lives entirely in the index, and the table is never read at all.

<!-- RU -->

Индекс — отдельная структура данных, которая позволяет PostgreSQL находить строки, не читая всю таблицу. Эта страница объясняет, как работает индекс B-tree по умолчанию, какой вариант индекса создавать под какую задачу и как читать планы EXPLAIN, чтобы убедиться, что индекс делает свою работу.

## Как Postgres находит строку

Без индекса WHERE по колонке заставляет последовательное сканирование: движок читает таблицу от начала до конца и проверяет каждую строку. Миллион строк — миллион проверок. Для маленьких таблиц этого достаточно, и планировщик часто предпочитает Seq Scan даже при наличии индекса — несколько мегабайт помещаются в кэш и дешевле, чем прыгать между индексом и таблицей.

Индекс — намного меньшая структура, построенная по одной или нескольким колонкам. B-tree, тип индекса по умолчанию в Postgres, хранит значения отсортированными, поэтому поиск занимает логарифмическое время: вместо проверки миллиона строк движок делает пару десятков шагов внутри дерева и попадает ровно в нужную строку.

Индексы окупаются, когда запрос касается маленького, селективного куска таблицы. Если WHERE подходит половине таблицы, планировщик честно прочитает таблицу подряд — прыгать через индекс дороже, чем один чистый проход.

## Создание индексов

```sql
-- Обычный B-tree по одной колонке
CREATE INDEX idx_events_user ON events (user_id);

-- UNIQUE: индекс одновременно ограничение на данные
CREATE UNIQUE INDEX idx_users_email ON users (email);

-- Многоколоночный: порядок колонок важен
CREATE INDEX idx_orders_user_date ON orders (user_id, created_at DESC);

-- Частичный: покрывает только строки, подходящие предикату
CREATE INDEX idx_active_sessions ON sessions (user_id) WHERE active = true;

-- Covering: индекс дополнительно несёт колонку, которую нужны запрос
CREATE INDEX idx_sessions_token ON sessions (token) INCLUDE (user_id);
```

Каждый вариант решает свою задачу. UNIQUE делает индекс ограничением на данные — дубликаты отклоняются при записи, и ON CONFLICT может ссылаться на него. Многоколоночный индекс служит запросам, фильтрующим по первой колонке или по первой плюс второй; самую селективную колонку ставят первой, а вторая колонка полезна, когда запрос фильтрует по обеим. Частичный индекс покрывает только часть таблицы, поэтому он меньше, дешевле в обслуживании, и планировщик использует его только тогда, когда WHERE согласуется с предикатом. INCLUDE добавляет дополнительные колонки в листья индекса, и запрос можно ответить только по индексу — index-only scan — вообще не трогая таблицу.

У многоколоночного случая есть имя: правило префикса. Индекс по (user_id, created_at) служит запросам WHERE user_id = 5 и WHERE user_id = 5 AND created_at > x, но не служит одинокому WHERE created_at > x — запрос пропускает первую колонку, и отсортированный порядок, который даёт индекс, уже не там. Когда сомневаетесь, пишите WHERE и индекс рядом и проверяйте порядок.

Именуйте индексы (idx_table_column), не принимая сгенерированные имена: через несколько сотен таблиц сгенерированные имена перестают быть читаемыми, а EXPLAIN выдаёт имя индекса при каждом сканировании.

## Чтение EXPLAIN

```sql
EXPLAIN ANALYZE
SELECT user_id
FROM sessions
WHERE token = 'alpha';
```

EXPLAIN показывает план без выполнения запроса; EXPLAIN ANALYZE выполняет его и добавляет к каждому узлу реальное время в миллисекундах и число строк. План — это дерево: нижние узлы производят строки, верхний узел возвращает результат. Чтение плана — в основном сопоставление паттернов: Seq Scan on sessions — таблицу читают от начала до конца; Index Scan using idx_sessions_token — индекс работает; rows=0 там, где ждали строки, — обычно проблема устаревшей статистики, лечится ANALYZE.

Строка Execution Time в конце плана — фактическая длительность запроса. Здоровый поиск по tokenu — это index scan на одну-две строки за долю миллисекунды; тот же запрос как Seq Scan по большой таблице — сигнал, что что-то, что вы ожидали индексированным, не индексировано.

Ещё одна привычка: сверять оценки плана с реальным размером таблицы. Если EXPLAIN предсказывает rows=100 для фильтра по случайному tokenu, а в таблице миллион строк и токен уникален, оценка сильно врёт — и первым шагом идёт ANALYZE по таблице, потому что каждое решение планировщика строится на этих оценках.

Добавив BUFFERS в опции (EXPLAIN (ANALYZE, BUFFERS)), вы увидите, сколько страниц с диска прочитал каждый узел: разница между кэшированным и холодным запросом может быть в порядок, и именно числа буферов это делают видимым.

## Когда индекс вредит

Индекс — не бесплатная вещь. Каждый INSERT, UPDATE и DELETE по таблице должен также менять индекс, поэтому на таблицах с частой записью каждый лишний индекс — налог на writes. Это вторая копия данных, раздувающая базу. И планировщик не обязан им пользоваться: низко-селективная колонка (status с двумя значениями на миллион строк), функция над индексированной колонкой в WHERE, каст, меняющий тип, — всё это обходит индекс, и EXPLAIN показывает полученный Seq Scan.

Дисциплина, которая держит базу быстрой: создавайте индекс, когда вы увидели медленный запрос в EXPLAIN, а не заранее «на всякий случай» по каждой колонке. pg_stat_user_indexes говорит, как часто каждый индекс использовался, через счётчик idx_scan — индекс, которым не пользовались месяц, — кандидат в DROP INDEX, а не предмет гордости.

## Частые ошибки

> **WARNING**
> Функция вокруг индексированной колонки в WHERE — WHERE upper(email) = '<ADA@X.COM>' — не использует индекс по email. Перепишите предикат по «сырой» колонке (WHERE email = '<ada@x.com>' с регистронезависимым collation или через ILIKE) или создайте expression-индекс по upper(email).

> **WARNING**
> «Индекс есть, а EXPLAIN показывает Seq Scan» — обычно не баг: на маленькой таблице последовательное сканирование просто быстрее, либо планировщик не доверяет устаревшей статистике. Запустите ANALYZE по таблице и посмотрите план ещё раз.

> **TIP**
> Для горячих поисков типа token → user_id идеальная форма — covering-индекс (token) INCLUDE (user_id): ответ целиком живёт в индексе, и таблица вообще не читается.
