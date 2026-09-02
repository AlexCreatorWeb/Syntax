# Урок 8. Операторы выборки: $eq/$ne/$gt/$in/$and/$or/$exists/$regex

## Цель

После урока студент сможет: строить сложные условия выборки: сравнения (`$gt/$gte/$lt/$lte`), «не равно» (`$ne`), «в списке» (`$in`/`$nin`), логика (`$and/$or`), существование поля (`$exists`), регулярные выражения (`$regex`), и понимать, что фильтр — «объект-условие», а не строка.

## Теория

### Фильтр = объект с операторами

Поле → условие. Условие — значение (точное) **или** объект с операторами:

```js
{ price: 100 }                 // price == 100 (точное)
{ price: { $gt: 100 } }        // price > 100
{ price: { $gte: 100, $lte: 500 } } // 100 <= price <= 500 (несколько операторов на поле)
{ status: { $in: ["new", "active"] } } // status ∈ {new, active}
```

### Справочник (основные)

- **Сравнение**: `$eq` (явное «равно»), `$ne`, `$gt`, `$gte`, `$lt`, `$lte`.
- **Список**: `$in` (в массиве значений), `$nin` (не в). `find({ cat: { $in: ["tech", "food"] } })`.
- **Логика**: `$or: [условие1, условие2, …]` (хотя бы одно), `$and: […]` (все — но чаще «несколько полей в одном объекте» = неявный AND: `find({ cat: "tech", price: { $lt: 5000 } })`), `$nor` (ни одно).
- **Поле**: `$exists: true|false` (поле есть/нет), `$regex: "pat"` (+ `$options: "i"` — регистр), `$type` (тип BSON).
- **Ссылка/массив** — в уроке 9 (`$elemMatch`, dot-нотация).

**Правило**: несколько полей в одном объекте — **AND**. OR — только через `$or`.

### $regex: мощно и «дорого»

`{ name: { $regex: "^ноут", $options: "i" } }` — подстрока/начало/шаблон. `^` — «с этого начинается» (можно индексом ускорить; без `^` («внутри») — почти всегда FULL SCAN). Для «поиска по тексту» — отдельное решение (текстовые индексы), не `$regex` на «всём».

TIP: «в списке» (`$in`) — не цикл из N запросов: `find({ id: { $in: [1,2,3] } })` — **один** запрос (против N round-trips).

NOTE: в песочнице поддерживаются: `$eq/$ne/$gt/$gte/$lt/$lte/$in/$nin/$or/$and/$exists/$regex` (+ dot-нотация). `find({ a: 1, b: 2 })` = AND.

## Пример

`models.js`:

```js
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URL || "mongodb://localhost:27017");
await client.connect();
const p = client.db("course").collection("products");
await p.deleteMany({});
await p.insertMany([
  { name: "Ноутбук Dell", price: 90000, cat: "tech", stock: 5 },
  { name: "Мышь Logitech", price: 2000, cat: "tech", stock: 20 },
  { name: "Кофе зёрна", price: 300, cat: "food", stock: 50 },
  { name: "Книга JS", price: 800, cat: "edu", stock: 12, new: true },
  { name: "Кресло", price: 15000, cat: "home" }, // нет stock
]);

// 1) Сравнения
console.log("> 5000:", (await p.find({ price: { $gt: 5000 } }).toArray()).map((x) => x.name).join(","));
console.log("300..10000:", (await p.find({ price: { $gte: 300, $lte: 10000 } }).toArray()).map((x) => x.name).join(","));

// 2) $ne
console.log("не food:", (await p.find({ cat: { $ne: "food" } }).toArray()).length);

// 3) $in / $nin
console.log("tech или food:", (await p.find({ cat: { $in: ["tech", "food"] } }).toArray()).map((x) => x.name).join(","));

// 4) $or (хотя бы одно)
const or = await p.find({ $or: [{ price: { $lt: 500 } }, { cat: "home" }] }).toArray();
console.log("$or (дешёвые или home):", or.map((x) => x.name).join(","));

// 5) Неявный AND (несколько полей)
const and = await p.find({ cat: "tech", price: { $lt: 5000 } }).toArray();
console.log("tech AND < 5000:", and.map((x) => x.name).join(","));

// 6) $exists
console.log("без stock:", (await p.find({ stock: { $exists: false } }).toArray()).map((x) => x.name).join(","));
console.log("с new=true:", (await p.find({ "new": { $exists: true } }).toArray()).length);

// 7) $regex (+ $options i)
console.log("начинается на 'коф' (i):", (await p.find({ name: { $regex: "^коф", $options: "i" } }).toArray()).map((x) => x.name).join(","));
console.log("содержит 'ogit' (i):", (await p.find({ name: { $regex: "ogit", $options: "i" } }).toArray()).length);
```

## Частые ошибки

WARN: ждёте **OR** от «нескольких полей»: `find({ cat: "tech", cat: "food" })` — это AND (невозможно). OR — только `$or`.

WARN: `$regex` «по середине» без `^` на большой коллекции — FULL SCAN на каждый запрос. `^prefix` + индекс, или текстовый поиск.

WARN: сравниваете **числа** со **строками** (`{ price: "100" }` — цена-число не найдётся). Типы в BSON строгие: число = число.

WARN: `$in` с 10 000 значений в одном запросе — «раздувание». Пачки по 500–1000.

## Практическое задание

1. Коллекция `orders`: 8 документов `{ total, status: new|paid|shipped, city, items: число }`.
2. Выведите: `total > 5000`; `status ∈ {paid, shipped}`; `city = "Москва" И total < 3000`.
3. `$or`: «дешёвые (<1000) ИЛИ статус shipped».
4. `$exists: false` — заказы без поля `city` (сначала удалите `city` у двух через `$unset`).
5. `$regex`: названия/город «начинаются на М» (case-insensitive); «содержат 'ав'».
6. Скомбинируйте: «paid, total от 2000 до 10000, не город „Новосибирск"» — одним запросом.
