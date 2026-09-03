---
id: mongo-indexes
track: mongo
type: guide
section: performance
order: 4
title:
  en: "Indexes"
  ru: "Индексы"
excerpt:
  en: "Why indexes exist, how to create and manage them, how the query planner chooses between them (COLLSCAN vs IXSCAN, ESI order), and the rules that keep them fast."
  ru: "Зачем нужны индексы, как их создавать и управлять, как планировщик запроса выбирает между ними (COLLSCAN против IXSCAN, ESI-порядок) и правила, которые держат их быстрыми."
version: "mongo 8"
updated: 2026-09-03
---

An index is a sorted side-table of field values pointing at documents, which lets MongoDB find data without reading the whole collection. This page covers why indexes exist, how to create and manage them, how the query planner chooses between them, and the rules that keep them fast.

## Why indexes exist

Without an index, `find({ status: "paid" })` performs a collection scan: the engine reads every document in the collection and checks the filter on each one. The `explain` output calls this `COLLSCAN`. It is correct at any size and hopeless at scale — a million documents means a million comparisons on every request, and the cost grows with the collection, not with the result.

An index on `status` is a B-tree of `status` values with pointers to the documents. The same query becomes `IXSCAN`: the engine walks the tree to the `"paid"` range and fetches only the documents in it. Think of the alphabetical index at the back of a book — you jump to the page instead of reading the whole volume.

```mongodb
db.orders.explain("executionStats").find({ status: "paid" })
```

In the `executionStats` output, two numbers tell the whole story: `totalDocsExamined` (documents the engine touched) and `nReturned` (documents it sent back). A healthy indexed query examines roughly what it returns; examined ≫ returned means the filter ran without an index, or the index matched too much.

## Creating and managing indexes

```mongodb
// single-field and compound
db.orders.createIndex({ status: 1, createdAt: -1 })
db.users.createIndex({ email: 1 }, { unique: true })

// inspect and drop
db.users.getIndexes()
db.users.dropIndex("email_1")
db.orders.dropIndexes()
```

The key pattern lists fields with a direction: `1` ascending, `-1` descending. A single-field index serves both directions (a B-tree reads backwards as easily as forwards), but compound indexes are directional: `(status: 1, createdAt: -1)` and `(status: -1, createdAt: 1)` are different indexes. `unique: true` turns the index into a distinctness constraint enforced at the storage layer — the right tool for "a user may have one e-mail".

Special options narrow what an index covers. A partial index stores only the documents matching a filter expression — ideal when most rows are `"open"` orders and only the published ones are ever queried. A TTL index deletes documents automatically once their date field is older than a threshold — the standard cleanup for sessions and events.

```mongodb
db.posts.createIndex(
  { status: 1 },
  { partialFilterExpression: { status: "published" } }
)

db.sessions.createIndex(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 }
)
```

> **TIP**
> Name indexes after the query they serve, not after their fields: the index `{ status: 1, createdAt: -1 }` is "open orders by date". The name is the only place in the schema that can document intent.

## How the planner uses indexes

The query planner estimates the cost of every candidate index — from the equality fields, the sort, and the ranges the query uses — and runs the cheapest plan. For a compound index, the effective order is ESI: **E**quality fields first, then **S**ort fields, then range (**I**nequality) fields. A query `find({ status: "paid", created: { $gt: t } }).sort({ amount: 1 })` is best served by the index `(status, amount, created)`.

If the sort cannot be served by the index, MongoDB sorts in memory — which works until the result gets large, then fails with "Exceeded memory limit for sort". That error is the planner telling you the index does not match the query.

The cheapest read of all is a covered query: the projection asks only for fields that are in the index (plus `_id`, or with `_id: 0`), so the engine never touches the documents. In the explain output you see it as a winning plan made of index operations only, with `COVERED` in the summary.

## Index hygiene

Every index has a price: each insert, update and delete must also update every index on the collection, and every index wants RAM. A collection with twenty indexes that serve ten query patterns pays write cost for ten of them for nothing.

The routine that keeps indexes honest: run `getIndexes()`, explain the slow queries you actually have, and drop every index that no explain ever shows as `IXSCAN`. High-cardinality fields (an e-mail, an order id) make excellent equality indexes; a low-cardinality field alone (a `status` with three values) is useful mostly in combination with a sort or another field.

> **WARNING**
> Indexing a field that changes constantly (a `lastSeen` updated on every request) multiplies write cost on every request. Before you add such an index, measure the query it serves — most "hot" fields turn out to be queried by a pattern a different index already covers.

> **TIP**
> Grow the index set from the slowest real queries, not from hypotheticals. Explain your top patterns, index those, re-measure. "Preventive" indexes for queries you might write next month are dead RAM today.

<!-- RU -->

Индекс — это отсортированная боковая таблица значений полей с указателями на документы, позволяющая MongoDB находить данные без чтения всей коллекции. Здесь: зачем индексы, как их создавать и управлять, как планировщик запроса выбирает между ними и правила, которые держат их быстрыми.

## Зачем нужны индексы

Без индекса `find({ status: "paid" })` делает collection scan: движок читает каждый документ коллекции и проверяет фильтр на каждом. В выводе `explain` это называется `COLLSCAN`. Корректно на любом размере и безнадёжно на масштабе: миллион документов — миллион сравнений на каждый запрос, и цена растёт с коллекцией, а не с результатом.

Индекс по `status` — это B-tree значений `status` с указателями на документы. Тот же запрос становится `IXSCAN`: движок идёт по дереву к диапазону `"paid"` и тянет только документы в нём. Индекс в конце книги: вы прыгаете на страницу, а не читаете весь том.

```mongodb
db.orders.explain("executionStats").find({ status: "paid" })
```

В выводе `executionStats` два числа рассказывают всю историю: `totalDocsExamined` (документы, которые движок коснулся) и `nReturned` (документы, которые он вернул). Здоровый индексированный запрос осматривает примерно то, что возвращает; examined ≫ returned — фильтр пошёл без индекса или индекс матчит слишком много.

## Создание и управление индексами

```mongodb
// однополевой и составной
db.orders.createIndex({ status: 1, createdAt: -1 })
db.users.createIndex({ email: 1 }, { unique: true })

// просмотр и удаление
db.users.getIndexes()
db.users.dropIndex("email_1")
db.orders.dropIndexes()
```

Ключевой паттерн перечисляет поля с направлением: `1` по возрастанию, `-1` по убыванию. Однополевой индекс обслуживает оба направления (B-tree читается назад не хуже, чем вперёд), но составные индексы направлены: `(status: 1, createdAt: -1)` и `(status: -1, createdAt: 1)` — разные индексы. `unique: true` превращает индекс в constraint уникальности, выполняемый на уровне хранения, — правильный инструмент для «у пользователя может быть один email».

Спецопции сужают, что индекс покрывает. Partial-индекс хранит только документы, матчащие expression фильтра, — идеально, если большинство строк — заказы `"open"`, а запрашивают только published. TTL-индекс автоматически удаляет документы, когда их date-поле старше порога, — стандартная уборка для сессий и событий.

```mongodb
db.posts.createIndex(
  { status: 1 },
  { partialFilterExpression: { status: "published" } }
)

db.sessions.createIndex(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 }
)
```

> **TIP**
> Называйте индексы по запросу, который они обслуживают, а не по полям: индекс `{ status: 1, createdAt: -1 }` — «открытые заказы по дате». Имя — единственное место в схеме, где можно задокументировать намерение.

## Как планировщик использует индексы

Планировщик запроса оценивает стоимость каждого кандидата — по equality-полям, sort и диапазонам, которые использует запрос, — и запускает самый дешёвый план. Для составного индекса эффективный порядок — ESI: **E**quality-поля первыми, затем **S**ort, затем range (**I**nequality). Запрос `find({ status: "paid", created: { $gt: t } }).sort({ amount: 1 })` лучше всего обслуживается индексом `(status, amount, created)`.

Если sort не обслуживается индексом, MongoDB сортирует в памяти — работает, пока результат небольшой, дальше падает с "Exceeded memory limit for sort". Эта ошибка — планировщик говорит, что индекс не совпадает с запросом.

Самое дешёвое чтение — covered query: проекция просит только поля, которые есть в индексе (плюс `_id`, или с `_id: 0`), и движок никогда не трогает документы. В explain это видно по winning plan, состоящему только из index-операций, и слову `COVERED` в сводке.

## Гигиена индексов

У каждого индекса есть цена: каждая вставка, обновление и удаление должны обновить все индексы коллекции, и каждый индекс просит RAM. Коллекция с двадцатью индексами, обслуживающими десять query-паттернов, платит write-стоимостью за десять лишних.

Рутинное, которое держит индексы честными: `getIndexes()`, explain по медленным запросам, которые у вас реально есть, и drop индексов, которые ни один explain не показывает как `IXSCAN`. Высококардинальные поля (email, id заказа) — прекрасные equality-индексы; низкокардинальное поле само по себе (`status` с тремя значениями) полезно скорее в комбинации с сортировкой или другим полем.

> **WARNING**
> Индексирование поля, которое меняется постоянно (`lastSeen`, обновляемый на каждом запросе), умножает write-cost на каждый запрос. Прежде чем добавить такой индекс, измерьте запрос, который он обслуживает: большинство «горячих» полей оказываются запрашиваемыми по паттерну, который уже покрывает другой индекс.

> **TIP**
> Растите набор индексов от самых медленных реальных запросов, а не от гипотез. Explain ваши топ-паттерны, проиндексируйте их, замерьте снова. «Профилактические» индексы под запросы, которые вы, возможно, напишете в следующий месяц, — это мёртвая RAM сегодня.
