# Урок 20. Исключения: try/except/else/finally, свои Exception

## Цель

После урока студент сможет: обрабатывать ошибки через **`try/except/else/finally`**, **бросать** исключения (`raise`), писать **свои** классы исключений (наследники `Exception`), использовать **`contextlib.suppress`** и понимать иерархию исключений (`Exception` → конкретные) и правило **«ловите узкое, не `except:`»**.

## Теория

### try / except / else / finally

```python
try:
    value = int(user_input)
except ValueError as e:          # «поймать» конкретное
    value = 0
else:                            # только если **без** ошибки
    print("parsed:", value)
finally:                         # **всегда** (после except/else)
    print("done")
```

- **`except TypeError, ValueError`** — несколько типов (кортеж).
- **`except Exception as e`** — «любое» (кроме `KeyboardInterrupt`/`SystemExit` — `BaseException`).
- **`except:`** (без типа) — **редко** (ловит даже `KeyboardInterrupt`); предпочтительнее `except Exception`.

### raise

`raise ValueError("текст")` — «бросить» исключение. `raise` (без аргумента) — «пер сбросить» текущее (в `except`). `raise … from e` — «цепочка» (cause).

### Свои исключения

Наследники `Exception` — «свой» домен (API, «поискатель»):

```python
class AppError(Exception):
    """Базовая ошибка приложения."""

class NotFoundError(AppError):
    def __init__(self, name: str):
        super().__init__(f"не найдено: {name}")
        self.name = name

def get_user(users: dict, name: str):
    if name not in users:
        raise NotFoundError(name)
    return users[name]
```

Вызывающий ловит **`NotFoundError`** (узкое) или **`AppError`** (группа).

### contextlib.suppress

`with suppress(ValueError): int(x)` — «погасить» указанное (вместо try/except-pass).

TIP: ловите узкое (ValueError, не Exception); не «глотайте» молча (хотя бы logging/комментарий); finally — для «очистки» (закрыть/откатить).

NOTE: в песочнице — настоящий CPython: try/except/raise — идентичны терминалу (traceback показывает строку файла).

## Пример

`main.py`:

```python
"""Исключения."""

# try/except/else/finally
def parse(text: str) -> int:
    try:
        n = int(text)
    except ValueError as e:
        print(f"ValueError: {e!r} → 0")
        n = 0
    else:
        print("else: распарсили")
    finally:
        print("finally: всегда")
    return n

print("parse('42'):", parse("42"))
print("parse('x'):", parse("x"))

# Несколько типов + as
def safe_div(a: float, b: float) -> float | None:
    try:
        return a / b
    except (ZeroDivisionError, TypeError) as e:
        print(f"{type(e).__name__}: {e}")
        return None
print("safe_div(10, 0):", safe_div(10, 0))
print("safe_div(10, 4):", safe_div(10, 4))

# Свои исключения
class AppError(Exception):
    """Базовая ошибка."""
class NotFoundError(AppError):
    def __init__(self, name: str):
        super().__init__(f"не найдено: {name}")
        self.name = name

users = {"Аня": 1, "Боря": 2}
def get_user(name: str) -> int:
    if name not in users:
        raise NotFoundError(name)
    return users[name]

try:
    get_user("Вера")
except NotFoundError as e:
    print("NotFoundError:", e, "| name:", e.name)
except AppError as e:
    print("AppError (группа):", e)

# raise … from (цепочка)
try:
    try:
        1 / 0
    except ZeroDivisionError as e:
        raise AppError("деление сломалось") from e
except AppError as e:
    print("cause:", e.__cause__)

# contextlib.suppress
from contextlib import suppress
value = None
with suppress(KeyError, IndexError):
    value = users["Вера"]
print("suppress: значение =", value)

# finally: «очистка»
def with_cleanup():
    print("открыл ресурс")
    try:
        raise RuntimeError("сбой")
    finally:
        print("закрыл ресурс (finally)")
try:
    with_cleanup()
except RuntimeError:
    print("обработано")
```

## Частые ошибки

WARN: except: (без типа) — ловит всё (KeyboardInterrupt, SystemExit) — «глотает» Ctrl+C/выход. except Exception (или конкретные).

WARN: «Глотаете» исключение (try/except-pass без логирования) — баг «исчезает» (трудно найти). Минимум logging.exception или комментарий «почему безопасно».

WARN: широкий except «вверху» (ловите Exception там, где нужно ValueError) — «перекрываете» конкретные (вызывающий не может отреагировать на «свою» ошибку).

WARN: raise внутри except без from (теряете «причину»). raise NewError("…") from e — «цепочка» (отладка).

## Практическое задание

1. Функция `load_config(path) -> dict`: читает JSON-файл; `FileNotFoundError` → `{}`; `json.JSONDecodeError` → `{"error": "bad json"}`; в `finally` — print «завершено».
2. Свои: `StockError`, `OutOfStockError(StockError)` (с `item`, `need`, `have`). Функция `buy(stock, item, qty)` (raise при нехватке). Обработайте в вызывающем.
3. `raise … from`: «обёртка» `fetch_value()` (внутри `int("x")` → `ValueError`; перебросите `AppError("bad value") from e`). Выведите `e.__cause__`.
4. `suppress`: `with suppress(KeyError): x = d["нет"]`; `with suppress(IndexError): y = [].pop()`. Выведите переменные (по умолчанию).
5. В комментарии: чем `except Exception` отличается от `except:`, и почему `else` полезен (2 предложения).
