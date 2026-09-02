# Урок 14. Aggregation Framework: конвейер, $match, $project, $group

## Цель

После урока студент сможет: объяснять **конвейер** агрегации (этапы-«трубы», каждый превращает поток документов), писать `$match` (фильтр), `$project` (преобразование/новые поля, выражения), `$group` (группировка + аккумуляторы `$sum/$avg/$min/$max/$push`), и понимать, что агрегация — «GROUP BY и аналитика» MongoDB.

## Теория

### Конвейер

`collection.aggregate([ этап1, этап2, … ])` — **конвейер**: документы «текут» через этапы, каждый получает «вывод» предыдущего. Порядок **важен** (обычно `$match` **раньше** — сузить, потом преобразования).

```js
coll.aggregate([
  { $match: { status: "paid" } },        // 1) отфильтровать
  { $group: { _id: "$city", total: { $sum: "$total" } } }, // 2) сгруппировать
  { $sort: { total: -1 } },              // 3) отсортировать
  { $limit: 5 },                         // 4) топ-5
]);
```

### Этапы (основные)

- **`$match`** — фильтр (синтаксис как у `find`). Ставьте **вперёд** (меньше данных дальше по конвейеру).
- **`$project`** — «выбрать/построить поля»: включение/исключение **+ выражения** (`{ fullName: { $concat: ["$first", " ", "$last"] } }`).
- **`$group`** — «сгруппировать» (как `GROUP BY`): `_id` — ключ группы (поле/выражение/`null` = все в одну), остальные — **аккумуляторы**: `$sum` (сумма; `$sum: 1` = **count**), `$avg`, `$min`, `$max`, `$push` (массив значений), `$first`/`$last`.
- **`$sort`**, **`$limit`**, **`$skip`** — как в find (на «результате»).
- **`$addFields`** (урок 15) — добавить вычисленные поля.

### Выражения

`"$поле"` — значение поля; `"$const"` — константа; операторы-выражения: `$sum`/`$add`/`$multiply` (арифметика), `$concat`, `$toUpper`/`$toLower`, `$year`/`$month`, `$cond`. Внутри `$group` и `$project`.

```js
{ $group: { _id: "$city", revenue: { $sum: "$total" }, orders: { $sum: 1 }, avg: { $avg: "$total" } } }
```

TIP: «отчёт по дням/месяцам» — `_id: { y: { $year: "$ts" }, m: { $month: "$ts" } }` (группировка по **выражению**).

NOTE: в песочнице `aggregate` поддерживает: `$match, $project (вкл. выражения), $group (все аккумуляторы), $sort, $limit, $skip, $count, $unwind, $addFields, $lookup` + выражения `$sum/$avg/$concat/$toUpper/$year/$month/…`.

## Пример

`models.js`:

```js
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URL || "mongodb://localhost:27017");
await client.connect();
const orders = client.db("analytics").collection("orders");
await orders.deleteMany({});
await orders.insertMany([
  { city: "MSK", total: 1500, status: "paid", ts: new Date("2026-09-01") },
  { city: "MSK", total: 2500, status: "paid", ts: new Date("2026-09-02") },
  { city: "MSK", total: 800, status: "new", ts: new Date("2026-09-02") },
  { city: "SPB", total: 3000, status: "paid", ts: new Date("2026-09-01") },
  { city: "SPB", total: 1200, status: "paid", ts: new Date("2026-09-03") },
]);

// 1) $match → $group (выручка по городам, только paid)
const byCity = await orders.aggregate([
  { $match: { status: "paid" } },
  { $group: { _id: "$city", revenue: { $sum: "$total" }, orders: { $sum: 1 }, avg: { $avg: "$total" } } },
  { $sort: { revenue: -1 } },
]).toArray();
console.log("Выручка по городам:", byCity.map((r) => r._id + ":" + r.revenue + " (" + r.orders + " закл)").join(" | "));

// 2) $group в одну группу (сводка)
const total = await orders.aggregate([
  { $match: { status: "paid" } },
  { $group: { _id: null, revenue: { $sum: "$total" }, count: { $sum: 1 }, max: { $max: "$total" } } },
]).toArray();
console.log("Сводка:", JSON.stringify(total[0]));

// 3) $project: новые поля-выражения
const withName = await orders.aggregate([
  { $project: { city: 1, total: 1, upper: { $toUpper: "$city" }, double: { $multiply: ["$total", 2] } } },
  { $limit: 2 },
]).toArray();
console.log("$project выражения:", JSON.stringify(withName[0]));

// 4) Группировка по выражению (месяц)
const byMonth = await orders.aggregate([
  { $group: { _id: { m: { $month: "$ts" } }, total: { $sum: "$total" } } },
  { $sort: { "_id.m": 1 } },
]).toArray();
console.log("По месяцам:", byMonth.map((r) => "месяц " + r._id.m + ": " + r.total).join(", "));

// 5) $push (собрать значения в массив)
const cities = await orders.aggregate([
  { $group: { _id: null, all: { $push: "$city" } } },
]).toArray();
console.log("$push:", cities[0].all.join(","));
```

## Частые ошибки

WARN: `$group` **без** `_id` — «все в одну группу» (иногда это то, что надо — сводка; чаще — забыли ключ).

WARN: `$match` **после** `$group` (по полям, которые «уже» сгруппированы/переименованы) — «не находит». `$match` — **вперёд** (по исходным полям).

WARN: путаете `$sum` (агрегация: аккумулятор по группе) и `$sum` (выражение: сумма значений). В `$group` — аккумулятор; в `$project` — выражение.

WARN: «один гигантский» этап вместо конвейера. Разбивайте: match → group → project → sort → limit (читабельно + `match` раньше = быстрее).

## Практическое задание

1. `sales`: 20 документов `{ product, qty, price, ts }` (4 продукта, разные месяцы).
2. «Выручка по продуктам» (`$match`? нет — все; `$group _id:"$product"`, `$sum: { $multiply: ["$qty", "$price"] }`) — топ-3.
3. «Средний чек» по продуктам (`$avg` по `price`).
4. «По месяцам» (`_id: { $month: "$ts" }`, сумма выручки).
5. `$project`: поле `revenue` (`$multiply`) + `upper` (`$toUpper` по `product`) — первые 3.
6. Сводка за всё время (одна группа: `$sum` выручки, `$sum:1` заказов, `$max`/`$min` чека).
