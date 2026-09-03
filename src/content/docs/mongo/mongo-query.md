---
id: mongo-query
track: mongo
type: guide
section: data
order: 3
title:
  en: "Query & Filters"
  ru: "Выборка и фильтры"
excerpt:
  en: "How find() filters work: comparison and membership operators, AND/OR/NOT, nested fields and arrays, and the sort/skip/limit/project modifiers that shape the result."
  ru: "Как работают фильтры find(): операторы сравнения и membership, AND/OR/NOT, вложенные поля и массивы, модификаторы sort/skip/limit/project, формирующие результат."
version: "mongo 8"
updated: 2026-09-03
relatedTask: mongo-002
---

A query in MongoDB is a filter — a document that describes which fields must hold which values. This page walks through the filter language: comparison and membership conditions, the three logical connectives (AND, OR, NOT), nested fields and arrays, and the modifiers that shape the result.

## Comparison and membership filters

```js
const pricey = await products.find({ price: { $gt: 50 } }).toArray();

const inStock = await products.find({ stock: { $gte: 5 } }).toArray();

const twoItems = await products.find({ name: { $in: ["Mouse", "Hub"] } }).toArray();

const cheap = await products.find({ price: { $lte: 30 } }).toArray();
```

A filter value that is a plain value is an equality test; a value that is a document of operators is a condition. `$gt`, `$gte`, `$lt` and `$lte` compare numbers, dates and strings (lexicographically); `$ne` is "not equal" (a missing field satisfies it too); `$in` and `$nin` test membership in a list. The full operator table lives on the Query Operators reference page — here is how they feel in practice.

> **TIP**
> For "any of these values", write `{ field: { $in: [a, b, c] } }` instead of a chain of `$or` — the planner can probe the index once per value, and the filter stays readable.

## AND, OR, NOT

```js
// AND: separate fields in the same filter
const hot = await products.find({ price: { $gt: 50 }, stock: { $gte: 5 } }).toArray();

// a range on one field: several operators in one document
const adults = await users.find({ age: { $gt: 21, $lt: 65 } }).toArray();

// OR: at least one branch matches
const promo = await products.find({
  $or: [{ price: { $lt: 10 } }, { name: { $regex: "^sale", $options: "i" } }],
}).toArray();

// NOT: negate a condition
const lowScore = await reviews.find({ score: { $not: { $gte: 4 } } }).toArray();
```

Fields in a filter combine with an implicit AND — `{ price: { $gt: 50 }, stock: { $gte: 5 } }` requires both. On a single field, several operators live in one document: `{ age: { $gt: 21, $lt: 65 } }` is a range, no `$and` involved. `$and` is only needed when you would otherwise repeat the same field key with different conditions; `$or` takes an array of complete sub-filters, any one of which may match; `$not` negates a condition on a single field.

> **WARNING**
> `$and` and `$or` nest, and nested nesting is where filter bugs are born: a `$or` inside an `$and` that should have wrapped the whole filter silently changes the result. If a filter needs more than one level of nesting, build it from named parts in code and verify the logic with a quick shell query.

## Nested fields and arrays

```js
// a field inside an embedded document
const adaPosts = await posts.find({ "author.name": "Ada" }).toArray();

// the array contains a value
const webPosts = await posts.find({ tags: "web" }).toArray();

// the array contains all values, in any order
const fullStack = await posts.find({ tags: { $all: ["web", "db"] } }).toArray();

// exactly one element satisfies ALL the conditions
const proPost = await posts.find({
  author: { $elemMatch: { name: "Ada", level: "pro" } },
}).toArray();
```

Dot notation reaches into embedded documents (`author.name`) and array elements. On an array field, a plain value (`tags: "web"`) matches if any element equals it; `{ tags: { $in: [...] } }` does the same for a list. `$all` requires every listed value to be present, in any order; `$size` matches the exact array length.

`$elemMatch` is the precise tool: it requires one single element to satisfy the whole sub-condition. Without it, `{ author: { name: "Ada", level: "pro" } }` over an array of authors matches a document where one author is Ada and another one is a pro — a classic wrong-results bug.

## Shaping the result

```js
const page = await products
  .find({ stock: { $gt: 0 } })
  .sort({ price: 1 })
  .skip(20)
  .limit(20)
  .project({ name: 1, price: 1, _id: 0 })
  .toArray();
```

`sort` (1 ascending, -1 descending), `skip` and `limit` for paging, and `project` to narrow the returned fields — this is the standard catalog query. `skip` + `limit` is fine while the offset is small; deep pages (`skip(100000)`) read and throw away every earlier document. For deep paging use keyset pagination: remember the last seen sort value and filter on it — `find({ price: { $gt: lastPrice } })` — which stays O(page size) at any depth.

> **WARNING**
> `$regex` without a leading anchor (and without a text index) forces the server to test the pattern against every document in the collection. A great debugging tool, a terrible production hot path.

> **TIP**
> Run every hot query through the planner once: in the shell, `db.products.explain("executionStats").find(filter)`. Look for `stage: "IXSCAN"` (an index is used) and a small `totalDocsExamined` versus `nReturned` — that ratio is your query's efficiency.

<!-- RU -->

Запрос в MongoDB — это фильтр: документ, описывающий, какие поля должны иметь какие значения. Здесь — язык фильтров: сравнения и membership, три логические связки (AND, OR, NOT), вложенные поля и массивы, модификаторы, формирующие результат.

## Сравнения и membership-фильтры

```js
const pricey = await products.find({ price: { $gt: 50 } }).toArray();

const inStock = await products.find({ stock: { $gte: 5 } }).toArray();

const twoItems = await products.find({ name: { $in: ["Mouse", "Hub"] } }).toArray();

const cheap = await products.find({ price: { $lte: 30 } }).toArray();
```

Фильтр-значение, которое обычное значение, — это тест на равенство; значение-документ с операторами — условие. `$gt`, `$gte`, `$lt` и `$lte` сравнивают числа, даты и строки (лексикографически); `$ne` — «не равно» (отсутствующее поле тоже удовлетворяет); `$in` и `$nin` — membership в списке. Полная таблица операторов — на справочной странице Query Operators; здесь — как они работают вживую.

> **TIP**
> Для «любого из этих значений» пишите `{ field: { $in: [a, b, c] } }`, а не цепочку `$or` — планировщик ходит по индексу по одному разу на значение, и фильтр остаётся читаемым.

## AND, OR, NOT

```js
// AND: разные поля в одном фильтре
const hot = await products.find({ price: { $gt: 50 }, stock: { $gte: 5 } }).toArray();

// диапазон по одному полю: несколько операторов в одном документе
const adults = await users.find({ age: { $gt: 21, $lt: 65 } }).toArray();

// OR: матчит хотя бы одна ветка
const promo = await products.find({
  $or: [{ price: { $lt: 10 } }, { name: { $regex: "^sale", $options: "i" } }],
}).toArray();

// NOT: отрицание условия
const lowScore = await reviews.find({ score: { $not: { $gte: 4 } } }).toArray();
```

Поля в фильтре соединяются неявным AND — `{ price: { $gt: 50 }, stock: { $gte: 5 } }` требует обоих. На одном поле несколько операторов живут в одном документе: `{ age: { $gt: 21, $lt: 65 } }` — это диапазон, без `$and`. `$and` нужен только тогда, когда иначе пришлось бы повторять ключ поля с разными условиями; `$or` принимает массив полных под-фильтров, матчить может любой из них; `$not` отрицает условие по одному полю.

> **WARNING**
> `$and` и `$or` встраиваются друг в друга, и именно во вложенности рождаются баги фильтров: `$or` внутри `$and`, который должен был оборачивать весь фильтр, молча меняет результат. Если фильтру нужно больше одного уровня вложенности, собирайте его из именованных частей в коде и проверьте логику быстрым shell-запросом.

## Вложенные поля и массивы

```js
// поле внутри вложенного документа
const adaPosts = await posts.find({ "author.name": "Ada" }).toArray();

// массив содержит значение
const webPosts = await posts.find({ tags: "web" }).toArray();

// массив содержит все значения, в любом порядке
const fullStack = await posts.find({ tags: { $all: ["web", "db"] } }).toArray();

// ровно один элемент удовлетворяет ВСЕМ условиям
const proPost = await posts.find({
  author: { $elemMatch: { name: "Ada", level: "pro" } },
}).toArray();
```

Точечная нотация достаёт до полей внутри вложенных документов (`author.name`) и элементов массивов. На массивном поле обычное значение (`tags: "web"`) матчит, если любой элемент ему равен; `{ tags: { $in: [...] } }` — то же самое, но для списка. `$all` требует, чтобы все перечисленные значения присутствовали, в любом порядке; `$size` матчит точную длину массива.

`$elemMatch` — точный инструмент: он требует, чтобы один-единственный элемент удовлетворял всему под-условию. Без него `{ author: { name: "Ada", level: "pro" } }` на массиве авторов матчит документ, где один автор — Ada, а другой — pro. Классический баг «не те результаты».

## Формирование результата

```js
const page = await products
  .find({ stock: { $gt: 0 } })
  .sort({ price: 1 })
  .skip(20)
  .limit(20)
  .project({ name: 1, price: 1, _id: 0 })
  .toArray();
```

`sort` (1 по возрастанию, -1 по убыванию), `skip` и `limit` для пагинации, `project` для узкого набора полей — стандартный каталожный запрос. `skip` + `limit` хорошо, пока смещение малое; глубокие страницы (`skip(100000)`) читают и выбрасывают все предшествующие документы. Для глубокой пагинации используйте keyset-пагинацию: запомните последнее seen значение сортировки и фильтруйте по нему — `find({ price: { $gt: lastPrice } })` — это O(размера страницы) на любой глубине.

> **WARNING**
> `$regex` без начального якоря (и без text-индекса) заставляет сервер тестировать паттерн на каждом документе коллекции. Отличный инструмент отладки и ужасный hot path в продакшене.

> **TIP**
> Прогоните каждый горячий запрос через планировщик один раз: в shell — `db.products.explain("executionStats").find(filter)`. Ищите `stage: "IXSCAN"` (используется индекс) и маленькое `totalDocsExamined` против `nReturned` — это отношение и есть эффективность запроса.
