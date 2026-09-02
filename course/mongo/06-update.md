# Урок 6. updateOne / updateMany: $set vs замена, upsert, replaceOne

## Цель

После урока студент сможет: обновлять документы через `updateOne`/`updateMany` с оператором **`$set`** (частичное обновление), понимать разницу `$set` и **полной замены** (главная ловушка), использовать `upsert` (обнови или вставь), `replaceOne` (заменить целиком), читать результат (`matchedCount`, `modifiedCount`) и отличать «JS-мутацию» от «сохранения в БД».

## Теория

### $set: обновить часть

`updateOne(filter, { $set: { поле: значение } })` — **меняет только указанные поля**, остальные сохраняются. Это **основной** способ обновления:

```js
await coll.updateOne({ _id: id }, { $set: { done: true, doneAt: new Date() } });
```

Другие операторы обновления (полезные): `$inc` (увеличить число), `$unset` (удалить поле), `$push`/`$pull` (массивы — урок 9), `$mul`, `$min`/`$max`, `$currentDate`.

### Главная ловушка: $set vs replacement

Если во втором аргументе **нет** операторов (`$`) — это **полная замена** документа (все поля, кроме `_id`, **удаляются**):

```js
// ПРАВИЛЬНО (часть):
await coll.updateOne({ id: 1 }, { $set: { done: true } });

// «ТИХО» заменяет ВЕСЬ документ одним полем (остальное пропадает!):
await coll.updateOne({ id: 1 }, { done: true });
```

Это №1 баг новичков. Правило: **почти всегда** — `$set`.

### Результат: matched / modified

`{ matchedCount, modifiedCount, upsertedId }`. `matchedCount: 0` — «никто не нашёлся» (в API → 404). `modifiedCount: 0` — нашёлся, но **ничего не изменилось** (значение то же).

### upsert: «обнови или вставь»

`{ upsert: true }` — если фильтр не нашёл документ — **создаёт** (из фильтруемых полей + `$set`):

```js
await stats.updateOne({ day: "2026-09-02" }, { $inc: { visits: 1 } }, { upsert: true });
// нет записи за день → создаст { day: "2026-09-02", visits: 1 }
```

Классика: счётчики, «upsert-профили».

### replaceOne

`replaceOne(filter, newDoc)` — **заменить** документ целиком (явно, не «случайно»). Для «полного пересохранения» (форм в UI).

TIP: «JS-объект из `find` — это **копия**». `doc.done = true; doc.save()` — без Mongoose **ничего не сохраняет** (просто мутировали локальный объект). Сохранение = `updateOne`.

NOTE: в песочнице `updateOne/updateMany/replaceOne` + операторы `$set/$inc/$unset/$push/$addToSet/$pull/$pop` работают как в драйвере; `upsert` — тоже.

## Пример

`models.js`:

```js
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URL || "mongodb://localhost:27017");
await client.connect();
const tasks = client.db("course").collection("tasks");
await tasks.insertOne({ title: "Отчёт", done: false, views: 0, tags: ["work"] });

const t = (await tasks.findOne({ title: "Отчёт" }));

// 1) $set: часть (остальные поля на месте)
const r1 = await tasks.updateOne({ _id: t._id }, { $set: { done: true, doneAt: new Date() } });
console.log("$set:", r1.matchedCount, "matched /", r1.modifiedCount, "modified");
console.log("После $set:", await tasks.findOne({ _id: t._id }));

// 2) $inc
await tasks.updateOne({ _id: t._id }, { $inc: { views: 5 } });
console.log("views:", (await tasks.findOne({ _id: t._id })).views);

// 3) $unset
await tasks.updateOne({ _id: t._id }, { $unset: { doneAt: "" } });
console.log("doneAt после $unset:", (await tasks.findOne({ _id: t._id })).doneAt);

// 4) matchedCount = 0 → «не нашёлся»
const r4 = await tasks.updateOne({ title: "Не существует" }, { $set: { x: 1 } });
console.log("несуществующий:", r4.matchedCount, "→ в API это 404");

// 5) upsert: счётчик посещений по дням
const stats = client.db("course").collection("stats");
for (let i = 0; i < 3; i++) await stats.updateOne({ day: "2026-09-02" }, { $inc: { visits: 1 } }, { upsert: true });
console.log("upsert-счётчик:", await stats.findOne({ day: "2026-09-02" }));

// 6) «Ловушка»: полная замена vs $set
await tasks.insertOne({ title: "Ловушка", a: 1, b: 2 });
const trap = (await tasks.findOne({ title: "Ловушка" }));
await tasks.updateOne({ _id: trap._id }, { a: 100 }); // ЗАМЕНА: b исчезнет!
console.log("После замены (b пропал?):", await tasks.findOne({ _id: trap._id }));
```

## Частые ошибки

WARN: **`updateOne(filter, { done: true })` без `$set`** — полная замена (остальные поля **пропали**). Почти всегда — `$set`.

WARN: мутируете документ из `find` и «думаете, что сохранили». JS-мутация ≠ запись в БД. `updateOne`/`save()` (Mongoose).

WARN: `matchedCount: 0` не обрабатываете — «обновили» то, чего нет (молча). В API: 0 → 404.

WARN: `updateMany` «для одного» документа (если фильтр точный) — работает, но `updateOne` честнее (и быстрее: останавливается на первом).

## Практическое задание

1. Коллекция `products`: создайте 3 (name, price, stock).
2. `updateOne` + `$set`: у первого `price` +10%; `$inc`: `stock: -1`; выведите документ.
3. `$unset`: удалите поле `stock` у второго.
4. **upsert**: счётчик `pageviews` по `path` (`{ $inc: { views: 1 }, upsert: true }`) — 5 раз для `/home`, 2 раза для `/about`; выведите обе записи.
5. Покажите «ловушку»: вставьте `{ x: 1, y: 2 }`, обновите `updateOne({…}, { x: 99 })` (без $set) — выведите документ (y пропал?) и «почините» через `$set`.
