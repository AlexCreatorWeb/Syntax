# Урок 2. Документы, BSON и ObjectId: единицы данных MongoDB

## Цель

После урока студент сможет: объяснять, что такое **BSON** и чем он отличается от JSON, называть типы данных MongoDB (включая те, которых нет в JSON), создавать и проверять **ObjectId** (`new ObjectId()`, `ObjectId.isValid`), понимать структуру ObjectId (почему он уникален и «знает» время) и работать с вложенными объектами/массивами в документе.

## Теория

### Документ = основной объект

Минимальный документ: `{ "hello": "world" }`. Каждый документ в коллекции **обязан** иметь поле **`_id`** (уникальный идентификатор). Если не задать — MongoDB создаст его сама (ObjectId). Документ — вложенная структура: объекты внутри объектов, массивы, «разные» документы в одной коллекции (гибкая схема).

### BSON: не совсем JSON

**BSON** (Binary JSON) — бинарный формат, в котором MongoDB хранит данные. Он совместим с JSON, но **добавляет типы**, которых в JSON нет:

- `ObjectId` (12-байтный id) — не строка;
- `Date` (timestamp) — в JSON это строка, в BSON — тип;
- `Number` (64-bit) vs `Int32`, `Decimal128` (деньги — без «0.1+0.2»);
- `Binary` (байты: файлы/картинки), `Regex`, `Null`.

Почему это важно: `{ "d": ISODate("2026-01-01") }` — это **тип Date**, а не строка (сортируется как дата, форматируется как дата). В JSON-ответе API дату обычно сериализуют в ISO-строку.

### ObjectId: 12 байт = время + уникальность

ObjectId — 12-байтное значение (в шелле `ObjectId("507f1f77bcf86cd799439011")`, в строках — 24 hex-символа). Структура: **4 байта — timestamp** (секунды), 5 — случайный «отпечаток процесса», 3 — счётчик. Поэтому:

- уникальность без центрального генератора (каждый клиент генерит сам);
- **по возрастанию времени** — документы, вставленные позже, «больше» (удобно для «по умолчанию свежие в конце»);
- по `_id` можно понять, **когда** создан документ (`new Date(id.getTimestamp())`).

Работа с ObjectId в Node:

```js
import { ObjectId } from "mongodb";
const id = new ObjectId();           // новый случайный
ObjectId.isValid(id);                 // true
id.toString();                        // "665f…" (24 hex)
new ObjectId("665f1f77bcf86cd799439011"); // из строки
```

**Важно**: в фильтрах ObjectId сравнивается **как ObjectId** (или строка-24hex — драйвер приведёт). `find({ _id: "665f…" })` работает; `find({ _id: 123 })` — никогда.

TIP: передавайте `_id` в REST как **строку** (`doc._id.toString()` / `String(doc._id)`) — JSON «не умеет» ObjectId.

NOTE: в песочнице `ObjectId` — та же семантика (24 hex, timestamp, `isValid`, `new ObjectId(str)`). `Date` в документах — настоящий `Date`.

## Пример

`models.js`:

```js
import { MongoClient, ObjectId } from "mongodb";

const client = new MongoClient(process.env.MONGO_URL || "mongodb://localhost:27017");
await client.connect();
const products = client.db("course").collection("products");

// 1) Вложенный документ (гибкая схема: разные поля у разных товаров)
const r1 = await products.insertOne({
  name: "Ноутбук",
  price: 90000,
  specs: { ram: 16, disk: "512GB SSD" }, // объект внутри
  tags: ["tech", "office"],             // массив
  createdAt: new Date(),                // тип Date (BSON)
});
console.log("_id:", r1.insertedId);

// 2) «Другой» документ в той же коллекции (без specs, с promo)
await products.insertOne({ name: "Кофе", price: 300, promo: true, createdAt: new Date() });

// 3) ObjectId: создание, проверка, «время рождения»
const id = r1.insertedId;
console.log("hex:", id.toString());
console.log("isValid:", ObjectId.isValid(id));
console.log("создан примерно:", new Date(id.getTimestamp ? id.getTimestamp() : Date.now()).toISOString());

// 4) Поиск по _id (ObjectId и строка — оба работают)
const byOid = await products.findOne({ _id: id });
const byStr = await products.findOne({ _id: id.toString() });
console.log("по ObjectId:", byOid.name, "| по строке:", byStr.name);

// 5) Все документы (видим вложенность и Date)
console.log(JSON.stringify(await products.find({}).toArray(), null, 1));
```

## Частые ошибки

WARN: храните дату как **строку** `"2026-01-01"` и пытаетесь сортировать/сравнивать диапазоном. Храните **`Date`** (BSON) — сортировка и диапазоны «из коробки».

WARN: сравниваете `_id` с **числом** (`find({ _id: 1 })`) — документов нет (id — 24 hex). Идентификаторы — ObjectId (или ваши **string**-коды, но не int).

WARN: «один и тот же» документ в разных местах кода — разные объекты (JS не копирует). Мутация `doc.price = 5` **не сохраняется** в БД — только через `updateOne` (урок 6).

WARN: сериализуете ObjectId «как есть» в JSON-ответ — получите `{"$oid": "…"}` или `undefined`. Преобразуйте: `String(doc._id)`.

## Практическое задание

1. Создайте коллекцию `books` и вставьте 3 документа: разные наборы полей (один с `author`-объектом `{name, country}`, другой с массивом `genres`), все с `createdAt: new Date()`.
2. Выведите `ObjectId.isValid` для: нового id, `"665f1f77bcf86cd799439011"`, `"abc"`, числа `5`.
3. Найдите первый документ и по его `_id` (ObjectId) и по его **строке** — убедитесь, что оба способа работают.
4. Выведите `createdAt` всех книг (`find({}).toArray()`) — убедитесь, что это объекты Date.
5. В комментарии: 4 BSON-типа, которых нет в JSON, и зачем каждому (по одному предложению).
