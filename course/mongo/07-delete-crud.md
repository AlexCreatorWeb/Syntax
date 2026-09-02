# Урок 7. deleteOne / deleteMany: завершаем CRUD

## Цель

После урока студент сможет: удалять документы через `deleteOne` (один) и `deleteMany` (все подходящие), читать `deletedCount`, безопасно удалять «по фильтру» (проверка перед удалением), собирать **полный CRUD** в функции и понимать «мягкое удаление» (soft delete) как альтернативу.

## Теория

### deleteOne / deleteMany

```js
const r1 = await coll.deleteOne({ _id: id });        // → { deletedCount: 1 | 0 }
const r2 = await coll.deleteMany({ done: true });    // все «завершённые»
```

`deletedCount: 0` — «ничего не нашлось» (в API — 404, а не «молча ок»). Удаление **физическое**: документ исчезает (восстановить нельзя, кроме как из бэкапа).

### Безопасное удаление

Паттерн «проверка → действие»: сначала `findOne` (существует? чья?), потом `deleteOne` (по **тому же** фильтру/`_id`). Для «только своих» ресурсов (API) — фильтруйте **всегда** по владельцу: `deleteOne({ _id: id, userId: me })` — чужой «не найдётся» → 404.

### Жёсткое vs мягкое удаление

- **Hard delete** (`deleteOne`) — «навсегда» (логи, временные данные, «очистка»).
- **Soft delete** — флаг `deleted: true` + `deletedAt` (данные «остаются», фильтры везде учитывают). Для «отменить удаление», аудита, «корзины». Цена: **все** запросы должны фильтровать `deleted: false` (иначе «мёртвые» появятся).

Выбор: для «пользовательских» сущностей (заметки, заказы) — часто soft; для «технических» (события, кэш) — hard.

### CRUD: полный круг

| Операция | Метод | HTTP |
|---|---|---|
| Create | `insertOne` | `POST` → 201 |
| Read | `find`/`findOne` | `GET` → 200 |
| Update | `updateOne` ($set) | `PATCH/PUT` → 200 |
| Delete | `deleteOne` | `DELETE` → 204 |

Теперь у нас **весь** CRUD — дальше: операторы (8–9), связи (10–11), индексы (12–13), агрегация (14–15), Mongoose (16–18).

TIP: в API `DELETE` → `204` (без тела). `deletedCount: 0` → `404`. «Обновили/удалили» — проверяйте счётчики, а не «доверяйте».

NOTE: в песочнице `deleteOne/deleteMany` — тот же API (`deletedCount`). Soft delete — «ваш» слой (поле + фильтры).

## Пример

`models.js`:

```js
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URL || "mongodb://localhost:27017");
await client.connect();
const notes = client.db("course").collection("notes");

async function seed() {
  await notes.deleteMany({});
  await notes.insertMany([
    { text: "Купить кофе", done: true, owner: "u1" },
    { text: "Написать код", done: false, owner: "u1" },
    { text: "Позвонить маме", done: false, owner: "u2" },
  ]);
}
await seed();

// 1) deleteOne (по _id)
const one = (await notes.findOne({ text: "Купить кофе" }));
const r1 = await notes.deleteOne({ _id: one._id });
console.log("deleteOne:", r1.deletedCount, "| осталось:", await notes.countDocuments({}));

// 2) deletedCount = 0 → 404
const r2 = await notes.deleteOne({ _id: one._id }); // второй раз
console.log("повторное удаление:", r2.deletedCount, "→ 404");

// 3) deleteMany (по фильтру)
const r3 = await notes.deleteMany({ done: true });
console.log("deleteMany done=true:", r3.deletedCount);

// 4) «Только свои»: deleteOne с owner в фильтре
const mine = (await notes.findOne({ owner: "u1" }));
const r4 = await notes.deleteOne({ _id: mine._id, owner: "u2" }); // чужой owner → 0
console.log("чужая (owner mismatch):", r4.deletedCount, "→ 404");

// 5) CRUD-функции (скелет для API)
const crud = {
  create: (doc) => notes.insertOne(doc).then((r) => r.insertedId),
  list: (filter) => notes.find(filter || {}).toArray(),
  get: (id) => notes.findOne({ _id: id }),
  update: (id, patch) => notes.updateOne({ _id: id }, { $set: patch }),
  remove: (id, owner) => notes.deleteOne({ _id: id, ...(owner ? { owner } : {}) }),
};
const id = await crud.create({ text: "CRUD тест", owner: "u1" });
await crud.update(id, { done: true });
console.log("CRUD: создали → обновили →", await crud.get(id));
console.log("CRUD: удалили →", (await crud.remove(id)).deletedCount);
console.log("Финал:", await crud.list({}));
```

## Частые ошибки

WARN: `deleteMany({})` «по ошибке» (пустой фильтр) — **вся** коллекция очищена. Перед `deleteMany` — «осознанный» фильтр (или подтверждение).

WARN: «удалили», но `deletedCount` не проверили — «успех» при 0 удалённых. 0 → 404.

WARN: hard delete там, где нужен soft (пользователь «передумал»). Для «отменяемых» сущностей — флаг `deleted`.

WARN: `deleteOne` без фильтра владельца в API — «чужие» данные удаляются. Фильтр `{ _id, userId }` — всегда.

## Практическое задание

1. Коллекция `todos`: 5 документов (2 с `done: true`, 3 с разным `owner`).
2. `deleteOne` по `_id`; повторное удаление → `deletedCount: 0` (выведите).
3. `deleteMany({ done: true })` — сколько удалилось?
4. Напишите CRUD-объект (create/list/get/update/remove) для `todos`; `remove(id, owner)` — только свои.
5. Проверьте: удалить чужой todo → 0 (404); полный цикл CRUD для одного todo (создать → прочитать → обновить → удалить).
6. В комментарии: когда soft delete, а когда hard (2 примера каждого) — для вашего API.
