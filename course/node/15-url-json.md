# Урок 15. URL, query, JSON API: GET/POST, body

## Цель

После урока студент сможет: разбирать URL (`new URL`, pathname/searchParams), читать query-параметры, собирать **тело POST** из `req` (стрим → Buffer → JSON), валидировать вход (тип, обязательность) и строить полноценный JSON API: `GET` (список/один) + `POST` (создание) с кодами 200/201/400/404.

## Теория

### URL и query

**`new URL(url, base)`** — разбор: `pathname` (`/notes/5`), `searchParams` (Map query), `protocol`, `host`. В `req.url` — «относительный» URL (`/path?x=1`), поэтому даём base:

```js
const u = new URL(req.url, "http://localhost");
u.pathname;              // "/notes/5"
u.searchParams.get("q"); // значение параметра
u.searchParams.getAll("tag"); // массив (повторяющиеся)
```

Query — **строки**: `?page=2&per=20` → `Number(sp.get("page"))`. Нет параметра → `null`.

### Тело запроса: req — это стрим

`req` — **Readable-стрим** (урок 11): тело «льётся» чанками. Собираем:

```js
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}
// Затем: const json = JSON.parse(buf.toString("utf8") || "{}");
```

Для JSON-запроса клиент шлёт `Content-Type: application/json`. Проверка: `req.headers["content-type"]?.includes("application/json")`.

### JSON API: шаблон маршрута

```
GET  /notes        → 200 [ {id, text} ]
GET  /notes/:id    → 200 {id, text} | 404
POST /notes        → 201 {id, text} | 400 (валидация)
```

Паттерн обработки POST: (1) прочитать body, (2) `JSON.parse` (catch → 400 «invalid json»), (3) валидация (текст непустой → 400), (4) «создать», (5) `201` + объект.

TIP: лимит тела (например, 1 МБ) — защита от «огромного» POST: в ручном `readBody` считайте `chunks.length` и отменяйте при превышении.

NOTE: в песочнице `__request(method, url, { body })` сам сериализует `body` в JSON и ставит `content-type: application/json` (если body — объект). `req` в обработчике — тот же стрим (собирается `readBody`).

## Пример

`server.js`:

```js
import http from "http";

function sendJson(res, code, obj) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(obj));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

const notes = [
  { id: 1, text: "Первая заметка" },
  { id: 2, text: "Вторая заметка" },
];
let nextId = 3;

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://localhost");
  const { pathname, searchParams } = u;

  // GET /notes?done=
  if (req.method === "GET" && pathname === "/notes") {
    const per = Number(searchParams.get("per")) || notes.length;
    sendJson(res, 200, notes.slice(0, per));
    return;
  }

  // GET /notes/:id
  const m = pathname.match(/^\/notes\/(\d+)$/);
  if (req.method === "GET" && m) {
    const note = notes.find((n) => n.id === Number(m[1]));
    if (!note) return sendJson(res, 404, { error: "not found" });
    sendJson(res, 200, note);
    return;
  }

  // POST /notes
  if (req.method === "POST" && pathname === "/notes") {
    const raw = await readBody(req);
    let data;
    try {
      data = JSON.parse(raw || "{}");
    } catch {
      return sendJson(res, 400, { error: "invalid json" });
    }
    if (typeof data.text !== "string" || !data.text.trim()) {
      return sendJson(res, 400, { error: "text обязателен" });
    }
    const note = { id: nextId++, text: data.text.trim() };
    notes.push(note);
    sendJson(res, 201, note);
    return;
  }

  sendJson(res, 404, { error: "not found: " + pathname });
});

server.listen(3000, () => console.log("JSON API (URL + body) на :3000"));
```

Проверка: `__request("GET", "/notes")` → 200, 2 заметки; `__request("GET", "/notes/1")` → 200; `__request("GET", "/notes/99")` → 404; `__request("POST", "/notes", { body: { text: "Третья" } })` → 201; `__request("POST", "/notes", { body: { text: "  " } })` → 400.

## Частые ошибки

WARN: читаете `req.body` «как в Express» — в чистом `http` тела **нет** (req — стрим). Собирайте через `readBody` (или middleware в Express, урок 19).

WARN: `searchParams.get("page")` → сравниваете со строкой `=== 2`. Query — **строки**: `Number(…)`.

WARN: `JSON.parse` body без try/catch — «кривой» JSON роняет **весь** запрос (500). Парсинг → catch → 400.

WARN: POST без валидации (создали «пустую» заметку). Входные данные — **всегда** не доверять: тип + обязательность + trim.

## Практическое задание

1. Добавьте в API `GET /notes/search?q=…`: искать по подстроке в `text` (регистр не важен). Пустой `q` → весь список.
2. Реализуйте `DELETE /notes/:id` → 204 (если есть) / 404.
3. Добавьте валидацию POST: `text` длиннее 200 символов → 400 `{ error: "text слишком длинный" }`.
4. Добавьте `GET /notes?per=N&skip=M` (пагинация по query).
5. Проверьте всё через `__request` и выведите таблицу «метод + путь → статус».
