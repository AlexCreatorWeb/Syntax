# Урок 17. Express: первый сервер, res.json, 404

## Цель

После урока студент сможет: поднять Express-сервер (`express()`, `app.listen`), описывать маршруты (`app.get/post/put/delete`), отвечать через `res.json`/`res.status`/`res.send`, читать `req.query`/`req.params`/`req.body` (с `express.json()`), выводить «404 JSON» для неизвестных путей и понимать, что Express — тот же паттерн, что в уроке 16, но «боевой».

## Теория

### Первый сервер

```js
import express from "express";
const app = express();

app.get("/", (req, res) => {
  res.json({ hello: "Express" });
});

app.listen(3000, () => console.log("API на :3000"));
```

`express()` — «приложение» (в терминале это отдельный `app.js`, запуск — `server.js`). `app.listen` — HTTP-сервер (под капотом — `http.createServer`, урок 14).

### Маршруты и «ручки»

- `app.METHOD(path, handler, …handler2)` — метод + путь + одна/несколько функций (конвейер: каждая вызывает `next()` или отвечает).
- **`res.json(obj)`** — `Content-Type: application/json` + `JSON.stringify` + `end`. **`res.status(code).json(…)`** — с кодом. **`res.send(str)`** — текст/HTML. **`res.status(204).end()`** — без тела.
- **`req.query`** — объект query (`?a=1` → `{a:"1"}`, строки!).
- **`req.params`** — параметры пути (`/users/:id` → `{id:"…"}`).
- **`req.body`** — тело **после** `app.use(express.json())` (без него — `undefined`!).

### Порядок: middleware → маршруты → 404

```js
app.use(express.json());        // (1) middleware (body-парсер)
app.get("/notes", …);           // (2) маршруты
app.use((req, res) => res.status(404).json({ error: "not found" })); // (3) «остаток»
```

`app.use(fn)` без пути — для **всех** запросов, дошедших до этой строки. «404-хвост» — middleware **после** всех маршрутов: если никто не ответил — 404.

### Версии Express

Express 4 (стабильный, «классика») и Express 5 (новый мажор: async-ошибки сами в error-handler, wildcard-синтаксис). Курс — **Express 4** (самый распространённый в проде); различия упомянем в уроке 19.

TIP: `res.status(201).json(obj)` — «создано» (POST). `res.status(204).end()` — «удалили/обновили без тела». Коды — семантика (урок 14).

NOTE: в песочнице `express` — mini-реализация (тот же API: `express()`, `Router`, `use`, `get/post/…`, `express.json()`, `req.body`, `res.json/status`), проверять — `__request`. В терминале — настоящий Express (`npm i express`).

## Пример

`server.js`:

```js
import express from "express";

const app = express();
app.use(express.json()); // body-парсер (ДО маршрутов, которые читают req.body)

const notes = [
  { id: 1, text: "Первая" },
  { id: 2, text: "Вторая" },
];
let nextId = 3;

// GET /notes?per=N
app.get("/notes", (req, res) => {
  const per = Number(req.query.per) || notes.length;
  res.json(notes.slice(0, per));
});

// GET /notes/:id
app.get("/notes/:id", (req, res) => {
  const note = notes.find((n) => n.id === Number(req.params.id));
  if (!note) return res.status(404).json({ error: "not found" });
  res.json(note);
});

// POST /notes
app.post("/notes", (req, res) => {
  const { text } = req.body;
  if (typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "text обязателен" });
  }
  const note = { id: nextId++, text: text.trim() };
  notes.push(note);
  res.status(201).json(note);
});

// DELETE /notes/:id
app.delete("/notes/:id", (req, res) => {
  const i = notes.findIndex((n) => n.id === Number(req.params.id));
  if (i === -1) return res.status(404).json({ error: "not found" });
  notes.splice(i, 1);
  res.status(204).end();
});

// 404-хвост (ПОСЛЕ всех маршрутов)
app.use((req, res) => res.status(404).json({ error: "not found: " + req.path }));

app.listen(3000, () => console.log("Express API на :3000"));
```

Проверка: `GET /notes` → 200; `GET /notes/1` → 200; `GET /notes/99` → 404; `POST /notes {text:"Третья"}` → 201; `POST /notes {}` → 400; `DELETE /notes/2` → 204; `GET /nope` → 404 (хвост).

## Частые ошибки

WARN: читаете `req.body` без `app.use(express.json())` — `undefined` (body не распаршен). Парсер — **до** маршрутов.

WARN: `req.params.id === 42` (число). Params — **строки**: `Number(req.params.id)`.

WARN: 404-хвост **до** маршрутов — все запросы «умирают» на 404. Порядок: middleware → маршруты → 404.

WARN: `res.json` после `res.end` (двойной ответ, warning «headers sent»). Один ответ на запрос: `return` после `res.…`.

## Практическое задание

1. Сделайте Express API «задач»: `GET /tasks` (200, список), `POST /tasks` (201; валидация `title`), `GET /tasks/:id` (200/404), `DELETE /tasks/:id` (204/404).
2. Добавьте `PATCH /tasks/:id` (200; обновить `done: true/false`; 404 если нет).
3. Добавьте 404-хвост (JSON) и убедитесь, что `GET /unknown` → 404 с телом.
4. Добавьте `GET /stats` → `{ total, done, pending }`.
5. Проверьте всё через `__request`, выведите статусы; убедитесь, что 204 — без тела.
