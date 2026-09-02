# Урок 24. asyncio на практике: create_task, when to async

## Цель

После урока студент сможете: управлять задачами (`create_task`, `Task`, `cancel`, `done()`), использовать `asyncio.wait` / `wait_for` (таймаут), применять `asyncio.Queue` (продюсер/консьюмер), и понимать when to async (I/O-bound, многоодновременно; не «для скорости CPU»).

## Теория

### `create_task` и `Task`

`asyncio.create_task(coro)` — запускаеткоруту в фоне (возвращает `Task`). `Task` — «обёртка» с состоянием: `done()`, `result()`, `exception()`, `cancel()`. `await task` — дождатьсярезультат.

```python
task = asyncio.create_task(long_io())
# … другая работа …
if not task.done():
    task.cancel()          # «отменить» (если «умеет» await)
else:
    print(task.result())
```

### `wait_for` (таймаут)

`await asyncio.wait_for(coro, timeout)` — дождаться или `TimeoutError` за timeout (отменяет корутину).

### `asyncio.wait`

`await asyncio.wait(tasks, return_when=FIRST_COMPLETED | ALL_COMPLETED | FIRST_EXCEPTION)` — «группа» задач (без `gather` всеилиничего»).

### `asyncio.Queue` (продюсер/консьюмер)

`Queue` — асинхроннаяочередь: `await q.put(x)`, `await q.get()`, `q.task_done()`, `await q.join()`. Паттерн: N продюсеров → очередь → M консьюмеров (классический «fan-in/fan-out»).

### When to async

- Да: I/O-bound (сеть, БД, файлы), многоодновременно (тысячи соединений), «сервер» (websockets, API).
- Нет: CPU-bound (расчёт — `multiprocessing`), одназадача (async «не ускорит; обычный синхронный проще), малозадач (оверхед loop «не окупается»).

TIP: async — архитектура (однопоточный loop, «уступки на I/O); не «магия скорости». Начните с синхронного (проще); async — когда «много I/O одновременно».

NOTE: в песочнице (Pyodide) — asyncio работает (CPython): create_task, wait_for, Queue, wait — доступны. «Настоящая сеть — урок 25–26 (pyfetch/httpx).

## Пример

`main.py`:

```python
"""asyncio на практике: create_task, wait_for, Queue."""

import asyncio
import time

async def work(name: str, delay: float) -> str:
    await asyncio.sleep(delay)
    return f"{name}:{delay}"

async def main() -> None:
    # create_task + done/result/cancel
    t0 = time.perf_counter()
    fast = asyncio.create_task(work("fast", 0.3))
    slow = asyncio.create_task(work("slow", 2.0))
    await fast
    print(f"fast готов: {fast.result()} (t={time.perf_counter() - t0:.1f}s)")
    if not slow.done():
        slow.cancel()
    try:
        await slow
    except asyncio.CancelledError:
        print("slow отменён (cancel)")

    # wait_for (таймаут)
    async def slow_io() -> str:
        await asyncio.sleep(2.0)
        return "поздно"
    try:
        r = await asyncio.wait_for(slow_io(), timeout=0.5)
        print("wait_for:", r)
    except asyncio.TimeoutError:
        print("wait_for: TimeoutError (0.5s < 2.0s)")

    # wait (FIRST_COMPLETED)
    t0 = time.perf_counter()
    tasks = [asyncio.create_task(work("a", 0.4)), asyncio.create_task(work("b", 0.9))]
    done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
    print(f"wait FIRST_COMPLETED: {[t.result() for t in done]} (t={time.perf_counter() - t0:.1f}s)")
    for t in pending:
        t.cancel()

    # Queue (продюсер/консьюмер)
    q: asyncio.Queue[str] = asyncio.Queue()
    async def producer(n: int):
        for i in range(n):
            await q.put(f"item-{i}")
            await asyncio.sleep(0.05)
    async def consumer():
        items = []
        while len(items) < 4:
            items.append(await q.get())
            q.task_done()
        return items
    async with asyncio.TaskGroup() as tg:   # 3.11+ (в песочнице CPython 3.12)
        tg.create_task(producer(6))
        result = tg.create_task(consumer())
    print("Queue consumer:", result.result())

# Запуск: в песочнице (Pyodide = WASM, sys.platform == "emscripten") loop уже работает
# → main() «садится» в него (create_task); в терминале — asyncio.run(main()).
import sys
if sys.platform == "emscripten":
    asyncio.get_event_loop().create_task(main())
else:
    asyncio.run(main())```

## Частые ошибки

WARN: create_task «и забыли» (не await, не держите ссылку) — задача может быть «собрana» (GC) до завершения (RuntimeWarning). Держите Task (или await).

WARN: await « CPU-heavy» в loop (длинный расчёт «заблокирует — другие задачи ждут). CPU — loop.run_in_executor (поток/процесс) или multiprocessing.

WARN: wait_for «без обработки TimeoutError — «падает (не «тихий fallback. Ловите except asyncio.TimeoutError.

WARN: async «для одной задачи» (оверхед loop «не окупается; обычный синхронный проще. Async — «много I/O одновременно».

## Практическое задание

1. `create_task`: 3 задачи (0.2/0.5/0.8с); `await` первую, `cancel` остальные, выведите `done()`/`result()`.
2. `wait_for`: запрос с timeout=0.3» (задача спит 1.0) → `TimeoutError`; затем timeout=2.0 → результат.
3. `asyncio.wait`: 4 задачи; `FIRST_COMPLETED` → выведите «кто первый», `cancel` остальные.
4. `Queue`: 2 продюсера (по 3 item) + 1 консьюмер (6 item); выведите «собранные». (Через `TaskGroup` или `gather`.)
5. В комментарии: «when to async» — 2 примера «да» и 2 «нет» (по 1 строке).
