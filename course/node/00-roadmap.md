# Курс «Node.js: серверная разработка с нуля» (26 уроков) — дорожная карта

Целевая аудитория: студент, прошедший курсы HTML, CSS и JavaScript (знает ES6+, async/await, Promise, fetch, модули). Результат: студент пишет современный серверный JavaScript — от понимания архитектуры Node (V8, Event Loop, неблокирующий I/O) до готового REST API на Express с базой данных, JWT-авторизацией и защитой (Helmet, CORS). Только современный синтаксис: ESM (import/export), async/await, без CommonJS в примерах.

Источники: nodejs.org/docs (Event Loop, Streams, Built-ins), expressjs.com (Guide, API), документация pg / mongodb driver / jsonwebtoken / bcrypt / helmet / cors, бест-практики структурирования Node-проектов (по слоям), OWASP Top 10 (веб).

## Структура

M1. Архитектура Node.js (01-04)
01 — Node.js и V8: как работает рантайм, отличие от браузера
02 — Event Loop: фазы, макротаски/микротаски, неблокирующий I/O
03 — Колбэки, пирамида ужаса, Promise
04 — async/await: try/catch, параллельность (Promise.all)

M2. Экосистема и модули (05-08)
05 — ESM: import/export, "type": "module", __dirname в ESM
06 — npm: install, dependencies/devDependencies, package.json, lock
07 — npx, скрипты, переменные окружения (.env, dotenv)
08 — Структура Node-проекта: папки по слоям

M3. Встроенные модули (09-13)
09 — path: join/resolve/relative/parse
10 — fs: sync vs async, readFile/writeFile, коды ошибок
11 — fs-стримы: createReadStream/createWriteStream, pipe
12 — Buffer и кодировки (utf8/base64/hex)
13 — events: EventEmitter, on/once/off, конвенция 'error'

M4. HTTP (14-16)
14 — http с нуля: createServer, req/res, статус-коды
15 — URL, query, JSON API: GET/POST, body
16 — Мини-фреймворк: свой роутинг и middleware

M5. Express (17-20)
17 — Express: первый сервер, res.json, 404
18 — Router: params, query, вложенные маршруты
19 — Middleware: порядок, next(), error-middleware, async-ловушки
20 — Структура приложения: routes / controllers

M6. Базы данных (21-23)
21 — PostgreSQL: pg Pool, CRUD, параметризованные запросы
22 — MongoDB: драйвер, CRUD, ObjectId
23 — ORM/ODM: Prisma и Mongoose (паттерны)

M7. Авторизация и безопасность (24-25)
24 — Auth: bcrypt, JWT (sign/verify), auth-middleware
25 — Безопасность: Helmet, CORS, rate-limit, env в проде

M8. Финал (26)
26 — Финальный проект: REST API «Заметки» (Express + pg + JWT + Helmet/CORS)

## Логическая цепочка

1. **Что такое Node** (01): V8, один поток, `process`, отличие от браузера — без этого непонятен весь курс.
2. **Event Loop** (02): почему I/O не блокирует, макротаски/микротаски — сердце Node.
3. **Колбэки и Promise** (03): асинхронность руками → обёртка, которая решает «пирамиду ужаса».
4. **async/await** (04): синтаксис, на котором написан весь остальной курс.
5. **ESM** (05): import/export — как Node-код модулируется (и почему `__dirname` в ESM по-другому).
6. **npm** (06): откуда берутся express/pg/jwt — пакетный менеджер.
7. **npx + env** (07): запуск и конфигурация (секреты — в env, не в коде).
8. **Структура проекта** (08): папки по слоям — каркас для Express-уроков.
9. **path** (09): пути — первый встроенный модуль (и первая классика ошибок).
10. **fs** (10): файлы, sync/async, коды ошибок (ENOENT) — «безопасная обработка ошибок» на практике.
11. **fs-стримы** (11): pipe — паттерн, который везде (HTTP, БД).
12. **Buffer** (12): байты и кодировки — то, что стоит под строками.
13. **events** (13): EventEmitter — архитектура, на которой стоят http/streams/БД.
14. **http** (14): сервер без фреймворка — понимаешь, что делает Express под капотом.
15. **URL/JSON/POST** (15): анатомия REST-запроса.
16. **Мини-фреймворк** (16): свои middleware+роутинг — перед Express.
17. **Express** (17): тот же паттерн, но готовый: app, маршруты, res.json, 404.
18. **Router** (18): params/query — динамические маршруты.
19. **Middleware** (19): конвейер обработки, error-middleware, async-ловушки.
20. **Структура** (20): routes/controllers — чистое приложение.
21. **PostgreSQL** (21): Pool, CRUD, $-параметры, SQL-инъекции.
22. **MongoDB** (22): document-модель, CRUD.
23. **ORM/ODM** (23): Prisma/Mongoose — когда магия оправдана.
24. **Auth** (24): хеширование, JWT, защищённые маршруты.
25. **Безопасность** (25): заголовки, CORS, лимиты, секреты.
26. **Финальный проект** (26): всё вместе — REST API «Заметки».

## Контракт урока (фиксированный, QC в сидере)

5 разделов в строгом порядке:
1. `## Цель` — «После урока студент сможет: …»
2. `## Теория` — простые объяснения, `###`-подзаголовки
3. `## Пример` — рабочий код в ```js-блоке (полный `server.js` — воспроизводим в терминале Node и в раннере платформы)
4. `## Частые ошибки` — минимум 1 `WARN:` (по одной на ловушку)
5. `## Практическое задание` — нумерованный список с TODO

Правила контента:
- минимум 1 `TIP:` и 1 `WARN:`-callout; `NOTE:` — для «как это работает в платформе Syntax»
- без таблиц, без markdown-ссылок `[t](u)` (ссылки — прозой)
- объём content 4000–7000 зн.
- **кодовое задание `code/NN.js` = скелет ЗАДАНИЯ** (НЕ решение): исполняемый `server.js` (ESM) с `// TODO`-комментариями
- весь код — ESM (`import`/`export`), async/await; в терминале: `node server.js` (Node 18+, `"type": "module"` в package.json)

## Механика платформы

- Файл задания Node-трека = `server.js` (TASK_FILE в lessonJob.js).
- **Node-раннер** (CodeEditor): `server.js` (ESM) → blob-module в «Node-sandbox» (браузер): шимы встроенных модулей в `globalThis.__shims` (fs — in-memory, path — posix, streams, mock `http` + хелпер **`__request(method, url, { body, headers })`** для проверки API без curl, mini-Express, `pg`/`mongodb`-моки (in-memory), JWT HS256, helmet/cors), import map (data:-модули; `events` — настоящий esm.sh). `process.env` предзаполнен демо-значениями. Консоль перехватывается; ошибки — с номерами строк файла (blob = код как есть). В материале уроков: NOTE, что в раннере БД/файлы — in-memory-имитация, а в терминале — настоящие PostgreSQL/MongoDB/диск.
- Материал урока (markdown-lite): `##`/`###`, **жирный**, *курсив*, `код`, ```js-блоки (Copy), TIP:/NOTE:/WARN:-callout'ы.
- Сидер `seed-node-course.mjs`: IDEMPOTENT (удаляет ВСЕ tech='node', вставляет 26, id `60000000-…00NN`), встроенный QC (5 разделов, TIP/WARN, ```js, объём, ссылки) — падает до БД при нарушении; `DRY=1 node …` — только проверка.

## Источники (первичные)

- nodejs.org/en/learn/getting-started — first application, modules, built-ins
- nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick — Event Loop
- nodejs.org/api — fs, path, http, stream, buffer, events
- expressjs.com — Guide (Routing, Middleware, API)
- node-postgres (pg) README; mongodb.com/docs/drivers — CRUD
- jsonwebtoken.com (HS256 sign/verify); bcrypt (хеширование)
- helmetjs.github.io; express-cors (CORS); OWASP Top 10 (веб)
