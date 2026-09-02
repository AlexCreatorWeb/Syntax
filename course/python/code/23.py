"""Урок 23. asyncio: event loop, coroutine, await, gather."""

import asyncio
import time


async def task(name: str, delay: float) -> str:
    print(f"  {name}: старт")
    await asyncio.sleep(delay)
    return f"{name}={delay}"


async def main() -> None:
    pass  # TODO: раскомментируйте
    # TODO: последовательно: r1 = await task("A", 1); r2; r3; время (time.perf_counter)
    # TODO: параллельно: results = await asyncio.gather(task("X", 1), task("Y", 1), task("Z", 1)); время
    # TODO: create_task: t1, t2 = asyncio.create_task(…); await asyncio.sleep(0.5); await asyncio.gather(t1, t2)
    # TODO: as_completed: for coro in asyncio.as_completed([task("fast", 0.5), task("slow", 1.5)]): r = await coro


asyncio.run(main())
