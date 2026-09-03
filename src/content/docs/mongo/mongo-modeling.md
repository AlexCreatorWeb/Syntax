---
id: mongo-modeling
track: mongo
type: guide
section: design
order: 6
title:
  en: "Embedding vs References"
  ru: "Встраивание против ссылок"
excerpt:
  en: "The core schema decision in MongoDB: store related data inside the parent document or in a separate collection linked by id. The criteria, the costs, and the hybrid patterns real schemas use."
  ru: "Ключевое проектное решение в MongoDB: хранить связанные данные внутри родительского документа или в отдельной коллекции со связью по id. Критерии, стоимость и гибридные паттерны реальных схем."
version: "mongo 8"
updated: 2026-09-03
---

The most consequential decision in a MongoDB design is not which indexes to create but how to store relationships: embed the related data inside the parent document, or store it separately and link it by id. This page lays out the two patterns, the criteria that decide between them, and the hybrid approaches real schemas use.

## The two ways to relate data

```js
// Pattern A: embed — the items live inside the order document
const embeddedOrder = {
  _id: "ORD-1042",
  customer: { name: "Ada", email: "ada@example.com" },
  items: [
    { sku: "kb-01", qty: 1, price: 89.9 },
    { sku: "ms-02", qty: 2, price: 19.9 },
  ],
  total: 129.7,
};

// Pattern B: reference — the items live in their own collection
const referencedOrder = { _id: "ORD-1042", customerId: "U-7", itemIds: ["I-1", "I-2"] };
const items = [
  { _id: "I-1", sku: "kb-01", qty: 1, price: 89.9 },
  { _id: "I-2", sku: "ms-02", qty: 2, price: 19.9 },
];
```

Pattern A — embedding — stores the child data inside the parent. A read of the order returns everything in a single operation: no join, no second query, no latency for a second hop. Pattern B — referencing — keeps the child data in its own collection, linked by id. Child documents can be updated in place, and the parent stays small no matter how many children exist.

Both patterns are first-class in MongoDB; the question is never "can I" but "which read pattern does this data serve". The decision criteria below come from four properties: how the data is read, how fast it changes, how big it grows, and whether it is shared between parents.

## When to embed

Embed a one-to-one relationship without hesitation: a user document with an embedded `profile` is the default shape. If the two sides always travel together, keeping them in two collections only adds a join to every read.

Embed one-to-few — a small, bounded number of children: order items, addresses, tags under a limit, the last five audit entries. The boundedness matters: bounded means the parent document has a size you can predict, and a predictable size keeps updates cheap.

```js
// denormalized history: a snapshot, not a live link
await orders.insertOne({
  _id: "ORD-1043",
  items: [
    { name: "Keyboard K1", price: 89.9, qty: 1 }, // the price at purchase time
  ],
  createdAt: new Date(),
});
```

Embedding is also the tool for denormalized history. An order embeds the product name and price **as they were at purchase time**; when the catalog later changes prices, the order keeps its numbers. That is a feature, not an accident: the document is a snapshot, and snapshots must not be re-derived.

The costs of embedding: the 16 MB document cap, whole-document rewrites when a child changes (the parent is updated as a unit), and duplication when the same child is embedded in several parents. Each of these is a reason to set a bound on how many children you embed.

## When to reference

Reference when the child collection grows without bound — blog comments, chat messages, an audit log — because an unbounded embedded array will eventually hit the 16 MB cap and then keep hitting it. Reference when the child is read on its own: "my last 20 orders" is a query on the orders collection, not a search inside every user document.

```js
// a comment is its own document — the post stays small
await comments.insertOne({ postId: "P-9", author: "U-4", text: "great post" });

// read the post with its comments in one pipeline
const withComments = await posts.aggregate([
  { $match: { _id: "P-9" } },
  {
    $lookup: {
      from: "comments",
      localField: "_id",
      foreignField: "postId",
      as: "comments",
    },
  },
]).toArray();
```

Many-to-many relationships (posts and tags, users and roles) are referenced by design: an array of ids on both sides, or a dedicated join collection. The price of referencing is that every read of the parent needs a second fetch — a `$lookup` or a second query — so keep the referenced data small and the joins cheap.

The hybrid that resolves most of the tension: reference the child for the source of truth, and denormalize a summary on the parent. A post references its comments but stores a `commentCount` kept in sync with an atomic `$inc`. The hot read stays a single document; the detail read goes to the collection.

## Choosing: a decision table

| Situation | Pattern | Why |
| ----------- | --------- | ----- |
| 1:1, always read together | embed | no join on any read |
| 1:N, small bounded N | embed | one read returns the unit |
| 1:N, unbounded growth | reference | 16 MB cap, cheap updates |
| N:M | reference | arrays of ids or a join collection |
| child read on its own key | reference | query the child collection directly |
| hot read needs child data | embed a snapshot / denormalize a summary | keep the hot path single-document |

Duplication is legal and often correct in MongoDB — the discipline is in keeping the copies consistent. If a summary field mirrors child data, update it in the same write (a transaction on a replica set, or an atomic `$inc`/`$push`), and decide which copy is authoritative when they disagree. Model for your read queries first: if ninety percent of reads want the whole parent at once, embedding is faster by construction; if reads want children by their own keys, reference.

> **WARNING**
> The 16 MB limit is per document, and "the array grew too big" is a production incident, not a theory. If an embedded array appends forever — a comment thread, a chat history — split it into its own collection before you see the "Document is too large" error.

> **TIP**
> Write the read queries before the schema. For each read, mark whether it needs one document or several; if the hot read needs several, either embed the missing piece (a snapshot) or denormalize a summary. The schema follows the reads.

<!-- RU -->

Самое consequential решение в MongoDB-дизайне — не какие индексы создавать, а как хранить отношения: встроить связанные данные в родительский документ или хранить отдельно и связать по id. Здесь — два паттерна, критерии выбора между ними и гибридные подходы, которые используют реальные схемы.

## Два способа связать данные

```js
// Паттерн A: встраивание — позиции живут внутри документа заказа
const embeddedOrder = {
  _id: "ORD-1042",
  customer: { name: "Ada", email: "ada@example.com" },
  items: [
    { sku: "kb-01", qty: 1, price: 89.9 },
    { sku: "ms-02", qty: 2, price: 19.9 },
  ],
  total: 129.7,
};

// Паттерн B: ссылка — позиции живут в своей коллекции
const referencedOrder = { _id: "ORD-1042", customerId: "U-7", itemIds: ["I-1", "I-2"] };
const items = [
  { _id: "I-1", sku: "kb-01", qty: 1, price: 89.9 },
  { _id: "I-2", sku: "ms-02", qty: 2, price: 19.9 },
];
```

Паттерн A — встраивание — хранит дочерние данные внутри родителя. Чтение заказа возвращает всё за одну операцию: без join, без второго запроса, без задержки второго hop. Паттерн B — ссылка — держит дочерние данные в своей коллекции, связанные по id. Дочерние документы обновляются на месте, родитель остаётся маленьким, сколько бы детей ни было.

Оба паттерна first-class в MongoDB; вопрос никогда не в «можно ли», а в «какой read-паттерн обслуживает эти данные». Критерии ниже вытекают из четырёх свойств: как данные читаются, как быстро меняются, как растут и разделяются ли между несколькими родителями.

## Когда встраивать

1:1-отношение встраивается без колебаний: user-документ со встроенным `profile` — дефолтная форма. Если две стороны всегда ходят вместе, раздельные коллекции добавляют join к каждому чтению.

Встраивайте one-to-few — небольшое ограниченное число детей: позиции заказа, адреса, теги с лимитом, последние пять записей аудита. Ограниченность важна: ограниченное означает, что у родительского документа предсказуемый размер, а предсказуемый размер держит обновления дешёвыми.

```js
// денормализованная история: снимок, а не живая ссылка
await orders.insertOne({
  _id: "ORD-1043",
  items: [
    { name: "Keyboard K1", price: 89.9, qty: 1 }, // цена на момент покупки
  ],
  createdAt: new Date(),
});
```

Встраивание — ещё и инструмент денормализованной истории. Заказ встраивает название товара и цену **на момент покупки**; когда каталог позже изменит цены, заказ сохранит свои числа. Это фича, а не случайность: документ — снимок, и снимок не должен пересчитываться.

Стоимость встраивания: потолок 16 МБ на документ, перезапись целого документа при изменении ребёнка (родитель обновляется как единое целое) и дублирование, если один и тот же ребёнок встроен в нескольких родителях. Каждое из этих — повод ограничить число встраиваемых детей.

## Когда ссылаться

Ссылайтесь, когда дочерняя коллекция растёт без предела — комментарии блога, сообщения чата, audit log, — потому что безграничный встроенный массив однажды упрётся в потолок 16 МБ, а потом будет упираться постоянно. Ссылайтесь, когда ребёнок читается сам по себе: «мои последние 20 заказов» — запрос к коллекции заказов, а не поиск внутри каждого user-документа.

```js
// комментарий — свой документ — пост остаётся маленьким
await comments.insertOne({ postId: "P-9", author: "U-4", text: "great post" });

// прочитать пост с комментариями одним конвейером
const withComments = await posts.aggregate([
  { $match: { _id: "P-9" } },
  {
    $lookup: {
      from: "comments",
      localField: "_id",
      foreignField: "postId",
      as: "comments",
    },
  },
]).toArray();
```

Many-to-many отношения (посты и теги, пользователи и роли) по определению через ссылки: массивы id с обеих сторон или отдельная join-коллекция. Цена ссылок — каждое чтение родителя требует второго fetch: `$lookup` или второй запрос. Держите референсируемые данные маленькими, а join дешёвыми.

Гибрид, который разрешает большую часть напряжения: ссылка на ребёнка как на source of truth плюс денормализованная сводка на родителе. Пост ссылается на комментарии, но хранит `commentCount`, который синхронизируется атомарным `$inc`. Горячее чтение остаётся одним документом; детальное чтение ходит в коллекцию.

## Выбор: таблица решений

| Ситуация | Паттерн | Почему |
| ----------- | --------- | ----- |
| 1:1, всегда читаются вместе | встраивание | без join ни в одном чтении |
| 1:N, малое ограниченное N | встраивание | одно чтение возвращает единицу |
| 1:N, неограниченный рост | ссылка | потолок 16 МБ, дешёвые обновления |
| N:M | ссылка | массивы id или join-коллекция |
| ребёнок читается по своему ключу | ссылка | прямой запрос к дочерней коллекции |
| горячее чтение требует дочерних данных | встроить снимок / денормализовать сводку | держать hot path одним документом |

Дублирование в MongoDB законно и часто правильно — дисциплина в том, чтобы держать копии согласованными. Если сводное поле зеркалит дочерние данные, обновляйте его той же записью (transakция на replica set или атомарные `$inc`/`$push`) и решите, какая копия авторитетна, если они расходятся. Моделируйте от read-запросов: если девяносто процентов чтений хотят весь родитель разом, встраивание быстрее по построению; если чтения хотят детей по их собственным ключам — ссылки.

> **WARNING**
> Лимит 16 МБ — на документ, и «массив вырос слишком» — это production-инцидент, а не теория. Если встроенный массив дописывается вечно — поток комментариев, чат, — разделите его в отдельную коллекцию до того, как увидите "Document is too large".

> **TIP**
> Сначала напишите read-запросы. Для каждого отметьте, нужно ли ему один документ или несколько; если горячее чтение требует несколько, либо встройте недостающее (снимок), либо денормализуйте сводку. Схема следует за чтениями.
