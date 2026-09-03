---
id: pg-joins
track: postgres
type: guide
section: queries
order: 3
title:
  en: "Joins"
  ru: "JOIN-операторы"
excerpt:
  en: "INNER, LEFT, RIGHT and FULL joins on the same example, multi-table joins with aliases, and the WHERE-versus-ON trap that silently turns LEFT JOINs into INNER JOINs."
  ru: "INNER, LEFT, RIGHT и FULL JOIN на одном примере, соединения нескольких таблиц с алиасами и ловушка WHERE против ON, которая молча превращает LEFT JOIN в INNER."
version: "postgres 17"
updated: 2026-09-03
relatedTask: pg-005
---

A relational database stores its data in many tables instead of one wide one. JOINs are the tool that brings columns from different tables back into a single result row. This page covers the join types, how to chain several tables, and the filtering trap that quietly changes the meaning of your query.

## Why data is split into tables

Instead of repeating an author's name in every book row, we store authors in their own table and link them by id. The price is a join at read time; the benefits are that a name is written once, a rename is a single UPDATE, and the tables grow with the number of entities rather than with the product of them.

```sql
CREATE TABLE authors (
    id   INT PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE books (
    id        INT PRIMARY KEY,
    title     TEXT NOT NULL,
    author_id INT REFERENCES authors (id)
);
```

REFERENCES authors (id) is a foreign key: the engine now guarantees that every author_id in books points at an existing author, and deleting an author with books is refused until you handle the children. This constraint is what makes joins reliable — the link columns are not just a convention, they are a promise.

A quick sanity habit for any join: check the row count of the result. An INNER JOIN never returns more rows than the side that can multiply it, and if the count balloons past the size of the inputs, either an ON condition was forgotten or the join is one-to-many and fanning out on purpose.

## INNER JOIN

INNER JOIN returns only the rows that match on both sides: a book without an author and an author without books both disappear from the result.

```sql
SELECT a.name, b.title
FROM books b
INNER JOIN authors a ON b.author_id = a.id
ORDER BY b.title;
```

Each side of the join gets an alias (b and a) — the short names we use in ON and SELECT. The ON clause describes the relationship: which column of which table links to which column of the other. In the great majority of cases it is "foreign key equals primary key".

Bare JOIN means INNER JOIN — the two spellings are identical. You can also write the matching columns in parentheses with USING (author_id) instead of ON; the result is the same, but ON is more explicit when the link columns have different names on the two sides.

## LEFT JOIN: keeping rows without matches

LEFT JOIN (formally LEFT OUTER JOIN) keeps every row of the left table even when nothing on the right matches. The unmatched columns come back as NULL.

```sql
SELECT a.name, b.title
FROM authors a
LEFT JOIN books b ON b.author_id = a.id
ORDER BY a.name;
```

An author who has not written a book yet still appears in the result — with title = NULL. This is the main tool behind "show everyone, even those with no activity yet" reports: customers and their orders, users and their reviews, days and the orders that landed on them. The NULL columns are not a display bug: they are data. In application code, map them explicitly — a NULL title means "no book", not "unknown".

RIGHT JOIN is the mirror image: keep every row of the right table. In practice it is used rarely, because flipping the two tables and writing LEFT JOIN gives the same result — and most developers find LEFT easier to think about.

## Multiple joins

Joins chain: the third table is joined to the already joined pair, and its ON clause can reference aliases from either side.

```sql
SELECT a.name, b.title, c.genre
FROM books b
JOIN authors a    ON a.id = b.author_id
JOIN categories c ON c.id = b.category_id
WHERE c.genre = 'fiction';
```

The order in which you write INNER JOINs does not change the result — the planner rearranges them into the cheapest order on its own. Readability, however, is yours: start from the main table, and attach each next table with its alias and its ON in one visual block, so the query reads as a map of the schema. A good way to debug a chain is to run SELECT COUNT(*) after each added join: a count that jumps by an order of magnitude tells you exactly which ON condition is wrong.

## WHERE versus ON

When you filter a LEFT JOIN, WHERE and ON are not equivalent. A filter inside ON narrows the join condition itself: left rows without a match after the filtering stay in the result, with NULLs. A filter in WHERE is applied after the join and throws away exactly the rows where the right-side columns are NULL — that is, it converts the LEFT JOIN into an INNER JOIN.

```sql
-- Variant 1: WHERE — authors without fiction disappear
SELECT a.name
FROM authors a
LEFT JOIN books b    ON b.author_id = a.id
LEFT JOIN categories c ON c.id = b.category_id
WHERE c.genre = 'fiction';

-- Variant 2: ON — every author stays, no fiction means NULL
SELECT a.name, b.title
FROM authors a
LEFT JOIN books b    ON b.author_id = a.id
LEFT JOIN categories c ON c.id = b.category_id AND c.genre = 'fiction';
```

The first query answers "which authors have fiction"; the second answers "for every author, show their fiction book if they have one". Same tables, same join, one word moved — different meaning. Rule of thumb: if you want to keep all left rows, put the condition on the right table into ON; if you want to discard them, put it into WHERE (or do not use LEFT at all). When in doubt, run both and compare: the number of left-side rows in the result must never shrink between the two variants.

A practical way to check which query you actually need: run both variants, and look at the row count and at the rows with NULLs. If the report "must show everyone", any lost row is a bug.

## Common mistakes

> **WARNING**
> A WHERE on a column of the right table silently converts a LEFT JOIN into an INNER JOIN: NULL rows no longer satisfy genre = 'fiction' and vanish. The result looks plausible but is missing everyone who had nothing to show.

> **WARNING**
> Two tables in FROM without a join condition produce a Cartesian product: every row of the first multiplied by every row of the second. Ten thousand orders times ten thousand users is a hundred million rows — almost always a sign that an ON was forgotten.

> **TIP**
> Give aliases that are short but meaningful (o for orders, c for customers) and use them everywhere in the query. Fully spelled-out table names make a three-table join unreadable.

<!-- RU -->

Реляционная база хранит данные во многих таблицах, а не в одной широкой. JOIN — инструмент, который возвращает колонки из разных таблиц в одну строку результата. Эта страница разбирает виды соединений, цепочки из нескольких таблиц и ловушку фильтрации, которая незаметно меняет смысл запроса.

## Зачем данные разнесены по таблицам

Вместо того чтобы повторять имя автора в каждой строке книг, мы храним авторов в отдельной таблице и связываем их по id. Цена — join в момент чтения; выгоды — имя записано один раз, смена имени это один UPDATE, а таблицы растут с числом сущностей, а не с их произведением.

```sql
CREATE TABLE authors (
    id   INT PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE books (
    id        INT PRIMARY KEY,
    title     TEXT NOT NULL,
    author_id INT REFERENCES authors (id)
);
```

REFERENCES authors (id) — это внешний ключ: движок теперь гарантирует, что каждый author_id в books указывает на существующего автора, и удалить автора с книгами откажется, пока вы не разберётесь с детьми. Это ограничение делает соединения надёжными — связующие колонки это не просто договорённость, а обещание.

Быстрый привычный чек для любого join: смотреть на число строк результата. INNER JOIN не возвращает больше строк, чем сторона, которая может умножать, и если число резко превышает размер входных таблиц, либо забыто условие ON, либо соединение один-ко-многим и распахивается намеренно.

## INNER JOIN

INNER JOIN возвращает только строки, которые совпали с обеих сторон: книга без автора и автор без книг исчезают из результата.

```sql
SELECT a.name, b.title
FROM books b
INNER JOIN authors a ON b.author_id = a.id
ORDER BY b.title;
```

Каждая сторона соединения получает алиас (b и a) — короткие имена, которые мы используем в ON и SELECT. Клауза ON описывает связь: какая колонка какой таблицы связана с какой колонкой другой. В подавляющем большинстве случаев это «внешний ключ равен первичному ключу».

Голый JOIN — это и есть INNER JOIN: обе записи идентичны. Можно также писать совпадающие колонки в скобках через USING (author_id) вместо ON; результат тот же, но ON нагляднее, когда связующие колонки называются по-разному.

## LEFT JOIN: строки без совпадений

LEFT JOIN (формально LEFT OUTER JOIN) сохраняет каждую строку левой таблицы, даже если справа ничего не совпало. Несовпавшие колонки приходят как NULL.

```sql
SELECT a.name, b.title
FROM authors a
LEFT JOIN books b ON b.author_id = a.id
ORDER BY a.name;
```

Автор, который ещё не написал ни одной книги, всё равно появляется в результате — с title = NULL. Это главный инструмент отчётов в стиле «покажи всех, даже тех, у кого пока нет активности»: клиенты и их заказы, пользователи и их отзывы, дни и пришедшие в них заказы. NULL-колонки — не баг отображения: это данные. В коде приложения мапьте их явно — NULL в title значит «книги нет», а не «неизвестно».

RIGHT JOIN — зеркальное изображение: сохранить все строки правой таблицы. На практике используется редко, потому что поменяв таблицы местами и написав LEFT JOIN, получают тот же результат — а LEFT проще держать в голове.

## Несколько соединений

Соединения chaîн: третья таблица дописывается к уже соединённой паре, и её ON-клауза может ссылаться на алиасы любой из сторон.

```sql
SELECT a.name, b.title, c.genre
FROM books b
JOIN authors a    ON a.id = b.author_id
JOIN categories c ON c.id = b.category_id
WHERE c.genre = 'fiction';
```

Порядок, в котором вы записываете INNER JOIN, не меняет результат — планировщик сам переставляет их в самый дешёвый порядок. Зато читаемость — на вас: начинайте с основной таблицы и добавляйте каждую следующую с её алиасом и ON одним визуальным блоком, чтобы запрос читался как карта схемы. Хороший способ отлаживать цепочку — выполнять SELECT COUNT(*) после каждого добавленного join: скачок числа на порядок точно показывает, какое условие ON неверно.

## WHERE против ON

Когда вы фильтруете LEFT JOIN, WHERE и ON не эквивалентны. Фильтр внутри ON сужает само условие соединения: строки левой таблицы без совпадения после фильтрации остаются в результате, с NULL. Фильтр в WHERE применяется после соединения и выбрасывает ровно те строки, где правые колонки NULL, — то есть превращает LEFT JOIN в INNER JOIN.

```sql
-- Вариант 1: WHERE — авторы без fiction исчезают
SELECT a.name
FROM authors a
LEFT JOIN books b    ON b.author_id = a.id
LEFT JOIN categories c ON c.id = b.category_id
WHERE c.genre = 'fiction';

-- Вариант 2: ON — каждый автор остаётся, нет fiction — значит NULL
SELECT a.name, b.title
FROM authors a
LEFT JOIN books b    ON b.author_id = a.id
LEFT JOIN categories c ON c.id = b.category_id AND c.genre = 'fiction';
```

Первый запрос отвечает на вопрос «какие авторы пишут fiction»; второй — «для каждого автора покажи его fiction-книгу, если она есть». Одни и те же таблицы, одно и то же соединение, одно слово переставлено — разный смысл. Правило: если хотите сохранить все строки слева, ставьте условие по правой таблице в ON; если хотите их выбросить — в WHERE (или вообще не используйте LEFT). Когда сомневаетесь, выполните оба и сравните: число строк левой таблицы в результате не должно уменьшаться между двумя вариантами.

Практический способ понять, какой запрос вам нужен: выполните оба варианта и посмотрите на число строк и на строки с NULL. Если отчёт «обязан показывать всех», любая потерянная строка — это баг.

## Частые ошибки

> **WARNING**
> WHERE по колонке правой таблицы молча превращает LEFT JOIN в INNER JOIN: строки с NULL больше не удовлетворяют genre = 'fiction' и исчезают. Результат выглядит правдоподобно, но в нём нет всех, кому было нечего показать.

> **WARNING**
> Две таблицы в FROM без условия соединения дают декартов произведение: каждая строка первой умножается на каждую строку второй. Десять тысяч заказов на десять тысяч пользователей — сто миллионов строк; почти всегда это признак забытого ON.

> **TIP**
> Давайте алиасы короткие, но содержательные (o — orders, c — customers) и используйте их везде в запросе. Полные имена таблиц делают соединение трёх таблиц нечитаемым.
