---
id: pg-window
track: postgres
type: guide
section: advanced
order: 5
title:
  en: "Window Functions"
  ru: "Оконные функции"
excerpt:
  en: "Ranking, running totals and month-over-month deltas without collapsing your rows: PARTITION BY, ROW_NUMBER, RANK, LAG, LEAD and the classic top-N-per-group pattern."
  ru: "Ранжирование, накопительные суммы и месячные дельты без схлопывания строк: PARTITION BY, ROW_NUMBER, RANK, LAG, LEAD и классический паттерн топ-N-в-группе."
version: "postgres 17"
updated: 2026-09-03
---

Window functions compute a value across a set of rows — the window — and attach it to every row, instead of collapsing the rows into a single aggregate result. This is the tool behind "top three products per category", "the running balance", "the difference from the previous month" — the whole classic family of reporting queries.

## What separates a window from an aggregate

SUM(amount) with GROUP BY month gives one row per month. SUM(amount) OVER (PARTITION BY month) gives every row its month's total, and the table keeps all its original rows. The keyword OVER turns an aggregate into a window function, and the arguments inside OVER describe the window itself.

```sql
-- Aggregate: three months, three rows
SELECT month, SUM(amount) AS total
FROM revenue
GROUP BY month;

-- Window: every original row, plus its month's total
SELECT date, amount,
       SUM(amount) OVER (PARTITION BY month) AS month_total
FROM revenue
ORDER BY date;
```

PARTITION BY splits the table into independent groups — like GROUP BY — but the rows do not disappear, they only get an extra column computed over their group. ORDER BY inside OVER sorts the rows within each group; ranking functions and running totals need that order to know what "previous" and "next" mean.

Without PARTITION BY, the window is the whole table: one group, and the aggregate you write sees every row. That is sometimes exactly what you want — a grand total attached to each row — and sometimes the source of a surprising repeated number.

## Ranking: ROW_NUMBER, RANK, DENSE_RANK

The three ranking functions answer "what place is this row in", and they differ only in how they treat ties.

```sql
SELECT product,
       sales,
       ROW_NUMBER()   OVER (ORDER BY sales DESC) AS rn,
       RANK()         OVER (ORDER BY sales DESC) AS rk,
       DENSE_RANK()   OVER (ORDER BY sales DESC) AS dr
FROM sales
ORDER BY rn;
```

ROW_NUMBER hands out unambiguous numbers 1, 2, 3, ... even when sales are equal — the tie is broken arbitrarily, which is fine for "pick one winner" reports. RANK skips places after a tie: 1, 2, 2, 4. DENSE_RANK does not skip: 1, 2, 2, 3. For top-N lists ROW_NUMBER is almost always the right choice, because it lets you cut the list off cleanly.

One practical detail: you cannot filter on the window's own result in the same query — WHERE runs before the window is computed. So the cutoff lives in an outer query: select the ranked subquery, then filter WHERE rn <= 3.

## Running totals and neighbors: SUM OVER, LAG, LEAD

```sql
SELECT date,
       amount,
       SUM(amount) OVER (ORDER BY date)      AS running_total,
       LAG(amount) OVER (ORDER BY date)      AS prev_amount,
       amount - LAG(amount) OVER (ORDER BY date) AS delta
FROM revenue
ORDER BY date;
```

SUM(amount) OVER (ORDER BY date) without PARTITION BY accumulates from the first row of the whole table up to the current one — the classic running balance. LAG returns the value from a previous row, LEAD from a following one; the second argument is how many rows to step (the default is 1), and the third argument is the value to use when there is no such row — the first row of the table has no previous row, so LAG(amount, 1, 0) treats the imaginary predecessor as zero.

The delta column is the standard way to compute month-over-month change, and the pattern generalizes: any comparison of "this row versus the row n positions away" is a LAG or LEAD with an arithmetic expression on top.

## A real report: top three per category

The question "show the three best products in every category" cannot be written with a single GROUP BY — grouping collapses each category into one row, and you need three. Window functions are built for exactly this:

```sql
SELECT category, product, sales
FROM (
    SELECT category, product, sales,
           ROW_NUMBER() OVER (PARTITION BY category
                              ORDER BY sales DESC) AS rn
    FROM sales
) ranked
WHERE rn <= 3
ORDER BY category, rn;
```

The pattern: the inner query numbers the rows inside each category, the outer query throws away everything from fourth place down. You will recognize this shape in a lot of production reports — "top N per group", "the latest event per user", "the first error per session" — only the columns and the ORDER BY change.

## Performance and traps

Window functions sort their partitions, so underneath there is a sort node with the same cost as ORDER BY. On large tables, partition by columns you can index, keep the number of different windows in one query small, and push the cutoff (WHERE rn <= 3) as early as possible — one ROW_NUMBER over a million rows is cheap, five different windows over the same table is not.

NULL in the ORDER BY inside OVER is placed first by default (NULLS FIRST in ascending order), so a row with missing sales can steal the first place in a ranking. If you rank by sales descending, write ORDER BY sales DESC NULLS LAST — or filter the NULLs out before the window.

> **TIP**
> Name your windows: WITH w AS (PARTITION BY month ORDER BY date) lets you write SUM(amount) OVER w and COUNT(*) OVER w — one definition, several functions, one less place for the partitioning to drift.

> **WARNING**
> An empty OVER () means "the window is the entire table": SUM(x) OVER () glues the grand total of every row onto every row. The classic source of "why is my total repeated on all rows".

<!-- RU -->

Оконные функции вычисляют значение по набору строк — окну — и приклеивают его к каждой строке, вместо того чтобы схлопнуть строки в один агрегированный результат. Это инструмент за запросами «топ-3 товара в каждой категории», «накопительный баланс», «разница с прошлым месяцем» — за всей классической отчётной семьей.

## Чем окно отличается от агрегата

SUM(amount) с GROUP BY month даёт по одной строке на месяц. SUM(amount) OVER (PARTITION BY month) даёт каждой строке сумму её месяца, и таблица сохраняет все исходные строки. Ключевое слово OVER превращает агрегат в оконную функцию, а аргументы внутри OVER описывают само окно.

```sql
-- Агрегат: три месяца, три строки
SELECT month, SUM(amount) AS total
FROM revenue
GROUP BY month;

-- Окно: каждая исходная строка плюс сумма её месяца
SELECT date, amount,
       SUM(amount) OVER (PARTITION BY month) AS month_total
FROM revenue
ORDER BY date;
```

PARTITION BY делит таблицу на независимые группы — как GROUP BY, — но строки не исчезают, к ним просто добавляется колонка, вычисленная по их группе. ORDER BY внутри OVER сортирует строки внутри каждой группы; ранжированию и накопительным суммам этот порядок нужен, чтобы понимать, что такое «предыдущая» и «следующая» строка.

Без PARTITION BY окно — вся таблица: одна группа, и агрегат видит все строки. Иногда это ровно то, что нужно — общий итог, приклеенный к каждой строке, — а иногда источник странного повторяющегося числа.

## Ранжирование: ROW_NUMBER, RANK, DENSE_RANK

Три ранжирующие функции отвечают на вопрос «какое место у этой строки» и отличаются только тем, как трактуют ничьи.

```sql
SELECT product,
       sales,
       ROW_NUMBER()   OVER (ORDER BY sales DESC) AS rn,
       RANK()         OVER (ORDER BY sales DESC) AS rk,
       DENSE_RANK()   OVER (ORDER BY sales DESC) AS dr
FROM sales
ORDER BY rn;
```

ROW_NUMBER выдаёт однозначные номера 1, 2, 3, ... даже когда sales равны — ничья разрешается произвольно, что нормально для отчётов «выбрать одного победителя». RANK пропускает места после ничьей: 1, 2, 2, 4. DENSE_RANK не пропускает: 1, 2, 2, 3. Для топ-N списков ROW_NUMBER почти всегда правильный выбор, потому что он позволяет чисто обрезать список.

Практическая деталь: фильтровать по результату собственного окна в том же запросе нельзя — WHERE выполняется раньше, чем окно вычислено. Поэтому обрезка живёт во внешнем запросе: выберите ранжированную подзапрос, затем WHERE rn <= 3.

## Накопительные суммы и соседи: SUM OVER, LAG, LEAD

```sql
SELECT date,
       amount,
       SUM(amount) OVER (ORDER BY date)      AS running_total,
       LAG(amount) OVER (ORDER BY date)      AS prev_amount,
       amount - LAG(amount) OVER (ORDER BY date) AS delta
FROM revenue
ORDER BY date;
```

SUM(amount) OVER (ORDER BY date) без PARTITION BY накапливает от первой строки всей таблицы до текущей — классический накопительный баланс. LAG возвращает значение из предыдущей строки, LEAD — из следующей; второй аргумент — на сколько строк шагнуть (по умолчанию 1), третий аргумент — значение, когда такой строки нет: у первой строки таблицы нет предыдущей, поэтому LAG(amount, 1, 0) считает воображаемого предшественника нулём.

Колонка delta — стандартный способ посчитать месячное изменение, и паттерн обобщается: любое сравнение «эта строка против строки в n позициях от неё» — это LAG или LEAD с арифметическим выражением сверху.

## Реальный отчёт: топ-3 в каждой категории

Вопрос «покажи три лучших товара в каждой категории» нельзя написать одним GROUP BY — группировка схлопывает каждую категорию в одну строку, а нужно три. Оконные функции созданы ровно для этого:

```sql
SELECT category, product, sales
FROM (
    SELECT category, product, sales,
           ROW_NUMBER() OVER (PARTITION BY category
                              ORDER BY sales DESC) AS rn
    FROM sales
) ranked
WHERE rn <= 3
ORDER BY category, rn;
```

Паттерн: внутренний запрос нумерует строки внутри каждой категории, внешний выбрасывает всё начиная с четвёртого места. Вы узнаете эту форму во многих продакшн-отчётах — «топ-N в группе», «последнее событие каждого пользователя», «первая ошибка в сессии» — меняются только колонки и ORDER BY.

## Производительность и ловушки

Оконные функции сортируют свои partitions, поэтому под ними лежит сортировочный узел с той же стоимостью, что и ORDER BY. На больших таблицах partition'йте по колонкам, по которым есть индекс, держите число разных окон в одном запросе маленьким и обрезайте результат (WHERE rn <= 3) как можно раньше: один ROW_NUMBER на миллион строк дёшев, пять разных окон по одной таблице — уже нет.

NULL в ORDER BY внутри OVER по умолчанию ставится первым (NULLS FIRST при возрастании), поэтому строка с пропущенными sales может занять первое место в ранжировании. Если ранжируете по sales по убыванию, пишите ORDER BY sales DESC NULLS LAST — или отфильтруйте NULL перед окном.

> **TIP**
> Именуйте окна: WITH w AS (PARTITION BY month ORDER BY date) позволяет писать SUM(amount) OVER w и COUNT(*) OVER w — одно определение, несколько функций, на одно место меньше, где partitions может «поплыть».

> **WARNING**
> Пустое OVER () значит «окно — вся таблица»: SUM(x) OVER () приклеивает общий итог всех строк к каждой строке. Классический источник вопроса «почему моя сумма повторяется на всех строках».
