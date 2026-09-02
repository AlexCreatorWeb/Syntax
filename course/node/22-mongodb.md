# Урок 22. MongoDB: драйвер, CRUD, ObjectId

## Цель

После урока студент сможет: подключиться к MongoDB через `MongoClient`, выбрать БД и коллекцию, делать **CRUD** (`insertOne`, `find`, `findOne`, `updateOne`, `deleteOne`), работать с **ObjectId** (`_id`), использовать фильтры/сортировку/лимиты и понимать отличие document-модели от табличной (Почему Mongo, почему Postgres — выбор по задаче).

## Теория

### Document-модель: чем Mongo отличается

PostgreSQL — **таблицы** (строки с фиксированными столбцами, SQL). MongoDB — **коллекции документов** (JSON-подобные объекты, схема гибкая):

```js
{ _id: ObjectId("…"), title: "Настроить CI", done: false, tags: ["dev", "ops"], meta: { est: 2 } }
```

Документ — вложенный «объект в объекте». Нет JOIN'ов (данные **денормализуются**: встраиваете связанное). Выбор: **Postgres** — реляционные данные, транзакции, сложная аналитика; **Mongo** — гибкая схема, вложенные структуры, «быстрый прототип», масштабирование по документу.

### Подключение: MongoClient

```js
import { MongoClient, ObjectId } from "mongodb";
const client = new MongoClient(process.env.MONGO_URL);
await client.connect();
const db = client.db("app");
const notes = db.collection("notes");
```

`client.connect()` — **один раз** при старте (клиент держит пул). Закрытие: `await client.close()`.

### CRUD

```js
// insertOne → { insertedId }
const { insertedId } = await notes.insertOne({ title: "Заметка", done: false });

// find → CURSOR (перебираем как async-итератор; limit/sort — на курсоре)
const list = await notes.find({ done: false }).sort({ createdAt: -1 }).limit(20).toArray();

// findOne → документ или null
const one = await notes.findOne({ _id: new ObjectId(id) });

// updateOne → { matchedCount, modifiedCount }
await notes.updateOne({ _id: oid }, { $set: { done: true } });

// deleteOne → { deletedCount }
await notes.deleteOne({ _id: oid });
```

Фильтры — «объекты-условия»: `{ done: false }`, `{ "meta.est": { $gte: 2 } }` (вложенные поля через точку, операторы `$gt/$in/$regex/…`). Обновления — **операторы** (`$set`, `$inc`, `$push`), а не «заменить документ».

### ObjectId

`_id` по умолчанию — **ObjectId** (24 hex-символа). Из JSON-ответа приходит как объект; в сравнениях — `new ObjectId(str)`. В REST — строкой (`doc._id.toHexString()` или `String(doc._id)`).

TIP: для «списков» всегда `limit` (иначе «выгрузите» коллекцию). Для «счётчиков/агрегаций» — `collection.aggregate([…])` (учим в прод-курсе).

NOTE: в песочнице `mongodb` — in-memory mock с **тем же API** (`MongoClient`, `connect`, `db`, `collection`, `insertOne/find/findOne/updateOne/deleteOne`, `ObjectId`), данные живут до перезагрузки. В терминале — настоящая MongoDB (`MONGO_URL` в env).

## Пример

`server.js`:

```js
import express from "express";
import { MongoClient, ObjectId } from "mongodb";

const client = new MongoClient(process.env.MONGO_URL || "mongodb://localhost:27017");
await client.connect();
const notes = client.db("app").collection("notes");

const app = express();
app.use(express.json());
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

app.get("/api/notes", asyncHandler(async (req, res) => {
  const filter = req.query.done === "true" ? { done: true } : req.query.done === "false" ? { done: false } : {};
  const rows = await notes.find(filter).sort({ createdAt: -1 }).limit(50).toArray();
  res.json(rows.map((n) => ({ ...n, _id: String(n._id) })));
}));

app.post("/api/notes", asyncHandler(async (req, res) => {
  const { title } = req.body;
  if (!title || !String(title).trim()) return res.status(400).json({ error: "title обязателен" });
  const { insertedId } = await notes.insertOne({
    title: String(title).trim(),
    done: false,
    createdAt: new Date(),
  });
  res.status(201).json({ _id: String(insertedId), title: String(title).trim(), done: false });
}));

app.patch("/api/notes/:id", asyncHandler(async (req, res) => {
  let oid;
  try { oid = new ObjectId(req.params.id); } catch { return res.status(400).json({ error: "bad id" }); }
  const { modifiedCount } = await notes.updateOne({ _id: oid }, { $set: { done: Boolean(req.body.done) } });
  if (modifiedCount === 0) {
    const exists = await notes.findOne({ _id: oid });
    if (!exists) return res.status(404).json({ error: "not found" });
  }
  const updated = await notes.findOne({ _id: oid });
  res.json({ ...updated, _id: String(updated._id) });
}));

app.delete("/api/notes/:id", asyncHandler(async (req, res) => {
  const { deletedCount } = await notes.deleteOne({ _id: new ObjectId(req.params.id) });
  if (deletedCount === 0) return res.status(404).json({ error: "not found" });
  res.status(204).end();
}));

app.use((req, res) => res.status(404).json({ error: "not found" }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: err.message }); });

app.listen(3000, () => console.log("MongoDB API на :3000"));
```

Проверка: `POST /api/notes {title:"В Mongo"}` → 201 (с `_id`-строкой); `GET /api/notes` → 200; `GET /api/notes?done=false` → фильтрует; `PATCH /api/notes/<id> {done:true}` → 200; `DELETE` → 204.

## Частые ошибки

WARN: сравниваете `_id` со строкой: `find({ _id: "665f…" })` — **null** (это ObjectId, не строка). `new ObjectId(str)`.

WARN: `updateOne({ _id }, { done: true })` **без** `$set` — **заменит** весь документ одним полем. Модификации — через операторы (`$set`/`$inc`/`$push`).

WARN: `find()` без `limit`/`sort` на «большой» коллекции — выгрузка всего. Всегда `limit` (и `sort` для предсказуемости).

WARN: `client.connect()` на каждый запрос. Один `client` (пул) на приложение.

## Практическое задание

1. Сделайте API «статей» (коллекция `articles`): `GET /api/articles` (с `?tag=…`), `POST /api/articles` (`title`, `tags` — массив), `GET /api/articles/:id`.
2. Добавьте `PATCH /api/articles/:id` (`$set` для `title`; `$push` для `tags` если передать `addTag`).
3. Добавьте `GET /api/articles/:id/comments` — «вложенные» комментарии (`article.comments`, массив объектов).
4. Проверьте: создание статьи с 2 тегами → фильтр `?tag=dev` её находит; `$push` добавляет третий.
5. В комментарии: почему для «статья + комментарии» Mongo-подход (вложенный массив) уместен, а когда — нет (ограничение размера документа 16 МБ).
