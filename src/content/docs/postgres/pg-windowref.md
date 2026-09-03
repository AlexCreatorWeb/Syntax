---
id: pg-windowref
track: postgres
type: reference
section: reference
order: 3
title:
  en: "Window Function Syntax"
  ru: "Оконные функции: синтаксис"
excerpt:
  en: "The anatomy of OVER(PARTITION BY ... ORDER BY ... frame) and a lookup table of the built-in window functions of PostgreSQL 17, from ROW_NUMBER to PERCENTILE_CONT."
  ru: "Анатомия OVER(PARTITION BY ... ORDER BY ... frame) и таблица встроенных оконных функций PostgreSQL 17 — от ROW_NUMBER до PERCENTILE_CONT."
version: "postgres 17"
updated: 2026-09-03
---

A dense reference for the syntax behind every window function in PostgreSQL 17: what each part of OVER does, which built-in functions exist, and how the frame argument changes what an aggregate sees.

## The anatomy of OVER

```sql
SUM(salary) OVER (
    PARTITION BY dept
    ORDER BY salary DESC
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
)
```

| Part | Meaning | If you omit it |
| ------ | --------- | ---------------- |
| PARTITION BY dept | Splits rows into groups before the function runs | The window is the whole table |
| ORDER BY salary DESC | Sorts rows inside each group | Allowed only if the function does not need an order |
| ROWS BETWEEN ... AND ... | The frame: exactly which rows the function sees | The function's default frame applies |

PARTITION BY is the GROUP BY of the window world, ORDER BY decides what "previous row" and "next row" mean, and the frame narrows the set of rows the function operates on. The three parts are independent: a ranking function needs only ORDER BY, a running total needs ORDER BY plus a frame, and a plain per-group average needs only PARTITION BY.

You can name a window once and reuse it, which keeps long queries honest:

```sql
SELECT dept, salary,
       AVG(salary)  OVER w AS dept_avg,
       RANK()       OVER w AS dept_rank
FROM employees
WITH w AS (PARTITION BY dept ORDER BY salary DESC);
```

One definition, several functions, one source of truth for the partitioning.

## The built-in functions

| Function | What it does | Typical use |
| ---------- | -------------- | ------------- |
| ROW_NUMBER() | Unambiguous 1..n position inside the partition | Top-N per group |
| RANK() | Position with gaps after ties (1, 2, 2, 4) | Leaderboards where ties share a place |
| DENSE_RANK() | Position without gaps (1, 2, 2, 3) | Tiering, pricing bands |
| NTILE(n) | Splits the partition into n near-equal buckets | Quartiles, deciles |
| SUM / AVG / MIN / MAX (x) | Aggregate over the frame | Running totals, group averages |
| LAG(x, n, def) | Value from n rows back, or def if none | Period-over-period deltas |
| LEAD(x, n, def) | Value from n rows forward, or def if none | Comparing with the next period |
| FIRST_VALUE(x) / LAST_VALUE(x) | First / last value of the frame | Baselines, last known state |
| PERCENTILE_CONT(q) | The q-quantile across the partition | p50 / p95 latencies |

The ranking family takes no column argument — the ORDER BY inside OVER is the only thing that decides the ranking. LAG and LEAD take the column first, the row offset second (default 1), and the fallback value third (NULL by default), so the first row of a partition does not turn into a NULL arithmetic hole.

A running total is one line:

```sql
SELECT date, amount,
       SUM(amount) OVER (ORDER BY date) AS running_total
FROM revenue
ORDER BY date;
```

With an ORDER BY and no explicit frame, the default frame is already "from the start of the partition to the current row", which is exactly the running-total shape.

## Frames

| Frame | Which rows the function sees |
| ------- | ------------------------------ |
| Default for ranking functions | The whole partition |
| RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW | Start of the partition up to the current row, ties included |
| ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW | Same, but counted by physical row position |
| ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING | The current row plus its immediate neighbors |
| ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING | The entire partition, explicitly |

RANGE and ROWS differ only when the ORDER BY column has duplicates: RANGE treats rows with equal sort values as one logical row (all of them are "current"), while ROWS counts physical positions. In practice: use the default frame for running totals, ROWS for neighbor-based windows like moving averages, and reach for explicit frames only when the default does not give you the right answer.

> **TIP**
> When a window query gets longer than a screen, put the WITH w AS (...) definition at the top and reference w everywhere — it is impossible to keep three PARTITION BY clauses in sync by eye.

<!-- RU -->

Плотный справочник по синтаксису, стоящему за каждой оконной функцией в PostgreSQL 17: что делает каждая часть OVER, какие встроенные функции есть и как аргумент frame меняет то, что видит агрегат.

## Анатомия OVER

```sql
SUM(salary) OVER (
    PARTITION BY dept
    ORDER BY salary DESC
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
)
```

| Часть | Значение | Если опустить |
| ------ | --------- | ---------------- |
| PARTITION BY dept | Делит строки на группы до запуска функции | Окно — вся таблица |
| ORDER BY salary DESC | Сортирует строки внутри каждой группы | Разрешено, только если функции порядок не нужен |
| ROWS BETWEEN ... AND ... | Frame: по каким именно строкам функция работает | Применяется frame по умолчанию для функции |

PARTITION BY — это GROUP BY мира окон, ORDER BY решает, что такое «предыдущая» и «следующая» строка, а frame сужает множество строк, по которым работает функция. Три части независимы: ранжирующей функции нужен только ORDER BY, накопительной сумме — ORDER BY плюс frame, а простому среднему по группе — только PARTITION BY.

Окно можно один раз именованно определить и переиспользовать — это держит длинные запросы честными:

```sql
SELECT dept, salary,
       AVG(salary)  OVER w AS dept_avg,
       RANK()       OVER w AS dept_rank
FROM employees
WITH w AS (PARTITION BY dept ORDER BY salary DESC);
```

Одно определение, несколько функций, один источник правды по partitions.

## Встроенные функции

| Функция | Что делает | Типичное применение |
| ---------- | -------------- | ------------- |
| ROW_NUMBER() | Неоднзначный номер 1..n внутри partition | Топ-N в группе |
| RANK() | Место с пропусками после ничьих (1, 2, 2, 4) | Лидерборды, где ничьи делят место |
| DENSE_RANK() | Место без пропусков (1, 2, 2, 3) | Тиринг, ценовые диапазоны |
| NTILE(n) | Делит partition на n почти равных корзин | Квантили, децили |
| SUM / AVG / MIN / MAX (x) | Агрегат по frame | Накопительные суммы, средние по группе |
| LAG(x, n, def) | Значение из строки n позади, или def если её нет | Межпериодные дельты |
| LEAD(x, n, def) | Значение из строки n впереди, или def если её нет | Сравнение со следующим периодом |
| FIRST_VALUE(x) / LAST_VALUE(x) | Первое / последнее значение frame | Базовые уровни, последнее известное состояние |
| PERCENTILE_CONT(q) | q-квантиль по partition | p50 / p95 задержек |

Семейство ранжирования не принимает аргумент-колонку — ORDER BY внутри OVER — единственное, что определяет ранжирование. LAG и LEAD принимают колонку первой, смещение строк второй (по умолчанию 1) и запасное значение третьей (по умолчанию NULL), поэтому первая строка partition не превращается в дыру в NULL-арифметике.

Накопительная сумма — одна строка:

```sql
SELECT date, amount,
       SUM(amount) OVER (ORDER BY date) AS running_total
FROM revenue
ORDER BY date;
```

С ORDER BY и без явного frame дефолтный frame уже означает «от начала partition до текущей строки» — ровно форма накопительной суммы.

## Frame'ы

| Frame | Какие строки видит функция |
| ------- | ------------------------------ |
| Дефолт для ранжирующих функций | Весь partition |
| RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW | От начала partition до текущей строки, с ничьими |
| ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW | То же, но по физическому положению строк |
| ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING | Текущая строка плюс непосредственные соседи |
| ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING | Весь partition, явно |

RANGE и ROWS отличаются только когда у ORDER BY-колонки есть дубликаты: RANGE считает строки с равным значением сортировки одной логической строкой (все они «текущие»), а ROWS считает физические позиции. На практике: для накопительных сумм — frame по умолчанию, для соседей — движущиеся средние по ROWS, а явные frame'ы — только когда дефолт не даёт нужного ответа.

> **TIP**
> Когда оконный запрос становится длиннее экрана, ставьте определение WITH w AS (...) в начало и ссылайтесь на w везде — невозможно держать три PARTITION BY-клаузы синхронно «на глаз».
