"""Урок 24. asyncio на практике: create_task, wait_for, Queue."""

import asyncio
import time


async def work(name: str, delay: float) -> str:
    await asyncio.sleep(delay)
    return f"{name}:{delay}"


async def main() -> None:
    pass  # TODO: раскомментируйте
    # TODO: create_task + cancel: fast = create_task(work("fast", 0.3)); slow = create_task(work("slow", 2.0))
    #       await fast; print(fast.result()); if not slow.done(): slow.cancel(); await slow → CancelledError
    # TODO: wait_for: async def slow_io() (sleep 2.0); await asyncio.wait_for(slow_io(), timeout=0.5) → TimeoutError
    # TODO: wait: tasks = [create_task(work("a", 0.4)), create_task(work("b", 0.9))];
    #       done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED); cancel pending
    # TODO: Queue: q = asyncio.Queue(); producer (6 item, sleep 0.05); consumer (4 item); TaskGroup


asyncio.run(main())
