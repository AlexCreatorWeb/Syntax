# Курс «MongoDB: NoSQL-базы данных с нуля» (18 уроков) — дорожная карта

Целевая аудитория: студент, прошедший JS (ES6+, async/await) и знающий основы Node (модули, npm). Результат: студент проектирует документные схемы, работает с MongoDB (mongosh/MongoDB Shell), строит индексы и агрегации и интегрирует БД в Node.js через Mongoose (схемы, валидация, модели). Только современный стек: MongoDB 7.x, mongosh, driver 6.x, Mongoose 8.x.

Источники: mongodb.com/docs (Manual: CRUD, Query Operators, Update Operators, Indexes, Aggregation, Data Modeling), mongodb.com/docs/drivers, mongoosejs.com/docs, бест-практики data modeling (Embed vs Reference, 16 МБ limit).

## Структура

M1. Основы NoSQL (01-03)
01 — NoSQL и MongoDB: отличие от SQL, когда что применять, mongosh и Compass
02 — Документы, BSON и ObjectId: единицы данных
03 — Базы данных и коллекции: структура, создание, списки

M2. CRUD (04-07)
04 — insertOne/insertMany: запись данных
05 — find: фильтры, проекция, sort, limit/skip (пагинация)
06 — updateOne/updateMany: $set vs полная замена, upsert, replaceOne
07 — deleteOne/deleteMany + практика CRUD

M3. Операторы (08-09)
08 — Операторы выборки: $eq/$ne/$gt/$in/$and/$or/$exists/$regex
09 — Массивы и вложенность: dot-нотация, $push/$addToSet/$pull/$pop, $elemMatch

M4. Проектирование (10-11)
10 — Связи: Embed vs Reference (правила выбора, 16 МБ)
11 — Практика моделирования: блог и магазин (схемы с объяснением)

M5. Производительность (12-13)
12 — Индексы: создание, составные, unique, объяснение плана (explain)
13 — Производительность: выбор индекса, FULL SCAN, count/distinct

M6. Агрегация (14-15)
14 — Aggregation Framework: конвейер, $match, $project, $group
15 — Сложные агрегации: $sort/$limit/$unwind/$lookup/$addFields (аналитика)

M7. Mongoose (16-18)
16 — Mongoose: connect, Schema, Model, CRUD
17 — Mongoose: валидация, defaults, timestamps, virtuals, статик
18 — Финальный проект: API «Блог» (Mongoose + Express: модели, маршруты, агрегация-аналитика)

## Логическая цепочка

1. **NoSQL/MongoDB vs SQL** (01): зачем документная БД, экосистема (mongosh/Compass), подключение.
2. **Документы/BSON/ObjectId** (02): единицы данных; почему `_id` — ObjectId; типы BSON ≠ JSON.
3. **БД и коллекции** (03): иерархия instance→db→collection; схема «на лету».
4. **INSERT** (04): запись, `_id` автоматически, `insertedId`.
5. **FIND** (05): выборка, проекция (только нужные поля), сортировка, пагинация.
6. **UPDATE** (06): `$set` (часть) vs replacement (весь документ — главная ловушка), upsert.
7. **DELETE** (07): один/многие; CRUD замкнут.
8. **Операторы выборки** (08): сравнения, логика, регулярки — «SQL WHERE по-полному».
9. **Массивы/вложенность** (09): сила и ловушки (мутация, dot-нотация, $elemMatch).
10. **Embed vs Reference** (10): сердцевина моделирования NoSQL.
11. **Практика схем** (11): применяем правила на бложке/магазине.
12. **Индексы** (12): почему без индекса — FULL SCAN; составные, unique.
13. **Производительность** (13): explain, выбор индекса, типичные грабли.
14. **Агрегация I** (14): конвейер + $match/$project/$group — «GROUP BY и аналитика».
15. **Агрегация II** (15): $unwind/$lookup («JOIN»)/выражения — реальные отчёты.
16. **Mongoose** (16): schema/model/CRUD — типизация и удобство.
17. **Mongoose-фичи** (17): валидация/defaults/timestamps/virtuals — production-схема.
18. **Финальный проект** (18): API «Блог» (модели + маршруты + агрегация-аналитика).

## Контракт урока (фиксированный, QC в сидере)

5 разделов в строгом порядке:
1. `## Цель` — «После урока студент сможет: …»
2. `## Теория` — простые объяснения, `###`-подзаголовки
3. `## Пример` — рабочий код в ```js-блоке (MongDB Shell-команды в тексте — в ```js тоже)
4. `## Частые ошибки` — минимум 1 `WARN:` (по одной на ловушку)
5. `## Практическое задание` — нумерованный список с TODO

Правила контента:
- минимум 1 `TIP:` и 1 `WARN:`-callout; `NOTE:` — «как это в песочнице Syntax»
- без таблиц, без markdown-ссылок `[t](u)`
- объём content 4000–7000 зн.
- **`code/NN.js` = скелет ЗАДАНИЯ** (НЕ решение): исполняемый `models.js` (ESM) с `// TODO`; shell-команды — в материале
- весь код — ESM, async/await

## Механика платформы

- Файл задания mongo-трека = `models.js` (TASK_FILE в lessonJob.js).
- **Node-раннер** (CodeEditor) поддерживает mongo: import map даёт `mongodb` (расширенный mock: фильтры $gt/$in/$or/$regex/$elemMatch/$exists, dot-нотация, $push/$addToSet/$pull/$inc/$unset/$pop, upsert, distinct, aggregate-конвейер $match/$project/$group/$sort/$limit/$skip/$unwind/$lookup/$addFields + выражения $sum/$avg/$concat/$toUpper/…, createIndex/listIndexes/dropIndex) и **`mongoose`** (mock: Schema с required/default/type, Model: create/find/findOne/findById/save/validate (ValidationError)/findByIdAndUpdate/aggregate/countDocuments/distinct). `new MongoClient(url)` + `client.db(name).collection(c)` — как в драйвере. Данные — in-memory (живут до перезагрузки). В терминале — настоящий mongod (npm i mongodb / mongoose, MONGO_URL в .env).
- Сидер `seed-mongo-course.mjs`: IDEMPOTENT (удаляет ВСЕ tech='mongo', вставляет 18, id `70000000-…00NN`), встроенный QC (5 разделов, TIP/WARN, ```js, объём, ссылки); `DRY=1 node …` — только проверка.

## Источники (первичные)

- mongodb.com/docs/manual/crud — insert/find/update/delete
- mongodb.com/docs/manual/reference/operator/query — операторы выборки
- mongodb.com/docs/manual/reference/operator/update — операторы обновления
- mongodb.com/docs/manual/indexes — индексы (compound, unique, explain)
- mongodb.com/docs/manual/core/aggregation-pipeline — Aggregation Framework
- mongodb.com/docs/manual/data-modeling — Embed vs Reference, design patterns
- mongodb.com/docs/compass — Compass (GUI)
- mongoosejs.com/docs — Schemas, Models, Validation, Querying
