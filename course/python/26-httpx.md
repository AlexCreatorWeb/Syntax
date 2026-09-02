# Урок 26. httpx и продвинутый REST: async-клиент, retries, best practices

## Цель

После урока студент сможет: использовать **httpx** (синхронный **и** **async** клиент; superset requests), применять **async** (`async with httpx.AsyncClient`, `await client.get`), настраивать **retries** (backoff), **base_url**/**headers**/**timeout**, и знать **best practices** REST-клиента (идемпотентность, versioning, pagination, error handling).

## Теория

### httpx: «requests + async + HTTP/2»

**httpx** — «современный** клиент** (superset **requests**: тот же** API** + **async** + **HTTP/2** + **better** timeouts). Синхронно **и** async:

```python
# Синхронно (как requests)
import httpx
r = httpx.get("https://api.example.com/users", timeout=5)
r.raise_for_status(); r.json()

# Async (async with — «соединение** (keep-alive))
import asyncio, httpx

async def main():
    async with httpx.AsyncClient(base_url="https://api.example.com",
                                 timeout=5, headers={"Authorization": "Bearer T"}) as client:
        r = await client.get("/users")          # await!
        data = r.json()
        r2 = await client.post("/users", json={"name": "Аня"})
```

### `base_url` + «относительные** пути**

`base_url="https://api.example.com"` → `client.get("/users")` = `https://api.example.com/users` (не «дублируйте** домен** в** каждом** запросе**.

### Retries (повторы)

«Сеть** ненадёжна: **повтор** при** 5xx/timeout** (с **backoff**: 0.5с, 1с, 2с…). `httpx` — «вручную** (цикл) или **`tenacity** (библиотека). **Идемпотентность**: **GET/PUT/DELETE** — «безопасно** повторять; **POST** — «осторожно** (дубль).

### Best practices REST-клиента

- **Versioning**: `/v1/users` (API «меняется»).
- **Pagination**: `?page=2&limit=50` (или cursor: `?after=…`).
- **Error handling**: `raise_for_status` + «структурированный** error** (`{"error": {"code": …, "message": …}}`).
- **Idempotency-Key** (для **POST**): «дубль** при** retry** (сервер «дедуплицирует).
- **Timeout** (connect/read), **rate limit** (429 + `Retry-After`).

TIP: **один** `Client`/`AsyncClient` на «приложение** (не «создавать** на** запрос**; **base_url** + **headers** «один раз**; **timeout** «всегда**.

NOTE: в песочнице (Pyodide) — **httpx не установлен**; «async** часть** работает** через** `pyodide.http.pyfetch`** (CORS** fetch** из** WASM** или **«имитация** (как** урок** 25). В терминале — `pip install httpx`.

## Пример

`main.py`:

```python
"""httpx + продвинутый REST (async; в песочнице — «имитация** pyfetch-стиля)."""

import asyncio
import json
import random
import time

# «Имитация** «сетевого** API** (песочница: задержка + редкий 500)
def fake_api(method: str, path: str, body: dict | None = None) -> dict:
    delay = random.uniform(0.05, 0.2)
    if method == "GET" and path == "/users":
        return {"status": 200, "json": [{"id": 1, "name": "Аня"}, {"id": 2, "name": "Боря"}]}
    if method == "POST" and path == "/users":
        return {"status": 201, "json": {"id": 3, **(body or {})}}
    return {"status": 404, "json": {"error": "not found"}}

# «Обёртка** (контракт httpx.Response): status_code, json(), raise_for_status()
class Resp:
    def __init__(self, status: int, payload: dict):
        self.status_code = status
        self._json = payload
    def json(self):
        return self._json
    def raise_for_status(self):
        if self.status_code >= 400:
            raise RuntimeError(f"HTTP {self.status_code}")

# «Асинхронный** клиент** (имитация httpx.AsyncClient)
class AsyncClient:
    def __init__(self, base_url: str, timeout: float = 5.0, headers: dict | None = None):
        self.base_url = base_url
        self.timeout = timeout
        self.headers = headers or {}
    async def get(self, path: str) -> Resp:
        await asyncio.sleep(0.05)   # «сеть**
        r = fake_api("GET", path)
        return Resp(r["status"], r["json"])
    async def post(self, path: str, json: dict) -> Resp:
        await asyncio.sleep(0.05)
        r = fake_api("POST", path, json)
        return Resp(r["status"], r["json"])

# Retries (backoff)
async def get_with_retry(client: AsyncClient, path: str, attempts: int = 3) -> Resp:
    last_err = None
    for i in range(attempts):
        try:
            r = await client.get(path)
            if r.status_code < 500:
                return r
            last_err = RuntimeError(f"HTTP {r.status_code}")
        except Exception as e:      # timeout/сеть
            last_err = e
        await asyncio.sleep(0.2 * (2 ** i))   # backoff: 0.2, 0.4, 0.8
    raise last_err

async def main() -> None:
    async with AsyncClient(base_url="https://api.example.com",
                           headers={"Authorization": "Bearer T"}) as client:
        # GET
        t0 = time.perf_counter()
        r = await get_with_retry(client, "/users")
        r.raise_for_status()
        print(f"GET /users ({time.perf_counter() - t0:.2f}s):", r.json())

        # POST
        r = await client.post("/users", json={"name": "Вера"})
        print("POST /users:", r.status_code, r.json())

        # «Параллельно** (async: gather)
        t0 = time.perf_counter()
        results = await asyncio.gather(
            client.get("/users"),
            client.get("/users"),
        )
        print(f"2 GET параллельно ({time.perf_counter() - t0:.2f}s):",
              [r.status_code for r in results])

asyncio.run(main())
```

## Частые ошибки

WARN: **`httpx` sync-клиент** «в** `async`** (блокирует** loop). В async — **`AsyncClient`** + **`await`.

WARN: **создаёте** `Client`** на** каждый** запрос** (пересоединение**. **Один** `Client`** (через** `with`/`async with`), переиспользуйте.

WARN: **POST** «с** retry** без** `Idempotency-Key`** — «дубль** (сервер «создаёт** twice**. Для **POST** — «ключ** идемпотентности» (или **GET** для «чтения»).

WARN: **без** `base_url`** (дублируете** домен** в** каждом** URL**. `base_url`** + «относительные** пути.

## Практическое задание

1. `AsyncClient` (имитация): `base_url` + `headers`; `get("/users")`, `post("/users", json=…)`. Выведите статусы.
2. `get_with_retry`: «API** возвращает** 500** первый** раз**, затем** 200** — выведите «сколько** попыток**. (Имитация: счётчик вызовов.)
3. `asyncio.gather`: 3 GET «одновременно»; выведите «общее** время** vs «сумма** задержек.
4. «Pagination**: `fake_get("/users", params={"page": n, "limit": k})` — «страницы** (имитация: 10 «пользователей**, limit=3); выведите «все** страницы**.
5. В комментарии: что такое `Idempotency-Key` и почему **POST** «с** retry** «опасен** без** него (2 предложения).
