# Урок 23. asyncio: event loop, coroutine, await, gather

## Цель

После урока студент сможет: объяснять **event loop** и **коаутин** (корутину), писать **`async def`** и вызывать через **`await`**, запускать «параллельно» через **`asyncio.gather`**, понимать разницу «CPU-bound» vs «I/O-bound» (asyncio — для **I/O**) и запускать «входную точку» через **`asyncio.run`**.

## Теория

### Зачем asyncio

**I/O** (сеть, файлы, БД) — «долго**ждём**» (ответ сервера). «Поток» (thread) на каждое ожидание — «дорого» (память, переключение). **asyncio** — **однопоточный** event loop: «запустил запрос → **отдал управление** другим задачам → вернулся, когда ответ». Тысячи «одновременно» в **одном** потоке.

### Coroutine: `async def` + `await`

```python
import asyncio

async def fetch(url: str) -> str:
    await asyncio.sleep(1)        # «имитация» I/O (уступка loop)
    return f"data from {url}"

async def main() -> None:
    result = await fetch("api")   # await — «дождаться» (уступая loop)
    print(result)

asyncio.run(main())               # запуск (создаёт loop, выполняет, закрывает)
```

- **`async def`** — «корута» (вызов → **объект** coroutine, **не** выполняет).
- **`await`** — «дождаться» (результат) **уступая** loop (другие коруты идут).
- **`asyncio.run(main())`** — «вход» (создаёт/закрывает loop). **Один раз** (не вложенно).

### `asyncio.gather`: «параллельно»

`await asyncio.gather(c1(), c2(), c3())` — запускает **все** и «ждёт**все»** (результаты в **порядке** вызова). «Параллельно» = **один** event loop, «одновременно» I/O.

```python
async def main():
    a, b = await asyncio.gather(fetch("a"), fetch("b"))   # ~1с, не 2с
```

### CPU-bound vs I/O-bound

- **I/O-bound** (сеть/файлы) — asyncio (await на «ожидании»).
- **CPU-bound** (расчёт) — asyncio **не помогает** (однопоточно; «займёт» loop). Для CPU — **процессы** (`multiprocessing`) или C-экстензии.

TIP: `await asyncio.sleep(0)` — «уступить» loop (редко, для «coop»); «длинная**CPU**» задача в async — «запах» (выносите в поток/процесс).

NOTE: в песочнице (Pyodide) — **asyncio доступен** (CPython): `asyncio.run`, `async def`, `await`, `gather`, `asyncio.sleep` — **работают** (I/O «имитируется» `sleep`; «настоящая» сеть — `pyodide.http.pyfetch`, урок 25–26).

## Пример

`main.py`:

```python
"""asyncio: event loop, coroutine, await, gather."""

import asyncio
import time

async def task(name: str, delay: float) -> str:
    print(f"  {name}: старт")
    await asyncio.sleep(delay)      # «I/O» (уступка loop)
    print(f"  {name}: готов через {delay}s")
    return f"{name}={delay}"

async def main() -> None:
    # Последовательно (await по одному): ~3с
    t0 = time.perf_counter()
    r1 = await task("A", 1)
    r2 = await task("B", 1)
    r3 = await task("C", 1)
    print(f"Последовательно: {time.perf_counter() - t0:.1f}s →", [r1, r2, r3])

    # Параллельно (gather): ~1с
    t0 = time.perf_counter()
    results = await asyncio.gather(task("X", 1), task("Y", 1), task("Z", 1))
    print(f"Параллельно (gather): {time.perf_counter() - t0:.1f}s →", results)

    # create_task (запуск + управление)
    t0 = time.perf_counter()
    t1 = asyncio.create_task(task("T1", 1))
    t2 = asyncio.create_task(task("T2", 1))
    print("  (главная идёт, пока задачи «в фоне»)")
    await asyncio.sleep(0.5)
    results2 = await asyncio.gather(t1, t2)
    print(f"create_task+gather: {time.perf_counter() - t0:.1f}s →", results2)

    # as_completed (по мере готовности)
    t0 = time.perf_counter()
    coros = [task("fast", 0.5), task("slow", 1.5)]
    for coro in asyncio.as_completed(coros):
        r = await coro
        print(f"  as_completed: {r} (t={time.perf_counter() - t0:.1f}s)")

asyncio.run(main())
```

## Частые ошибки

WARN: **забываете `await`** (`result = fetch(url)` → coroutine **не** запущена; «never awaited» warning). `await` — **обязателен** (кроме `create_task`).

WARN: **`asyncio.run` «внутри** `async`» (вложенный loop) → `RuntimeError`. `asyncio.run` — **один раз** («вход»); «внутри» async — `await`/`create_task`.

WARN: **CPU-bound** в asyncio (длинный расчёт «заблокирует» loop — другие коруты **ждут**). CPU — `multiprocessing`/поток; asyncio — **I/O**.

WARN: **`gather` «без** `return_exceptions`**: одно исключение «убивает**всё**» (остальные «отменяются»). Для «независимых» — `return_exceptions=True` (результат/исключение в списке).

## Практическое задание

1. `async def` «загрузка» (3 «ресурса» с `asyncio.sleep` 0.5/1.0/1.5). Выведите: последовательно (await по одному) vs `gather` (время).
2. `create_task`: запустите 2 задачи, `await asyncio.sleep(0.3)`, затем `await` обе. Выведите «кто когда».
3. `as_completed`: 3 задачи (0.5/1.0/0.7) — выведите «по мере готовности» (время каждого).
4. `gather(return_exceptions=True)`: одна задача «бросает» `ValueError` — выведите результаты (исключение **в** списке, не «падает»).
5. В комментарии: почему asyncio «не для CPU-bound» (1–2 предложения), и что вместо него (multiprocessing/поток).
