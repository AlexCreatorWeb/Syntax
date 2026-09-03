---
id: node-http
track: node
type: guide
section: network
order: 4
title:
  en: "Building an HTTP Server"
  ru: "HTTP-сервер"
excerpt:
  en: "From the raw node:http module to a minimal router, request bodies, and the moment it is time to switch to Express."
  ru: "От сырого node:http до минимального роутера, тела запросов и момента, когда пора переходить на Express."
version: "node 22"
updated: 2026-09-03
relatedTask: node-004
---

Every web server in Node is, at the bottom, a stream of request and response objects. The built-in `node:http` module is small enough to learn completely — and understanding it is what makes every framework, including Express, transparent instead of magic.

## A server from node:http

`http.createServer` takes one handler that runs for every request. The handler receives `req` — a readable stream of the request — and `res` — a writable stream for the response. A response is written in two moves: headers first (via `writeHead` or `setHeader`), then the body, ending with `end()`.

```js
import http from "node:http";

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  console.log(req.method, url.pathname);

  if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "not found" }));
});

server.listen(3000, () => console.log("listening on :3000"));
```

`req.url` is the raw path plus the query string, which is why it is parsed with `new URL` against a dummy origin — `url.searchParams` then hands you the query values. `req.headers` is a plain object of lower-cased header names; `req.method` and `req.httpVersion` describe the request itself.

## Reading the request body

The body of a POST does not arrive in `req` as a string or an object — it arrives as stream chunks, potentially over several events. The standard recipe accumulates chunks until `end`.

```js
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}
```

```js
import http from "node:http";

const notes = [];

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");

  if (req.method === "POST" && url.pathname === "/notes") {
    const text = JSON.parse(await readBody(req)).text;
    const note = { id: notes.length + 1, text };
    notes.push(note);
    res.writeHead(201, { "content-type": "application/json" });
    res.end(JSON.stringify(note));
    return;
  }

  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ notes }));
});

server.listen(3000);
```

Once every handler repeats the same JSON ritual, the pattern is ripe for extraction — and this is exactly where a framework earns its keep.

## A minimal router

A route table plus a tiny matcher covers ninety percent of cases: the method plus a pattern with `:param` placeholders.

```js
function match(pattern, pathname) {
  const p = pattern.split("/");
  const a = pathname.split("/");
  if (p.length !== a.length) return null;
  const params = {};
  for (let i = 0; i < p.length; i += 1) {
    if (p[i].startsWith(":")) params[p[i].slice(1)] = decodeURIComponent(a[i]);
    else if (p[i] !== a[i]) return null;
  }
  return params;
}
```

```js
const routes = {
  "GET /notes": (req, res) => json(res, 200, { notes }),
  "GET /notes/:id": (req, res, params) => {
    const note = notes.find((n) => n.id === Number(params.id));
    if (!note) return json(res, 404, { error: "not found" });
    json(res, 200, note);
  },
};

function json(res, status, body) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}
```

Once the table grows past a few dozen entries, it is time to stop reinventing it.

## When to reach for Express

Express is a thin layer over the same `node:http`: a middleware chain where each function can inspect `req` and `res` and either answer or pass to the next handler with `next()`. It ships the boring half — JSON body parsing, routing, 404s — as one-liners.

```js
import express from "express";

const app = express();
app.use(express.json()); // parses req.body for you

app.get("/notes", (req, res) => res.json({ notes }));

app.post("/notes", (req, res) => {
  const note = { id: notes.length + 1, text: req.body.text };
  notes.push(note);
  res.status(201).json(note);
});

app.listen(3000);
```

The concepts transfer directly: `app.use` is a middleware in the chain, `app.get`/`app.post` register a route, and the final 404 is just another middleware that runs when nobody answered. If you know how the raw module works, Express has nothing left to hide.

> **TIP**
> Always set the `content-type` header before the body — clients and your tests both branch on it.

> **WARNING**
> Forgetting `res.end()` leaves the request hanging forever. Every code path in a handler must end the response exactly once — including the error path.

<!-- RU -->

Каждый веб-сервер в Node, если спуститься на самое дно, — это поток объектов запроса и ответа. Встроенный модуль `node:http` мал, чтобы выучить его целиком, — и понимание его делает любой фреймворк, включая Express, прозрачным, а не магией.

## Сервер на node:http

`http.createServer` принимает один хендлер, который исполняется для каждого запроса. Хендлер получает `req` — readable-поток запроса — и `res` — writable-поток ответа. Ответ пишется двумя движениями: сначала заголовки (через `writeHead` или `setHeader`), затем тело, завершаясь `end()`.

```js
import http from "node:http";

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  console.log(req.method, url.pathname);

  if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "not found" }));
});

server.listen(3000, () => console.log("listening on :3000"));
```

`req.url` — это сырой путь плюс query-строка, поэтому его парсят через `new URL` с вымышленным origin — тогда `url.searchParams` отдаёт значения query. `req.headers` — обычный объект с именами заголовков в нижнем регистре; `req.method` и `req.httpVersion` описывают сам запрос.

## Чтение тела запроса

Тело POST приходит в `req` не строкой и не объектом — оно приходит чанками потока, потенциально за несколько событий. Стандартный рецепт — копить чанки до `end`.

```js
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}
```

```js
import http from "node:http";

const notes = [];

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");

  if (req.method === "POST" && url.pathname === "/notes") {
    const text = JSON.parse(await readBody(req)).text;
    const note = { id: notes.length + 1, text };
    notes.push(note);
    res.writeHead(201, { "content-type": "application/json" });
    res.end(JSON.stringify(note));
    return;
  }

  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ notes }));
});

server.listen(3000);
```

Когда каждый хендлер повторяет один и тот же JSON-обряд, паттерн готов к выносу в функцию — и именно здесь фреймворк начинает окупаться.

## Минимальный роутер

Таблица маршрутов плюс крошечный матчер покрывают девяносто процентов случаев: метод плюс шаблон с плейсхолдерами `:param`.

```js
function match(pattern, pathname) {
  const p = pattern.split("/");
  const a = pathname.split("/");
  if (p.length !== a.length) return null;
  const params = {};
  for (let i = 0; i < p.length; i += 1) {
    if (p[i].startsWith(":")) params[p[i].slice(1)] = decodeURIComponent(a[i]);
    else if (p[i] !== a[i]) return null;
  }
  return params;
}
```

```js
const routes = {
  "GET /notes": (req, res) => json(res, 200, { notes }),
  "GET /notes/:id": (req, res, params) => {
    const note = notes.find((n) => n.id === Number(params.id));
    if (!note) return json(res, 404, { error: "not found" });
    json(res, 200, note);
  },
};

function json(res, status, body) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}
```

Когда таблица вырастает за пару десятков записей, пора перестать reinvent the wheel.

## Когда пора на Express

Express — тонкий слой поверх того же `node:http`: цепочка middleware, где каждая функция может осмотреть `req` и `res` и либо ответить, либо передать дальше через `next()`. Он вывозит скучную половину — парсинг JSON-тела, роутинг, 404 — в виде one-liner.

```js
import express from "express";

const app = express();
app.use(express.json()); // сам парсит req.body

app.get("/notes", (req, res) => res.json({ notes }));

app.post("/notes", (req, res) => {
  const note = { id: notes.length + 1, text: req.body.text };
  notes.push(note);
  res.status(201).json(note);
});

app.listen(3000);
```

Понятия переносятся напрямую: `app.use` — это middleware в цепочке, `app.get`/`app.post` регистрируют маршрут, а финальный 404 — просто ещё одно middleware, которое исполняется, когда никто не ответил. Зная, как работает сырой модуль, у Express больше нечего прятать.

> **TIP**
> Всегда ставьте заголовок `content-type` до тела — и клиенты, и ваши тесты ветвят по нему.

> **WARNING**
> Забытый `res.end()` оставляет запрос висеть вечно. Каждый путь кода в хендлере должен завершить ответ ровно один раз — включая путь ошибки.
