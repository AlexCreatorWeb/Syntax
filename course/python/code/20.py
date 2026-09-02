"""Урок 20. Исключения: try/except/else/finally, raise, свои Exception."""

# TODO: def parse(text: str) -> int: try: n = int(text) except ValueError as e: print(…), n = 0
#       else: print("else: распарсили"); finally: print("finally: всегда"); return n
# TODO: выведите parse("42"), parse("x")

# TODO: def safe_div(a, b) -> float | None: try: return a / b except (ZeroDivisionError, TypeError) as e: …
#       выведите safe_div(10, 0), safe_div(10, 4)

# TODO: class AppError(Exception): …; class NotFoundError(AppError): __init__(name) — super().__init__(…), self.name
#       users = {"Аня": 1, "Боря": 2}; def get_user(name) (raise NotFoundError)
#       try: get_user("Вера") except NotFoundError as e: print(e, e.name)

# TODO: raise … from: try: try: 1/0 except ZeroDivisionError as e: raise AppError("…") from e
#       except AppError as e: print("cause:", e.__cause__)

# TODO: from contextlib import suppress; with suppress(KeyError, IndexError): value = users["Вера"]; выведите
