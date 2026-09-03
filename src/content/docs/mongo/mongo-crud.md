---
id: mongo-crud
track: mongo
type: guide
section: basics
order: 2
title:
  en: "CRUD Operations"
  ru: "CRUD-операции"
excerpt:
  en: "Insert, read, update and delete with the Node driver: insertOne/insertMany, find with modifiers, atomic $set/$inc updates, upserts, deletes — and how to verify what actually happened."
  ru: "Вставка, чтение, обновление и удаление через Node-драйвер: insertOne/insertMany, find с модификаторами, атомарные $set/$inc-обновления, upsert, удаление — и как проверить, что реально произошло."
version: "mongo 8"
updated: 2026-09-03
relatedTask: mongo-004
---

CRUD — create, read, update, delete — is the daily work of any application backed by MongoDB. This page walks through all four operations with the Node driver, in the order you actually use them: insert documents, query them back, modify them atomically, and remove them.

## Create: insertOne and insertMany

```js
import { MongoClient } from "mongodb";

const client = new MongoClient("mongodb://localhost:27017/app");
await client.connect();
const tasks = client.db("app").collection("tasks");

const one = await tasks.insertOne({ title: "Write docs", done: false });
console.log(one.insertedId); // an auto-generated ObjectId

const many = await tasks.insertMany([
  { title: "Review PR", done: false },
  { title: "Ship release", done: true },
]);
console.log(many.insertedCount); // 2
```

If the document has no `_id`, the server generates an ObjectId and returns it in `insertedId`. `insertMany` takes an array and, by default, is ordered: it stops at the first error and reports it. Pass `{ ordered: false }` and every valid document is inserted, with all errors collected into a single result.

> **TIP**
> Let the server generate `_id` unless you have a natural, globally unique key (an order number, a URL slug). Custom ids that run in sequence — an integer counter, a timestamp — make the `_id` index grow in bursts at one edge, which is slower under concurrent inserts.

## Read: find and its modifiers

```js
const open = await tasks
  .find({ done: false })
  .sort({ title: 1 })
  .limit(10)
  .toArray();

const first = await tasks.findOne({ done: false });

const titlesOnly = await tasks
  .find({ done: false })
  .project({ title: 1, _id: 0 })
  .toArray();

const n = await tasks.countDocuments({ done: false });
```

`find` returns a cursor — a lazy handle, not an array. Nothing is fetched until you call `.toArray()` (or iterate). The modifiers you chain — `sort`, `limit`, `skip`, `project` — describe a plan the server can execute with an index: an index on `(done, title)` answers the first query straight from the index, without an in-memory sort.

In a projection, `1` includes a field and `0` excludes it. `_id` is included by default; write `_id: 0` to drop it. `countDocuments(filter)` returns the exact number of matching documents — use it for "N of M" counters in the UI, not for pagination.

## Update: $set and friends

```js
const r1 = await tasks.updateOne({ title: "Write docs" }, { $set: { done: true } });
console.log(r1.matchedCount, r1.modifiedCount); // 1 1

const r2 = await tasks.updateMany({}, { $inc: { views: 1 } });
console.log(r2.modifiedCount); // every document

const r3 = await tasks.updateOne(
  { title: "Write docs" },
  { $set: { priority: 1 } },
  { upsert: true }
);
console.log(r3.upsertedId); // null — the document already matched
```

Field-level updates are written with operators. `$set` writes only the listed fields and leaves the rest of the document untouched; `$inc` and `$mul` adjust numbers; `$push` appends to arrays. These operations are atomic on the server: concurrent `$inc`s never lose an increment, and no application-side lock is needed.

The result separates `matchedCount` from `modifiedCount`: the filter matched one document, but a `$set` to a value it already has changes nothing — `matched: 1, modified: 0`. Reading both numbers tells you whether a "no-op" was an unmatched filter or an unchanged value.

With `{ upsert: true }`, an update that matches nothing creates a new document from the filter plus the `$set` fields; `$setOnInsert` applies its fields only on that creation. This is the standard atomic counter: `updateOne({ key: "visits" }, { $inc: { count: 1 } }, { upsert: true })` creates the counter on the first hit and increments it on every hit after.

> **WARNING**
> A plain document as the second argument is a full replacement, not an update: passing `{ title: "x" }` turns the whole document into `{ _id, title: "x" }` and silently drops every other field. For field-level changes, always write `{ $set: ... }`.

## Delete: deleteOne and deleteMany

```js
const d1 = await tasks.deleteOne({ title: "Ship release" });
console.log(d1.deletedCount); // 1

const d2 = await tasks.deleteMany({ done: true });
console.log(d2.deletedCount); // every finished task
```

`deleteMany({})` removes the documents of the whole collection — the filter, like everywhere in MongoDB, is a plain object, and the empty object matches everything. The result's `deletedCount` tells you how many rows actually went away.

> **TIP**
> For user-visible data, prefer a soft delete — `{ $set: { archived: true } }` and a filter on the flag — over physical deletion. History stays queryable, reports can include it, and a mistaken delete is a one-line fix instead of a restore.

## Checking the result

Every write returns a result object with `acknowledged` and the counters that describe what happened: `insertedId`/`insertedCount` for inserts, `matchedCount`/`modifiedCount`/`upsertedId` for updates, `deletedCount` for deletes. In the Node driver all writes are acknowledged by default, so `acknowledged: false` is a signal that something is wrong with your connection settings — worth an alert in production.

The pattern that keeps CRUD code honest: check the counter immediately after the write. An update that expected to match one document and matched zero is a data bug — a typo in the filter, a lost race — and it deserves the same attention as an exception.

<!-- RU -->

CRUD — create, read, update, delete — ежедневная работа любого приложения на MongoDB. В этом материале — все четыре операции с Node-драйвером в том порядке, в котором они реально используются: вставить документы, прочитать их, атомарно изменить и удалить.

## Create: insertOne и insertMany

```js
import { MongoClient } from "mongodb";

const client = new MongoClient("mongodb://localhost:27017/app");
await client.connect();
const tasks = client.db("app").collection("tasks");

const one = await tasks.insertOne({ title: "Write docs", done: false });
console.log(one.insertedId); // сгенерированный ObjectId

const many = await tasks.insertMany([
  { title: "Review PR", done: false },
  { title: "Ship release", done: true },
]);
console.log(many.insertedCount); // 2
```

Если у документа нет `_id`, сервер генерирует ObjectId и возвращает его в `insertedId`. `insertMany` принимает массив и по умолчанию ordered: останавливается на первой ошибке и сообщает о ней. Передайте `{ ordered: false }` — вставится всё, что валидно, а все ошибки соберутся в один результат.

> **TIP**
> Пусть сервер генерирует `_id`, пока у вас нет естественного глобально-уникального ключа (номер заказа, slug). Собственные id по последовательности — счётчик, timestamp — заставляют индекс `_id` расти очередями у одного края, что медленнее при параллельных вставках.

## Read: find и его модификаторы

```js
const open = await tasks
  .find({ done: false })
  .sort({ title: 1 })
  .limit(10)
  .toArray();

const first = await tasks.findOne({ done: false });

const titlesOnly = await tasks
  .find({ done: false })
  .project({ title: 1, _id: 0 })
  .toArray();

const n = await tasks.countDocuments({ done: false });
```

`find` возвращает курсор — ленивую ручку, а не массив. Ничего не читается, пока вы не вызовете `.toArray()` (или не переберёте). Модификаторы, которые вы цепляете — `sort`, `limit`, `skip`, `project` — описывают план, который сервер может исполнить по индексу: индекс на `(done, title)` отвечает на первый запрос прямо по индексу, без сортировки в памяти.

В проекции `1` — включить поле, `0` — исключить. `_id` включено по умолчанию; чтобы убрать, напишите `_id: 0`. `countDocuments(filter)` возвращает точное число совпавших документов — используйте для UI-счётчиков «N из M», а не для пагинации.

## Update: $set и друзья

```js
const r1 = await tasks.updateOne({ title: "Write docs" }, { $set: { done: true } });
console.log(r1.matchedCount, r1.modifiedCount); // 1 1

const r2 = await tasks.updateMany({}, { $inc: { views: 1 } });
console.log(r2.modifiedCount); // все документы

const r3 = await tasks.updateOne(
  { title: "Write docs" },
  { $set: { priority: 1 } },
  { upsert: true }
);
console.log(r3.upsertedId); // null — документ уже матчил
```

Полевые обновления пишутся операторами. `$set` пишет только перечисленные поля и не трогает остальной документ; `$inc` и `$mul` корректируют числа; `$push` дописывает в массив. Эти операции атомарны на сервере: параллельные `$inc` не теряют ни одного инкремента, и application-lock не нужен.

Результат разделяет `matchedCount` и `modifiedCount`: фильтр матчил один документ, но `$set` значения, которое уже есть, ничего не меняет — `matched: 1, modified: 0`. Чтение обоих чисел говорит, был ли «no-op» промах фильтра или неизменное значение.

С `{ upsert: true }` обновление, не найдшее совпадений, создаёт документ из фильтра плюс `$set`-поля; `$setOnInsert` применяет свои поля только при создании. Это стандартный атомарный счётчик: `updateOne({ key: "visits" }, { $inc: { count: 1 } }, { upsert: true })` создаёт счётчик на первом хите и инкрементит его на каждом хите дальше.

> **WARNING**
> Обычный документ как второй аргумент — полная замена, а не обновление: передав `{ title: "x" }`, вы превратите весь документ в `{ _id, title: "x" }` и молча потеряете все остальные поля. Для полевых изменений всегда пишите `{ $set: ... }`.

## Delete: deleteOne и deleteMany

```js
const d1 = await tasks.deleteOne({ title: "Ship release" });
console.log(d1.deletedCount); // 1

const d2 = await tasks.deleteMany({ done: true });
console.log(d2.deletedCount); // все завершённые задачи
```

`deleteMany({})` удаляет документы всей коллекции — фильтр, как и везде в MongoDB, обычный объект, а пустой объект матчит всё. `deletedCount` в результате говорит, сколько строк реально исчезло.

> **TIP**
> Для данных, видимых пользователем, предпочитайте soft delete — `{ $set: { archived: true } }` и фильтр по флагу, — физическому удалению. История остаётся запросимой, отчёты могут её включать, а ошибочный delete лечится одной строкой, а не восстановлением.

## Проверка результата

Каждая запись возвращает результат-объект с `acknowledged` и счётчиками, описывающими, что произошло: `insertedId`/`insertedCount` для вставок, `matchedCount`/`modifiedCount`/`upsertedId` для обновлений, `deletedCount` для удалений. В Node-драйвере все записи acknowledged по умолчанию, поэтому `acknowledged: false` — сигнал, что что-то не так с настройками подключения, — в продакшене это повод для алерта.

Паттерн, который держит CRUD-код честным: сразу после записи проверяйте счётчик. Обновление, которое ожидало один матч и не нашло, — это баг данных (опечатка в фильтре, проигранная гонка), и оно заслуживает такого же внимания, как исключение.
