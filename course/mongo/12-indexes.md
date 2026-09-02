# Урок 12. Индексы: создание, составные, unique, explain

## Цель

После урока студент сможет: объяснять, зачем индексы (без них — **COLLSCAN** по всем документам), создавать индексы (`createIndex`, составные, `unique`), понимать **порядок полей** в составном индексе (правило equality→range→sort), смотреть **план выполнения** (`explain`) и отличать `IXSCAN` (индекс) от `COLLSCAN` (полный перебор).

## Теория

### Что такое индекс

Индекс — **отсортированная «копия»** полей (как указатель в книге). Без индекса `find({ email: "x" })` — **COLLSCAN** (перебор **всех** документов, O(N)). С индексом — **IXSCAN** (бинарный поиск, O(log N)). На маленькой коллекции разница незаметна, на百万 — критична.

Цена индекса: **память/диск** (копия) + **замедление записи** (индексы обновляются при insert/update). Индексируйте **то, что часто ищете/сортируете** (не «всё на всякий»).

### Создание

```js
await coll.createIndex({ email: 1 });                 // 1 = asc, -1 = desc
await coll.createIndex({ status: 1, createdAt: -1 }); // составной (порядок важен!)
await coll.createIndex({ sku: 1 }, { unique: true }); // уникальность (дубль → ошибка)
await coll.listIndexes();   // список
await coll.dropIndex("…");  // удалить
```

**Порядок в составном** — правило **ESI** (Equality → Sort → Inequality/range): сначала поля **равенства**, потом **сортировки**, потом **диапазоны**. `{ status: 1, createdAt: -1 }` — оптимален для «status = X, по createdAt desc»; наоборот — нет.

### explain: «как MongoDB ищет»

```js
// mongosh:
db.orders.find({ status: "paid" }).explain("executionStats")
// driver:
await coll.find({ status: "paid" }).explain("executionStats")
```

Смотрите: `winningPlan.stage` — **IXSCAN** (индекс, хорошо) или **COLLSCAN** (полный перебор, «красный флаг»); `executionStats.nExamined` (сколько «посмотрел») vs `nReturned` (сколько вернул) — если examined >> returned — индекс «не тот».

### Какие поля индексовать

- Поля из **фильтров** частых запросов (`status`, `userId`, `email`).
- Поля **сортировки** (особенно с фильтром — составной).
- **unique** для «естественных» ключей (`email`, `sku`).
- **Не**: поля с «низкой» селективностью (boolean `done` — индекс почти бесполезен), «редко ищущие».

TIP: `_id` — **уже** проиндексирован (unique). «По id» — всегда быстро.

NOTE: в песочнице `createIndex/listIndexes/dropIndex` — «бумажные» (храним список, COLLSCAN/IXSCAN не симулируется); в терминале — настоящие (explain работает).

## Пример

`models.js`:

```js
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URL || "mongodb://localhost:27017");
await client.connect();
const orders = client.db("shop").collection("orders");
await orders.deleteMany({});
await orders.insertMany(Array.from({ length: 200 }, (_, i) => ({
  total: (i % 50) * 100 + 50,
  status: ["new", "paid", "shipped"][i % 3],
  userId: "u" + (i % 20),
  createdAt: new Date(Date.now() - i * 3600_000),
})));

// 1) Индекс по полю фильтра
await orders.createIndex({ status: 1 });
console.log("Индексы:", (await orders.listIndexes()).map((i) => i.name));

// 2) Составной (equality + sort)
await orders.createIndex({ userId: 1, createdAt: -1 });
console.log("После составного:", (await orders.listIndexes()).length);

// 3) unique
await client.db("shop").collection("users").createIndex({ email: 1 }, { unique: true });
const users = client.db("shop").collection("users");
await users.insertOne({ email: "a@b.c" });
try {
  await users.insertOne({ email: "a@b.c" }); // дубль
  console.log("Дубль прошёл (не должно быть)");
} catch (e) {
  console.log("unique сработал:", e.codeName || e.message);
}

// 4) explain (driver) — смотреть stage
const plan = await orders.find({ status: "paid" }).explain("executionStats");
const s = JSON.stringify(plan).slice(0, 200);
console.log("explain (фрагмент):", s);
// В терминале: winningPlan.stage = "IXSCAN" (index: "status_1") — не COLLSCAN
```

## Частые ошибки

WARN: «проиндексировали всё» — индексы едят память и **замедляют запись** (каждый insert/update обновляет все индексы). Только «горячие» поля.

WARN: **порядок** составного «наугад»: `{ createdAt: -1, userId: 1 }` для запроса «userId = X по createdAt» — неоптимален. ESI: equality (userId) **первым**.

WARN: не смотрите **explain** — «индекс есть, значит быстро». Проверяйте: IXSCAN vs COLLSCAN, examined vs returned.

WARN: уникальный индекс **после** данных (в коллекции уже дубли) — `createIndex` упадёт. Уникальность — на старте схемы.

## Практическое задание

1. Коллекция `events`: 300 документов `{ type, userId, ts }` (type из 5 значений).
2. Создайте: индекс по `type`; составной `{ userId: 1, ts: -1 }`; выведите `listIndexes`.
3. `explain("executionStats")` для `find({ type: "click" })` — найдите `stage` (в терминале: IXSCAN).
4. `unique`-индекс по `eventId` (сгенерируйте строки); попробуйте вставить дубль — ошибка.
5. Удалите индекс по `type` (`dropIndex`); повторите explain — что изменилось (COLLSCAN)?
6. В комментарии: 2 поля, которые вы **не** стали бы индексировать, и почему.
