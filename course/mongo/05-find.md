# Урок 5. find: фильтры, проекция, sort, limit/skip

## Цель

После урока студент сможет: выбирать документы через `find` (без фильтра / с точным), использовать **проекцию** (только нужные поля, включение/исключение), сортировать (`sort`, мульти-ключ), ограничивать (`limit`) и делать **пагинацию** (`skip`+`limit`), и читать курсор через `.toArray()` / `.forEach`.

## Теория

### find: «SELECT» MongoDB

`collection.find(filter)` возвращает **курсор** (не массив!). Документы «достаёт» `toArray()` (все в память), `forEach` (по одному), итерация `for await`. Фильтр — «объект-условие»:

```js
coll.find({});                     // все
coll.find({ done: false });        // ровно done === false
coll.find({ "author.country": "DE" }); // вложенное поле (dot-нотация)
```

**Точное совпадение** — дефолт: `find({ price: 100 })` — только 100 (не «100 и больше»). Диапазоны/логика — операторы (урок 8).

### Проекция: только нужные поля

Второй аргумент `find` — **projection**. Два режима (не смешивать!):

- **Включение**: `{ title: 1, price: 1 }` — только эти поля (+ `_id`).
- **Исключение**: `{ specs: 0 }` — всё, кроме `specs` (`_id` остаётся; убрать — `{ _id: 0 }`).

Зачем: не тянуть «тяжёлые» поля (описание, binary) в списки — меньше сети и памяти.

### sort / limit / skip

```js
coll.find({ done: false })
  .sort({ priority: -1, created: 1 }) // -1 desc, 1 asc; несколько ключей
  .limit(10)
  .skip(20)        // «страница 3 по 10»
  .toArray();
```

Порядок вызовов на курсоре не важен (оптимизатор сам), но **логика** пагинации: `skip(page*size) + limit(size)`.

**Ограничение skip**: для «глубокой» пагинации (`skip(100000)`) — медленно (сервер «пролистывает»). Для «больших» списков — **cursor-based** (по `_id`/времени: `find({ _id: { $gt: lastId } }).limit(size)`).

TIP: «список на страницу» — проекция (без тяжёлых полей) + `sort` + `limit`. «Один» — `findOne` (быстрее, без курсора).

NOTE: в песочнице курсор поддерживает `sort/limit/skip/project/toArray/count`; `for await` — по массиву. Пагинация «skip/limit» — работает.

## Пример

`models.js`:

```js
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URL || "mongodb://localhost:27017");
await client.connect();
const shop = client.db("course");
const products = shop.collection("products");

// Данные: разные цены/категории + «тяжёлое» поле description
const items = [
  { name: "Ноутбук", price: 90000, cat: "tech", description: "…2000 символов…", created: new Date("2026-01-10") },
  { name: "Мышь", price: 2000, cat: "tech", created: new Date("2026-02-01") },
  { name: "Кофе", price: 300, cat: "food", created: new Date("2026-03-05") },
  { name: "Книга", price: 800, cat: "edu", created: new Date("2026-03-20") },
  { name: "Кресло", price: 15000, cat: "home", created: new Date("2026-04-01") },
];
await products.insertMany(items);

// 1) Все
console.log("Всего:", (await products.find({}).toArray()).length);

// 2) Точный фильтр
const tech = await products.find({ cat: "tech" }).toArray();
console.log("tech:", tech.map((p) => p.name).join(", "));

// 3) Проекция: только name+price (без description!)
const light = await products.find({}).projection
  ? null : await products.find({}, { name: 1, price: 1 }).toArray();
console.log("Проекция (поля):", Object.keys(light[0]));

// 4) Исключение: всё, кроме description
const noDesc = await products.find({}, { description: 0 }).toArray();
console.log("Без description:", !("description" in noDesc[0]));

// 5) sort + limit
const top2 = await products.find({}).sort({ price: -1 }).limit(2).toArray();
console.log("Дороже всех:", top2.map((p) => p.name + ":" + p.price).join(", "));

// 6) Пагинация: 2 по 2 (страницы 1 и 2)
const page1 = await products.find({}).sort({ price: 1 }).limit(2).toArray();
const page2 = await products.find({}).sort({ price: 1 }).skip(2).limit(2).toArray();
console.log("Стр.1:", page1.map((p) => p.name).join(","), "| Стр.2:", page2.map((p) => p.name).join(","));

// 7) findOne (один документ, без «всех»)
const first = await products.findOne({ cat: "food" });
console.log("findOne:", first.name);
```

## Частые ошибки

WARN: «забыли» `.toArray()` — работаете с **курсором** (не массивом): `cursor.length` — undefined, `cursor.map` — нет. Курсор → `toArray()`.

WARN: смешали проекцию: `{ name: 1, specs: 0 }` — неоднозначно (кроме `_id`). Либо **включение** (все 1), либо **исключение** (все 0).

WARN: `find({ price: 100 })` ждёте «100 и выше» — это **ровно** 100. Диапазон — `{ price: { $gte: 100 } }` (урок 8).

WARN: глубокая пагинация `skip(50000)` — «замирает». Для «больших» списков — по последнему id (`{ _id: { $gt: last } }`).

## Практическое задание

1. Коллекция `employees`: 10 документов `{ name, role, salary, dept, hired }` (разные департаменты/зарплаты).
2. Выведите: всех из `dept: "dev"`; проекцией `{ name: 1, salary: 1 }` (убедитесь, что `role` нет).
3. Топ-3 по зарплате (`sort({ salary: -1 }).limit(3)`); «сначала dev, потом по зарплате» (`sort({ dept: 1, salary: -1 })`).
4. Пагинация по 3 (страницы 1–3) — выведите имена на каждой.
5. Напишите функцию `page(coll, { sort, size, page })` → массив «страницы»; проверьте на `employees`.
