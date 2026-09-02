# Урок 23. ORM/ODM: Prisma и Mongoose (паттерны)

## Цель

После урока студент сможет: объяснять, что ORM/ODM дают (типизация, миграции, «без SQL в бизнес-коде») и чего стоят (абстракция, «чёрный ящик» запросов), читать типовой код **Prisma** (schema, `prisma.user.findMany`, транзакции) и **Mongoose** (схема, модель, валидация), и выбирать «прямой драйвер vs ORM» по размеру проекта.

## Теория

### Зачем ORM/ODM

Прямые драйверы (`pg`, `mongodb`) — «сырые» запросы. При росте проекта: SQL размазан по файлам, нет типов, миграции «вручную». **ORM/ODM** берут на себя: схему (в коде), миграции, CRUD-методы, (частично) типизацию.

- **Prisma** (для SQL: Postgres/MySQL) — **schema.prisma** (модель данных) → CLI генерирует **client** (типизированные методы). Запросы — «объектные»: `prisma.user.findMany({ where: … })`.
- **Mongoose** (для Mongo) — **схема** (типизация + валидация + дефолты) → **модель** с методами (`Model.find`, `Model.create`, `doc.save()`).

### Prisma: паттерн

```prisma
// schema.prisma
model User {
  id       Int      @id @default(autoincrement())
  email    String   @unique
  name     String
  posts    Post[]
}
model Post {
  id        Int      @id @default(autoincrement())
  title     String
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  Int
}
```

```js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const users = await prisma.user.findMany({ where: { email: { contains: "a" } } });
const post = await prisma.post.create({ data: { title: "Hi", authorId: 1 }, include: { author: true } });
await prisma.$transaction([
  prisma.user.update({ where: { id: 1 }, data: { name: "A" } }),
  prisma.post.update({ where: { id: 5 }, data: { published: true } }),
]);
```

`include`/`select` — «связанные» данные одним запросом (вместо N+1).

### Mongoose: паттерн

```js
import mongoose from "mongoose";
await mongoose.connect(process.env.MONGO_URL);

const userSchema = new mongoose.Schema(
  { email: { type: String, required: true, unique: true }, name: String },
  { timestamps: true });
const User = mongoose.model("User", userSchema);

const users = await User.find({ email: /a/ }).limit(20);
const user = await User.create({ email: "a@b.c", name: "A" });
user.name = "A2";
await user.save(); // или User.updateOne({ _id: user._id }, { $set: { name: "A2" } })
```

Схема = **валидация на клиенте** (до БД): `required`, `type`, `minlength`, кастомные `validate`.

### Когда что

- **Прямой драйвер** — маленький API, полный контроль над запросами, «понимаю SQL».
- **ORM/ODM** — средний/большой проект: типы, миграции, команда, скорость разработки. Цена: абстракция (иногда «странное» SQL), лишний слой.

TIP: с ORM **не** исчезает необходимость понимать SQL/запросы под капотом (профилирование, индексы, N+1). ORM — «удобная обёртка», а не «магия вместо базы».

NOTE: в песочнице Prisma/Mongoose **не имитируются** (слишком разные «внутренности»); урок — **паттерны** (читать/писать типовой код). В терминале: `npm i @prisma/client` (+ `prisma` в devDeps) / `npm i mongoose`.

## Пример

`server.js` (песочница: «имитация Prisma-стиля» на in-memory + реальный Mongoose-код в комментариях):

```js
import express from "express";

// ===== «Prisma-стиль» (имитация: объект с типизированными методами) =====
const usersDB = [{ id: 1, email: "a@b.c", name: "Аня", posts: [] }];
let nextUserId = 2, nextPostId = 1;
const prisma = {
  user: {
    async findMany({ where } = {}) {
      let rows = usersDB;
      if (where?.email?.contains) rows = rows.filter((u) => u.email.includes(where.email.contains));
      return rows;
    },
    async create({ data }) {
      const u = { id: nextUserId++, email: data.email, name: data.name, posts: [] };
      usersDB.push(u);
      return u;
    },
  },
  post: {
    async create({ data, include }) {
      const p = { id: nextPostId++, title: data.title, published: false, authorId: data.authorId };
      const author = usersDB.find((u) => u.id === data.authorId);
      author.posts.push(p);
      return include?.author ? { ...p, author } : p;
    },
    async findMany({ where }) {
      let rows = usersDB.flatMap((u) => u.posts.map((p) => ({ ...p, authorId: u.id })));
      if (where?.published !== undefined) rows = rows.filter((p) => p.published === where.published);
      return rows;
    },
  },
};
// В терминале это: import { PrismaClient } from "@prisma/client"; const prisma = new PrismaClient();
// (с schema.prisma из теории; методы те же: findMany/create/…)

const app = express();
app.use(express.json());
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

app.get("/api/users", ah(async (req, res) => {
  const rows = await prisma.user.findMany({ where: { email: { contains: req.query.q || "" } } });
  res.json(rows);
}));

app.post("/api/posts", ah(async (req, res) => {
  const { title, authorId } = req.body;
  if (!title) return res.status(400).json({ error: "title обязателен" });
  const post = await prisma.post.create({ data: { title, authorId: Number(authorId) }, include: { author: true } });
  res.status(201).json(post);
}));

app.get("/api/posts", ah(async (req, res) => {
  const filter = req.query.published === "true" ? { published: true } : req.query.published === "false" ? { published: false } : {};
  res.json(await prisma.post.findMany({ where: filter }));
}));

app.use((req, res) => res.status(404).json({ error: "not found" }));
app.use((err, req, res, next) => res.status(500).json({ error: err.message }));
app.listen(3000, () => console.log("ORM-паттерны (Prisma-стиль) на :3000"));
```

Проверка: `POST /api/posts {title:"Статья", authorId:1}` → 201 (с `author`); `GET /api/posts?published=false` → 200; `GET /api/users?q=a` → фильтрует.

## Частые ошибки

WARN: N+1: `for (const u of users) { u.posts = await prisma.post.findMany({where:{authorId: u.id}}) }` — N+1 запрос. `include: { posts: true }` **в** запросе пользователей (один запрос со связями).

WARN: Mongoose: `Model.updateOne({…}, { name: "X" })` **без** `$set` — замена документа. Мутации — операторы.

WARN: Prisma: `new PrismaClient()` в каждом модуле (много соединений). Один экземпляр (singleton) на приложение.

WARN: «ORM решит всё» — индексы, транзакции, профилирование — по-прежнему на вас. ORM не отменяет понимания базы.

## Практическое задание

1. Расширьте «Prisma-имитацию»: `prisma.user.update({ where, data })`, `prisma.post.update({ where, data })`, `prisma.post.delete({ where })`.
2. Добавьте `GET /api/users/:id/posts` (через `include`-подобное: `findMany({ where: { authorId } })`).
3. Напишите Mongoose-схему `Article` (title — required, tags — [String], views — Number с дефолтом 0, timestamps) и код `create`/`find`/`updateOne` (в комментарии — «как в терминале»).
4. Реализуйте «транзакцию» (имитация: `withTransaction([ops])` — применить все или откатить при ошибке одного).
5. В комментарии: 3 случая, когда выберете **прямой** `pg` вместо Prisma (и 3 — наоборот).
