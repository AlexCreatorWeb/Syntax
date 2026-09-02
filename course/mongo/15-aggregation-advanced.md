# Урок 15. Сложные агрегации: $unwind, $lookup, $addFields — аналитика

## Цель

После урока студент сможет: «разворачивать» массивы (`$unwind`), делать «JOIN» между коллекциями (`$lookup`), добавлять вычисленные поля (`$addFields`), строить **реальные аналитические** отчёты (топ-авторы, активность по дням, «заказы с товарами») и понимать порядок этапов конвейера.

## Теория

### $unwind: массив → строки

`$unwind: "$items"` — документ с массивом (3 элемента) превращается в **3** документа (по одному элементу). Зачем: «сгруппировать **по элементам** массива» (без unwind `$group` по `$items` — по «всему» массиву):

```js
// «Какие товары покупали» (items — массив в заказе)
[ { $unwind: "$items" }, { $group: { _id: "$items.name", times: { $sum: 1 } } }, { $sort: { times: -1 } } ]
```

### $lookup: «JOIN» MongoDB

`$lookup: { from: "коллекция", localField, foreignField, as: "имя" }` — для каждого документа «подmixивает» массив совпадений из другой коллекции (left-outer: нет совпадений → пустой массив). Это и есть «JOIN»:

```js
// Заказы + товары
[ { $lookup: { from: "products", localField: "items.productId", foreignField: "_id", as: "itemsFull" } } ]
```

`localField` может быть **массивом** (подmешает по всем элементам). Для «сложных» условий — `pipeline` (вложенный конвейер).

### $addFields / $set: вычисленные поля

Добавляют поля **без потери** остальных (в отличие от `$project`, который «перебирает»):

```js
{ $addFields: { revenue: { $multiply: ["$qty", "$price"] }, month: { $month: "$ts" } } }
```

### Реальные отчёты (паттерны)

- **Топ-N**: `match → group → sort → limit`.
- **«По дням»**: `group _id:{ $dateToString: { format: "%Y-%m-%d", date: "$ts" } }` (или `$month`).
- **«Связанные данные»**: `lookup` (+ `unwind` если «один»), `addFields` (суммы по подmешанному).
- **«Фильтр после lookup»**: `match` **по подmешанному** (`{ "itemsFull.price": { $gt: X } }`) — только **после** lookup.

TIP: порядок конвейера — «фильтр → преобразование → группировка → сортировка → лимит». `$match` как можно **раньше**.

NOTE: в песочнице `$unwind/$lookup/$addFields` — работают (in-memory); `$dateToString` — опционально (используйте `$year/$month`).

## Пример

`models.js`:

```js
import { MongoClient, ObjectId } from "mongodb";

const client = new MongoClient(process.env.MONGO_URL || "mongodb://localhost:27017");
await client.connect();
const db = client.db("analytics");
const orders = db.collection("orders");
const products = db.collection("products");
const users = db.collection("users");

await orders.deleteMany({}); await products.deleteMany({}); await users.deleteMany({});
const [p1, p2, p3] = (await products.insertMany([
  { name: "Кофе", price: 300 }, { name: "Чай", price: 200 }, { name: "Печенье", price: 150 },
])).insertedIds;
const [u1, u2] = (await users.insertMany([{ name: "Аня" }, { name: "Боря" }])).insertedIds;
await orders.insertMany([
  { userId: u1, items: [{ productId: p1, qty: 2 }, { productId: p2, qty: 1 }], ts: new Date("2026-09-01") },
  { userId: u2, items: [{ productId: p1, qty: 1 }], ts: new Date("2026-09-02") },
  { userId: u1, items: [{ productId: p3, qty: 3 }], ts: new Date("2026-09-02") },
]);

// 1) $unwind: «популярность» товаров (items — массив)
const popular = await orders.aggregate([
  { $unwind: "$items" },
  { $lookup: { from: "products", localField: "items.productId", foreignField: "_id", as: "p" } },
  { $group: { _id: "$p.name", times: { $sum: 1 }, units: { $sum: "$items.qty" } } },
  { $sort: { units: -1 } },
]).toArray();
console.log("Топ товаров:", popular.map((r) => r._id + "×" + r.units).join(", "));

// 2) $lookup: заказы с именами пользователей
const withUsers = await orders.aggregate([
  { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
  { $addFields: { userName: { $arrayElemAt: ["$user.name", 0] } } },
]).toArray();
console.log("Заказы с авторами:", withUsers.map((o) => o.userName).join(", "));

// 3) Аналитика: «выручка по пользователям» (сумма qty*price через lookup)
const byUser = await orders.aggregate([
  { $unwind: "$items" },
  { $lookup: { from: "products", localField: "items.productId", foreignField: "_id", as: "p" } },
  { $addFields: { lineRevenue: { $multiply: [{ $arrayElemAt: ["$p.price", 0] }, "$items.qty"] } } },
  { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "u" } },
  { $group: { _id: { $arrayElemAt: ["$u.name", 0] }, revenue: { $sum: "$lineRevenue" } } },
  { $sort: { revenue: -1 } },
]).toArray();
console.log("Выручка по юзерам:", byUser.map((r) => r._id + ":" + r.revenue).join(", "));

// 4) «Активность по дням»
const byDay = await orders.aggregate([
  { $group: { _id: { m: { $month: "$ts" }, d: { $dayOfMonth: "$ts" } }, orders: { $sum: 1 } } },
  { $sort: { "_id.m": 1, "_id.d": 1 } },
]).toArray();
console.log("По дням:", byDay.map((r) => r._id.m + "-" + r._id.d + ":" + r.orders).join(", "));
```

## Частые ошибки

WARN: `$group` по **массивному** полю без `$unwind` — «группировка» по «всему» массиву (не по элементам). Сначала `$unwind`.

WARN: `$match` по **подmешанному** (`"itemsFull.price"`) **до** `$lookup` — поля ещё нет (пусто). Match по lookup-данным — **после**.

WARN: `$lookup` «один-ко-многим», но ожидаете **объект** — это **массив** (`as`). Один — `$unwind` (после) или `$arrayElemAt: [ "$arr", 0 ]`.

WARN: «гигантский» конвейер из 10 этапов «наугад». Разбивайте на **мыслимые** этапы (каждый — «одна цель»).

## Практическое задание

1. `books` (`{ title, author, year }`, 10 книг, 4 автора) + `reviews` (`{ bookId, rating }`, ~30).
2. «Средний рейтинг по книгам» (`lookup` reviews → `group` по книге → `$avg` → `sort` desc → `limit 3`).
3. «Топ авторов по сумме рейтингов их книг» (lookup книг → lookup reviews → group по автору).
4. «Книги с рейтингом > 4» (`lookup` + `match` **после** по подmешанному).
5. «Число книг по годам» (`group _id:"$year"`).
6. Соберите «отчёт за месяц»: заказы (из урока) — количество, выручка, топ-3 товара (unwind+lookup+group).
