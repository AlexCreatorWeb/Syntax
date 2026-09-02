# Урок 3. Базы данных и коллекции: структура, создание, списки

## Цель

После урока студент сможет: объяснять иерархию MongoDB (instance → database → collection → document), создавать базы и коллекции (явно и неявно), переключаться между базами (mongosh) / выбирать (driver), выводить списки баз и коллекций, понимать, что схема задаётся «на лету» и как это влияет на проектирование.

## Теория

### Иерархия

```
mongod (инстанс — процесс)
└── database (база: blog, shop, analytics)
    └── collection (коллекция: posts, users, comments)
        └── document ({ _id, … })
```

Аналогия с SQL: instance ≈ сервер, database ≈ schema, collection ≈ table, document ≈ row. Но ключевое отличие: **коллекция не имеет заранее заданной схемы** — документы могут отличаться полями, и БД не «возмутится».

### Создание: неявное и явное

- **Неявное** (по умолчанию): первая запись создаёт коллекцию и базу. `db.posts.insertOne(…)` — и база `blog` + коллекция `posts` появились.
- **Явное**: `db.createCollection("posts", { validator: … })` / driver `db.createCollection("posts")`. Зачем явно: задать **опции** (валидация схемы, capped-коллекция) до данных.

### Выбор базы и списки

- **mongosh**: `use shop` (переключить/создать), `show dbs`, `show collections`, `db.getCollectionNames()`, `db.stats()`.
- **Driver**: `client.db("shop")` (база), `db.collection("posts")`; списки — `client.listDatabases()`, `db.listCollections()`.

### «Схема на лету»: две стороны медали

Плюс: добавили новое поле — **нет миграции** (просто вставляйте документы с ним). Минус: **нет защиты от опечаток** (`prce` вместо `price` — БД примет!). Поэтому: (1) единый стандарт имён полей в команде, (2) **schema validation** (урок 11+), (3) в Node — **Mongoose** (схема в коде, уроки 16–17).

TIP: имена коллекций — **множественное число** (`posts`, `users`), базы — по домену (`shop`, `blog`). Короткие, строчные, без пробелов.

NOTE: в песочнице `client.db(name).collection(name)` — in-memory (разные имена = разные «хранилища»); `listCollections()` работает. `createCollection` — опционально (неявное создание тоже работает).

## Пример

`models.js`:

```js
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URL || "mongodb://localhost:27017");
await client.connect();

// 1) Две базы — два домена
const shop = client.db("shop");
const blog = client.db("blog");

// 2) Неявное создание: первая запись → коллекция существует
await shop.collection("orders").insertOne({ id: 1001, total: 1500, status: "new" });
await blog.collection("posts").insertOne({ title: "Первый пост" });

// 3) Списки
console.log("Коллекции shop:", (await shop.listCollections().toArray()).map((c) => c.name));
console.log("Коллекции blog:", (await blog.listCollections().toArray()).map((c) => c.name));
console.log("Всего баз:", (await client.listDatabases()).databases.length);

// 4) Явное создание с именем (до данных)
await shop.createCollection("promos");
console.log("После createCollection:", (await shop.listCollections().toArray()).map((c) => c.name));

// 5) «Схема на лету»: разные документы в одной коллекции
await shop.collection("products").insertOne({ name: "Мышь", price: 2000 });
await shop.collection("products").insertOne({ name: "Кресло", price: 15000, ergo: true }); // лишний поле — ок
console.log("products:", JSON.stringify(await shop.collection("products").find({}).toArray()));

// 6) Статистика
const st = await shop.stats();
console.log("shop: коллекций", st.collections, "| данных ~", Math.round(st.dataSize / 1024), "КБ");
```

## Частые ошибки

WARN: пишете базу/коллекцию **с заглавной** (`db.Posts`) — mongo case-sensitive: `Posts` и `posts` — **разные** коллекции. Данные «размазываются».

WARN: «забыли» `use <db>` в mongosh — работаете в `test` (дефолт) и ищете данные «не там». Всегда проверяйте `db` (какую базу вы смотрите).

WARN: надеетесь, что БД «проверит» схему — не проверяет (опечатка в поле = «тихо» принято). Защита: Mongoose-схема / validation (модуль 7).

WARN: в driver «переиспользуете» `db` от другого клиента после `client.close()` — ошибки «client closed». Один `client` на приложение (урок 16).

## Практическое задание

1. Создайте базу `course`: коллекции `students` и `courses` (неявно, записями).
2. В `courses` — 3 документа (title, lessons — число, level: "beginner"|"middle"); в `students` — 2 (name, course — **строка-название** курса).
3. Выведите: список коллекций `course`, количество документов в каждой (`countDocuments`), имена всех баз (`listDatabases`).
4. Выведите `db.stats()` базы (или `shop.stats()`-эквивалент) — сколько коллекций.
5. В комментариях: почему `Posts` и `posts` — разные коллекции, и 2 правила именования для вашей команды.
