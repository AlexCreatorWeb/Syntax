# Урок 18. Финальный проект: API «Блог» (Mongoose + Express)

## Цель

После урока студент сможет: собрать **целиком** REST API «Блог» на Express + Mongoose: модели (User/Post/Comment) со схемой и валидацией, CRUD-маршруты, «сборку» связанных данных (пост + автор + комментарии), **агрегацию-аналитику** (статистика блога) и error-handling (ValidationError → 400) — применяя **все** паттерны курса.

## Теория

### Собираем всё вместе

Финал — **композиция**: документы/BSON (02), CRUD (04–07), операторы (08–09), **Embed vs Reference** (10–11), индексы (12–13), **агрегация** (14–15), **Mongoose** (16–17). Stack: Express + Mongoose.

### Схема (применяя правила)

- **User**: `{ email (unique), name, postsCount }` + timestamps.
- **Post**: `{ title (required), body, authorId (ref User), tags: [String] (embed), likesCount, commentsCount, published (default true) }` + timestamps. Индексы: `authorId`, `tags`.
- **Comment**: `{ postId (ref), authorId (ref), text (required) }` + timestamps. Индекс: `postId`.

Правила: автор — **reference** (меняется, 1-ко-бесконечному); теги — **embed** (мало, вместе); комментарии — **отдельная** коллекция (растут); счётчики — денормализация (`$inc`).

### Контракт API

```
POST   /api/users           { email, name }        → 201 { id, email, name }
GET    /api/users/:id       → 200 (с postsCount)
POST   /api/posts           { title, body, authorId, tags } → 201
GET    /api/posts           (?tag=, ?author=)      → 200 (список, проекция)
GET    /api/posts/:id       → 200 (post + автор + комментарии — «сборка»)
POST   /api/posts/:id/comments { authorId, text }  → 201
DELETE /api/posts/:id       → 204 (только автор или 404)
GET    /api/stats           → 200 { users, posts, comments, topTags, byMonth }
```

### «Сборка» и аналитика

- Пост «полный»: `Post.findById` → `User.findById(authorId)` → `Comment.find({ postId })` (3 запроса — осознанно, reference).
- **`/api/stats`** — агрегация: `Post.aggregate` (топ-теги через `$unwind`+`$group`; посты по месяцам через `$month`; `User.countDocuments`, `Comment.countDocuments`).

### Ошибки

`ValidationError` (Mongoose) → **400** (с деталями по полям); «не нашёлся» → **404**; дубликат `email` (unique) → **409**. Error-middleware в конце (урок 19 Node-курса).

TIP: счётчики (`postsCount`, `commentsCount`) обновляйте `$inc` **в том же** запросе создания (создали пост → `$inc` у автора и у поста).

NOTE: в песочнице: Mongoose-mock (схемы/валидация/timestamps/virtuals), Express-mock, `__request` для E2E. В терминале: `npm i express mongoose`, `MONGO_URL` в `.env`, настоящий mongod.

## Пример

`models.js` (скелет — **решите** TODO; фрагменты-«опоры» в комментариях):

```js
import express from "express";
import mongoose from "mongoose";

await mongoose.connect(process.env.MONGO_URL || "mongodb://localhost:27017");

// ===== СХЕМЫ (применяя Embed vs Reference + валидацию) =====
// TODO: userSchema (email unique, name required, postsCount default 0, timestamps)
// TODO: postSchema (title required, body, authorId ref User, tags [String],
//   likesCount/commentsCount default 0, published default true, timestamps;
//   index authorId, index tags)
// TODO: commentSchema (postId ref, authorId ref, text required, timestamps; index postId)
// TODO: const User = mongoose.model("User", …); Post; Comment;

// ===== app =====
const app = express();
app.use(express.json());

// TODO: POST /api/users (создать; дубликат email → 409)
// TODO: GET /api/users/:id (404 если нет)
// TODO: POST /api/posts (создать + $inc postsCount автора; 404 если нет автора)
// TODO: GET /api/posts (?tag=, ?author=; проекция без body для списка)
// TODO: GET /api/posts/:id — «сборка»: post + author (User.findById) + comments (Comment.find)
// TODO: POST /api/posts/:id/comments (создать + $inc commentsCount поста; 404 если нет поста)
// TODO: DELETE /api/posts/:id (404; $inc postsCount автора -1)
// TODO: GET /api/stats — агрегация: { users, posts, comments,
//   topTags: Post.aggregate([{$unwind:"$tags"},{$group:{_id:"$tags",n:{$sum:1}}},{$sort:{n:-1}},{$limit:5}]),
//   byMonth: Post.aggregate([{$group:{_id:{$month:"$createdAt"},n:{$sum:1}}},{$sort:{"_id":1}}]) }
// TODO: error-middleware: ValidationError → 400, «не нашёлся» → 404, unique (code 11000) → 409

app.listen(3000, () => console.log("API «Блог» (Mongoose) на :3000"));
```

## Частые ошибки

WARN: «связанные» данные **встраиваете** (комментарии в пост) — 16 МБ. Reference (отдельная коллекция) + «сборка» при чтении.

WARN: `ValidationError` «уходит» в 500 (не обработали). В error-middleware: `err.name === "ValidationError"` → **400**.

WARN: забыли обновить **счётчики** (postsCount/commentsCount) при создании/удалении — «профиль» врёт. `$inc` в том же сценарии.

WARN: список постов **с body** (тяжёлое) — проекция (без `body` в списке; body — в «одном»).

## Практическое задание

1. Реализуйте **все** схемы (User/Post/Comment) с валидацией, дефолтами, timestamps, индексами.
2. Маршруты: users (create/get), posts (create/list/get-с-сборкой/delete), comments (create).
3. Счётчики: `postsCount` (автор), `commentsCount` (пост) — `$inc`.
4. `GET /api/stats` — агрегация (topTags, byMonth, счётчики).
5. Error-middleware: ValidationError → 400, 404, unique → 409.
6. **E2E** (через `__request`): создать юзера → 2 поста (с тегами) → 2 комментария → `GET /api/posts/:id` (сборка: автор+комментарии) → `GET /api/stats` (topTags содержит ваши теги) → `DELETE` поста → счётчик автора уменьшился. Выведите статусы.
