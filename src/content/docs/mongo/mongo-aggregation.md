---
id: mongo-aggregation
track: mongo
type: guide
section: data
order: 5
title:
  en: "Aggregation Pipeline"
  ru: "Конвейер агрегации"
excerpt:
  en: "How aggregation works: documents flow through stages ($match, $group, $sort, $limit, $project), with $unwind and $lookup for arrays and joins — built up with a real report pipeline."
  ru: "Как работает агрегация: документы текут через этапы ($match, $group, $sort, $limit, $project), плюс $unwind и $lookup для массивов и join — на примере реального отчётного конвейера."
version: "mongo 8"
updated: 2026-09-03
relatedTask: mongo-006
---

Aggregation is MongoDB's answer to GROUP BY, joins and reports: a pipeline in which documents flow through a sequence of stages, each stage transforming the stream. This page builds pipelines from the core stages — `$match`, `$group`, `$sort`, `$limit`, `$project` — and adds `$unwind` and `$lookup` for arrays and joins.

## The pipeline as a data flow

```js
const report = await orders.aggregate([
  { $match: { status: "paid" } },
  { $group: { _id: "$customer", total: { $sum: "$amount" } } },
  { $sort: { total: -1 } },
  { $limit: 10 },
]).toArray();
```

Each stage receives the documents the previous stage emitted and emits its own. `$match` filters, exactly like a `find` filter (and, like one, it can use indexes). `$group` collapses the stream into groups: the `_id` expression names the group key — a field path like `"$customer"`, a computed value, or `null` for a single global group — and every other field is an accumulator over the group's documents. `$sort` orders the stream, `$limit` keeps the first N, and `$project` reshapes each document.

Order is the first design decision. The pipeline above ends at the top 10 customers by revenue; every stage after the `$group` works on 10 documents instead of 100,000. Reorder the same stages and the engine does the same work many times over.

> **TIP**
> Push `$match` (and any cheap `$project`) to the front of the pipeline. A selective filter early on shrinks every stage after it — a `$group` over 100,000 documents after a `$match` is far cheaper than over 10,000,000 without one.

## $group and accumulators

```js
const stats = await products.aggregate([
  {
    $group: {
      _id: "$category",
      count: { $sum: 1 },
      avgPrice: { $avg: "$price" },
      minPrice: { $min: "$price" },
      maxPrice: { $max: "$price" },
      firstSeen: { $first: "$createdAt" },
    },
  },
]).toArray();
```

Inside a `$group`, `$sum: 1` counts documents and `$sum: "$field"` adds the field (missing values count as 0). `$avg`, `$min` and `$max` ignore missing values entirely. `$first` and `$last` take the value from the first or last document of the group **in stream order** — which is storage order unless you `$sort` first, so sort before you rely on them. `$push` and `$addToSet` collect values into arrays, with duplicates or without.

Grouping by a computed value is how time-series reports work: `$dateTrunc` buckets `createdAt` into months, and each group's `_id` becomes the month. The same pipeline with `unit: "day"` or `"hour"` gives daily or hourly charts.

```js
const monthly = await orders.aggregate([
  {
    $group: {
      _id: { $dateTrunc: { date: "$createdAt", unit: "month" } },
      revenue: { $sum: "$amount" },
      orders: { $sum: 1 },
    },
  },
  { $sort: { _id: 1 } },
]).toArray();
```

> **WARNING**
> `$first` and `$last` are not "minimum" and "maximum". Without a preceding `$sort`, they return the value from whatever document storage happens to hand over first — and that order can change when documents are updated or the collection is compacted.

## $unwind and $lookup

```js
const proOrders = await orders.aggregate([
  {
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "_id",
      as: "user",
    },
  },
  { $unwind: "$user" },
  { $match: { "user.tier": "pro" } },
]).toArray();
```

`$lookup` is the join: for each incoming document it copies the matching documents from another collection into the array field named by `as`. `$unwind` then deconstructs that array, emitting one document per element. The pair `$lookup` + `$unwind` is the standard way to enrich a collection with data that lives elsewhere.

By default, `$unwind` drops documents whose array is missing or empty — which turns the join into an inner join. Pass `{ $unwind: { path: "$user", preserveNullAndEmptyArrays: true } }` to keep them — the left-join behaviour.

> **WARNING**
> "No match" in a `$lookup` is not an error — it is an empty array. A pipeline that `$unwind`s that field without `preserveNullAndEmptyArrays` silently returns fewer documents than it received. If a missing match is a valid state, preserve it.

## A real pipeline: top products by revenue

```js
const topProducts = await orders.aggregate([
  { $unwind: "$items" },
  {
    $group: {
      _id: "$items.sku",
      revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
    },
  },
  { $sort: { revenue: -1 } },
  { $limit: 5 },
  {
    $lookup: {
      from: "products",
      localField: "_id",
      foreignField: "sku",
      as: "product",
    },
  },
  { $project: { _id: 0, sku: "$_id", revenue: 1, name: "$product.name" } },
]).toArray();
```

Walk through the stages. `$unwind` turns each order into one document per order line. `$group` collects the lines by sku and sums `price * qty` — note the expression inside the accumulator: `{ $multiply: [...] }` is evaluated per document before the sum happens. `$sort` and `$limit` keep the five biggest revenues. The final `$lookup` fetches human-readable product names, and `$project` shapes the result the API wants. One round-trip answers a question that in SQL would be a `JOIN` plus a `GROUP BY`.

Aggregation covers most of the report work an application needs: counts by category, revenue per period, top-N lists, multi-collection joins. The full catalog of stages and expression operators is on the Aggregation Stages reference page.

<!-- RU -->

Агрегация — ответ MongoDB на GROUP BY, join и отчёты: конвейер, в котором документы текут через последовательность этапов, каждый этап трансформирует поток. Здесь мы собираем конвейеры из ключевых этапов — `$match`, `$group`, `$sort`, `$limit`, `$project` — и добавляем `$unwind` и `$lookup` для массивов и join.

## Конвейер как поток данных

```js
const report = await orders.aggregate([
  { $match: { status: "paid" } },
  { $group: { _id: "$customer", total: { $sum: "$amount" } } },
  { $sort: { total: -1 } },
  { $limit: 10 },
]).toArray();
```

Каждый этап принимает документы, которые выпустил предыдущий, и выпускает свои. `$match` фильтрует — точно как фильтр `find` (и, как и он, может использовать индексы). `$group` схлопывает поток в группы: expression `_id` задаёт ключ группы — путь к полю, вроде `"$customer"`, вычисленное значение или `null` для одной глобальной группы, — а каждое другое поле — аккумулятор по документам группы. `$sort` упорядочивает поток, `$limit` оставляет первые N, `$project` перекраивает каждый документ.

Порядок — первое проектное решение. Конвейер выше заканчивается топ-10 клиентов по выручке; каждый этап после `$group` работает с 10 документами, а не со 100 000. Переставьте те же этапы — и движок повторит ту же работу многократно.

> **TIP**
> Выталкивайте `$match` (и любой дешёвый `$project`) в начало конвейера. Селективный фильтр в начале уменьшает каждый следующий этап: `$group` по 100 000 документов после `$match` гораздо дешевле, чем по 10 000 000 без него.

## $group и аккумуляторы

```js
const stats = await products.aggregate([
  {
    $group: {
      _id: "$category",
      count: { $sum: 1 },
      avgPrice: { $avg: "$price" },
      minPrice: { $min: "$price" },
      maxPrice: { $max: "$price" },
      firstSeen: { $first: "$createdAt" },
    },
  },
]).toArray();
```

Внутри `$group`: `$sum: 1` считает документы, `$sum: "$field"` суммирует поле (отсутствующие значения считаются как 0). `$avg`, `$min` и `$max` вовсе игнорируют отсутствующие. `$first` и `$last` берут значение из первого или последнего документа группы **в порядке потока** — а это порядок хранения, если перед ними нет `$sort`, — сортируйте, прежде чем полагаться на них. `$push` и `$addToSet` собирают значения в массивы, с дубликатами и без.

Группировка по вычисленному значению — так работают time-series отчёты: `$dateTrunc` складывает `createdAt` в месяцы, и `_id` каждой группы становится месяцем. Тот же конвейер с `unit: "day"` или `"hour"` даёт дневные или почасовые графики.

```js
const monthly = await orders.aggregate([
  {
    $group: {
      _id: { $dateTrunc: { date: "$createdAt", unit: "month" } },
      revenue: { $sum: "$amount" },
      orders: { $sum: 1 },
    },
  },
  { $sort: { _id: 1 } },
]).toArray();
```

> **WARNING**
> `$first` и `$last` — это не «минимум» и «максимум». Без предшествующего `$sort` они возвращают значение из того документа, который хранилище подаёт первым, — а этот порядок меняется, когда документы обновляются или коллекция компактируется.

## $unwind и $lookup

```js
const proOrders = await orders.aggregate([
  {
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "_id",
      as: "user",
    },
  },
  { $unwind: "$user" },
  { $match: { "user.tier": "pro" } },
]).toArray();
```

`$lookup` — это join: для каждого входящего документа он копирует матчащие документы из другой коллекции в массив-поле, названное `as`. `$unwind` затем разбирает этот массив, выпуская по одному документу на элемент. Пара `$lookup` + `$unwind` — стандартный способ обогатить коллекцию данными, которые живут в другой.

По умолчанию `$unwind` выбрасывает документы, у которых массив отсутствует или пуст — join становится inner. Передайте `{ $unwind: { path: "$user", preserveNullAndEmptyArrays: true } }`, чтобы оставить их, — это поведение left join.

> **WARNING**
> «Нет совпадений» в `$lookup` — не ошибка, а пустой массив. Конвейер, который `$unwind`-ит это поле без `preserveNullAndEmptyArrays`, молча вернёт меньше документов, чем вошло. Если отсутствие матча — валидное состояние, сохраняйте его.

## Реальный конвейер: топ товаров по выручке

```js
const topProducts = await orders.aggregate([
  { $unwind: "$items" },
  {
    $group: {
      _id: "$items.sku",
      revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
    },
  },
  { $sort: { revenue: -1 } },
  { $limit: 5 },
  {
    $lookup: {
      from: "products",
      localField: "_id",
      foreignField: "sku",
      as: "product",
    },
  },
  { $project: { _id: 0, sku: "$_id", revenue: 1, name: "$product.name" } },
]).toArray();
```

Разберём этапы. `$unwind` превращает каждый заказ в один документ на строку заказа. `$group` собирает строки по sku и суммирует `price * qty` — обратите внимание на expression внутри аккумулятора: `{ $multiply: [...] }` вычисляется на документ до суммы. `$sort` и `$limit` оставляют пять biggest revenue. Финальный `$lookup` тянет человекочитаемые названия товаров, `$project` оформляет результат в то, что хочет API. Один round-trip отвечает на вопрос, который в SQL был бы `JOIN` плюс `GROUP BY`.

Агрегация покрывает большинство отчётной работы приложения: счётчики по категориям, выручка по периодам, top-N списки, multi-collection join. Полный каталог этапов и expression-операторов — на справочной странице Aggregation Stages.
