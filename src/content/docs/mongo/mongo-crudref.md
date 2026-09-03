---
id: mongo-crudref
track: mongo
type: reference
section: reference
order: 4
title:
  en: "CRUD Commands Cheat Sheet"
  ru: "CRUD: шпаргалка"
excerpt:
  en: "Every CRUD command side by side in mongosh and the Node driver: the result fields you assert on, find modifiers, count commands, atomic read-modify-write, and the full table of atomic update operators."
  ru: "Все CRUD-команды бок о бок в mongosh и Node-драйвере: поля результата, на которые сверяете, модификаторы find, команды подсчёта, атомарный read-modify-write и полная таблица атомарных операторов обновления."
version: "mongo 8"
updated: 2026-09-03
relatedTask: mongo-001
---

Every CRUD command MongoDB exposes, in one place: mongosh and the Node driver side by side, the result fields you should assert on, the options that change behavior, and the atomic update operators. The CRUD guide explains the concepts; this page is for copying from.

## The four operations

| Operation | mongosh | Node driver | Read back from the result |
| --- | --- | --- | --- |
| Insert one | db.c.insertOne(doc) | coll.insertOne(doc) | insertedId |
| Insert many | db.c.insertMany(docs) | coll.insertMany(docs) | insertedIds |
| Find many | db.c.find(filter) | coll.find(filter).toArray() | documents |
| Find one | db.c.findOne(filter) | coll.findOne(filter) | a document or null |
| Update one | db.c.updateOne(filter, update) | coll.updateOne(filter, update) | matchedCount, modifiedCount |
| Update many | db.c.updateMany(filter, update) | coll.updateMany(filter, update) | matchedCount, modifiedCount |
| Replace | db.c.replaceOne(filter, doc) | coll.replaceOne(filter, doc) | matchedCount, modifiedCount |
| Delete one | db.c.deleteOne(filter) | coll.deleteOne(filter) | deletedCount |
| Delete many | db.c.deleteMany(filter) | coll.deleteMany(filter) | deletedCount |

Every write is acknowledged, and the result object is your evidence. matchedCount says how many documents the filter touched; modifiedCount says how many of them actually changed. A $set to the same value the field already has matches but does not modify — the usual surprise when a test expects a modifiedCount of 1 for an idempotent update. An upsert that creates the document reports matchedCount 0, modifiedCount 0, and sets upsertedId to the new _id. Deletes report deletedCount; inserts report insertedId for one document and the insertedIds array for many.

Replace and update are two different verbs. replaceOne swaps the whole document for the replacement (everything except _id is discarded); updateOne applies operators to fields of the existing document. For read-modify-write in one atomic step the shell has findAndModify, and the driver splits the same operation into three names: findOneAndUpdate, findOneAndReplace and findOneAndDelete — all atomic, all returning the document, before or after the change depending on an option.

Upsert — update, or insert when nothing matched — is the third behavior you opt into with `upsert: true` on any update or replace. The filter defines the document's identity, the operator document (plus $setOnInsert for fields that should exist only on the first insert) defines its content, and upsertedId in the result tells you which of the two things happened.

## Find modifiers, counts, atomic read-modify-write

| Modifier | Purpose | Call (same shape in shell and driver) |
| --- | --- | --- |
| projection | only the listed fields; _id is included unless you drop it | .project({ title: 1, _id: 0 }) |
| sort | order the results | .sort({ createdAt: -1 }) |
| limit | stop after N documents | .limit(20) |
| skip | drop the first N documents | .skip(40) |
| hint | force a specific index | .hint("status_created") |

Counts come in two flavors. countDocuments(filter) is exact — it runs a real query and can still use a covered index. estimatedDocumentCount() is a storage-stat read: near-instant, ignores the filter, and is the right answer to "how big is this collection". distinct(field, filter) returns the unique values of one field.

```mongodb
// pagination with a projection
db.posts.find({ status: "published" })
  .sort({ createdAt: -1 })
  .skip(40).limit(20)
  .project({ title: 1, createdAt: 1, _id: 0 })
```

```mongodb
// atomic counter: read-modify-write in one step
db.counters.findAndModify({
  query: { key: "visits" },
  update: { $setOnInsert: { key: "visits" }, $inc: { count: 1 } },
  upsert: true,
  new: true,
})
```

```js
// driver: the same counter, with the result
const res = await coll.updateOne(
  { key: "visits" },
  { $setOnInsert: { key: "visits" }, $inc: { count: 1 } },
  { upsert: true }
);
console.log(res.matchedCount, res.modifiedCount, res.upsertedId);
```

## Atomic update operators

| Operator | Example | Effect |
| --- | --- | --- |
| $set | { $set: { status: "done" } } | sets/overwrites the field (creates it if missing) |
| $setOnInsert | { $setOnInsert: { by: "ana" } } | only when upsert creates the document |
| $unset | { $unset: { tmp: "" } } | removes the field |
| $inc | { $inc: { count: 2 } } | adds the number (creates the field with the delta) |
| $mul | { $mul: { price: 1.2 } } | multiplies |
| $min | { $min: { record: 5 } } | sets only if the new value is smaller |
| $max | { $max: { record: 5 } } | sets only if the new value is larger |
| $rename | { $rename: { old: "new" } } | renames the field |
| $currentDate | { $currentDate: { at: true } } | sets a date (or { $type: "timestamp" }) |
| $push | { $push: { tags: { $each: ["a", "b"], $slice: -5 } } } | appends, with modifiers |
| $addToSet | { $addToSet: { tags: "web" } } | appends only if not already present |
| $pop | { $pop: { items: 1 } } | removes the last (1) or first (-1) element |
| $pull | { $pull: { tags: "web" } } | removes the elements that match |

An update document is either an operator document (every top-level key starts with $) or a full replacement — there is no middle ground, and you cannot mix the two in one document. updateOne silently performs the replacement when it receives a document without $ operators, which is the classic data-loss bug; replaceOne says the same thing out loud. For many operations in one round trip there is bulkWrite: an array of insertOne, updateOne, replaceOne, deleteOne and deleteMany operations, applied in order by default (ordered, the default) or independently (ordered: false).

```mongodb
db.orders.bulkWrite([
  { insertOne: { document: { n: 1, status: "open" } } },
  { updateOne: { filter: { n: 1 }, update: { $set: { status: "paid" } } } },
  { deleteMany: { filter: { n: -1 } } },
])
```

The result of bulkWrite reports totals (insertedCount, matchedCount, modifiedCount, deletedCount) and the per-operation upsertedIds; with ordered: false one failing operation does not stop the rest, which is what you want for bulk backfills and what you must check in the result.

> **TIP**
> Use countDocuments when the number matters and estimatedDocumentCount for "how big is this, roughly" — it is a storage stat, not a scan. And for any counter you update often, $inc is the only operator that stays correct under concurrency: it never reads the value first.

> **WARNING**
> An update document without a $ operator is a full replacement: updateOne({ _id: 1 }, { status: "done" }) keeps only status and _id and deletes every other field. If you meant to touch one field, the operator is the syntax — $set is the single most-used line of any MongoDB codebase.

<!-- RU -->

Каждая CRUD-команда MongoDB — в одном месте: mongosh и Node-драйвер бок о бок, поля результата, на которые сверяете, опции, которые меняют поведение, и атомарные операторы обновления. CRUD-гайд объясняет концепции; эта страница — для копирования.

## Четыре операции

| Операция | mongosh | Node-драйвер | Читаем из результата |
| --- | --- | --- | --- |
| Вставить один | db.c.insertOne(doc) | coll.insertOne(doc) | insertedId |
| Вставить много | db.c.insertMany(docs) | coll.insertMany(docs) | insertedIds |
| Найти много | db.c.find(filter) | coll.find(filter).toArray() | документы |
| Найти один | db.c.findOne(filter) | coll.findOne(filter) | документ или null |
| Обновить один | db.c.updateOne(filter, update) | coll.updateOne(filter, update) | matchedCount, modifiedCount |
| Обновить много | db.c.updateMany(filter, update) | coll.updateMany(filter, update) | matchedCount, modifiedCount |
| Заменить | db.c.replaceOne(filter, doc) | coll.replaceOne(filter, doc) | matchedCount, modifiedCount |
| Удалить один | db.c.deleteOne(filter) | coll.deleteOne(filter) | deletedCount |
| Удалить много | db.c.deleteMany(filter) | coll.deleteMany(filter) | deletedCount |

Каждый write подтверждаем, и объект результата — ваше доказательство. matchedCount — сколько документов задел фильтр; modifiedCount — сколько из них реально изменилось. $set на то же значение, что уже в поле, матчит, но не модифицирует — обычный сюрприз, когда тест ждёт modifiedCount 1 для идемпотентного обновления. Upsert, создавший документ, сообщает matchedCount 0, modifiedCount 0 и ставит upsertedId с новым _id. Удаления сообщают deletedCount; вставки — insertedId для одного документа и массив insertedIds для многих.

Replace и update — два разных глагола. replaceOne целиком заменяет документ на replacement (всё кроме _id выбрасывается); updateOne применяет операторы к полям существующего документа. Для read-modify-write за один атомарный шаг в шелле есть findAndModify, а драйвер раскладывает ту же операцию на три имени: findOneAndUpdate, findOneAndReplace и findOneAndDelete — все атомарные, все возвращают документ, до или после изменения в зависимости от опции.

Upsert — «обнови, а если ничего не матчнулось — вставь» — третье поведение, которое включается флагом `upsert: true` на любом update или replace. Фильтр задаёт идентичность документа, операторный документ (плюс $setOnInsert для полей, которые должны существовать только при первой вставке) задаёт содержимое, а upsertedId в результате говорит, что из двух произошло.

## Модификаторы find, подсчёт, атомарный read-modify-write

| Модификатор | Назначение | Вызов (одна форма в шелле и драйвере) |
| --- | --- | --- |
| projection | только указанные поля; _id включено, если его не убрать | .project({ title: 1, _id: 0 }) |
| sort | порядок результата | .sort({ createdAt: -1 }) |
| limit | остановиться после N документов | .limit(20) |
| skip | выбросить первые N документов | .skip(40) |
| hint | принудить конкретный индекс | .hint("status_created") |

Подсчёт бывает двух видов. countDocuments(filter) — точный: исполняет настоящий запрос и всё ещё может использовать covered-индекс. estimatedDocumentCount() — чтение storage-статистики: почти мгновенно, игнорирует фильтр, и это правильный ответ на «насколько велика эта коллекция». distinct(field, filter) возвращает уникальные значения одного поля.

```mongodb
// пагинация с проекцией
db.posts.find({ status: "published" })
  .sort({ createdAt: -1 })
  .skip(40).limit(20)
  .project({ title: 1, createdAt: 1, _id: 0 })
```

```mongodb
// атомарный счётчик: read-modify-write за один шаг
db.counters.findAndModify({
  query: { key: "visits" },
  update: { $setOnInsert: { key: "visits" }, $inc: { count: 1 } },
  upsert: true,
  new: true,
})
```

```js
// драйвер: тот же счётчик, с результатом
const res = await coll.updateOne(
  { key: "visits" },
  { $setOnInsert: { key: "visits" }, $inc: { count: 1 } },
  { upsert: true }
);
console.log(res.matchedCount, res.modifiedCount, res.upsertedId);
```

## Атомарные операторы обновления

| Оператор | Пример | Эффект |
| --- | --- | --- |
| $set | { $set: { status: "done" } } | ставит/перезаписывает поле (создаёт, если нет) |
| $setOnInsert | { $setOnInsert: { by: "ana" } } | только если upsert создаёт документ |
| $unset | { $unset: { tmp: "" } } | удаляет поле |
| $inc | { $inc: { count: 2 } } | прибавляет число (создаёт поле с дельтой) |
| $mul | { $mul: { price: 1.2 } } | умножает |
| $min | { $min: { record: 5 } } | ставит только если новое значение меньше |
| $max | { $max: { record: 5 } } | ставит только если новое значение больше |
| $rename | { $rename: { old: "new" } } | переименовывает поле |
| $currentDate | { $currentDate: { at: true } } | ставит дату (или { $type: "timestamp" }) |
| $push | { $push: { tags: { $each: ["a", "b"], $slice: -5 } } } | дописывает, с модификаторами |
| $addToSet | { $addToSet: { tags: "web" } } | дописывает, если ещё нет |
| $pop | { $pop: { items: 1 } } | убирает последний (1) или первый (-1) элемент |
| $pull | { $pull: { tags: "web" } } | убирает матчащие элементы |

Update-документ — либо операторный (каждый top-level ключ начинается с $), либо полная замена — середины нет, и смешивать их в одном документе нельзя. updateOne молча выполняет замену, когда получает документ без $-операторов, — это классический баг потери данных; replaceOne говорит то же самое вслух. Для многих операций за один round trip есть bulkWrite: массив операций insertOne, updateOne, replaceOne, deleteOne и deleteMany, исполняются по порядку по умолчанию (ordered, по умолчанию) или независимо (ordered: false).

```mongodb
db.orders.bulkWrite([
  { insertOne: { document: { n: 1, status: "open" } } },
  { updateOne: { filter: { n: 1 }, update: { $set: { status: "paid" } } } },
  { deleteMany: { filter: { n: -1 } } },
])
```

Результат bulkWrite сообщает суммы (insertedCount, matchedCount, modifiedCount, deletedCount) и upsertedIds по операциям; с ordered: false одна упавшая операция не останавливает остальные — это то, что нужно для bulk-backfill, и то, что нужно проверить в результате.

> **TIP**
> Используйте countDocuments, когда число важно, и estimatedDocumentCount для «насколько это велико, примерно» — это storage-статистика, а не scan. И для любого счётчика, который вы часто обновляете, $inc — единственный оператор, остающийся корректным при конкурентности: он никогда сначала не читает значение.

> **WARNING**
> Update-документ без $-оператора — полная замена: updateOne({ _id: 1 }, { status: "done" }) сохраняет только status и _id и удаляет все остальные поля. Если вы хотели зацепить одно поле — оператор и есть синтаксис: $set — самая употребительная строка любого MongoDB-кодоуза.
