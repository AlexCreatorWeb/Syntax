# Урок 9. Массивы и вложенность: dot-нотация, $push/$addToSet/$pull/$pop, $elemMatch

## Цель

После урока студент сможет: работать с **массивами** в документах (поиск «содержит элемент», dot-нотация, `$elemMatch`), обновлять массивы операторами (`$push`, `$addToSet`, `$pull`, `$pop`, `$push.$each`), читать **вложенные** поля через dot-нотацию (`"author.name"`) и понимать ловушки (мутация вложенного без `$`-оператора).

## Теория

### Массивы в документе

```js
{ name: "Корзина", items: ["кофе", "сахар"], tags: ["a", "b"] }
```

Поиск «массив **содержит** значение»: `find({ items: "кофе" })` — найдёт (специальное правило: для массивов точное совпадение = «содержит элемент»). Для «содержит **объект**» — `find({ items: { name: "кофе", qty: 2 } })` (совпадение по полям элемента).

### Dot-нотация: вложенность и массивы

`"author.name"` — вложенное поле. `"items.name"` для **массива объектов** — «какой-то элемент массива имеет name=…». Глубже: `"address.city"`, `"items.qty"` и т.д.

### $elemMatch: условие «в одном элементе»

Когда нужно «в **одном** элементе массива** одновременно** несколько условий:

```js
find({ items: { $elemMatch: { name: "кофе", qty: { $gte: 2 } } } })
```

Без `$elemMatch` условия могут «рассредоточиться» по разным элементам (один с name, другой с qty).

### Операторы массивов (update)

- **`$push`** — добавить в конец: `{ $push: { tags: "new" } }`; массово — `{ $push: { tags: { $each: ["a", "b"] } } }`.
- **`$addToSet`** — добавить **если ещё нет** (уникальность в массиве).
- **`$pull`** — убрать по условию: `{ $pull: { tags: "old" } }` (или объект-фильтр для массива объектов).
- **`$pop`** — убрать с края: `{ $pop: { items: 1 } }` (конец) / `-1` (начало).

TIP: «список тегов/ролей» — `$addToSet` (не дублировать), «история/лог» — `$push` (+ `$pop` для ограничения длины, или отдельная коллекция).

NOTE: в песочнице: dot-нотация (вкл. массивы), `find({ arr: value })` = «содержит», `$elemMatch`, `$push/$addToSet/$pull/$pop` — работают как в драйвере.

## Пример

`models.js`:

```js
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URL || "mongodb://localhost:27017");
await client.connect();
const carts = client.db("course").collection("carts");
await carts.deleteMany({});
await carts.insertMany([
  { user: "u1", items: [{ name: "Кофе", qty: 2 }, { name: "Сахар", qty: 1 }] },
  { user: "u2", items: [{ name: "Кофе", qty: 1 }], profile: { city: "Москва" } },
]);

// 1) Dot-нотация: вложенное поле
const msq = await carts.find({ "profile.city": "Москва" }).toArray();
console.log("Москва:", msq.map((c) => c.user).join(","));

// 2) Массив «содержит» (объект по полям)
const hasCoffee2 = await carts.find({ items: { name: "Кофе", qty: 2 } }).toArray();
console.log("кофе qty=2:", hasCoffee2.map((c) => c.user).join(","));

// 3) $elemMatch: «кофе и qty >= 2 в ОДНОМ элементе»
const em = await carts.find({ items: { $elemMatch: { name: "Кофе", qty: { $gte: 2 } } } }).toArray();
console.log("$elemMatch:", em.map((c) => c.user).join(","));

// 4) $push
await carts.updateOne({ user: "u1" }, { $push: { items: { name: "Молоко", qty: 1 } } });
console.log("после $push:", (await carts.findOne({ user: "u1" })).items.map((i) => i.name).join(","));

// 5) $push $each (несколько)
await carts.updateOne({ user: "u1" }, { $push: { items: { $each: [{ name: "Чай", qty: 3 }, { name: "Мёд", qty: 1 }] } } });
console.log("после $each:", (await carts.findOne({ user: "u1" })).items.length, "позиций");

// 6) $addToSet (массив «скалярных» тегов)
await carts.updateOne({ user: "u1" }, { $addToSet: { tags: "vip" } });
await carts.updateOne({ user: "u1" }, { $addToSet: { tags: "vip" } }); // дубль не добавится
console.log("$addToSet (без дублей):", (await carts.findOne({ user: "u1" })).tags);

// 7) $pull (убрать позицию)
await carts.updateOne({ user: "u1" }, { $pull: { items: { name: "Сахар" } } });
console.log("после $pull:", (await carts.findOne({ user: "u1" })).items.map((i) => i.name).join(","));
```

## Частые ошибки

WARN: «обновили» вложенное **без** dot-нотации: `updateOne(…, { $set: { profile: { city: "X" } } })` — **заменит** весь `profile` (остальные поля пропадут). Для части — `$set: { "profile.city": "X" }`.

WARN: условия «рассредоточились» по элементам массива (один элемент с `name`, другой с `qty`). Для «в одном элементе» — **`$elemMatch`**.

WARN: `$push` в цикле на каждый элемент (N запросов). Массово — `$push: { field: { $each: [ … ] } }` (один запрос).

WARN: не ограничиваете «растущие» массивы (история/лог) — документ уходит к 16 МБ (лимит). Длинные «ленты» — отдельная коллекция (урок 10).

## Практическое задание

1. Коллекция `orders`: 3 заказа с `items: [{name, qty, price}]` (3–5 позиций) и `profile: {city, vip}`.
2. Найдите: заказы из `profile.city = "СПб"`; где «есть позиция с qty >= 3»; где «есть позиция name='X' И price < 100» (`$elemMatch`).
3. `$push` (новая позиция), `$push.$each` (две позиции), `$pull` (убрать позицию по name).
4. `tags`: `$addToSet` (дважды одно и то же — дубля нет), `$pull` (убрать тег).
5. Выведите итоговый документ «u1» — убедитесь, что вложенное `profile` не «потерял» поля (вы обновляли его точечно через dot-нотацию).
6. В комментарии: почему «комментарии к посту» — отдельная коллекция, а «теги» — массив (по одной причине для каждого).
