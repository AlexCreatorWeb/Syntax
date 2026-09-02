# Урок 20. Структура приложения: routes / controllers

## Цель

После урока студент сможет: разложить Express-приложение на **routes** (таблица маршрутов), **controllers** (обработка запроса: валидация + ответ) и **services** (бизнес-логика без `req`/`res`), применить паттерн «тонкие маршруты, жирные сервисы» и собрать приложение по уроку 8 (слои) на реальном Express.

## Теория

### Зачем три слоя

Один файл «всё в `app.get`» разрастается: валидация, БД-запросы, бизнес-правила и `res.json` в одном обработчике. Разделение:

- **routes** (`routes/notes.js`) — только «метод + путь → контроллер». 3–5 строк на маршрут.
- **controllers** (`controllers/notes.js`) — «HTTP-слой»: читать `req` (params/query/body), **валидировать вход**, звать service, «переводить» результат в `res` (status, json). Ошибки сервиса → коды HTTP.
- **services** (`services/notes.service.js`) — **бизнес**: правила, оркестрация, «что делать». **Не знает** про HTTP (никаких `req`/`res`/`status`). Возвращает данные / бросает «доменные» ошибки.

Поток: `route → controller → service → model/БД`. Тестирование: service — **чистыми** юнит-тестами (без HTTP), controller — интеграционно.

### «Доменные» ошибки

Service бросает ошибки с **семантикой** (не HTTP-кодом, а «фактом»): `throw new Error("NOTE_NOT_FOUND")`, `throw new Error("TEXT_REQUIRED")`. Controller «переводит» в HTTP:

```js
try {
  const note = await notesService.create(body);
  res.status(201).json(note);
} catch (e) {
  if (e.message === "TEXT_REQUIRED") return res.status(400).json({ error: e.message });
  if (e.message === "NOTE_NOT_FOUND") return res.status(404).json({ error: e.message });
  throw e; // не «наша» — в error-middleware (500)
}
```

(Альтернатива — классы `AppError` с полем `status`; в песочнице проще по message.)

### Каркас (повтор уроков 8/16)

```
server.js          // listen
app.js             // express() + middleware + mount routes
routes/index.js    // apiRouter: use("/notes", notesRouter), use("/users", …)
routes/notes.js    // notesRouter: get/post/… → controllers
controllers/notes.js
services/notes.service.js
models/note.model.js  // (в песочнице — in-memory; в терминале — pg/mongo)
middleware/        // auth (урок 24), error (урок 19)
```

TIP: «толщина»控制器а — только HTTP-механика. Если в контроллере появилась `if (user.role === "admin")` — это **бизнес**, несите в service.

NOTE: в песочнице всё в одном `server.js`, но **логически** слои разделены баннерами-комментариями (`// ===== routes =====` и т.д.). В терминале — те же блоки в разных файлах (импорты ESM).

## Пример

`server.js` (песочница: слои-баннеры; в терминале — файлы):

```js
import express from "express";

// ===== model (in-memory; в терминале — pg/mongo) =====
const notesDB = [
  { id: 1, text: "Первая", done: false, owner: "u1" },
  { id: 2, text: "Вторая", done: true, owner: "u1" },
];
let nextId = 3;
const noteModel = {
  list: () => notesDB,
  get: (id) => notesDB.find((n) => n.id === Number(id)),
  create: ({ text, owner }) => { const n = { id: nextId++, text, done: false, owner }; notesDB.push(n); return n; },
  update: (id, patch) => { const n = noteModel.get(id); Object.assign(n, patch); return n; },
  remove: (id) => { const i = notesDB.findIndex((n) => n.id === Number(id)); if (i >= 0) notesDB.splice(i, 1); },
};

// ===== service (бизнес, без HTTP) =====
const notesService = {
  list: () => noteModel.list(),
  one: (id) => {
    const n = noteModel.get(id);
    if (!n) throw new Error("NOTE_NOT_FOUND");
    return n;
  },
  create: ({ text, owner }) => {
    if (!text || !String(text).trim()) throw new Error("TEXT_REQUIRED");
    return noteModel.create({ text: String(text).trim(), owner: owner || "anon" });
  },
  toggle: (id) => {
    const n = noteModel.one(id) ? noteModel.get(id) : null;
    if (!n) throw new Error("NOTE_NOT_FOUND");
    return noteModel.update(id, { done: !n.done });
  },
  remove: (id) => {
    if (!noteModel.get(id)) throw new Error("NOTE_NOT_FOUND");
    noteModel.remove(id);
  },
};

// ===== controller (HTTP-слой) =====
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const httpError = (e, res) => {
  if (e.message === "NOTE_NOT_FOUND") return res.status(404).json({ error: "not found" });
  if (e.message === "TEXT_REQUIRED") return res.status(400).json({ error: "text обязателен" });
  throw e;
};
const notesController = {
  list: asyncHandler(async (req, res) => res.json(notesService.list())),
  one: asyncHandler(async (req, res) => { try { res.json(notesService.one(req.params.id)); } catch (e) { httpError(e, res); } }),
  create: asyncHandler(async (req, res) => { try { res.status(201).json(notesService.create(req.body)); } catch (e) { httpError(e, res); } }),
  toggle: asyncHandler(async (req, res) => { try { res.json(notesService.toggle(req.params.id)); } catch (e) { httpError(e, res); } }),
  remove: asyncHandler(async (req, res) => { try { notesService.remove(req.params.id); res.status(204).end(); } catch (e) { httpError(e, res); } }),
};

// ===== routes (только маршруты) =====
const notesRouter = express.Router();
notesRouter.get("/", notesController.list);
notesRouter.get("/:id", notesController.one);
notesRouter.post("/", notesController.create);
notesRouter.patch("/:id/toggle", notesController.toggle);
notesRouter.delete("/:id", notesController.remove);

// ===== app + server =====
const app = express();
app.use(express.json());
app.use("/api/notes", notesRouter);
app.use((req, res) => res.status(404).json({ error: "not found" }));
app.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.message }));
app.listen(3000, () => console.log("Приложение по слоям (routes/controllers/services) на :3000"));
```

Проверка: `GET /api/notes` → 200; `POST /api/notes {text:"Новая"}` → 201; `PATCH /api/notes/1/toggle` → 200 (done: true); `DELETE /api/notes/2` → 204; `GET /api/notes/99` → 404.

## Частые ошибки

WARN: «жирные» маршруты: БД-запросы и бизнес-правила прямо в `app.get`. Вынесите в service (маршрут = 3 строки).

WARN: service знает про `res` (зовёт `res.json`). Service — **чистый**: возвращает данные / бросает ошибки; HTTP — в контроллере.

WARN: controller «глотает» все ошибки в 500 (не различает NOT_FOUND/VALIDATION). «Доменные» ошибки → 404/400; «неизвестные» → 500 (error-middleware).

WARN: модель (БД) зовётся из routes, минуя service. Поток всегда `route → controller → service → model`.

## Практическое задание

1. Переделайте «задачи» (урок 17) по слоям: `taskModel` (in-memory), `tasksService` (правила: title обязателен, ≤100 символов), `tasksController` (HTTP), `tasksRouter` (маршруты).
2. Добавьте в service правило: `priority` — только `"low"|"medium"|"high"` (иначе ошибка `BAD_PRIORITY` → 400).
3. Добавьте `GET /api/tasks/stats` (через service: `{ total, byPriority: {…} }`).
4. Проверьте: `POST /api/tasks {title:"X", priority:"urgent"}` → 400; `{title:"X", priority:"high"}` → 201; `stats` — считает.
5. В комментарии вверху файла — дерево папок (терминал) для этого кода.
