---
id: py-asyncio
track: python
type: guide
section: asyncio
order: 3
title:
  en: "AsyncIO Deep Dive"
  ru: "AsyncIO подробно"
excerpt:
  en: "Concurrency models, event loops, and non-blocking I/O operations for high-performance network applications."
  ru: "Модели конкурентности, event loop и неблокирующий I/O для высокопроизводительных сетевых приложений."
version: "python 3.9+"
updated: 2026-05-03
---

Async Python trades threads for a single-threaded event loop. It shines when the program spends most of its time waiting on I/O — HTTP, databases, sockets.

## The event loop

```python
import asyncio

async def greet(name):
    await asyncio.sleep(1)  # yields control, no thread blocked
    return f"Hello, {name}"

async def main():
    await asyncio.gather(greet("Ada"), greet("Linus"))

asyncio.run(main())
```

## Concurrent tasks

```python
async def fetch_status(url):
    async with aiohttp.ClientSession() as s:
        async with s.get(url) as r:
            return r.status

# 5 requests in ~1 RTT, not 5
statuses = asyncio.run(
    asyncio.gather(*[fetch_status(u) for u in urls])
)
```

> **WARNING**
> Calling a blocking function (requests, time.sleep, heavy CPU) inside a coroutine stalls the whole loop. Offload it with `asyncio.to_thread` or a process pool.

## Timeouts and error handling

```python
async def call_with_timeout():
    try:
        return await asyncio.wait_for(fetch_status(url), timeout=5)
    except TimeoutError:
        return None  # the task is cancelled automatically
```

> **TIP**
> `asyncio.gather(..., return_exceptions=True)` keeps one failed task from silently cancelling the whole batch — inspect results per item.

<!-- RU -->

Асинхронный Python меняет потоки на однопоточный event loop. Он расцветает, когда программа в основном ждёт I/O — HTTP, базы данных, сокеты.

## Event loop

```python
import asyncio

async def greet(name):
    await asyncio.sleep(1)  # отдаёт управление, поток не блокируется
    return f"Hello, {name}"

async def main():
    await asyncio.gather(greet("Ada"), greet("Linus"))

asyncio.run(main())
```

## Параллельные задачи

```python
async def fetch_status(url):
    async with aiohttp.ClientSession() as s:
        async with s.get(url) as r:
            return r.status

# 5 запросов за ~1 RTT, а не за 5
statuses = asyncio.run(
    asyncio.gather(*[fetch_status(u) for u in urls])
)
```

> **WARNING**
> Блокирующий вызов (requests, time.sleep, тяжёлый CPU) внутри корутины останавливает весь цикл. Выносите через `asyncio.to_thread` или process pool.

## Таймауты и обработка ошибок

```python
async def call_with_timeout():
    try:
        return await asyncio.wait_for(fetch_status(url), timeout=5)
    except TimeoutError:
        return None  # задача отменяется автоматически
```

> **TIP**
> `asyncio.gather(..., return_exceptions=True)` не даёт одной упавшей задаче тихо отменить всю партию — проверяйте результаты по одному.
