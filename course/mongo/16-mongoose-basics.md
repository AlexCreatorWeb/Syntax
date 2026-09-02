# Урок 16. Mongoose: connect, Schema, Model, CRUD

## Цель

После урока студент сможет: подключить Mongoose к MongoDB (`mongoose.connect`), описать **Schema** (поля, типы) и создать **Model**, делать CRUD через Model (`create`, `find`, `findOne`, `findById`, `save`, `updateOne`), понимать, чем Mongoose удобнее «сырого» драйвера (схема, валидация, удобные методы) и использовать `async/await` с запросами.

## Теория

### Что даёт Mongoose

«Сырой» драйвер — «как в шелле» (гибко, но без схемы). **Mongoose** — ODM (Object-Document Mapping) поверх драйвера: **схема в коде** (типы, дефолты, валидация), **модели** (удобные методы), **документы-объекты** (`.save()`). Для большинства приложений — «стандарт».

### Схема и модель

```js
import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, default: "" },
  tags: { type: [String], default: [] },   // массив строк
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // ссылка
  views: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const Post = mongoose.model("Post", postSchema);
```

**Model** = «обёртка» над коллекцией (имя модели → коллекция во множественном: `Post` → `posts`). Схема задаёт **типы** (приведение: `"5"` → `5` для Number) и правила.

### CRUD через Model

```js
await mongoose.connect(process.env.MONGO_URL);

const p = await Post.create({ title: "Первый" });      // insert (с валидацией)
const list = await Post.find({ tags: "mongo" });       // find → массив документов
const one = await Post.findById(p._id);                // по id
one.views = 1;
await one.save();                                      // сохранить изменения
await Post.updateOne({ _id: p._id }, { $set: { views: 5 } }); // как в драйвере
await Post.countDocuments({});
await Post.deleteOne({ _id: p._id });
```

**Документ Mongoose** — «живой» объект: меняете поля → `await doc.save()` (в отличие от «сырого» драйвера, где мутиация не сохраняет).

TIP: один `mongoose.connect` на приложение (при старте). Модели — **один раз** (`mongoose.model` повторно с тем же именем — ошибка; экспортите модели из модуля).

NOTE: в песочнице `mongoose` — mock с ядром курса: `connect`, `Schema` (type/required/default/массивы), `Model`: `create/find/findOne/findById/save (с валидацией → ValidationError)/updateOne/countDocuments/deleteOne/distinct/aggregate`. `doc._id` — ObjectId.

## Пример

`models.js`:

```js
import mongoose from "mongoose";

await mongoose.connect(process.env.MONGO_URL || "mongodb://localhost:27017");
console.log("Подключено:", mongoose.connection.readyState); // 1

// Схема
const noteSchema = new mongoose.Schema({
  text: { type: String, required: true },
  done: { type: Boolean, default: false },
  priority: { type: String, default: "medium" },
  tags: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
});
const Note = mongoose.model("Note", noteSchema);

// Create
const n1 = await Note.create({ text: "Первая заметка", tags: ["work"] });
console.log("Создали:", n1._id, "| priority:", n1.priority, "| done:", n1.done); // дефолты

// Read
const all = await Note.find({});
console.log("Всего:", all.length);
const byId = await Note.findById(n1._id);
console.log("По id:", byId.text);
const notDone = await Note.find({ done: false });
console.log("Не сделанные:", notDone.length);

// Update (2 способа)
byId.done = true;
await byId.save(); // «живой» документ → save
console.log("После save:", (await Note.findById(n1._id)).done);
await Note.updateOne({ _id: n1._id }, { $set: { priority: "high" } });
console.log("После updateOne:", (await Note.findById(n1._id)).priority);

// Count / Delete
console.log("Счётчик:", await Note.countDocuments({ priority: "high" }));
await Note.deleteOne({ _id: n1._id });
console.log("После delete:", await Note.countDocuments({}));
```

## Частые ошибки

WARN: **повторно** `mongoose.model("Note", …)` (в двух файлах) — ошибка «already initialized». Модель — **один раз** (модуль-«реестр» моделей, экспорт).

WARN: мутируете документ **без** `save()` — «в памяти» изменили, в БД **не** сохранили. `await doc.save()`.

WARN: `find` возвращает **документы Mongoose** (не plain-объекты). В JSON-ответ — `.toJSON()` / `JSON.stringify` (работает), но «сырые» операции драйвера на них — осторожно.

WARN: `connect` «на каждый запрос» (или без ожидания). Один `connect` при старте (и `await`).

## Практическое задание

1. Схема `Task`: `title` (required), `done` (default false), `due` (Date), `tags` ([String]), `createdAt`.
2. `create` 3 задачи (одна с `due`), выведите дефолты.
3. `find({ done: false })`; `findById`; `find({ tags: "urgent" })`.
4. Измените `done` через `save()`; `priority` через `updateOne` — убедитесь, что оба сохранились.
5. `countDocuments`, `deleteOne`, финальный `countDocuments`.
6. В комментарии: 3 преимущества Mongoose над «сырым» драйвером (с примером из вашего кода).
