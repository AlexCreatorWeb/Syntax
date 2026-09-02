# Урок 25. REST-клиент: requests (GET/POST, JSON, статусы, timeout)

## Цель

После урока студент сможет: делать **HTTP-запросы** через `requests` (`get`/`post`/`put`/`delete`), работать с **JSON** (`.json()`, `json=`), проверять **статусы** (`raise_for_status`, `status_code`), ставить **`timeout`** (обязательно!), передавать **headers/params**, и понимать **REST** (методы, коды 2xx/4xx/5xx).

## Теория

### REST и HTTP-методы

**REST** — «стиль** API** по** HTTP: **ресурсы** (URL) + **глаголы** (методы):
- **GET** — «получить** (идемпотентно, без «побочного»).
- **POST** — «создать** (или «отправить»).
- **PUT** — «заменить** (целиком).
- **PATCH** — «изменить** (часть).
- **DELETE** — «удалить».

**Статусы**: **2xx** (успех: 200 OK, 201 Created, 204 No Content), **4xx** (клиент: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 422 Unprocessable), **5xx** (сервер: 500, 502, 503).

### requests: базовый

```python
import requests

r = requests.get("https://api.example.com/users", timeout=5)
r.status_code          # 200
r.raise_for_status()   # бросает HTTPError при 4xx/5xx
r.json()               # body → dict/list (Content-Type: json)
r.text                 # body (строка)
r.headers              # ответные заголовки

# POST с JSON
r = requests.post(url, json={"name": "Аня"}, timeout=5)

# params (query string) + headers
r = requests.get(url, params={"page": 1, "q": "x"},
                 headers={"Authorization": "Bearer TOKEN"}, timeout=5)
```

### `timeout` — **обязательно**

Без `timeout` запрос **может** «висеть** бесконечно (сервер «молчит»). `timeout=5` (или `(3.05, 10)` — connect, read).

### Session (соединение)

`requests.Session()` — «соединение** (keep-alive) + «общие** headers**: для «много** запросов** к** одному** API** (быстрее, cookie).

TIP: **всегда** `timeout`; **всегда** `raise_for_status()` (или проверка `r.ok`); JSON — `r.json()` (не `json.loads(r.text)` руками).

NOTE: в песочнице (Pyodide) — **`requests` не доступен** (нет «настоящего** HTTP** из** WASM** по** умолчанию). Вместо него — **`pyodide.http.pyfetch`** (async, CORS) или **«имитация** API** функцией** (в уроках 25–26: примеры — `requests` (для терминала), а в песочнице — «обёртка** `fake_api`** (тот же** контракт**: dict «ответа»). В терминале — `pip install requests`.

## Пример

`main.py`:

```python
"""REST-клиент: requests (терминал) + «имитация» API (песочница)."""

import json

# «Имитация** API** (песочница: вместо requests) — тот же** контракт** (dict «ответа»)
FAKE_DB = {"users": {"1": {"name": "Аня", "age": 30}, "2": {"name": "Боря", "age": 25}}}

def fake_get(path: str, params: dict | None = None) -> dict:
    """Имитирует GET: возвращает {'status': 200, 'json': …} или 404."""
    if path == "/users" and not params:
        return {"status": 200, "json": list(FAKE_DB["users"].values())}
    if path.startswith("/users/"):
        uid = path.rsplit("/", 1)[1]
        if uid in FAKE_DB["users"]:
            return {"status": 200, "json": FAKE_DB["users"][uid]}
        return {"status": 404, "json": {"error": "not found"}}
    return {"status": 404, "json": {"error": "unknown path"}}

def fake_post(path: str, body: dict) -> dict:
    if path == "/users" and "name" in body:
        uid = str(max(int(k) for k in FAKE_DB["users"]) + 1)
        FAKE_DB["users"][uid] = body
        return {"status": 201, "json": {"id": uid, **body}}
    return {"status": 400, "json": {"error": "bad body"}}

# «Обёртка** (контракт requests: status_code, json(), raise_for_status)
class FakeResponse:
    def __init__(self, status: int, payload: dict):
        self.status_code = status
        self._json = payload
    def json(self) -> dict:
        return self._json
    def raise_for_status(self) -> None:
        if self.status_code >= 400:
            raise RuntimeError(f"HTTP {self.status_code}")

def api_get(path: str, params: dict | None = None) -> FakeResponse:
    r = fake_get(path, params)
    return FakeResponse(r["status"], r["json"])

def api_post(path: str, json_body: dict) -> FakeResponse:
    r = fake_post(path, json_body)
    return FakeResponse(r["status"], r["json"])

# «Как** в** терминале** (requests):
#   import requests
#   r = requests.get("https://api.example.com/users", timeout=5)
#   r.raise_for_status()
#   data = r.json()

# В песочнице — «обёртка**:
r = api_get("/users")
r.raise_for_status()
print("GET /users:", r.json())

r = api_get("/users/1")
print("GET /users/1:", r.json())

try:
    r = api_get("/users/999")
    r.raise_for_status()
except RuntimeError as e:
    print("404:", e)

# POST (создание)
r = api_post("/users", json_body={"name": "Вера", "age": 28})
print("POST /users:", r.status_code, r.json())
```

## Частые ошибки

WARN: **без `timeout`** — запрос «висит** (сервер «молчит»). **Всегда** `timeout=`.

WARN: **не проверяете** статус** (`r.json()` при **404** → «пусто**/ошибка**; «тихий** баг**. `raise_for_status()` (или `if r.ok`).

WARN: **`params` vs `json`** путаете: `params` — **query string** (`?a=b`), `json=` — **body** (POST/PUT). `data=` — form-encoded (не JSON).

WARN: **одноразовый** `requests.get` «для много** запросов** (пересоединение**. `Session()` для «много** (keep-alive, headers).

## Практическое задание

1. «Имитация** API**: `fake_get("/orders")` (список), `fake_post("/orders", {"item": "кофе", "sum": 300})` (201 + id). Выведите.
2. `FakeResponse.raise_for_status`: обработайте **404** (`/users/999`) через `try/except`.
3. «Параметры**: `fake_get("/users", params={"age_min": 28})` — отфильтруйте (возраст >= 28).
4. (Терминал) `pip install requests`; `requests.get("https://httpbin.org/get", timeout=5)` — выведите `status_code`, `json()` (args).
5. В комментарии: чем `params` отличается от `json`, и когда **каждый** (по 1 примеру).
