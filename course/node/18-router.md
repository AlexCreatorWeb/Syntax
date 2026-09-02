# Урок 18. Router: params, query, вложенные маршруты

## Цель

После урока студент сможет: выносить группы маршрутов в `express.Router()`, монтировать роутеры с префиксом (`app.use("/api/notes", router)`), использовать `:param` и множественные параметры, читать `req.query` с дефолтами, организовывать «разделенные» ресурсы (CRUD-роутер) и понимать, как роутеры вкладываются (суб-роутеры).

## Теория

### express.Router()

**Router** — «мини-приложение» со своими маршрутами и middleware. Зачем: группировка (все маршруты ресурса — в одном файле), переиспользование (один роутер в двух местах), изоляция middleware (только для префикса).

```js
import express from "express";
const router = express.Router();

router.get("/", (req, res) => res.json([…]));       // → GET /api/notes
router.get("/:id", (req, res) => { … });            // → GET /api/notes/5
router.post("/", (req, res) => { … });              // → POST /api/notes

const app = express();
app.use("/api/notes", router); // префикс «приклеивается»
```

Внутри роутера `req.path` — **относительно** префикса (`/api/notes/5` → в обработчике `req.path === "/5"`).

### Params и query

- `:id` — один сегмент: `/notes/:id` → `req.params.id`.
- Несколько: `/users/:userId/notes/:noteId` → оба в `req.params`.
- Query: `req.query` (объект, **строки**). Дефолты: `const page = Number(req.query.page) || 1`.
- Типизация на входе: `Number(…)`, проверка диапазона — **в обработчике** (до БД).

### Структура CRUD-роутера

```js
router.get("/", list);        // список
router.get("/:id", one);      // один
router.post("/", create);     // создать
router.put("/:id", replace);  // полная замена
router.patch("/:id", update); // частичное обновление
router.delete("/:id", remove); // удалить
```

Это **каноническая** форма REST-роутера — запоминаем.

### Вложенные роутеры

`router.use("/sub", subRouter)` — префикс **внутри** роутера. Итог: `app.use("/api", apiRouter)` + `apiRouter.use("/notes", notesRouter)` → `/api/notes/…`. Глубину держите разумной (2 уровня — норма).

TIP: middleware **внутри** роутера (`router.use(auth)`) — applies только к маршрутам этого роутера. Для «auth только на /api/private» — `router.use("/private", auth, privateRouter)`.

NOTE: в песочнице `express.Router()` — тот же API (префиксы, params, `router.use`). `__request` бьёт по полным путям (`/api/notes/1`).

## Пример

`server.js`:

```js
import express from "express";

const app = express();
app.use(express.json());

// ===== Роутер «заметки» (CRUD) =====
const notes = [
  { id: 1, title: "Первая", done: false },
  { id: 2, title: "Вторая", done: true },
];
let nextId = 3;

const notesRouter = express.Router();

notesRouter.get("/", (req, res) => {
  const per = Number(req.query.per) || 20;
  const skip = Number(req.query.skip) || 0;
  res.json(notes.slice(skip, skip + per));
});

notesRouter.get("/:id", (req, res) => {
  const note = notes.find((n) => n.id === Number(req.params.id));
  if (!note) return res.status(404).json({ error: "not found" });
  res.json(note);
});

notesRouter.post("/", (req, res) => {
  const { title } = req.body;
  if (!title || !String(title).trim()) return res.status(400).json({ error: "title обязателен" });
  const note = { id: nextId++, title: String(title).trim(), done: false };
  notes.push(note);
  res.status(201).json(note);
});

notesRouter.patch("/:id", (req, res) => {
  const note = notes.find((n) => n.id === Number(req.params.id));
  if (!note) return res.status(404).json({ error: "not found" });
  if (typeof req.body.done === "boolean") note.done = req.body.done;
  res.json(note);
});

notesRouter.delete("/:id", (req, res) => {
  const i = notes.findIndex((n) => n.id === Number(req.params.id));
  if (i === -1) return res.status(404).json({ error: "not found" });
  notes.splice(i, 1);
  res.status(204).end();
});

// ===== Роутер «пользователи» (с вложенным «заметки пользователя») =====
const usersRouter = express.Router();
usersRouter.get("/:userId/notes", (req, res) => {
  res.json({ userId: Number(req.params.userId), notes: notes.slice(0, 2) });
});

// ===== Сборка =====
const apiRouter = express.Router();
apiRouter.use("/notes", notesRouter);
apiRouter.use("/users", usersRouter);
app.use("/api", apiRouter);

app.use((req, res) => res.status(404).json({ error: "not found" }));
app.listen(3000, () => console.log("API с Router на :3000"));
```

Полные пути: `GET /api/notes`, `GET /api/notes/1`, `POST /api/notes`, `PATCH /api/notes/1`, `DELETE /api/notes/2`, `GET /api/users/7/notes`.

## Частые ошибки

WARN: путаете `app.get` и `router.get` «вместо» — монтируете роутер **без** префикса (`app.use(router)`), а пути в роутере без `/api` — API «едет». Префикс = в `app.use("/api", router)`.

WARN: `req.params.id` сравниваете с числом. Строка! `Number(req.params.id)`.

WARN: вложенные маршруты «перекрывают»: `router.get("/:id")` зарегистрирован **до** `router.get("/special")` — `/special` уйдёт в `:id` (id="special"). Конкретные пути — **перед** параметризованными.

WARN: query-параметры «пропадают» после префикса: ищете `req.query` в «родительском» роутере. Query доступен в любом обработчике (это свойство запроса, не роутера).

## Практическое задание

1. Сделайте `productsRouter`: `GET /` (с `?min=..&max=..` по цене), `GET /:id`, `POST /` (валидация `name`+`price`), `DELETE /:id`.
2. Добавьте `ordersRouter`: `GET /` (список), `POST /` (принимает `{ productId, qty }`; проверка существования товара → 404).
3. Соберите: `app.use("/api", api)`; `api.use("/products", productsRouter)`; `api.use("/orders", ordersRouter)`.
4. В `productsRouter` добавьте **внутренний** middleware-логгер (`router.use((req,res,next)=>{…next()})`) — убедитесь, что он срабатывает только на `/api/products/*`.
5. Проверьте: `POST /api/orders { productId: 999 }` → 404; `GET /api/products?min=10&max=100` — фильтрует.
