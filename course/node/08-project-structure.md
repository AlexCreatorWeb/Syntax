# Урок 8. Структура Node-проекта: папки по слоям

## Цель

После урока студент сможет: проектировать каталоги Express-приложения (routes / controllers / services / models / middleware / utils / config), объяснять, зачем слои (разделение ответственности, теструемость), помещать файлы в правильную папку и держать `server.js` «тонким» (запуск + сборка приложения).

## Теория

### Зачем структура

Когда в приложении 5 маршрутов, 3 БД, JWT, валидация — «один файл на всё» перестаёт работать. **Слои** — это разделение по **ответственности**:

- **routes** — *что* и *куда*: `app.get("/notes", notesRouter)`. Тонкие, только маршруты.
- **controllers** — *обработка запроса*: читать body/params, валидировать, звать service, резать ответ (status, json). Здесь живёт `req`/`res`.
- **services** — *бизнес-логика*: правила, расчёты, оркестрация. **Не знают** про `req`/`res` (чистые функции) → легко тестировать.
- **models** (или repositories) — *данные*: работа с БД (запросы pg / Mongo). Только CRUD + специфичные запросы.
- **middleware** — поперечные вещи: auth, логирование, error-handler.
- **utils** — чистые помощники (форматирование, даты).
- **config** — конфигурация (из env, один объект).

Правило потока: **route → controller → service → model**. Обратных зависимостей нет (model не зовёт controller).

### Типовой каркас

```
my-api/
  server.js            // ТОЛЬКО запуск: import app, app.listen
  app.js               // сборка приложения: express(), middleware, маршруты
  src/
    config/index.js    // config из env
    routes/
      index.js         // собирает все роутеры: app.use("/notes", notesRouter)
      notes.js
      auth.js
    controllers/
      notes.js
      auth.js
    services/
      notes.service.js
      users.service.js
    models/
      note.model.js
      user.model.js
    middleware/
      auth.js          // проверка JWT
      error.js         // error-handler
    utils/
      asyncHandler.js
  .env
  .env.example
  .gitignore
  package.json
  package-lock.json
  README.md
```

### Тонкий server.js

`server.js` делает **две** вещи: инициализация (config, подключение БД) и `app.listen`. Всё остальное — в `app.js` (модуль, который можно импортировать в тестах без запуска сервера).

```js
// server.js
import app from "./app.js";
import { config } from "./src/config/index.js";
app.listen(config.port, () => console.log("API на :" + config.port));
```

TIP: начинайте с **плоской** структуры (всё в `src/`), слоите по слоям, когда файлов станет больше 10–15. Премature-абстракция хуже плоскости.

NOTE: в песочнице платформы задания **однофайловые** (`server.js`), поэтому «слои» будут функциями в одном файле (route-обработчик = controller, чистая логика = service). Привыкайте мыслить слоями — в терминале те же функции разнесутся по папкам без изменения кода.

## Пример

`server.js` (песочница: «слои» — функции одного файла):

```js
// ============ config (src/config/index.js) ============
const config = {
  port: Number(process.env.PORT) || 3000,
  env: process.env.NODE_ENV || "development",
};

// ============ model (src/models/note.model.js) ============
const notesDB = [
  { id: 1, text: "Изучить Event Loop", done: true },
  { id: 2, text: "Сделать REST API", done: false },
];
let nextId = 3;
const noteModel = {
  list: () => notesDB,
  get: (id) => notesDB.find((n) => n.id === Number(id)),
  create: ({ text }) => {
    const n = { id: nextId++, text, done: false };
    notesDB.push(n);
    return n;
  },
};

// ============ service (src/services/notes.service.js) ============
// бизнес-логика: «нельзя создать пустую заметку»
const notesService = {
  list() {
    return noteModel.list();
  },
  create(input) {
    if (!input.text || !String(input.text).trim()) throw Object.assign(new Error("text обязателен"), { status: 400 });
    return noteModel.create({ text: String(input.text).trim() });
  },
};

// ============ route + controller (src/routes/notes.js) ============
import express from "express";
const router = express.Router();

router.get("/", (req, res) => res.json(notesService.list()));
router.post("/", (req, res) => {
  const n = notesService.create(req.body);
  res.status(201).json(n);
});

// ============ app (app.js) ============
import express from "express";
const app = express();
app.use(express.json());
app.use("/api/notes", router);

// ============ server.js ============
app.listen(config.port, () => console.log("API (слои: route → controller → service → model) на :" + config.port));
```

Проверка: `__request("POST", "/api/notes", { body: { text: "Новая" } })` → 201; `__request("GET", "/api/notes")` → массив из 3.

## Частые ошибки

WARN: «бог-файл»: все маршруты, логика, SQL и JWT в одном `server.js` на 800 строк. Разделите по слоям (хотя бы функциями — в песочнице).

WARN: service/model знают про `req`/`res` (зовут `res.json` из «бизнес-логики»). Тогда их невозможно тестировать без HTTP. `req`/`res` — только в controller/route.

WARN: controller шлёт запросы в БД напрямую (минуя service). Бизнес-правила размазываются по маршрутам.

WARN: `server.js` толстый (маршруты, middleware, логика). Сервер = `listen` + сборка `app`; остальное — модули.

## Практическое задание

1. В `server.js` организуйте код по «слоям» (разделите комментариями-баннерами): `config`, `model` (in-memory пользователи), `service` (логика: имя обязательно, email уникальный), `controller` (обработчики), `route` (Router), `app`, `listen`.
2. Маршруты: `GET /api/users` (список), `POST /api/users` (создать), `GET /api/users/:id`.
3. Правило service: email без `@` → ошибка 400; дубликат email → 409.
4. Проверьте через `__request`: создание валидного, создание дубликата (409), получение несуществующего id (404).
5. В комментарии вверху файла нарисуйте текстовое дерево папок, как эти «слои» выглядели бы в терминале (src/routes, src/controllers, …).
