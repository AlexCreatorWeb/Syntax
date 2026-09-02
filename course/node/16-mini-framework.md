# Урок 16. Мини-фреймворк: свой роутинг и middleware

## Цель

После урока студент сможет: собрать «мини-Express» (конвейер middleware + таблица маршрутов с паттернами `:param`), объяснить, что такое middleware (функция `(req, res, next)`), понять порядок обработки и «краткий возврат» (`res.end` без `next`), и сознательно использовать Express (урок 17) зная, что под капотом.

## Теория

### Что делает фреймворк

Express (и любой фреймворк) решает три задачи: (1) **роутинг** — «какой обработчик для METHOD + path», (2) **конвейер middleware** — поперечные шаги (лог, JSON-body, auth) в правильном порядке, (3) **удобный `res`** (`res.json`, `res.status`). Всё это — ~100 строк. Соберём.

### Middleware: `(req, res, next)`

Middleware — функция, которая получает `(req, res, next)`: либо **обрабатывает и завершает** (вызывает `res.end` — дальше не идёт), либо **продолжает цепочку** (`next()`). Классика:

```js
app.use(logMiddleware);      // для всех запросов
app.use(jsonBody);           // распарсить body
app.use("/api", authCheck);  // для префикса
app.get("/notes", listNotes); // маршрут (тоже middleware, но «конечный»)
```

Порядок = порядок регистрации. `next()` — «мой шаг сделан, следующий». `res.end` без `next` — «ответ ушёл, цепочка окончена».

### Роутинг с `:param`

Паттерн `/notes/:id` матчит `/notes/42` и извлекает `id = "42"` в `req.params.id`. Алгоритм: разбить паттерн и URL на сегменты, по позициям: `:xxx` → «любой сегмент, сохранить в params[xxx]», иначе — точное совпадение.

### Мини-дизайн

```js
const app = {
  stack: [],      // { method, pattern, handler } | { method:"*", pattern, handler } (use)
  use(fn) { this.stack.push({ method: "*", pattern: "/", handler: fn, isUse: true }); },
  get(p, h) { this.stack.push({ method: "GET", pattern: p, handler: h }); },
  post(p, h) { this.stack.push({ method: "POST", pattern: p, handler: h }); },
  handle(req, res) { /* конвейер: идти по stack, next = следующий */ },
};
```

`app.listen` — оборачивает `http.createServer((req, res) => app.handle(req, res))`.

TIP: в `handle` храните **индекс** текущего шага и `next = () => step(i + 1)`; «краткий возврат» — `res.end` (проверка `res.writableEnded` — не шагаем дальше). Это **в точности** то, что делает Express.

NOTE: мини-фреймворк — «учебный»: в песочнице он работает поверх mock-`http` (и `__request`). В терминале — поверх настоящего `http`. Express (урок 17) — тот же паттерн, но с Router, error-handling, статикой и 20 годами баг-фиксов.

## Пример

`server.js`:

```js
import http from "http";

function createApp() {
  const stack = [];
  const app = {
    use(pattern, fn) { stack.push({ method: "*", pattern, fn }); },
    get(p, fn) { stack.push({ method: "GET", pattern: p, fn }); },
    post(p, fn) { stack.push({ method: "POST", pattern: p, fn }); },
    match(method, path) {
      // вернуть { handler, params } первого подходящего (use — по префиксу, маршрут — точно)
      for (const route of stack) {
        if (route.method !== "*" && route.method !== method) continue;
        const params = matchPattern(route.pattern, path);
        if (params) return { fn: route.fn, params };
      }
      return null;
    },
    handle(req, res) {
      // конвейер middleware (use) → затем «конечный» маршрут
      const uses = stack.filter((r) => r.method === "*");
      const routes = stack.filter((r) => r.method !== "*");
      let i = 0;
      const runUse = () => {
        if (res.writableEnded) return; // кто-то уже ответил
        if (i >= uses.length) return runRoute();
        const { fn } = uses[i++];
        fn(req, res, runUse); // next = следующий use
      };
      const runRoute = () => {
        if (res.writableEnded) return;
        const hit = matchRoute(routes, req.method, req.url.split("?")[0]);
        if (!hit) return sendJson(res, 404, { error: "not found" });
        hit.fn(req, res, () => {}); // next «в никуда» (маршрут конечный)
      };
      runUse();
    },
    listen(port, cb) {
      http.createServer((req, res) => app.handle(req, res)).listen(port, cb);
    },
  };
  return app;
}

function matchPattern(pattern, path) {
  const pp = pattern.split("/").filter(Boolean);
  const pp2 = path.split("/").filter(Boolean);
  if (pp.length !== pp2.length) return null;
  const params = {};
  for (let k = 0; k < pp.length; k++) {
    if (pp[k].startsWith(":")) params[pp[k].slice(1)] = decodeURIComponent(pp2[k]);
    else if (pp[k] !== pp2[k]) return null;
  }
  return params;
}
function matchRoute(routes, method, path) {
  for (const r of routes) {
    const params = matchPattern(r.pattern, path);
    if (params && r.method === method) return { fn: r.fn, params };
  }
  return null;
}
function sendJson(res, code, obj) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(obj));
}

// Использование
const app = createApp();
app.use("/", (req, res, next) => { console.log("LOG:", req.method, req.url); next(); });
app.get("/notes/:id", (req, res) => {
  res.params = matchPattern("/notes/:id", req.url.split("?")[0]);
  sendJson(res, 200, { note: Number(res.params.id) });
});
app.post("/notes", (req, res) => sendJson(res, 201, { created: true }));
app.listen(3000, () => console.log("Мини-фреймворк на :3000"));
```

Проверка: `__request("GET", "/notes/42")` → 200 `{note: 42}`; `__request("POST", "/notes")` → 201; `__request("GET", "/nope")` → 404. В логах — строка `LOG:` **до** каждого ответа (middleware сработал).

## Частые ошибки

WARN: middleware «забыл» `next()` и не вызвал `res.end` — запрос **висит** (цепочка не продвинулась, ответ не ушёл). Каждый middleware обязан либо ответить, либо вызвать `next`.

WARN: порядок middleware неверный: `auth` **после** маршрутов (никогда не сработает) или `jsonBody` после маршрутов, которые читают `req.body`. Порядок регистрации = порядок выполнения.

WARN: `:param` сравниваете как строку с числом (`params.id === 42` — false). Params — **строки**: `Number(params.id)`.

WARN: «конечный» маршрут вызывает `next()` «на всякий случай» — цепочка идёт дальше, в 404-обработчик (двойной ответ). Маршрут, который ответил, `next` не зовёт.

## Практическое задание

1. Доработайте мини-фреймворк: `app.use(pattern, fn)` с **префиксом** (`/api` матчит `/api/...`), `req.path` (без query), `req.params` (заполнить автоматически в `handle`).
2. Добавьте middleware `timing`: замеряет `Date.now()` до/после (через обёртку `next`) и ставит заголовок `X-Elapsed-ms`.
3. Добавьте middleware `jsonBody`: для `content-type: application/json` собирает тело (readBody) в `req.body` (объект), иначе `req.body = {}`.
4. Маршруты: `GET /api/items` (200, список), `GET /api/items/:id` (200/404), `POST /api/items` (201, валидация `name`).
5. Проверьте: `__request("POST", "/api/items", { body: { name: "X" } })` → 201; без `name` → 400; `__request("GET", "/api/items/3")` → 200; выведите `X-Elapsed-ms` из заголовков ответа.
