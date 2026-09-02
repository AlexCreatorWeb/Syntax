# Урок 10. Type hints и PEP 8: современный стиль

## Цель

После урока студент сможет: annotировать функции и переменные (**type hints**: `int`, `str`, `list[int]`, `dict[str, int]`, `X | None`, `Optional`, `Callable`), понимать, что аннотации — **не** проверка в рантайме (подсказки для инструментов), и применять базовые правила **PEP 8** (имена: snake_case/UPPER_CASE/PascalCase, отступы, длина строк, пробелы).

## Теория

### Зачем type hints

Python — динамический (типы «на лету»). **Аннотации** (`x: int = 5`, `def f(a: int) -> str:`) — **подсказки**: IDE (автодополнение, подсветка ошибок) и **лент-чекеры** (mypy, pyright) проверяют **статически** (без запуска). В рантайме — почти не влияют (можно прочитать как `f.__annotations__`, но «не enforcement»).

### Базовые аннотации

```python
name: str = "Аня"
age: int = 30
scores: list[float] = [9.5, 8.0]          # list[...] (3.9+, не List)
stock: dict[str, int] = {"кофе": 10}      # dict[str, int]
point: tuple[int, int] = (3, 4)           # tuple[...]
maybe: int | None = None                  # «int или None» (3.10+, PEP 604)
# Optional[int] — то же, что int | None (старый синтаксис)
```

Функции:
```python
def greet(name: str, excited: bool = False) -> str:
    return f"Привет, {name}!" + ("!" if excited else "")

def find(items: list[int], x: int) -> int | None:
    for i, v in enumerate(items):
        if v == x:
            return i
    return None                            # «не нашли» → None
```

«Сложные»: `Callable[[int, str], bool]` (функция (int, str) → bool), `Any` («не знаю/любое» — редко), `Iterable`/`Iterator` (итерируемые).

### PEP 8: базовый стиль

- **Имена**: переменные/функции — `snake_case`; константы — `UPPER_CASE`; классы — `PascalCase`; «приватное» — `_leading`.
- **Отступы**: 4 пробела (не табы).
- **Строки**: до **79** (PEP 8) или 88–100 (многие проекты; flake8/ruff — конфигурируются).
- **Пробелы**: `x = 1 + 2` (окружают операторы), `f(1, 2)` (после запятой), `if x:` (после условия).
- **Импорты**: сначала stdlib, затем сторонние, затем локальные (группы).
- **Одна точка с запятой** — на строку (не `a = 1; b = 2`).

Инструменты: **ruff** (лент + форматтер, быстро), **mypy** (тип-чек). В курсе — «руками» (понимание), но держите стиль.

TIP: аннотируйте **публичные** функции (API) точно; «внутри» — где помогает читаемости. `int | None` (не `Optional[int]`) — на 3.10+.

NOTE: в песочнице — настоящий CPython: аннотации **работают** (хранятся в `__annotations__`), но **не проверяются** в рантайме (как в терминале).

## Пример

`main.py`:

```python
"""Type hints и PEP 8."""

# Переменные
username: str = "student"
level: int = 1
progress: float = 0.75
tags: list[str] = ["python", "backend"]
config: dict[str, int | str] = {"port": 8000, "host": "localhost"}
origin: tuple[int, int] = (0, 0)
nickname: str | None = None

# Функции с аннотациями
def top_scores(scores: list[float], n: int = 3) -> list[float]:
    """Топ-N баллов (отсортировано по убыванию)."""
    return sorted(scores, reverse=True)[:n]

def find_index(items: list[int], target: int) -> int | None:
    """Индекс target или None."""
    for i, value in enumerate(items):
        if value == value and value == target:
            return i
    return None

# Вызовы
print("top_scores:", top_scores([88, 95, 72, 99, 84]))
print("find_index:", find_index([10, 20, 30], 20))
print("find_index (нет):", find_index([10, 20], 99))

# Аннотации «хранятся»
print("Аннотации top_scores:", top_scores.__annotations__)

# Callable (тип «функции»)
from collections.abc import Callable
def apply_twice(func: Callable[[int], int], x: int) -> int:
    return func(func(x))
def double(x: int) -> int:
    return x * 2
print("apply_twice(double, 3) =", apply_twice(double, 3))

# PEP 8: имена (примеры, не нарушайте)
MAX_RETRIES: int = 3          # константа — UPPER_CASE
user_name: str = "a"          # переменная — snake_case
class Task:                    # класс — PascalCase
    _internal: int = 0        # «приватное» — _leading
```

## Частые ошибки

WARN: ожидаете, что аннотация **проверит** тип в рантайме (`def f(x: int): …; f("a")` — **не упадёт**, TypeError только если код сам не проверит). Проверка — mypy/pyright (статика).

WARN: пишете `Optional[int]` на 3.10+ — используйте **`int | None`** (PEP 604, короче). `Optional` — для совместимости со старыми.

WARN: **нарушаете PEP 8** системно (имена camelCase для функций, табы, строки по 200 символов). Стиль — часть «чистоты» (PEP 8 — стандарт).

WARN: `Any` «везде» (аннотация-«не знаю») — теряет смысл аннотаций. `Any` — только на границе (внешние данные, «пока не ясно»).

## Практическое задание

1. Аннотируйте: `def normalize(values: list[float]) -> list[float]` (round 2), `def first_positive(nums: list[int]) -> int | None`, `def merge(a: dict[str, int], b: dict[str, int]) -> dict[str, int]`.
2. `def histogram(words: list[str]) -> dict[str, int]` (слово → количество). Проверьте аннотации (`.__annotations__`).
3. `Callable`: `def retry(func: Callable[[], int], attempts: int = 3) -> int` — вызывает `func`, пока не вернёт `> 0` (или `attempts` раз). Функция-«лотерей» (счётчик попыток).
4. PEP 8: возьмите «кривой» фрагмент (camelCase-функции, табы, длинные строки, `Optional`) и «переписать» по PEP 8 (snake_case, 4 пробела, `int | None`, строки < 88).
5. В комментарии: чем `int | None` отличается от `Optional[int]` и почему первый предпочтительнее (3.10+).
