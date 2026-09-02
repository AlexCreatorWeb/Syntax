# Урок 13. Производительность: выбор индекса, FULL SCAN, count/distinct

## Цель

После урока студент сможет: диагностировать «медленные» запросы (COLLSCAN, examined >> returned), выбирать **правильный** индекс под запрос (составной, порядок), использовать `countDocuments`/`distinct`/`estimatedDocumentCount` осознанно и применять приёмы: проекция (меньше данных), ограничение (`limit`), «горячие» поля рядом.

## Теория

### Почему запрос «медленный»

Три главных сигнала:

1. **COLLSCAN** в explain — «полный» перебор (нет подходящего индекса). Лечится: индекс под фильтр.
2. **examined >> returned** — «посмотрел» 100 000, «вернул» 10 (индекс «не тот» или фильтр «слабый»). Лечится: точный составной индекс (equality-поля первыми).
3. **«Тяжёлые» документы** — тянете 16 МБ, а нужно 2 поля. Лечится: **проекция** (только нужное).

### Правильный индекс = «под запрос»

Индекс не «для поля», а **для запроса**. Запрос `{ status: "paid", createdAt: { $gt: X } }` + `sort(createdAt desc)` → индекс `{ status: 1, createdAt: -1 }` (ESI: equality → range/sort). Один индекс закрывает **фильтр + сортировку** (без «доп. сортировки» в памяти).

**Покрытие** (covered query): если **все** поля запроса (фильтр + проекция) — в индексе, MongoDB отвечает **из индекса** (документы не читает) — быстро. `find({ status: "paid" }, { status: 1, _id: 0 })` с индексом `{ status: 1 }` — covered.

### count / distinct / estimated

- **`countDocuments({ filter })`** — «точные» (с фильтром), но **медленный** (перебирает). Для «сколько всего» без фильтра — `estimatedDocumentCount()` (быстро, из метаданных, **без** фильтра).
- **`distinct("поле", filter)`** — уникальные значения (полезно для «список фильтров»: все `city`, все `status`).
- Не считайте `countDocuments` «на каждый рендер» (дорого) — кэшируйте/денормализуйте.

### Приёмы «меньше работы»

- **Проекция** — только нужные поля (списки: без «тела»).
- **limit** — всегда (не «все 100 000»).
- **Пагинация по курсору** (по `_id`/`ts`), не `skip` вглубь.
- **«Горячее» рядом** (embed) — меньше запросов (урок 10).

TIP: «профилирование» — `explain` + мониторинг (slow query log в mongod: `profile`). В проде — индекс **до** трафика (по частым запросам).

NOTE: в песочнице `countDocuments/distinct/estimatedDocumentCount` — работают (in-memory); `explain` — «бумажный» (в терминале — настоящий план).

## Пример

`models.js`:

```js
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URL || "mongodb://localhost:27017");
await client.connect();
const orders = client.db("perf").collection("orders");
await orders.deleteMany({});
await orders.insertMany(Array.from({ length: 500 }, (_, i) => ({
  status: ["new", "paid", "shipped", "done"][i % 4],
  city: ["MSK", "SPB", "KZN"][i % 3],
  total: (i % 100) * 100,
  body: "x".repeat(2000), // «тяжёлое» поле
  createdAt: new Date(Date.now() - i * 60_000),
})));

// 1) count: точный (с фильтром) vs estimated (без)
console.log("countDocuments(status=paid):", await orders.countDocuments({ status: "paid" }));
console.log("estimatedDocumentCount():", await orders.estimatedDocumentCount());

// 2) distinct: «список значений» для фильтров UI
const cities = await orders.distinct("city");
console.log("distinct city:", cities.sort().join(", "));

// 3) Проекция: список без «тела»
const light = await orders.find({ status: "paid" }, { status: 1, total: 1, _id: 0 }).limit(5).toArray();
console.log("Проекция (без body):", Object.keys(light[0]).join(", "));

// 4) Индекс под «типичный» запрос (equality + range + sort)
await orders.createIndex({ status: 1, createdAt: -1 });
const recent = await orders.find({ status: "paid", createdAt: { $gt: new Date(Date.now() - 10 * 60_000) } }).limit(10).toArray();
console.log("paid за 10 мин:", recent.length, "(индекс status_1_createdAt_-1)");

// 5) Пагинация по курсору (не skip вглубь)
const page1 = await orders.find({ status: "paid" }).sort({ createdAt: -1 }).limit(20).toArray();
const lastTs = page1[page1.length - 1].createdAt;
const page2 = await orders.find({ status: "paid", createdAt: { $lt: lastTs } }).sort({ createdAt: -1 }).limit(20).toArray();
console.log("Курсорная пагинация: стр1 =", page1.length, "| стр2 =", page2.length, "| не пересекаются:", page1[0].createdAt > page2[0].createdAt);
```

## Частые ошибки

WARN: `countDocuments({})` «для красоты» на каждый запрос — медленно. `estimatedDocumentCount()` (без фильтра) или кэш/счётчик.

WARN: «тяжёлые» документы **в список** (body/описание) — сеть+память. Проекция.

WARN: `skip(10000)` — «пролистывает» 10 000 каждый раз. Курсорная пагинация (по последнему id/ts).

WARN: индекс «на поле», а запрос «фильтр+сортировка» — «доп. сортировка» в памяти. Составной под **запрос** (ESI).

## Практическое задание

1. `metrics`: 1000 документов `{ service, ts, latency }` (5 сервисов).
2. `distinct("service")`; `countDocuments` по каждому сервису; `estimatedDocumentCount()`.
3. Индекс `{ service: 1, ts: -1 }`; запрос «service = X, ts > сейчас-1ч» — выведите количество.
4. Проекция: «топ-10 по latency» (`sort({ latency: -1 }).limit(10)`, проекция `{ service: 1, latency: 1, _id: 0 }`).
5. Курсорная пагинация (2 страницы по 50, по `ts`) — убедитесь, что «не пересекаются».
6. В комментарии: что «медленнее» — `countDocuments({service:"a"})` или `estimatedDocumentCount()`, и почему.
