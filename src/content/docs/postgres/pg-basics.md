---
id: pg-basics
track: postgres
type: guide
section: basics
order: 1
title:
  en: "SQL Basics & Data Types"
  ru: "SQL-основы и типы данных"
excerpt:
  en: "How a SQL query is read, the core data types of PostgreSQL 17, and the filtering, sorting and paging patterns behind almost every query you will write."
  ru: "Как читается SQL-запрос, базовые типы данных PostgreSQL 17 и приёмы фильтрации, сортировки и пагинации, которые стоят за почти каждым запросом."
version: "postgres 17"
updated: 2026-09-03
relatedTask: pg-001
---

SQL is the interface between your application and PostgreSQL. You describe what you want, and the query planner decides how to fetch it: which tables to read, in which order, and which indexes to use. This page covers the anatomy of a query, the core data types of PostgreSQL 17, and the everyday filtering, sorting, and paging patterns you will use constantly.

## Reading a SQL query

Every SQL statement follows the same skeleton, and the clauses always appear in a fixed order: SELECT declares which columns you want, FROM names the table or tables, WHERE picks rows, ORDER BY sorts the result, and LIMIT with OFFSET cuts out one page. You do not have to use all of them, but the order is fixed by the language.

```sql
SELECT name, price
FROM products
WHERE price > 10
ORDER BY price DESC
LIMIT 5;
```

Read the example top to bottom: from the products table take the name and price columns, keep only rows where price is greater than 10, sort by price in descending order, and return the first five rows. The planner is free to perform the steps in any physically convenient order — WHERE is usually applied before ORDER BY, but that is an implementation detail, not part of the contract.

Statements end with a semicolon. psql, the command-line client, sends a statement to the server when it sees the semicolon; in a script with several statements the semicolon is what separates one command from the next.

Two more etiquette rules. Identifiers with spaces or names that collide with keywords go in double quotes: "My Table". Do not quote out of habit, though — quoted identifiers are case-sensitive, while unquoted ones are folded to lowercase.

## Tables, columns and data types

A table is a named collection of rows that all have the same columns. The column type is the first design decision, because it determines what the data may look like and how the engine stores and compares it.

```sql
CREATE TABLE products (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name       TEXT NOT NULL,
    price      NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    is_active  BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

The id column is an identity: Postgres numbers the rows automatically, and PRIMARY KEY guarantees that the number is unique. NOT NULL makes a column mandatory, DEFAULT supplies a value when you insert nothing, and CHECK (price >= 0) rejects rows that make no business sense.

The core types you will meet in almost any schema:

| Type | What it stores | Example value |
| ------ | ---------------- | --------------- |
| INT / BIGINT | Integers, up to ±2.1e9 / ±9.2e18 | 42 |
| NUMERIC(p, s) | Exact decimal numbers | 19.99 |
| TEXT | Text of any length | 'keyboard' |
| BOOLEAN | true, false, or unknown | true |
| TIMESTAMPTZ | Moment in time with timezone | '2026-09-03 12:00+02' |
| UUID | 128-bit identifier | 'a0eebc99-9e6b-4a7f-8f6b-1c2d3e4f5a6b' |
| JSONB | Binary JSON document | '{"size": "m"}' |

After creating the table you can fill it and look at what happened:

```sql
INSERT INTO products (name, price) VALUES ('Hub', 25.00), ('Cable', 9.50);

SELECT * FROM products;
```

## Filtering rows: WHERE

WHERE takes a boolean expression and keeps only the rows for which it is true. The basic tools are comparison operators (=, <>, <, >, <=, >=), the logical connectors AND, OR and NOT, the range and membership operators BETWEEN and IN, and the pattern matchers LIKE and ILIKE.

```sql
SELECT name, price
FROM products
WHERE (price BETWEEN 10 AND 100 OR is_active = false)
  AND name ILIKE '%keyboard%';
```

BETWEEN 10 AND 100 is inclusive on both ends. IN (1, 2, 3) is shorthand for a list of equality checks. LIKE matches patterns with % (any run of characters) and _ (exactly one character); ILIKE does the same case-insensitively. For real pattern work Postgres also supports regular expressions through ~ and !~, but for everyday filters ILIKE covers the need.

The parentheses in the example are not decoration: AND binds tighter than OR, so (a OR b) AND c is not the same as a OR (b AND c). Whenever you mix connectors, write the parentheses explicitly.

NULL deserves a special paragraph. A NULL is not a value — it is the absence of a value. Any comparison with NULL, even NULL = NULL, evaluates to neither true nor false, so such rows are silently excluded from WHERE results. To select them you must write IS NULL (and IS NOT NULL for the opposite).

## Sorting and limiting

ORDER BY sorts the result set. You can sort by several keys at once: first by the first key, and only then, for rows tied on it, by the next. DESC reverses the order of a key; ASC, the default, keeps the natural one.

```sql
SELECT name, price
FROM products
ORDER BY price DESC, name ASC
LIMIT 10 OFFSET 20;
```

LIMIT 10 OFFSET 20 is the classic pagination idiom: skip the first 20 rows of the sorted result and take the next 10. Two practical notes. First, pagination is only meaningful with a stable order — if two rows have identical sort keys, their relative order between requests is arbitrary. Second, OFFSET is expensive for deep pages: Postgres has to sort the whole table and then throw rows away. For large tables a keyset page (WHERE id > last_seen_id ... LIMIT 10) is dramatically faster.

## A complete example

Let's combine everything into one small script: a table, some data, and a reporting question — which products do named customers order, and for how much.

```sql
CREATE TABLE orders (
    id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product   TEXT NOT NULL,
    amount    NUMERIC(10, 2) NOT NULL,
    customer  TEXT
);

INSERT INTO orders (product, amount, customer)
VALUES
    ('Monitor',  250.00, 'ada@example.com'),
    ('Cable',     9.50,  NULL),
    ('Keyboard',  80.00, 'ada@example.com');

SELECT product, amount
FROM orders
WHERE customer IS NOT NULL
ORDER BY amount DESC;
```

The result is two rows: Monitor and Keyboard. The Cable row disappears not because of its price but because its customer is NULL, and IS NOT NULL filtered it out — the exact row a careless WHERE customer = NULL would have mangled.

The script is deliberately written without a transaction: in autocommit mode every statement commits on its own. As soon as you start changing data in several coordinated steps, wrap the block in BEGIN ... COMMIT — that topic belongs to the Transactions & Concurrency page.

## Common mistakes

> **WARNING**
> WHERE name = NULL is never true, so the query silently returns zero rows. Check for NULL with IS NULL / IS NOT NULL — this is the number one "my query returns nothing" bug for newcomers.

> **WARNING**
> SELECT * is fine in an interactive psql session, but in application code list columns explicitly: a new column in the table changes the shape of the result and can break your row-to-object mapping.

> **TIP**
> Add a unique column (id) as the last key in ORDER BY: the result order becomes fully deterministic, which matters for pagination and for tests that assert exact output.

<!-- RU -->

SQL — интерфейс между приложением и PostgreSQL. Вы описываете, что хотите, а планировщик запросов решает, как это достать: какие таблицы читать, в каком порядке и по каким индексам. Эта страница разбирает анатомию запроса, базовые типы данных PostgreSQL 17 и повседневные приёмы фильтрации, сортировки и пагинации, которые вы будете использовать постоянно.

## Как читается SQL-запрос

Каждое SQL-выражение следует одному и тому же каркасу, и клаузы всегда идут в фиксированном порядке: SELECT описывает, какие колонки вы хотите, FROM называет таблицу или таблицы, WHERE отбирает строки, ORDER BY сортирует результат, а LIMIT с OFFSET вырезают одну страницу. Использовать их все не обязательно, но порядок задан языком.

```sql
SELECT name, price
FROM products
WHERE price > 10
ORDER BY price DESC
LIMIT 5;
```

Читаем пример сверху вниз: из таблицы products берём колонки name и price, оставляем только строки, где price больше 10, сортируем по price по убыванию и возвращаем первые пять строк. Планировщик свободен выполнять шаги в любом физически удобном порядке — WHERE обычно применяется раньше ORDER BY, но это деталь реализации, а не часть контракта.

Выражения завершаются точкой с запятой. psql, командный клиент, отправляет выражение на сервер, когда видит точку с запятой; в скрипте из нескольких выражений именно она разделяет одну команду на другую.

Ещё два правила этикета. Идентификаторы с пробелами или совпадающие с ключевыми словами заключаются в двойные кавычки: "My Table". Но не ставьте кавычки по привычке — кавыченные идентификаторы чувствительны к регистру, а без кавычек складываются в нижний регистр.

## Таблицы, колонки и типы данных

Таблица — именованное множество строк, у которых все одинаковые колонки. Тип колонки — первое проектное решение, потому что он определяет, как может выглядеть данные и как движок хранит и сравнивает их.

```sql
CREATE TABLE products (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name       TEXT NOT NULL,
    price      NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    is_active  BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Колонка id — identity: Postgres нумерует строки автоматически, а PRIMARY KEY гарантирует, что номер уникален. NOT NULL делает колонку обязательной, DEFAULT подставляет значение, если при вставке ничего не указали, а CHECK (price >= 0) отклоняет строки, которые не имеют смысла с точки зрения бизнеса.

Базовые типы, которые встречаются почти в любой схеме:

| Тип | Что хранит | Пример значения |
| ------ | ---------------- | --------------- |
| INT / BIGINT | Целые, до ±2.1e9 / ±9.2e18 | 42 |
| NUMERIC(p, s) | Точные десятичные числа | 19.99 |
| TEXT | Текст любой длины | 'keyboard' |
| BOOLEAN | true, false или «неизвестно» | true |
| TIMESTAMPTZ | Мгновение времени с таймзоной | '2026-09-03 12:00+02' |
| UUID | 128-битный идентификатор | 'a0eebc99-9e6b-4a7f-8f6b-1c2d3e4f5a6b' |
| JSONB | JSON-документ в бинарном виде | '{"size": "m"}' |

После создания таблицы можно заполнить её и посмотреть, что получилось:

```sql
INSERT INTO products (name, price) VALUES ('Hub', 25.00), ('Cable', 9.50);

SELECT * FROM products;
```

## Фильтрация строк: WHERE

WHERE принимает булево выражение и оставляет только строки, для которых оно истинно. Базовый инструментарий — операторы сравнения (=, <>, <, >, <=, >=), логические связки AND, OR и NOT, операторы диапазона и принадлежности BETWEEN и IN, и сопоставление шаблонов LIKE и ILIKE.

```sql
SELECT name, price
FROM products
WHERE (price BETWEEN 10 AND 100 OR is_active = false)
  AND name ILIKE '%keyboard%';
```

BETWEEN 10 AND 100 включает оба конца диапазона. IN (1, 2, 3) — сокращение для списка проверок на равенство. LIKE сопоставляет шаблоны, где % — любая последовательность символов, а _ — ровно один символ; ILIKE делает то же самое без учёта регистра. Для серьёзной работы с шаблонами у Postgres есть регулярные выражения через ~ и !~, но для повседневных фильтров хватает ILIKE.

Скобки в примере — не украшение: AND связывается крепче, чем OR, поэтому (a OR b) AND c не равно a OR (b AND c). Смешивая связки, всегда пишите скобки явно.

NULL заслуживает отдельного абзаца. NULL — это не значение, а отсутствие значения. Любое сравнение с NULL, даже NULL = NULL, даёт не true и не false, поэтому такие строки молча выпадают из результата WHERE. Чтобы выбрать их, нужно писать IS NULL (и IS NOT NULL для противоположного).

## Сортировка и ограничение

ORDER BY сортирует множество результата. Можно сортировать сразу по нескольким ключам: сначала по первому, и только затем — по второму для строк, сравнявшихся по первому. DESC переворачивает порядок ключа; ASC, значение по умолчанию, сохраняет естественный.

```sql
SELECT name, price
FROM products
ORDER BY price DESC, name ASC
LIMIT 10 OFFSET 20;
```

LIMIT 10 OFFSET 20 — классический идиом пагинации: пропустить первые 20 строк отсортированного результата и взять следующие 10. Два практических замечания. Во-первых, пагинация осмысленна только при стабильном порядке — если у двух строк одинаковые ключи сортировки, их взаимное расположение между запросами произвольно. Во-вторых, OFFSET дорог на глубоких страницах: Postgres сортирует всю таблицу, а потом выбрасывает строки. Для больших таблиц keyset-страница (WHERE id > last_seen_id ... LIMIT 10) работает на порядки быстрее.

## Полный пример

Соберём всё в один небольшой скрипт: таблица, немного данных и отчётный вопрос — какие товары заказывают именные клиенты и на какую сумму.

```sql
CREATE TABLE orders (
    id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product   TEXT NOT NULL,
    amount    NUMERIC(10, 2) NOT NULL,
    customer  TEXT
);

INSERT INTO orders (product, amount, customer)
VALUES
    ('Monitor',  250.00, 'ada@example.com'),
    ('Cable',     9.50,  NULL),
    ('Keyboard',  80.00, 'ada@example.com');

SELECT product, amount
FROM orders
WHERE customer IS NOT NULL
ORDER BY amount DESC;
```

Результат — две строки: Monitor и Keyboard. Строка Cable исчезает не из-за цены, а потому что её customer равен NULL, и IS NOT NULL её отфильтровал — ровно та строка, которую небрежный WHERE customer = NULL исказил бы.

Скрипт намеренно написан без транзакции: в режиме autocommit каждое выражение коммитится само. Как только вы начнёте менять данные несколькими согласованными шагами, оборачивайте блок в BEGIN ... COMMIT — эта тема раскрыта на странице Transactions & Concurrency (Транзакции и конкурентность).

## Частые ошибки

> **WARNING**
> WHERE name = NULL никогда не истинно, поэтому запрос молча возвращает ноль строк. NULL проверяется через IS NULL / IS NOT NULL — это ошибка номер один в жанре «мой запрос ничего не возвращает».

> **WARNING**
> SELECT * годится в интерактивной сессии psql, но в коде приложения перечисляйте колонки явно: новая колонка в таблице изменит форму результата и может сломать маппинг строки в объект.

> **TIP**
> Добавляйте уникальную колонку (id) последним ключом в ORDER BY: порядок результата становится полностью детерминированным, а это важно для пагинации и для тестов, которые сверяют точный вывод.
