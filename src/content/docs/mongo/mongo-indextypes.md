---
id: mongo-indextypes
track: mongo
type: reference
section: reference
order: 3
title:
  en: "Index Types"
  ru: "Типы индексов"
excerpt:
  en: "Every index type MongoDB builds — B-tree (single-field, compound, multikey), TTL, text, geospatial, hashed, wildcard, expression — the options that shape an index, and the pattern-to-type decision table."
  ru: "Все типы индексов MongoDB — B-tree (single-field, compound, multikey), TTL, text, geospatial, hashed, wildcard, expression — опции, которые формируют индекс, и таблица выбора типа по паттерну запроса."
version: "mongo 8"
updated: 2026-09-03
---

In MongoDB, "index type" is used in three senses at once: the data structure (a B-tree by default), what the key covers (single-field, compound, multikey), and the special-purpose indexes built for a job (TTL, text, geospatial, hashed, wildcard, expression). Every collection also carries an implicit unique index on `_id` that you never manage. This page is the reference table of all types and options, plus a short guide to choosing.

## Types at a glance

| Type | Key structure | What it serves |
| --- | --- | --- |
| Single-field | B-tree over one field | equality, range and sort on that field |
| Compound | B-tree over several fields in order | filter + sort + range (ESI order) |
| Multikey | one B-tree entry per array element | queries on array elements |
| Text | inverted token index | $text full-text search |
| TTL | B-tree over a date field | automatic deletion of old documents |
| 2dsphere | geospatial index over GeoJSON | $near, $geoWithin, $geoIntersects |
| Hashed | one-way hash of the value | equality lookups only (and hashed sharding) |
| Wildcard | all top-level fields | last-resort convenience, rarely the right answer |
| Expression (4.2+) | B-tree over a computed value | indexing a derived field you never store |

Single-field and compound indexes are the workhorses, and most queries live in them. The direction flag matters: a single-field index serves both directions (a B-tree reads backwards as easily as forwards), but a compound index is directional — `(a: 1, b: -1)` and `(a: -1, b: 1)` are different indexes, and `(a: 1, b: -1)` serves the sorts `{ a: 1, b: -1 }` and its exact reverse `{ a: -1, b: 1 }`, nothing else.

When you index an array field, MongoDB builds a multikey index automatically: one entry per element, so `{ tags: "web" }` finds every document whose `tags` contain `"web"`. You never declare it — the planner reports it as `multikey` in explain. Multikey indexes use more RAM, match more, and the planner avoids them when another index can do the job.

Text indexes tokenize string fields into an inverted token index; queries use `$text` with `textScore` ranking, and per-field weights plus a default language shape the results. A 2dsphere index stores GeoJSON (Point, Polygon, …) and serves proximity queries (`$near`, `$nearSphere`) and containment (`$geoWithin`, `$geoIntersects`). A hashed index stores a one-way hash: it answers equality lookups only — no ranges, no sort — and its main job is being a sharded shard key. A wildcard index indexes every top-level field of a document (`{ "**": 1 }`); it is a debugging convenience, not a plan — the planner treats it as a last resort. Expression indexes (4.2+) store the result of an aggregation expression instead of a raw field, which lets you index a value you compute but do not store.

## Options that shape an index

| Option | Applies to | Effect |
| --- | --- | --- |
| unique | B-tree | rejects duplicate key values (null is exempt) |
| sparse | B-tree | stores only documents where the field exists |
| partialFilterExpression | B-tree | stores only documents matching the expression |
| expireAfterSeconds | TTL (date field) | auto-deletes documents older than the threshold |
| name | any | custom name (default: field_1, field2_1, …) |
| language, defaultLanguage, weights | text | tokenizer language and per-field weight |
| expression | B-tree, 4.2+ | indexes a computed value instead of the raw field |

```mongodb
// unique single-field
db.users.createIndex({ email: 1 }, { unique: true })

// compound, named
db.orders.createIndex({ status: 1, createdAt: -1 }, { name: "status_created" })

// partial — only what you actually query
db.posts.createIndex({ views: -1 }, { partialFilterExpression: { status: "published" } })

// TTL — sessions disappear after a day
db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 })

// text with a weight
db.articles.createIndex({ title: "text", body: "text" }, { weights: { title: 10 } })

// geospatial
db.places.createIndex({ loc: "2dsphere" })

// expression (4.2+) — index a derived value
db.orders.createIndex({ total: 1 }, { expression: { $multiply: ["$price", "$qty"] } })
```

sparse and partial look similar and are not the same. A sparse index simply skips documents without the field; a partial index skips documents that fail a filter expression — and the planner will only use a partial index for a query whose filter implies that expression. The `{ views: -1 }` index above serves `find({ status: "published" }).sort({ views: -1 })`, but a query without `status` cannot use it. TTL deletion runs on a background monitor with roughly 60 seconds of granularity, and `expireAfterSeconds: 0` means "delete as soon as seen".

## Choosing the right type

| Query pattern | Build |
| --- | --- |
| Equality on one field | Single-field (unique if it must be distinct) |
| Filter + sort + range on several fields | Compound, fields in ESI order |
| Any array element equals a value | Multikey (automatic on the array field) |
| Full-text search | Text |
| Delete old rows automatically | TTL |
| Nearest points / polygon intersection | 2dsphere |
| Equality lookups in a sharded collection | Hashed, as the shard key |
| Index a computed expression | Expression (4.2+) |

When in doubt, start from the slow query: explain it, read which fields the filter and the sort touch, and build the smallest index that serves that pattern. Then re-explain and watch the plan change from COLLSCAN to IXSCAN. The decision table above covers the patterns you will actually meet; almost everything else is a variant of the first two rows.

> **TIP**
> Name indexes after the query they serve, not after their fields — "open_orders_by_date" documents intent in the getIndexes() output. And remember the direction rule: one single-field index serves both sort directions, so never index the same field twice — once ascending and once descending.

> **WARNING**
> A multikey index is the planner's last resort: while a query uses a multikey index on an array field, it cannot use any other index in the same query (except on _id). If find({ tags: "web", createdAt: { $gt: t } }) gets slower as the collection grows, the multikey on tags is the reason — the fix is a partial index or a re-model, not a second index.

<!-- RU -->

В MongoDB «тип индекса» используется в трёх смыслах сразу: структура данных (по умолчанию B-tree), то, что покрывает ключ (single-field, compound, multikey), и специальные индексы под задачу (TTL, text, geospatial, hashed, wildcard, expression). Плюс в каждой коллекции есть неявный unique-индекс на `_id`, которым вы не управляете. Здесь — справочная таблица всех типов и опций и короткая памятка по выбору.

## Типы индексов на одном экране

| Тип | Структура ключа | Что обслуживает |
| --- | --- | --- |
| Single-field | B-tree по одному полю | equality, range и sort по этому полю |
| Compound | B-tree по нескольким полям в порядке | filter + sort + range (ESI-порядок) |
| Multikey | по одной записи B-tree на элемент массива | запросы по элементам массива |
| Text | инвертированный токен-индекс | $text полнотекстовый поиск |
| TTL | B-tree по date-полю | автоматическое удаление старых документов |
| 2dsphere | geospatial-индекс на GeoJSON | $near, $geoWithin, $geoIntersects |
| Hashed | односторонний hash значения | только equality-запросы (и hashed-sharding) |
| Wildcard | все top-level поля | «удобство» для отладки, редко верный ответ |
| Expression (4.2+) | B-tree по вычисленному значению | индексация производного поля, которое не храните |

Single-field и compound — рабочие лошади, и большинство запросов живёт в них. Флаг направления важен: single-field индекс обслуживает оба направления (B-tree читается назад не хуже, чем вперёд), но compound-индекс направлен — `(a: 1, b: -1)` и `(a: -1, b: 1)` — разные индексы, и `(a: 1, b: -1)` обслуживает сортировки `{ a: 1, b: -1 }` и ровно её обратную `{ a: -1, b: 1 }`, больше ничего.

Когда вы индексируете поле-массив, MongoDB автоматически строит multikey-индекс: по одной записи на элемент, так что `{ tags: "web" }` находит каждый документ, в котором `tags` содержат `"web"`. Вы его никогда не объявляете — планировщик помечает его как `multikey` в explain. Multikey-индексы едят больше RAM, матчат больше, и планировщик обходит их стороной, если другой индекс может сделать работу.

Text-индексы токенизируют строковые поля в инвертированный токен-индекс; запросы идут через `$text` с ранжированием `textScore`, а веса полей и язык по умолчанию формируют результат. 2dsphere-индекс хранит GeoJSON (Point, Polygon, …) и обслуживает proximity-запросы (`$near`, `$nearSphere`) и containment (`$geoWithin`, `$geoIntersects`). Hashed-индекс хранит односторонний hash: отвечает только на equality-запросы — без диапазонов, без sort — и его главное применение — shard key в sharded-кластере. Wildcard-индекс индексирует все top-level поля документа (`{ "**": 1 }`); это удобство для отладки, а не план — планировщик обращается к нему в последнюю очередь. Expression-индексы (4.2+) хранят результат агрегационного expression вместо сырого поля — так индексируют значение, которое вы вычисляете, но не храните.

## Опции, которые формируют индекс

| Опция | Применяется к | Эффект |
| --- | --- | --- |
| unique | B-tree | отклоняет дубликаты ключа (null — исключение) |
| sparse | B-tree | хранит только документы, где поле есть |
| partialFilterExpression | B-tree | хранит только документы, матчащие expression |
| expireAfterSeconds | TTL (date-поле) | автоматически удаляет документы старше порога |
| name | любой | своё имя (по умолчанию: field_1, field2_1, …) |
| language, defaultLanguage, weights | text | язык токенизатора и вес по полю |
| expression | B-tree, 4.2+ | индексирует вычисленное значение вместо сырого поля |

```mongodb
// unique однополевой
db.users.createIndex({ email: 1 }, { unique: true })

// составной, с именем
db.orders.createIndex({ status: 1, createdAt: -1 }, { name: "status_created" })

// partial — только то, что реально запрашивается
db.posts.createIndex({ views: -1 }, { partialFilterExpression: { status: "published" } })

// TTL — сессии исчезают через день
db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 })

// text с весом
db.articles.createIndex({ title: "text", body: "text" }, { weights: { title: 10 } })

// geospatial
db.places.createIndex({ loc: "2dsphere" })

// expression (4.2+) — индекс производного значения
db.orders.createIndex({ total: 1 }, { expression: { $multiply: ["$price", "$qty"] } })
```

sparse и partial выглядят похоже, но не одно и то же. Sparse-индекс просто пропускает документы без поля; partial-индекс пропускает документы, не проходящие filter-expression — и планировщик использует partial-индекс только для запроса, чей фильтр вытекает из этого expression. Индекс `{ views: -1 }` выше обслуживает `find({ status: "published" }).sort({ views: -1 })`, но запрос без `status` им воспользоваться не может. TTL-удаление крутит фоновый монитор с гранулярностью около 60 секунд, а `expireAfterSeconds: 0` означает «удалять сразу, как только увидели».

## Как выбрать тип

| Паттерн запроса | Строить |
| --- | --- |
| Equality по одному полю | Single-field (unique, если значение должно быть уникальным) |
| Filter + sort + range по нескольким полям | Compound, поля в ESI-порядке |
| Любой элемент массива равен значению | Multikey (автоматически на поле-массиве) |
| Полнотекстовый поиск | Text |
| Автоматически удалять старые строки | TTL |
| Ближайшие точки / пересечение полигонов | 2dsphere |
| Equality-запросы в sharded-коллекции | Hashed, как shard key |
| Индексировать вычисляемое expression | Expression (4.2+) |

Если сомневаетесь — начинайте от медленного запроса: explain его, посмотрите, какие поля трогают фильтр и сортировка, и постройте минимальный индекс под этот паттерн. Потом снова explain — и смотрите, как план меняется с COLLSCAN на IXSCAN. Таблица выбора выше покрывает паттерны, которые вы реально встретите; почти всё остальное — вариации первых двух строк.

> **TIP**
> Называйте индексы по запросу, который они обслуживают, а не по полям — "open_orders_by_date" документирует намерение в выводе getIndexes(). И помните правило направления: один single-field индекс обслуживает оба направления сортировки, поэтому не индексируйте одно поле дважды — один раз по возрастанию и один раз по убыванию.

> **WARNING**
> Multikey-индекс — последний аргумент планировщика: пока запрос использует multikey-индекс по полю-массиву, он не может использовать в том же запросе никакой другой индекс (кроме _id). Если find({ tags: "web", createdAt: { $gt: t } }) замедляется вместе с ростом коллекции — виноват multikey на tags; лечение — partial-индекс или передел модели, а не второй индекс.
