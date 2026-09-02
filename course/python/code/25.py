"""Урок 25. REST-клиент: requests (терминал) + «имитация» API (песочница)."""

FAKE_DB = {"users": {"1": {"name": "Аня", "age": 30}, "2": {"name": "Боря", "age": 25}}}


# TODO: def fake_get(path: str, params: dict | None = None) -> dict:
#       "/users" → {"status": 200, "json": list(…values())}; "/users/<id>" → 200/404; иначе 404
# TODO: def fake_post(path: str, body: dict) -> dict: "/users" + "name" in body → 201 + новый id; иначе 400

# TODO: class FakeResponse: __init__(status, payload); status_code; json(); raise_for_status() (RuntimeError при >=400)
# TODO: def api_get(path, params) -> FakeResponse; def api_post(path, json_body) -> FakeResponse

# TODO: r = api_get("/users"); r.raise_for_status(); print(r.json())
# TODO: r = api_get("/users/1"); print(r.json())
# TODO: try: r = api_get("/users/999"); r.raise_for_status() except RuntimeError as e: print("404:", e)
# TODO: r = api_post("/users", json_body={"name": "Вера", "age": 28}); print(r.status_code, r.json())
