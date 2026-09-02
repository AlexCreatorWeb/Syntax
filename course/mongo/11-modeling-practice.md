# Урок 11. Практика моделирования: блог и магазин

## Цель

После урока студент сможет: спроектировать **реальные** схемы (блог: users/posts/comments/tags; магазин: users/products/orders) применяя правила Embed vs Reference, добавлять **вычисленные/денормализованные** поля (счётчики) и объяснять каждое решение (почему здесь embed, там reference, зачем счётчик).

## Теория

### Метод: «от чтения»

Схема — это **оптимизация под ваши чтения**. Алгоритм проектирования:

1. **Что читаем вместе?** (один экран = один/несколько документов). «Вместе» → embed.
2. **Что растёт без bounds?** (комментарии, заказы, события) → reference + отдельная коллекция.
3. **Что меняется независимо?** (профиль юзера, цена товара) → reference (не дублировать «живое»).
4. **Где нужен «быстрый список»?** → денормализованные счётчики/поля (чтобы не считать на лету).

### Блог (схема)

- **users**: `{ email, name, avatar, postsCount }` — `postsCount` (счётчик, обновляем при создании поста — «быстрый профиль»).
- **posts**: `{ title, body, authorId (ref), tags: [..] (embed, ограничено), likesCount, commentsCount, publishedAt }` — теги **встроены** (мало, читаются вместе); автор — **ссылка** (меняется независимо, 1-ко-бесконечному постам); счётчики — денормализация.
- **comments**: `{ postId (ref), authorId (ref), text, createdAt }` — **отдельная** коллекция (растёт).
- **tags** (опционально): если нужны «страницы тегов» с постами — отдельная коллекция (N-ко-N) или просто `find({ "tags": tag })` по posts.

### Магазин (схема)

- **products**: `{ name, price, category, specs: {..} (embed), variants: [{size, stock}] (embed, ограничено), images: [..] }` — характеристики/варианты **встроены** (чуть больше, но «вместе»).
- **orders**: `{ userId (ref), items: [{ productId (ref), name (denorm), price (denorm), qty }] (embed с дениормализацией!), total, status, createdAt }` — позиции **встроены** (ограничено, «история»), но с **копией** name/price (чтобы «прошлый заказ» не менялся при смене цены товара).
- **users**: `{ email, name, ordersCount }`.

**Ключевой приём — денормализация «истории»**: в заказ копируем `name`/`price` на момент покупки (embed). «Текущий» товар — в products (reference по `productId`).

TIP: «счётчики» (`postsCount`, `likesCount`) — **обновляйте** через `$inc` (атомарно) при событии. Точность «примерно» ок; для «точных» — считать из коллекции (дорого) или отдельная сервисная задача.

NOTE: в песочнице схема = данные (как и в настоящем mongo). Счётчики — ваши `$inc`.

## Пример

`models.js` (схема + данные + «сборка»):

```js
import { MongoClient, ObjectId } from "mongodb";

const client = new MongoClient(process.env.MONGO_URL || "mongodb://localhost:27017");
await client.connect();
const db = client.db("blog");

// ===== Схема (документы-«примеры») =====
const users = db.collection("users");
const posts = db.collection("posts");
const comments = db.collection("comments");

const [u1, u2] = (await users.insertMany([
  { email: "a@b.c", name: "Аня", postsCount: 0 },
  { email: "b@b.c", name: "Боря", postsCount: 0 },
])).insertedIds;

// Пост: автор-ref, теги-embed, счётчики
const p1 = (await posts.insertOne({
  title: "Введение в NoSQL",
  body: "…",
  authorId: u1,
  tags: ["nosql", "mongo"],
  likesCount: 0,
  commentsCount: 0,
  publishedAt: new Date(),
})).insertedId;

// Комментарии: отдельная коллекция (reference)
await comments.insertMany([
  { postId: p1, authorId: u2, text: "Ясно!", createdAt: new Date() },
  { postId: p1, authorId: u1, text: "Спасибо", createdAt: new Date() },
]);

// ===== Денормализованные счётчики ($inc) =====
await posts.updateOne({ _id: p1 }, { $inc: { commentsCount: 2 } });
await users.updateOne({ _id: u1 }, { $inc: { postsCount: 1 } });

// ===== «Сборка» поста (автор + комментарии) =====
const post = await posts.findOne({ _id: p1 });
const author = await users.findOne({ _id: post.authorId });
const postComments = await comments.find({ postId: p1 }).toArray();
console.log("Пост:", post.title, "| автор:", author.name, "| комментов:", post.commentsCount, "(факт:", postComments.length + ")");

// ===== Магазин: embed позиций с дениормализацией =====
const shop = client.db("shop");
const products = shop.collection("products");
const orders = shop.collection("orders");
const prod = (await products.insertOne({ name: "Кофе", price: 300, specs: { origin: "Бразилия" } })).insertedId;
await orders.insertOne({
  userId: u1,
  items: [{ productId: prod, name: "Кофе", price: 300, qty: 2 }], // КОПИЯ name/price
  total: 600,
  status: "paid",
});
// Изменили цену товара — «прошлый» заказ НЕ меняется:
await products.updateOne({ _id: prod }, { $set: { price: 350 } });
console.log("Текущая цена:", (await products.findOne({ _id: prod })).price, "| в заказе (история):", (await orders.findOne({})).items[0].price);
```

## Частые ошибки

WARN: «живые» данные **встраиваете** (профиль автора в каждом комментарии) — изменили аватар → «старые» комментарии с «прошлым». Живое — reference (+ «горячее» дублировать осознанно).

WARN: «история» **без дениормализации** (в заказе только `productId`) — сменили цену/название товара → «исторические» заказы «исказились». Для истории — копия на момент события.

WARN: «счётчики» считаете `countDocuments` **на каждый** рендер (дорого). Денормализуйте (`$inc` при событии).

WARN: «одна большая» коллекция «всё» (users+posts+orders в документе) — 16 МБ и безумие. Коллекции — по **сущностям**.

## Практическое задание

1. Спроектируйте и создайте: `users` (с `postsCount`), `posts` (authorId-ref, tags-embed, likesCount/commentsCount), `comments` (postId/authorId-ref).
2. 2 юзера, 3 поста (разные теги), 6 комментариев. Обновите счётчики (`$inc`) у постов и юзеров.
3. «Соберите» пост (автор + комментарии) — выведите; убедитесь, что `commentsCount` совпадает с фактом.
4. «Поиск по тегу»: `find({ tags: "nosql" })` — все посты с тегом.
5. Магазин: `products` (specs-embed) + `orders` (items-embed с копией name/price). Смените цену — убедитесь, что «история» не изменилась.
6. В комментарии: 3 решения вашей схемы + «почему» (embed/ref/счётчик).
