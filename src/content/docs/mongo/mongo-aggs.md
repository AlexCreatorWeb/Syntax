---
id: mongo-aggs
track: mongo
type: reference
section: reference
order: 2
title:
  en: "Aggregation Stages"
  ru: "Этапы агрегации"
excerpt:
  en: "The pipeline's stages and the expression operators used inside them, as tables — plus three ready patterns: counts by field, top-N, and $facet dashboards."
  ru: "Этапы конвейера и expression-операторы внутри них — таблицами, плюс три готовых паттерна: счётчики по полю, top-N и дашборды на $facet."
version: "mongo 8"
updated: 2026-09-03
relatedTask: mongo-007
---

The aggregation pipeline's stages and the expression operators used inside them, as tables. A pipeline is an array of stage documents; each stage transforms the stream of documents into a new stream. Find the stage, copy the shape, fill in the fields.

## Core stages

| Stage | What it does | Key argument |
| ------- | -------------- | -------------- |
| $match | filters documents with a find-style filter (index-aware) | a filter document |
| $project | reshapes documents: include, exclude, compute | fields as 0/1 or expressions |
| $group | collapses the stream into groups | _id (group key) + accumulators |
| $sort | orders the stream | { field: 1 or -1 } |
| $limit | keeps the first N documents | a number |
| $skip | drops the first N documents | a number |
| $unwind | deconstructs an array into one document per element | a field path |
| $lookup | joins documents from another collection | from, localField, foreignField, as |
| $addFields | adds or overwrites fields on each document | field: expression |
| $replaceRoot | replaces each document with a subdocument | newRoot: expression |
| $count | counts documents into a single field | the output field name |
| $sample | returns a random sample | { size: n } |
| $facet | runs several sub-pipelines in parallel | stage: sub-pipeline |
| $out | writes the result to a new collection | the collection name |
| $merge | merges the result into an existing collection | the collection name |

Stages execute in array order, and each stage sees only what the previous stage emitted. Two stages are special for performance: `$match` can use indexes (like a `find`), so a selective `$match` early in the pipeline shrinks all later stages; `$facet` runs its branches in parallel, so it is the right tool when one dashboard needs several different aggregations over the same data.

The canonical report shape is `$match` → `$group` → `$sort` → `$limit` → `$project`: filter, aggregate, order, truncate, reshape. Reordering the same stages changes the cost, not the result — put the narrowing stages first.

## Accumulators and expressions

| Expression | Where | Result |
| ------------ | ------- | -------- |
| $sum: 1 | $group | counts documents in the group |
| $sum: "$f" | $group | sums field f (missing = 0) |
| $avg / $min / $max: "$f" | $group | aggregate over field f (missing ignored) |
| $first / $last: "$f" | $group | value from the first/last document (stream order) |
| $push / $addToSet: "$f" | $group | collects values into an array (with / without duplicates) |
| $cond | any | [if, then, else] ternary |
| $ifNull | any | [a, b] → a, or b when a is null or missing |
| $concat, $toUpper, $toLower | any | string operations |
| $year, $month, $dateTrunc | any | date parts, truncation to a unit |
| $add, $subtract, $multiply, $divide | any | arithmetic on field paths |
| $abs, $round, $trunc | any | numeric rounding |

Inside an expression, `"$field"` (a string with a `$` prefix) references a field of the document; without the `$`, a string is a literal. Accumulators ($sum, $avg, …) exist only inside `$group` (and `$facet`/`$count`); elsewhere you compose with the general expressions, which can be nested arbitrarily: `{ $multiply: ["$price", "$qty"] }` is evaluated per document before any `$sum` over it.

## Three ready patterns

```mongodb
// 1. Count by a field, most frequent first
db.events.aggregate([
  { $group: { _id: "$type", n: { $sum: 1 } } },
  { $sort: { n: -1 } },
]);
```

```mongodb
// 2. Top 5 by a computed value
db.orders.aggregate([
  { $unwind: "$items" },
  { $group: { _id: "$items.sku", revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } } } },
  { $sort: { revenue: -1 } },
  { $limit: 5 },
]);
```

```mongodb
// 3. Several aggregations at once
db.orders.aggregate([
  {
    $facet: {
      total: [{ $count: "n" }],
      byStatus: [{ $group: { _id: "$status", n: { $sum: 1 } } }],
    },
  },
]);
```

Pattern 1 is the workhorse of dashboards: one group, a `$sum: 1` counter, sorted descending. Pattern 2 shows a computed expression inside an accumulator — the per-line revenue is `price * qty`, summed per sku. Pattern 3 answers "total count plus a breakdown by status" in a single scan, instead of two separate `aggregate` calls.

> **TIP**
> `$facet` is the only stage that branches. If two of your endpoints aggregate the same collection with different groups, consider one `$facet` that produces both result sets.

<!-- RU -->

Этапы конвейера агрегации и expression-операторы, которые используются внутри, — таблицами. Конвейер — массив stage-документов; каждый этап трансформирует поток документов в новый поток. Найдите этап, скопируйте форму, подставьте поля.

## Ключевые этапы

| Этап | Что делает | Ключевой аргумент |
| ------- | -------------- | -------------- |
| $match | фильтрует документы find-фильтром (использует индексы) | фильтр-документ |
| $project | перекраивает документы: включить, исключить, вычислить | поля как 0/1 или expressions |
| $group | схлопывает поток в группы | _id (ключ группы) + аккумуляторы |
| $sort | упорядочивает поток | { field: 1 или -1 } |
| $limit | оставляет первые N документов | число |
| $skip | выбрасывает первые N документов | число |
| $unwind | разбирает массив в по одному документу на элемент | путь к полю |
| $lookup | join документов из другой коллекции | from, localField, foreignField, as |
| $addFields | добавляет/перезаписывает поля в каждом документе | поле: expression |
| $replaceRoot | заменяет каждый документ поддокументом | newRoot: expression |
| $count | считает документы в одно поле | имя выходного поля |
| $sample | возвращает случайную выборку | { size: n } |
| $facet | запускает несколько под-конвейеров параллельно | этап: под-конвейер |
| $out | записывает результат в новую коллекцию | имя коллекции |
| $merge | сливает результат в существующую коллекцию | имя коллекции |

Этапы исполняются в порядке массива, и каждый видит только то, что выпустил предыдущий. Два этапа особы для производительности: `$match` может использовать индексы (как `find`), поэтому селективный `$match` в начале конвейера уменьшает все последующие этапы; `$facet` исполняет ветки параллельно, поэтому это правильный инструмент, когда одному дашборду нужны несколько разных агрегаций по одним данным.

Каноническая форма отчёта: `$match` → `$group` → `$sort` → `$limit` → `$project`: фильтр, агрегация, порядок, обрезка, перекрой. Перестановка тех же этапов меняет стоимость, а не результат — сужающие этапы первыми.

## Аккумуляторы и expressions

| Expression | Где | Результат |
| ------------ | ------- | -------- |
| $sum: 1 | $group | считает документы в группе |
| $sum: "$f" | $group | суммирует поле f (отсутствующие = 0) |
| $avg / $min / $max: "$f" | $group | агрегация по полю f (отсутствующие игнорируются) |
| $first / $last: "$f" | $group | значение из первого/последнего документа (порядок потока) |
| $push / $addToSet: "$f" | $group | собирает значения в массив (с дубликатами / без) |
| $cond | любой | [if, then, else] тернарник |
| $ifNull | любой | [a, b] → a, или b, если a null/отсутствует |
| $concat, $toUpper, $toLower | любой | строковые операции |
| $year, $month, $dateTrunc | любой | части даты, обрезка к единице |
| $add, $subtract, $multiply, $divide | любой | арифметика по путям к полям |
| $abs, $round, $trunc | любой | округление чисел |

Внутри expression `"$field"` (строка с префиксом `$`) ссылается на поле документа; без `$` строка — литерал. Аккумуляторы ($sum, $avg, …) существуют только внутри `$group` (и `$facet`/`$count`); дальше вы комбинируете общие expressions, которые встраиваются без ограничений: `{ $multiply: ["$price", "$qty"] }` вычисляется на документ до любой суммы по нему.

## Три готовых паттерна

```mongodb
// 1. Счётчик по полю, самые частые сверху
db.events.aggregate([
  { $group: { _id: "$type", n: { $sum: 1 } } },
  { $sort: { n: -1 } },
]);
```

```mongodb
// 2. Топ-5 по вычисленному значению
db.orders.aggregate([
  { $unwind: "$items" },
  { $group: { _id: "$items.sku", revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } } } },
  { $sort: { revenue: -1 } },
  { $limit: 5 },
]);
```

```mongodb
// 3. Несколько агрегаций за один раз
db.orders.aggregate([
  {
    $facet: {
      total: [{ $count: "n" }],
      byStatus: [{ $group: { _id: "$status", n: { $sum: 1 } } }],
    },
  },
]);
```

Паттерн 1 — рабочая лошадка дашбордов: одна группа, счётчик `$sum: 1`, сортировка по убыванию. Паттерн 2 показывает вычисляемый expression внутри аккумулятора: выручка строки — `price * qty`, сумма по sku. Паттерн 3 отвечает «всего плюс разбивка по статусу» за один scan, вместо двух отдельных `aggregate`.

> **TIP**
> `$facet` — единственный ветвящийся этап. Если два ваших эндпоинта агрегируют одну коллекцию с разными группами, рассмотрите один `$facet`, который выдаёт оба результата.
