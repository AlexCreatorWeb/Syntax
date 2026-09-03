---
id: mongo-queryops
track: mongo
type: reference
section: reference
order: 1
title:
  en: "Query Operators"
  ru: "Операторы выборки"
excerpt:
  en: "Every condition you can write in a find() filter: comparison, logical, array and text operators with exact syntax — as tables you can copy from."
  ru: "Все условия, которые можно написать в фильтре find(): операторы сравнения, логические, array и text с точным синтаксисом — в виде таблиц, которые можно копировать."
version: "mongo 8"
updated: 2026-09-03
relatedTask: mongo-003
---

This is the full set of conditions you can write in a `find` filter. The tables below cover comparison, logical, array and text operators with exact syntax — copy a row, paste it into your filter, adjust the field.

## Comparison and membership

| Operator | Example | Matches |
| ---------- | --------- | --------- |
| (implicit $eq) | `{ a: 5 }` | a equals 5 |
| $eq | `{ a: { $eq: 5 } }` | a equals 5 (explicit form) |
| $ne | `{ a: { $ne: 5 } }` | a not equal — includes missing and null |
| $gt | `{ a: { $gt: 5 } }` | a greater than 5 |
| $gte | `{ a: { $gte: 5 } }` | a greater than or equal to 5 |
| $lt | `{ a: { $lt: 5 } }` | a less than 5 |
| $lte | `{ a: { $lte: 5 } }` | a less than or equal to 5 |
| $in | `{ a: { $in: [1, 2] } }` | a is one of the listed values |
| $nin | `{ a: { $nin: [1, 2] } }` | a is none of the listed values (incl. missing) |
| $exists | `{ a: { $exists: true } }` | the field exists (even with value null) |
| $type | `{ a: { $type: "string" } }` | the field has this BSON type |
| $not | `{ a: { $not: { $gt: 5 } } }` | negates any single-field condition |

Comparison operators work on numbers, dates and strings (strings compare lexicographically). A filter combines its fields with an implicit AND: `{ age: { $gte: 21 }, city: "Berlin" }` requires both. For several conditions on the same field, put the operators in one document: `{ age: { $gt: 21, $lt: 65 } }` is a range — no `$and` needed.

`$exists` checks the field's presence, not its value: a field set to `null` exists. `$type` matches the BSON type name (`"double"`, `"int"`, `"long"`, `"string"`, `"array"`, …) and is the tool for "find documents where this field is malformed".

## Logical operators

| Operator | Example | Behaviour |
| ---------- | --------- | ----------- |
| $and | `{ $and: [{ a: 1 }, { b: { $gt: 2 } }] }` | all conditions must match |
| $or | `{ $or: [{ a: 1 }, { b: 2 }] }` | at least one sub-filter matches |
| $nor | `{ $nor: [{ a: 1 }] }` | no sub-filter matches (NOT-OR) |
| $not | `{ a: { $not: { $in: [1, 2] } } }` | negates one field's condition |

`$or` takes an array of complete sub-filters — each element is a full filter, not a field condition. `$and` is rarely needed: fields in the same filter already AND, and `$and` exists to repeat a field key with different conditions that cannot be merged into one operator document. `$not` works on a single field and is the only one of the four that inverts instead of combining.

> **TIP**
> "Any of these values for one field" is `$in`, not `$or`: `{ tag: { $in: ["web", "db"] } }` is shorter, and the planner can probe the index once per value. Reserve `$or` for genuinely different fields.

## Array operators

| Operator | Example | Matches |
| ---------- | --------- | --------- |
| plain value | `{ tags: "web" }` | any element equals "web" |
| $in | `{ tags: { $in: ["web", "css"] } }` | any element is in the list (or the field value is) |
| $all | `{ tags: { $all: ["web", "db"] } }` | every listed value is present, any order |
| $size | `{ tags: { $size: 2 } }` | the array has exactly 2 elements |
| $elemMatch | `{ items: { $elemMatch: { price: { $gt: 50 } } } }` | one element satisfies the whole sub-condition |

Dot notation reaches into arrays element by element: `{ "items.price": { $gt: 50 } }` matches a document where some item costs more than 50. The subtlety appears with two conditions on the same array: `{ "items.price": { $gt: 50 }, "items.qty": { $gt: 1 } }` matches a document where one item has the high price and (possibly a different) item has the big quantity. When both conditions must hold on one element, `$elemMatch` is the only correct form.

## Text and pattern matching

| Syntax | Example | Requirements |
| -------- | --------- | -------------- |
| $regex | `{ name: { $regex: "^web", $options: "i" } }` | none — tests values |
| $text | `{ $text: { $search: "mongodb index" } }` | a text index on the searched fields |
| textScore | `score: { $meta: "textScore" }` | returned with $text queries |

`$regex` is a full regular expression applied to string values (and to array elements); `$options: "i"` makes it case-insensitive. A pattern anchored at the start (`^web`) can be served by a normal B-tree index as a prefix range; an unanchored pattern forces a collection scan. `$text` is the full-text alternative: it requires a text index, tokenizes the query, and ranks results with `textScore` — use it for search boxes, not for exact or prefix lookups.

<!-- RU -->

Здесь — полный набор условий, которые можно написать в фильтре `find`. Таблицы ниже покрывают операторы сравнения, логические, array и text с точным синтаксисом: скопируйте строку, вставьте в фильтр, подставьте поле.

## Сравнения и membership

| Оператор | Пример | Матчит |
| ---------- | --------- | --------- |
| (неявный $eq) | `{ a: 5 }` | a равно 5 |
| $eq | `{ a: { $eq: 5 } }` | a равно 5 (явная форма) |
| $ne | `{ a: { $ne: 5 } }` | a не равно — включая отсутствующие и null |
| $gt | `{ a: { $gt: 5 } }` | a больше 5 |
| $gte | `{ a: { $gte: 5 } }` | a больше или равно 5 |
| $lt | `{ a: { $lt: 5 } }` | a меньше 5 |
| $lte | `{ a: { $lte: 5 } }` | a меньше или равно 5 |
| $in | `{ a: { $in: [1, 2] } }` | a — одно из перечисленных значений |
| $nin | `{ a: { $nin: [1, 2] } }` | a — ни одно из перечисленных (вкл. отсутствующие) |
| $exists | `{ a: { $exists: true } }` | поле существует (даже со значением null) |
| $type | `{ a: { $type: "string" } }` | поле имеет этот BSON-тип |
| $not | `{ a: { $not: { $gt: 5 } } }` | отрицает любое однополевое условие |

Операторы сравнения работают с числами, датами и строками (строки сравниваются лексикографически). Фильтр соединяет свои поля неявным AND: `{ age: { $gte: 21 }, city: "Berlin" }` требует обоих. Для нескольких условий по одному полю положите операторы в один документ: `{ age: { $gt: 21, $lt: 65 } }` — это диапазон, `$and` не нужен.

`$exists` проверяет присутствие поля, а не его значение: поле, поставленное в `null`, существует. `$type` матчит имя BSON-типа (`"double"`, `"int"`, `"long"`, `"string"`, `"array"`, …) — инструмент для «найди документы, где это поле кривое».

## Логические операторы

| Оператор | Пример | Поведение |
| ---------- | --------- | ----------- |
| $and | `{ $and: [{ a: 1 }, { b: { $gt: 2 } }] }` | должны матчить все условия |
| $or | `{ $or: [{ a: 1 }, { b: 2 }] }` | матчит хотя бы один под-фильтр |
| $nor | `{ $nor: [{ a: 1 }] }` | не матчит ни один (NOT-OR) |
| $not | `{ a: { $not: { $in: [1, 2] } } }` | отрицает условие по одному полю |

`$or` принимает массив полных под-фильтров: каждый элемент — целый фильтр, а не условие по полю. `$and` почти не нужен: поля в одном фильтре уже AND'ятся, а `$and` существует, чтобы повторить ключ поля с разными условиями, которые нельзя слить в один оператор-документ. `$not` работает по одному полю и — единственный из четырёх — инвертирует, а не комбинирует.

> **TIP**
> «Любое из этих значений по одному полю» — это `$in`, а не `$or`: `{ tag: { $in: ["web", "db"] } }` короче, и планировщик ходит по индексу по одному разу на значение. Оставьте `$or` для по-настоящему разных полей.

## Array-операторы

| Оператор | Пример | Матчит |
| ---------- | --------- | --------- |
| обычное значение | `{ tags: "web" }` | любой элемент равен "web" |
| $in | `{ tags: { $in: ["web", "css"] } }` | любой элемент в списке (или значение поля в списке) |
| $all | `{ tags: { $all: ["web", "db"] } }` | все перечисленные значения присутствуют, в любом порядке |
| $size | `{ tags: { $size: 2 } }` | в массиве ровно 2 элемента |
| $elemMatch | `{ items: { $elemMatch: { price: { $gt: 50 } } } }` | один элемент удовлетворяет всему под-условию |

Точечная нотация ходит по массиву по элементам: `{ "items.price": { $gt: 50 } }` матчит документ, у которого какая-то позиция стоит дороже 50. Подвох появляется с двумя условиями на один массив: `{ "items.price": { $gt: 50 }, "items.qty": { $gt: 1 } }` матчит документ, где у одной позиции высокая цена, а (возможно, у другой) большое количество. Если оба условия должны выполняться на одном элементе, единственная правильная форма — `$elemMatch`.

## Text и совпадение паттернов

| Синтаксис | Пример | Требования |
| -------- | --------- | -------------- |
| $regex | `{ name: { $regex: "^web", $options: "i" } }` | нет — тестирует значения |
| $text | `{ $text: { $search: "mongodb index" } }` | text-индекс на искомых полях |
| textScore | `score: { $meta: "textScore" }` | возвращается в $text-запросах |

`$regex` — полные регулярные выражения, применяются к строковым значениям (и элементам массива); `$options: "i"` делает регистронезависимым. Паттерн с якорем в начале (`^web`) может обслуживаться обычным B-tree индексом как префиксный диапазон; без якоря — collection scan. `$text` — full-text альтернатива: требует text-индекс, токенизирует запрос и ранжирует результаты по `textScore`; используйте для поисковых полей, а не для точных и префиксных поисков.
