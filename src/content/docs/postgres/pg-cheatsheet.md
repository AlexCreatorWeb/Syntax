---
id: pg-cheatsheet
track: postgres
type: reference
section: reference
order: 4
title:
  en: "Common Queries Cheat Sheet"
  ru: "Шпаргалка по частым запросам"
excerpt:
  en: "The queries you write every day on one page: reporting patterns, schema and index maintenance, and data-hygiene functions — copy, adapt the names, use."
  ru: "Запросы, которые пишешь каждый день, на одной странице: отчётные паттерны, обслуживание схемы и индексов, функции «гигиены данных» — скопировал, подставил имена, пользуешься."
version: "postgres 17"
updated: 2026-09-03
---

The working set of queries you reach for constantly, gathered in one place: reporting patterns for SELECT, the maintenance statements for schemas and indexes, and the small functions that keep data hygienic. Copy a row, adapt the names, and run.

## Everyday SELECT patterns

| Job | Query |
| ----- | ------- |
| Top N by a column | SELECT ... ORDER BY x DESC LIMIT N |
| Top N per group | ROW_NUMBER() OVER (PARTITION BY g ORDER BY x DESC) in a subquery, then WHERE rn <= N |
| Find duplicates | SELECT col, COUNT(*) FROM t GROUP BY col HAVING COUNT(*) > 1 |
| Rows where a column is NULL | SELECT ... WHERE col IS NULL |
| One row by id | SELECT ... WHERE id = $1 (a parameter, not a string) |
| Share of the whole | COUNT(*) FILTER (WHERE ok) * 100.0 / COUNT(*) |
| The last N days | SELECT ... WHERE created_at >= now() - interval '30 days' |
| Date without the time | DATE_TRUNC('day', created_at) |
| Keyset pagination | SELECT ... WHERE id > $last_id ORDER BY id LIMIT 50 |
| "Has at least one related row" | WHERE EXISTS (SELECT 1 FROM x WHERE x.user_id = u.id) |
| Pivot a row into columns | MAX(value) FILTER (WHERE label = 'a') AS a, MAX(value) FILTER (WHERE label = 'b') AS b |

FILTER (WHERE ...) is Postgres's way of writing a conditional aggregate without a CASE: COUNT(*) FILTER (WHERE status = 'paid') counts only the paid rows, and several FILTER expressions in one SELECT turn a tall table into a wide one.

EXISTS beats a counted IN for "has at least one" checks: the planner stops at the first matching related row, while COUNT or a subquery with * may scan the whole relation.

## Schema and index maintenance

| Job | Statement |
| ----- | ----------- |
| Add a column | ALTER TABLE t ADD COLUMN c TEXT |
| Rename a table | ALTER TABLE t RENAME TO t2 |
| Drop a column | ALTER TABLE t DROP COLUMN c |
| Unique index | CREATE UNIQUE INDEX idx_t_col ON t (col) |
| Partial index | CREATE INDEX idx ON t (col) WHERE flag |
| Drop an index | DROP INDEX idx_t_col |
| Check a query plan | EXPLAIN (ANALYZE, BUFFERS) SELECT ... |
| Refresh planner statistics | ANALYZE t |
| Clean dead row versions | VACUUM (ANALYZE) t (usually autovacuum's job) |
| Grant reads to an app role | GRANT SELECT ON t TO app_role |
| Freeze old data into an archive | CREATE TABLE archive AS SELECT * FROM t WHERE created_at < now() - interval '1 year' |

EXPLAIN (ANALYZE, BUFFERS) is the single most useful maintenance statement: it runs the query for real, times every node, and reports disk pages. If a plan you expected to be an index scan is a Seq Scan, the plan output tells you whether the index is missing, the statistics are stale, or the query is simply not selective enough.

## Data hygiene

| Job | Function or clause |
| ----- | -------------------- |
| Replace NULL with a value | COALESCE(a, b) |
| NULL when two values are equal | NULLIF(a, b) |
| Empty string to NULL | NULLIF(trim(s), '') |
| Insert or update | INSERT ... ON CONFLICT (id) DO UPDATE SET col = EXCLUDED.col |
| Skip duplicates silently | INSERT ... ON CONFLICT (id) DO NOTHING |
| Split a string into an array | string_to_array(s, ',') |
| Join an array into a string | array_to_string(a, ', ') |
| Format a timestamp | to_char(created_at, 'YYYY-MM-DD HH24:MI') |
| A new random UUID | gen_random_uuid() |
| One random row (small tables only) | ORDER BY random() LIMIT 1 |

COALESCE(a, b, c) returns the first non-NULL argument — the standard fallback chain for "use a if it exists, else b". NULLIF(a, b) returns NULL exactly when the arguments are equal, which is why NULLIF(trim(s), '') is the two-word way to normalize empty strings before inserting them.

For application code the single most valuable row of this page is the idiom "parameter, not string": every value goes in as $1, $2, ... and the driver sends it separately from the SQL text. The same statement shape gets cached by the planner, injection is impossible, and the query stays testable.

> **TIP**
> Keep a scratch psql file with your last ten real queries, stripped of project names. In six months it will be your best onboarding material — and this page's patterns will look familiar in your own history.

<!-- RU -->

Рабочий набор запросов, к которым вы тянетесь постоянно, на одной странице: отчётные паттерны для SELECT, служебные выражения для схемы и индексов и маленькие функции «гигиены данных». Скопируйте строку, подставьте имена, запускайте.

## Повседневные SELECT-паттерны

| Задача | Запрос |
| ----- | ------- |
| Топ-N по колонке | SELECT ... ORDER BY x DESC LIMIT N |
| Топ-N в группе | ROW_NUMBER() OVER (PARTITION BY g ORDER BY x DESC) в подзапросе, затем WHERE rn <= N |
| Найти дубликаты | SELECT col, COUNT(*) FROM t GROUP BY col HAVING COUNT(*) > 1 |
| Строки, где колонка NULL | SELECT ... WHERE col IS NULL |
| Одна строка по id | SELECT ... WHERE id = $1 (параметр, а не строка) |
| Доля от целого | COUNT(*) FILTER (WHERE ok) * 100.0 / COUNT(*) |
| Последние N дней | SELECT ... WHERE created_at >= now() - interval '30 days' |
| Дата без времени | DATE_TRUNC('day', created_at) |
| Keyset-пагинация | SELECT ... WHERE id > $last_id ORDER BY id LIMIT 50 |
| «Есть хотя бы одна связанная строка» | WHERE EXISTS (SELECT 1 FROM x WHERE x.user_id = u.id) |
| Перевернуть строку в колонки | MAX(value) FILTER (WHERE label = 'a') AS a, MAX(value) FILTER (WHERE label = 'b') AS b |

FILTER (WHERE ...) — способ Postgres писать условный агрегат без CASE: COUNT(*) FILTER (WHERE status = 'paid') считает только оплаченные строки, а несколько FILTER-выражений в одном SELECT превращают высокую таблицу в широкую.

EXISTS бьёт подсчёт через IN в проверках «есть хотя бы одна»: планировщик останавливается на первой подходящей связанной строке, тогда как подсчёт или подзапрос со * может просканировать всю relation.

## Обслуживание схемы и индексов

| Задача | Выражение |
| ----- | ----------- |
| Добавить колонку | ALTER TABLE t ADD COLUMN c TEXT |
| Переименовать таблицу | ALTER TABLE t RENAME TO t2 |
| Удалить колонку | ALTER TABLE t DROP COLUMN c |
| Unique-индекс | CREATE UNIQUE INDEX idx_t_col ON t (col) |
| Частичный индекс | CREATE INDEX idx ON t (col) WHERE flag |
| Удалить индекс | DROP INDEX idx_t_col |
| Посмотреть план запроса | EXPLAIN (ANALYZE, BUFFERS) SELECT ... |
| Обновить статистику планировщика | ANALYZE t |
| Почистить мёртвые версии строк | VACUUM (ANALYZE) t (обычно работа autovacuum) |
| Выдать чтение роле приложения | GRANT SELECT ON t TO app_role |
| Заморозить старые данные в архив | CREATE TABLE archive AS SELECT * FROM t WHERE created_at < now() - interval '1 year' |

EXPLAIN (ANALYZE, BUFFERS) — самое полезное служебное выражение: оно реально выполняет запрос, таймирует каждый узел и сообщает о страницах диска. Если план, который вы ожидали как index scan, оказался Seq Scan, вывод плана скажет, чего не хватает: индекса, свежей статистики, или запрос просто недостаточно селективный.

## Гигиена данных

| Задача | Функция или клауза |
| ----- | -------------------- |
| Заменить NULL на значение | COALESCE(a, b) |
| NULL, если два значения равны | NULLIF(a, b) |
| Пустая строка в NULL | NULLIF(trim(s), '') |
| Вставить или обновить | INSERT ... ON CONFLICT (id) DO UPDATE SET col = EXCLUDED.col |
| Молча пропустить дубликаты | INSERT ... ON CONFLICT (id) DO NOTHING |
| Разбить строку в массив | string_to_array(s, ',') |
| Склеить массив в строку | array_to_string(a, ', ') |
| Оформить timestamp | to_char(created_at, 'YYYY-MM-DD HH24:MI') |
| Новый случайный UUID | gen_random_uuid() |
| Одна случайная строка (только малые таблицы) | ORDER BY random() LIMIT 1 |

COALESCE(a, b, c) возвращает первый не-NULL аргумент — стандартная цепочка отступлений для «используй a, если он есть, иначе b». NULLIF(a, b) возвращает NULL ровно тогда, когда аргументы равны, — именно поэтому NULLIF(trim(s), '') — двухсловный способ нормализовать пустые строки перед вставкой.

Для кода приложения самая ценная строка этой страницы — идиома «параметр, а не строка»: каждое значение идёт как $1, $2, ... и драйвер шлёт его отдельно от текста SQL. Форма запроса кэшируется планировщиком, инъекция невозможна, и запрос остаётся тестируемым.

> **TIP**
> Держите черновой psql-файл с вашими последними десятью реальными запросами, очищенный от имён проекта. Через шесть месяцев это будет ваш лучший onboarding-материал — а паттерны этой страницы вы узнаете в собственной истории.
