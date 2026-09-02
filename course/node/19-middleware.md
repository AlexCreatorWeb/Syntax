# Урок 19. Middleware: порядок, next(), error-middleware, async-ловушки

## Цель

После урока студент сможет: писать собственные middleware (логгер, ограничитель, авторизация), объяснять порядок и «краткий возврат», обрабатывать ошибки через **error-middleware** (4 аргумента: `(err, req, res, next)`), ловить ошибки из **async**-обработчиков (Express 4: `asyncHandler`-обёртка) и собирать «каркас» приложения из middleware-цепочки.

## Теория

### Middleware: анатомия

Middleware — функция `(req, res, next)`. Два исхода: **ответить** (`res.…` — цепочка окончена) или **продолжить** (`next()` — следующий шаг). `next(err)` — «передать ошибку» в error-middleware.

```js
app.use((req, res, next) => {
  const t0 = Date.now();
  res.on("finish", () => console.log(req.method, req.path, Date.now() - t0, "мс"));
  next(); // НЕ отвечаем — продолжаем
});
```

**Порядок** регистрации = порядок выполнения. Классический «каркас»:

```js
app.use(helmet());          // заголовки (урок 25)
app.use(cors());            // CORS (урок 25)
app.use(express.json());    // body
app.use(logger);            // лог
app.use("/api", auth);      // авторизация (урок 24)
app.use("/api", apiRouter); // маршруты
app.use(notFound);          // 404
app.use(errorHandler);      // ошибки (В САМОМ КОНЦЕ)
```

### Error-middleware: 4 аргумента

Обычная middleware — 3 аргумента. **Error-middleware — 4**: `(err, req, res, next)`. Express «понимает» её по арности. Вызывается, когда: (1) `next(err)` из предыдущего шага, (2) ошибка **в синхронном** коде обработчика. Ответ в ней **обязателен** (иначе запрос висит):

```js
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "internal" });
});
```

### async-ловушка (Express 4)

В **Express 4** ошибка из `async`-обработчика **не** попадает в error-middleware (returned Promise «теряется») → запрос виснет или 500 «молча». Решение — обёртка:

```js
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

app.get("/notes/:id", asyncHandler(async (req, res) => {
  const note = await db.find(req.params.id); // ошибка → next(err) → errorHandler
  res.json(note);
}));
```

(В **Express 5** async-ошибки уходят в error-middleware **автоматически** — обёртка не нужна. Курс на Express 4 — держим `asyncHandler`.)

### «Краткий возврат» и `next`

После `res.status(…).json(…)` — `return` (иначе код пойдёт дальше). `next()` без аргументов — «всё ок, следующий». `next("строка")` — создаст `Error` с этим message.

TIP: логгер через `res.on("finish", …)` — сработает **когда ответ реально ушёл** (не когда вызвали `res.json`). Для «сколько времени занял запрос» — точнее, чем замер в обработчике.

NOTE: в песочнице error-middleware и `next(err)` работают как в Express 4; async-обработчики без `asyncHandler` — тоже «теряют» ошибку (поведение совпадает).

## Пример

`server.js`:

```js
import express from "express";

const app = express();
app.use(express.json());

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// 1) Логгер (res.on finish)
app.use((req, res, next) => {
  const t0 = Date.now();
  res.on("finish", () => console.log("LOG:", req.method, req.path, res.statusCode, (Date.now() - t0) + "мс"));
  next();
});

// 2) Middleware-«ограничитель» (пример: только /api)
app.use("/api", (req, res, next) => {
  res.setHeader("X-Api", "true");
  next();
});

// 3) Синхронная ошибка через next(err)
app.get("/api/sync-err", (req, res, next) => {
  next(Object.assign(new Error("синхронный сбой"), { status: 400 }));
});

// 4) Async-ошибка через asyncHandler
const db = { async find(id) { if (id === "boom") throw Object.assign(new Error("БД упала"), { status: 500 }); return { id, text: "заметка " + id }; } };
app.get("/api/notes/:id", asyncHandler(async (req, res) => {
  const note = await db.find(req.params.id);
  res.json(note);
}));

// 5) 404
app.use((req, res) => res.status(404).json({ error: "not found" }));

// 6) Error-middleware (4 аргумента, В КОНЦЕ)
app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({ error: err.message, status });
});

app.listen(3000, () => console.log("Middleware-каркас на :3000"));
```

Проверка: `GET /api/notes/5` → 200 + заголовок `X-Api` + строка LOG; `GET /api/sync-err` → 400 `{error:"синхронный сбой"}`; `GET /api/notes/boom` → 500 (asyncHandler сработал); `GET /nope` → 404.

## Частые ошибки

WARN: async-обработчик без `asyncHandler` (Express 4) — ошибка «пропадает», запрос виснет. Обёртка обязательна (или Express 5).

WARN: error-middleware **до** маршрутов — ошибки маршрутов её не видят (она уже «прошла»). Error-handler — **последним**.

WARN: error-middleware с 3 аргументами `(req, res, next)` — Express считает её **обычной** (err не передаётся). Арность 4 — маркер.

WARN: middleware «забыл» `next()` и не ответил — запрос **висит**. Два исхода: `res.…` **или** `next()`.

## Практическое задание

1. Напишите middleware `requestId`: генерирует `crypto.randomUUID()` (или `Date.now()+random`), кладёт в `req.id` и заголовок ответа `X-Request-Id`.
2. Напишите middleware `timing` (через `res.on("finish")`): лог `method path status duration`.
3. Добавьте `asyncHandler` и маршрут `GET /api/data/:id`, где «БД» (объект с async-методом) бросает ошибку при `id === "fail"` (status 503).
4. Соберите каркас: `requestId` → `timing` → `express.json()` → маршруты → 404 → error-handler.
5. Проверьте: `GET /api/data/ok` → 200 + `X-Request-Id`; `GET /api/data/fail` → 503; `GET /x` → 404; в логах — строки timing.
