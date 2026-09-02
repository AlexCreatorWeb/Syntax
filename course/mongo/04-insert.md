# Урок 4. insertOne / insertMany: запись данных

## Цель

После урока студент сможет: добавлять документы через `insertOne` (один) и `insertMany` (массив), читать результат (`insertedId`, `insertedCount`, `insertedIds`), задавать `_id` явно, понимать атомарность `insertMany` (все или ничего по умолчанию) и массово загружать данные (генерация + batch).

## Теория

### insertOne

Вставляет **один** документ, возвращает `{ acknowledged, insertedId }`. `_id` — если не задан, создаётся (ObjectId). Запись **атомарна** на уровне одного документа.

```js
const r = await coll.insertOne({ title: "Первый", done: false });
r.insertedId; // ObjectId — сохраняем для связи/ответа клиенту (201 + id)
```

### insertMany

Массив документов. Возвращает `{ acknowledged, insertedCount, insertedIds }` (объект «index → id»). **По умолчанию атомарно**: если один «упал» (например, дубликат unique-индекса) — откатываются **все**. Для больших партий с допустимыми частичными сбоями: `{ ordered: false }`.

```js
const r = await coll.insertMany([
  { title: "A" },
  { title: "B" },
]);
r.insertedCount;   // 2
r.insertedIds;     // { "0": ObjectId, "1": ObjectId }
```

### `_id` явно

Можно задать свой `_id` (любое значение, обычно **строка** — бизнес-код):

```js
await coll.insertOne({ _id: "SKU-1001", name: "Мышь" }); // _id = "SKU-1001"
```

Тогда документы этой коллекции идентифицируются **вашим** id (поиск `find({ _id: "SKU-1001" })`). Важно: **тип** `_id` в коллекции — единый (первый документ «задаёт тон»; ObjectId и строки можно смешать, но не стоит).

### Массовая загрузка

Генерация данных для разработки/тестов: цикл/Array.from + `insertMany` (батчами по 500–1000, чтобы не «забивать» память).

TIP: в API «создание» (POST) — `insertOne` + ответ `201` с `insertedId` (в строке). Bulk-импорт — `insertMany` батчами, с `try/catch` на `BulkWriteError` (дубликаты).

NOTE: в песочнице `insertOne`/`insertMany` — тот же API (in-memory). `insertedIds` — объект по индексам.

## Пример

`models.js`:

```js
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URL || "mongodb://localhost:27017");
await client.connect();
const tasks = client.db("course").collection("tasks");

// 1) insertOne
const one = await tasks.insertOne({ title: "Написать отчёт", done: false, priority: "high" });
console.log("insertedId:", one.insertedId);

// 2) insertMany
const batch = await tasks.insertMany([
  { title: "Код-ревью", done: false, priority: "medium" },
  { title: "Деплой", done: true, priority: "high" },
  { title: "Онбординг", done: false, priority: "low" },
]);
console.log("insertedCount:", batch.insertedCount);
console.log("insertedIds:", Object.keys(batch.insertedIds).length, "штук");

// 3) Свой _id (бизнес-код)
await tasks.insertOne({ _id: "TASK-42", title: "Свой id", done: false });
const byCode = await tasks.findOne({ _id: "TASK-42" });
console.log("по своему id:", byCode.title);

// 4) Генерация + batch-загрузка
const generated = Array.from({ length: 20 }, (_, i) => ({
  title: "Генерация " + (i + 1),
  done: i % 4 === 0,
  created: new Date(),
}));
const big = await tasks.insertMany(generated);
console.log("загрузили:", big.insertedCount, "| всего:", await tasks.countDocuments({}));
```

## Частые ошибки

WARN: не сохраняете `insertedId` после `insertOne` — «создали, но не знаем какой». API: ответ `201 { id: String(insertedId) }`.

WARN: `insertMany` на 100 000 документов **одной** партией — память/таймаут. Батчи по 500–1000.

WARN: ждёте `insertedId` (одиночный) от `insertMany` — там `insertedCount` + `insertedIds` (объект). Не путайте.

WARN: смешиваете **типы** `_id` (ObjectId у одних, строки у других) — «одна» коллекция с двумя мирами. Тип id — решение на старте.

## Практическое задание

1. Коллекция `books`: `insertMany` из 5 объектов `{ title, pages, year }`. Выведите `insertedCount`.
2. `insertOne` с явным `_id: "ISBN-2026-001"`; найдите его `findOne({ _id: "ISBN-2026-001" })`.
3. Сгенерируйте 30 «отзывов» `{ text, rating (1..5), date }` и загрузите `insertMany`; выведите `countDocuments`.
4. Найдите «самую свежую» книгу (`sort({ _id: -1 }).limit(1)`) — объясните комментарием, почему `_id` можно использовать как «время» (ObjectId).
5. В комментарии: что вернёт `insertMany` при дубликате `_id` и как это обработать в API (ошибка 409).
