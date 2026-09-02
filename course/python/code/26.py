"""Урок 26. httpx + продвинутый REST (async; в песочнице — имитация AsyncClient)."""

import asyncio
import random
import time


# TODO: def fake_api(method, path, body=None) -> dict: GET "/users" → 200 + список; POST "/users" → 201; иначе 404
# TODO: class Resp: status_code; json(); raise_for_status()
# TODO: class AsyncClient: __init__(base_url, timeout=5.0, headers=None); async get(path) (sleep 0.05 + fake_api);
#       async post(path, json)
# TODO: async def get_with_retry(client, path, attempts=3): цикл; if status < 500 → return; backoff sleep(0.2 * 2**i)

async def main() -> None:
    pass  # TODO: раскомментируйте
    # TODO: async with AsyncClient(base_url="https://api.example.com", headers={"Authorization": "Bearer T"}) as client:
    #       r = await get_with_retry(client, "/users"); r.raise_for_status(); print(r.json())
    #       r = await client.post("/users", json={"name": "Вера"}); print(r.status_code, r.json())
    #       results = await asyncio.gather(client.get("/users"), client.get("/users")); время


asyncio.run(main())
