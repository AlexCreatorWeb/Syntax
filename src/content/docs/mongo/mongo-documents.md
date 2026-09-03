---
id: mongo-documents
track: mongo
type: guide
section: basics
order: 1
title:
  en: "Documents & BSON"
  ru: "Документы и BSON"
excerpt:
  en: "The document is MongoDB's unit of data: a BSON structure with fields, embedded objects and arrays. The BSON types you can store and the hard rules every document must respect."
  ru: "Документ — единица данных MongoDB: BSON-структура с полями, вложенными объектами и массивами. BSON-типы, которые можно хранить, и жёсткие правила, которым подчиняется каждый документ."
version: "mongo 8"
updated: 2026-09-03
---

Every piece of data in MongoDB lives in a document — a small, self-contained BSON structure. A document is the equivalent of a JSON object, but it supports more types than JSON: dates, binary data, 64-bit integers, exact decimals. This page covers the document model, the BSON types you can store inside it, and the hard rules every document must respect.

## The document model

A document is a field-value structure: field names are strings, values are typed. Documents have no fixed schema — two documents in the same collection may carry different fields. That is the model's core strength (new features ship without a migration) and its core responsibility (the application, not the server, guarantees a consistent shape).

The `_id` field is special: it is the document's primary key, unique within the collection. If you do not supply one, the server generates an ObjectId for you.

```js
import { MongoClient } from "mongodb";

const client = new MongoClient("mongodb://localhost:27017/app");
await client.connect();
const orders = client.db("shop").collection("orders");

// A typical document: an identifier, embedded objects, arrays, scalars
const order = {
  _id: "ORD-1042", // a custom _id — a string is fine
  customer: { name: "Ada", email: "ada@example.com" },
  items: [
    { sku: "kb-01", qty: 1, price: 89.9 },
    { sku: "ms-02", qty: 2, price: 19.9 },
  ],
  total: 129.7,
  status: "paid",
  createdAt: new Date(),
};

const result = await orders.insertOne(order);
console.log(result.insertedId); // ORD-1042
```

The shape above is a standard order document: an identifier, an embedded document (`customer`), an array of embedded documents (`items`), and plain scalars. Embedding keeps related data in one place — reading a single order returns the whole picture without a join.

### Embedded documents and arrays

Embedded documents nest fields; arrays hold ordered lists. Both can be read and written with dot notation: `items.0.sku` addresses the first item, `customer.email` the customer's e-mail. There is no practical depth limit, but deep nesting hurts readability and slows queries down. The working rule: embed what always travels together, reference what changes independently.

```mongodb
db.orders.find({ "items.sku": "kb-01" })
db.orders.find({ "customer.name": "Ada" })
```

In the queries above, dot notation reaches into embedded documents and array elements. `items.sku` matches any order that contains an item with that sku — the array is searched element by element.

## BSON types

Documents are stored as BSON (Binary JSON) — a compact binary encoding of JSON-like structures. BSON extends JSON with types JSON has no room for. The table below lists the types you will actually use.

| Type | Example | What it is for |
| ------ | --------- | ---------------- |
| double | `19.99` | default number (64-bit float) |
| int32 | `Int32(5)` | small integers |
| int64 (long) | `12n` | large integers beyond 2^53 |
| decimal128 | `Decimal128("19.99")` | exact money and fixed-point values |
| string | `"Ada"` | text, UTF-8 |
| document | `{ a: 1 }` | embedded object |
| array | `[1, 2, 3]` | ordered list of any types |
| boolean | `true` | flag |
| date | `new Date()` | milliseconds since the epoch |
| objectId | `ObjectId()` | 12-byte unique id, the default `_id` |
| binary | `BinData(0, "AQ==")` | raw bytes (images, blobs, base64) |
| null | `null` | absence of a value |
| regex | `/^web/` | stored pattern (rarely stored) |

The default number is a double (64-bit float). It is precise enough for most data, but counters and money are the classic cases where you reach for int64 or decimal128 instead — a double loses integer precision past 2^53, and 0.1 + 0.2 is not 0.3.

ObjectId deserves a word of its own: its 12 bytes encode a timestamp, machine identity, process id and a counter. The practical consequence is that ids created over time sort in creation order, which makes the default `_id` index fast to write and makes "newest first" queries nearly free.

```js
import { ObjectId, Decimal128 } from "mongodb";

const doc = {
  id: new ObjectId(),              // 12-byte unique id
  amount: Decimal128("109.99"),    // exact decimal for money
  bigCount: 9007199254740993n,     // int64 (a Node BigInt)
  at: new Date(),                  // BSON date
};
```

When you insert from Node, the driver maps JavaScript values to BSON automatically: a `Date` becomes a BSON date, an `ObjectId` stays an ObjectId, a `BigInt` becomes an int64. No string-to-type conversion — the type travels with the value.

> **TIP**
> If a field "looks wrong" when you read it back (a date became a string, a number became a decimal), check the extended-JSON mode of your shell or serializer before you suspect the data: the BSON type itself is preserved exactly.

## Hard rules

Three limits apply to every document, and the server rejects violations at write time.

Documents must be finite — a document cannot contain itself, circular structures are impossible, and the BSON encoder fails on them.

Documents must fit the 16 MB maximum document size. That is a hard cap, not a target: a document near the limit makes updates, replication and caching expensive. If a field grows without bound (an append-only log, a comment thread), split it into a parent document plus a separate collection of children.

Field names must not contain the dollar sign — it is reserved for operator syntax. Names may not be empty, and short names are a habit worth keeping: every field you write is part of every index that covers it.

> **WARNING**
> "Document is too large" is a runtime error, not a schema error: the same insert works while the array is small and fails once it crosses 16 MB. Design the split before you see the error.

> **TIP**
> Keep the shape of documents in a collection consistent even though the server does not enforce it. Mixed shapes make indexes and queries unpredictable: an index on a field that half the documents lack is a partial index in all but name.

<!-- RU -->

Все данные в MongoDB живут в документах — небольших самодостаточных BSON-структурах. Документ — это аналог JSON-объекта, но с более богатыми типами: даты, бинарные данные, 64-битные целые, точные десятичные. В этом материале — модель документа, BSON-типы, которые в нём можно хранить, и жёсткие правила, которым должен подчиняться каждый документ.

## Модель документа

Документ — структура «поле → значение»: имена полей — строки, значения — типизированы. У документов нет фиксированной схемы — два документа в одной коллекции могут иметь разные поля. В этом и главная сила модели (новые функции выпускаются без миграций), и главная ответственность (не сервер, а приложение гарантирует согласованную форму).

Поле `_id` — особое: это первичный ключ документа, уникальный внутри коллекции. Если вы не задаёте его сами, сервер генерирует ObjectId за вас.

```js
import { MongoClient } from "mongodb";

const client = new MongoClient("mongodb://localhost:27017/app");
await client.connect();
const orders = client.db("shop").collection("orders");

// Типичный документ: идентификатор, вложенные объекты, массивы, скаляры
const order = {
  _id: "ORD-1042", // свой _id — строка тоже подходит
  customer: { name: "Ada", email: "ada@example.com" },
  items: [
    { sku: "kb-01", qty: 1, price: 89.9 },
    { sku: "ms-02", qty: 2, price: 19.9 },
  ],
  total: 129.7,
  status: "paid",
  createdAt: new Date(),
};

const result = await orders.insertOne(order);
console.log(result.insertedId); // ORD-1042
```

Форма выше — стандартный документ заказа: идентификатор, вложенный документ (`customer`), массив вложенных документов (`items`) и обычные скаляры. Встраивание держит связанные данные в одном месте — чтение одного заказа возвращает всю картину без join.

### Вложенные документы и массивы

Вложенные документы вставляют поля внутрь; массивы хранят упорядоченные списки. И то, и другое читается и пишется через точечную нотацию: `items.0.sku` — первый элемент, `customer.email` — email клиента. Практического ограничения на глубину нет, но глубокое встраивание ухудшает читаемость и замедляет запросы. Рабочее правило: встраивайте то, что всегда ходит вместе, а то, что меняется независимо, — ссылайтесь.

```mongodb
db.orders.find({ "items.sku": "kb-01" })
db.orders.find({ "customer.name": "Ada" })
```

В запросах выше точечная нотация достаёт до полей внутри вложенных документов и элементов массивов. `items.sku` матчит любой заказ, у которого есть позиция с этим sku — массив перебирается по элементам.

## Типы BSON

Документы хранятся в BSON (Binary JSON) — компактном бинарном кодировании JSON-подобных структур. BSON расширяет JSON типами, которым в JSON нечего противопоставить. Ниже — типы, которые вы действительно будете использовать.

| Тип | Пример | Для чего |
| ------ | --------- | ---------------- |
| double | `19.99` | число по умолчанию (64-битный float) |
| int32 | `Int32(5)` | небольшие целые |
| int64 (long) | `12n` | большие целые за пределами 2^53 |
| decimal128 | `Decimal128("19.99")` | точные деньги и fixed-point значения |
| string | `"Ada"` | текст, UTF-8 |
| document | `{ a: 1 }` | вложенный объект |
| array | `[1, 2, 3]` | упорядоченный список любых типов |
| boolean | `true` | флаг |
| date | `new Date()` | миллисекунды с эпохи |
| objectId | `ObjectId()` | 12-байтный уникальный id, дефолтный `_id` |
| binary | `BinData(0, "AQ==")` | сырые байты (изображения, blobs, base64) |
| null | `null` | отсутствие значения |
| regex | `/^web/` | хранящийся паттерн (редко хранят) |

Число по умолчанию — double (64-битный float). Для большинства данных его точности хватает, но счётчики и деньги — классические случаи, когда нужен int64 или decimal128: double теряет точность целых за 2^53, а 0.1 + 0.2 не равно 0.3.

Отдельное слово про ObjectId: его 12 байт кодируют timestamp, identity машины, process id и счётчик. Практическое следствие — id, созданные во времени, сортируются по порядку создания, поэтому индекс по `_id` быстр на запись, а запросы «новые сверху» почти бесплатны.

```js
import { ObjectId, Decimal128 } from "mongodb";

const doc = {
  id: new ObjectId(),              // 12-байтный уникальный id
  amount: Decimal128("109.99"),    // точный decimal для денег
  bigCount: 9007199254740993n,     // int64 (Node BigInt)
  at: new Date(),                  // BSON-дата
};
```

При вставке из Node драйвер сам мапит значения JavaScript на BSON: `Date` становится BSON-датой, `ObjectId` остаётся ObjectId, `BigInt` — int64. Никакой конвертации строк в типы — тип едет вместе со значением.

> **TIP**
> Если прочитанное поле «выглядит не так» (дата стала строкой, число — десятичной), проверяйте extended-JSON режим shell или сериализатора, а не данные: сам BSON-тип сохраняется точно.

## Жёсткие правила

Три ограничения действуют на каждый документ, и сервер отклоняет нарушения при записи.

Документ должен быть конечным — документ не может содержать сам себя, циклические структуры невозможны, и BSON-кодировщик на них падает.

Документ должен влезать в максимальный размер 16 МБ. Это жёсткий потолок, а не цель: документ у потолка дорожает в обновлении, репликации и кэшировании. Если поле растёт без предела (append-only журнал, поток комментариев), разделите его на родительский документ и отдельную коллекцию детей.

Имена полей не должны содержать знак доллара — он зарезервирован за синтаксисом операторов. Имена не могут быть пустыми, и короткие имена — привычка, которая стоит того: каждое записанное поле входит в каждый индекс, который его покрывает.

> **WARNING**
> "Document is too large" — это runtime-ошибка, а не схема: та же вставка работает, пока массив мал, и падает, когда он пересекает 16 МБ. Проектируйте разделение до того, как увидите ошибку.

> **TIP**
> Держите форму документов в коллекции согласованной, даже если сервер её не проверяет. Смешанные формы делают индексы и запросы непредсказуемыми: индекс по полю, которого нет в половине документов, — частичный индекс по всем признакам, кроме имени.
