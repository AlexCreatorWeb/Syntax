# Урок 14. http с нуля: createServer, req/res, статус-коды

## Цель

После урока студент сможет: поднять HTTP-сервер без фреймворка (`http.createServer`), читать `req` (method, url, headers, body), писать `res` (status, headers, json/text/redirect), использовать корректные **статус-коды** (2xx/3xx/4xx/5xx) и понимать, что именно делает Express «под капотом» (урок 17).

## Теория

### http.createServer

Модуль **`http`** — HTTP-сервер без зависимостей. Сервер — функция-обработчик, вызываемая **на каждый запрос**:

```js
import http from "http";

const server = http.createServer((req, res) => {
  // req: method, url, headers (тело — стрим, урок 15)
  // res: writeHead/status/headers/end
});
server.listen(3000, () => console.log("Сервер на :3000"));
```

`req` — объект запроса: `req.method` (`GET`/`POST`/…), `req.url` (`/path?query`), `req.headers` (объект, ключи в **нижнем** регистре). `res` — «ручка ответа»:

```js
res.statusCode = 200;                 // или res.status(200) в Express
res.setHeader("Content-Type", "application/json");
res.end(JSON.stringify({ ok: true })); // end — «закрыть» ответ (обязателен)
```

Краткие формы: `res.writeHead(code, headers)` + `res.end(body)`. **`res.end` — обязан быть вызван** (иначе клиент ждёт вечно).

### Статус-коды (минимум, который обязан знать бэкендер)

- **200** OK — успех; **201** Created — ресурс создан (POST); **204** No Content — успех без тела.
- **301/302** Redirect — `Location` header.
- **400** Bad Request — «кривой» запрос (body, params); **401** Unauthorized — нет/неверный токен; **403** Forbidden — токен есть, прав нет; **404** Not Found; **409** Conflict — дубликат; **422** Unprocessable — валидация.
- **500** Internal — ошибка сервера; **503** Unavailable — «временно».

Правило: **код = семантика**. «Создали» → 201 (не 200). «Нашли не нашли» → 404 (не 200 с `{error}` в теле).

### JSON API: контракт

Для JSON: `Content-Type: application/json` в ответе (и в запросе клиента). Тело — `JSON.stringify(obj)`. Ошибки — **и** код, **и** JSON `{ "error": "…" }` (клиент читает тело).

TIP: вынесите «отправить JSON» в функцию (`sendJson(res, code, obj)`), чтобы не дублировать `setHeader`/`stringify`/`end` по всем маршрутам. Это первый «middleware»-зародыш (урок 16).

NOTE: в песочнице платформы `http` — mock: `createServer` регистрирует обработчик, а **`__request(method, url, { body, headers })`** (глобальная функция консоли платформы) «бьётся» по серверу и возвращает `{ status, headers, body, raw }`. В терминале тот же сервер проверяется `curl http://localhost:3000/…`.

## Пример

`server.js`:

```js
import http from "http";

function sendJson(res, code, obj) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(obj));
}

const server = http.createServer((req, res) => {
  const { method, url } = req;
  const path = url.split("?")[0];

  if (method === "GET" && path === "/") {
    sendJson(res, 200, { hello: "Node HTTP", time: new Date().toISOString() });
    return;
  }
  if (method === "GET" && path === "/health") {
    res.statusCode = 204; // успех без тела
    res.end();
    return;
  }
  if (method === "GET" && path === "/redirect") {
    res.statusCode = 302;
    res.setHeader("Location", "/");
    res.end();
    return;
  }
  // POST /echo (тело — в уроке 15; здесь принимаем «пустой»)
  if (method === "POST" && path === "/echo") {
    sendJson(res, 201, { received: true, method, path });
    return;
  }
  // 405 — метод не поддерживается для пути
  if (path === "/") {
    sendJson(res, 405, { error: "method not allowed" });
    return;
  }
  sendJson(res, 404, { error: "not found: " + path });
});

server.listen(3000, () => console.log("HTTP-сервер (без фреймворка) на :3000"));
```

Проверка в платформе: `__request("GET", "/")` → 200 JSON; `__request("GET", "/health")` → 204; `__request("GET", "/nope")` → 404; `__request("POST", "/")` → 405.

## Частые ошибки

WARN: забыли `res.end()` — клиент висит «навсегда». Каждый путь обработки обязан завершаться `end` (или `next` в Express).

WARN: всегда 200 «для всего» (ошибки — в теле `{ok:false}`). Клиент/мониторинг/кэши — по **коду**. Ошибка → 4xx/5xx.

WARN: «создали ресурс» → 200. Создание (POST, успешное) → **201** (+ `Location` на новый ресурс).

WARN: читаете `req.headers["Content-Type"]` с camelCase. Ключи заголовков в `req.headers` — **строчные**: `content-type`.

## Практическое задание

1. Поднимите HTTP-сервер с маршрутами: `GET /` (200, `{ app, version }`), `GET /health` (204), `GET /time` (200, `{ now: ISO }`), остальное — 404 JSON.
2. Добавьте `POST /register` (201, `{ id: 1 }` — «создано») и `GET /register` (405).
3. Реализуйте функцию `sendJson(res, code, obj)` и используйте её во всех маршрутах (никаких повторений `setHeader`/`end`).
4. Добавьте `302`-редирект: `GET /old` → `Location: /`.
5. Проверьте всё через `__request`: выведите status + body каждого; убедитесь, что 204 — без тела, 404 — с JSON-ошибкой.
