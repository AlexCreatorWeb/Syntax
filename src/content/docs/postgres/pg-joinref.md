---
id: pg-joinref
track: postgres
type: reference
section: reference
order: 2
title:
  en: "JOIN Types Illustrated"
  ru: "Типы JOIN: примеры"
excerpt:
  en: "INNER, LEFT, RIGHT and FULL joins on one small example with users and orders, plus CROSS JOIN and the comma-join trap, in tables you can screenshot."
  ru: "INNER, LEFT, RIGHT и FULL JOIN на одном маленьком примере с users и orders, плюс CROSS JOIN и ловушка comma-join — в таблицах, которые хочется заскринить."
version: "postgres 17"
updated: 2026-09-03
relatedTask: pg-005
---

All four join types, illustrated on one small example you can keep in your head. The tables: users with three rows (Ada, Ben, Cara) and orders with three rows — Ada has two orders, Ben has one, Cara has none.

## The four joins at a glance

| Join | Keeps | What happens without a match |
| ------ | ------- | ------------------------------ |
| INNER JOIN | Only matched rows from both sides | Both rows disappear |
| LEFT JOIN | Every row of the left table | Right-side columns become NULL |
| RIGHT JOIN | Every row of the right table | Left-side columns become NULL |
| FULL JOIN | Every row from both tables | NULLs on the side without a match |

The LEFT JOIN, which does most of the reporting work:

```sql
SELECT u.name, o.amount
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
ORDER BY u.name, o.amount;
```

The result, in psql's own format:

```plaintext
 name | amount
------+---------
 Ada  |     100
 Ada  |      50
 Ben  |      20
 Cara |
```

Note the multiplicities: Ada appears twice because she has two orders, and Cara appears once with an empty amount because she has none. A join can multiply rows — the result size is not the sum of the inputs, it is the number of matches.

RIGHT JOIN is the mirror of LEFT: keep every order even if its user was deleted from the table. In practice it is used rarely, because swapping the two tables and writing LEFT gives the same rows — and most developers find LEFT easier to read. FULL JOIN is for reconciliation: "which customers exist only in the old system and which only in the new one" — every row from both sides, with NULLs marking the side that had no match.

## The example, all four ways

| Query | Rows in the result |
| ------- | -------------------- |
| users INNER JOIN orders | Ada x2, Ben x1 |
| users LEFT JOIN orders | Ada x2, Ben x1, Cara with NULL amount |
| orders LEFT JOIN users | All three orders (every order has a user, so no NULLs) |
| users FULL JOIN orders | Ada x2, Ben x1, Cara with NULL amount |

Orientation matters: LEFT keeps the table written first. users LEFT JOIN orders and orders LEFT JOIN users are different queries with different results — the join type names the side that is protected from disappearing, not the side that is "important".

A second, common shape is joining three tables, where each ON clause references the previous pair:

```sql
SELECT u.name, o.amount, s.city
FROM users u
LEFT JOIN orders o    ON o.user_id = u.id
LEFT JOIN shipments s ON s.order_id = o.id;
```

Read it as a chain: users to orders, orders to shipments. Every left-protected table keeps its rows, and every missing link shows up as NULLs in the columns that hang off it.

## CROSS JOIN and the comma trap

```sql
SELECT u.name, o.amount
FROM users u
CROSS JOIN orders o;
```

Three users times three orders: nine rows, every combination of a user and an order regardless of any relationship. Legitimate uses exist — generating a days-by-stores grid for a report, or pairing a lookup table with a data table — but in ninety-nine percent of cases a CROSS JOIN is a forgotten ON: the classic query that suddenly returns a hundred million rows.

The trap has a second face: a comma between two tables in FROM is exactly the same as CROSS JOIN. The query SELECT * FROM users, orders is a Cartesian product of ten thousand by ten thousand if both tables have ten thousand rows, and nothing in the syntax warns you.

> **WARNING**
> Two tables in FROM separated by a comma is a CROSS JOIN in disguise. If a query with "FROM a, b" returns far more rows than expected, an ON condition is missing — not the data.

> **TIP**
> For "everyone, including those without X" reports, LEFT JOIN plus COALESCE is the standard pair: COALESCE(o.amount, 0) turns the NULL rows into honest zeros instead of empty cells.

<!-- RU -->

Все четыре типа соединений, проиллюстрированные на одном маленьком примере, который можно держать в голове. Таблицы: users с тремя строками (Ada, Ben, Cara) и orders с тремя строками — у Ada два заказа, у Ben один, у Cara ноль.

## Четыре соединения одним взглядом

| Join | Сохраняет | Что происходит без совпадения |
| ------ | ------- | ------------------------------ |
| INNER JOIN | Только совпавшие строки с обеих сторон | Обе строки исчезают |
| LEFT JOIN | Каждую строку левой таблицы | Правые колонки становятся NULL |
| RIGHT JOIN | Каждую строку правой таблицы | Левые колонки становятся NULL |
| FULL JOIN | Каждую строку из обеих таблиц | NULL на стороне без совпадения |

LEFT JOIN, который делает основную отчётную работу:

```sql
SELECT u.name, o.amount
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
ORDER BY u.name, o.amount;
```

Результат в фирменном формате psql:

```plaintext
 name | amount
------+---------
 Ada  |     100
 Ada  |      50
 Ben  |      20
 Cara |
```

Обратите внимание на кратности: Ada появляется дважды, потому что у неё два заказа, а Cara — один раз с пустым amount, потому что заказов нет. Join может умножать строки — размер результата это не сумма входов, а число совпадений.

RIGHT JOIN — зеркало LEFT: сохранить каждый заказ, даже если его пользователь удалён из таблицы. На практике используется редко, потому что поменяв таблицы местами и написав LEFT, получают те же строки — а LEFT легче читать. FULL JOIN — для сверки: «какие клиенты есть только в старой системе, а какие только в новой» — все строки из обеих сторон, с NULL, отмечающей сторону без совпадения.

## Пример, четыре способа

| Запрос | Строки в результате |
| ------- | -------------------- |
| users INNER JOIN orders | Ada x2, Ben x1 |
| users LEFT JOIN orders | Ada x2, Ben x1, Cara с NULL amount |
| orders LEFT JOIN users | Все три заказа (у каждого заказа есть пользователь, так что NULL нет) |
| users FULL JOIN orders | Ada x2, Ben x1, Cara с NULL amount |

Направление важно: LEFT сохраняет таблицу, написанную первой. users LEFT JOIN orders и orders LEFT JOIN users — разные запросы с разными результатами; тип соединения называет сторону, защищённую от исчезновения, а не «важную» сторону.

Вторая частая форма — соединение трёх таблиц, где каждый ON-клауза ссылается на предыдущую пару:

```sql
SELECT u.name, o.amount, s.city
FROM users u
LEFT JOIN orders o    ON o.user_id = u.id
LEFT JOIN shipments s ON s.order_id = o.id;
```

Читайте как цепочку: users к orders, orders к shipments. Каждая «левозащищённая» таблица сохраняет свои строки, и каждая недостающая связь проявляется как NULL в колонках, которые от неё висят.

## CROSS JOIN и ловушка запятой

```sql
SELECT u.name, o.amount
FROM users u
CROSS JOIN orders o;
```

Три пользователя на три заказа: девять строк, все комбинации пользователя и заказа независимо от какой-либо связи. Легитимные применения есть — генерация сетки «дни x магазины» для отчёта или связывание lookup-таблицы с таблицей данных, — но в девяноста девяти случаях из ста CROSS JOIN — это забытое ON: классический запрос, который вдруг возвращает сто миллионов строк.

У ловушки есть второе лицо: запятая между двумя таблицами в FROM — это ровно то же самое, что CROSS JOIN. Запрос SELECT * FROM users, orders — это декартов произведение десяти тысяч на десять тысяч, если в обеих таблицах по десять тысяч строк, и ничто в синтаксисе не предупреждает об этом.

> **WARNING**
> Две таблицы в FROM, разделённые запятой, — это CROSS JOIN в маске. Если запрос с «FROM a, b» возвращает заметно больше строк, чем ожидалось, — не в данных проблема, а отсутствует условие ON.

> **TIP**
> Для отчётов «все, включая тех, у кого нет X» стандартная пара — LEFT JOIN плюс COALESCE: COALESCE(o.amount, 0) превращает NULL-строки в честные нули вместо пустых ячеек.
