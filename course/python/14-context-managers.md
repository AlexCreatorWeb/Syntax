# Урок 14. Контекстные менеджеры вглубь: `__enter__`/`__exit__`, contextlib

## Цель

После урока студент сможет: объяснять **протокол контекстного менеджера** (`__enter__`/`__exit__`, что возвращает `as`), писать **свой** контекстный менеджер (класс) и через **`@contextmanager`** (генератор + `yield`), использовать **`contextlib.suppress`** и **`contextlib.redirect_stdout`**, и понимать, что `with` — «универсальный» механизм (файлы, блокировки, тайминг — всё через него).

## Теория

### Протокол `with`

`with выражение as переменная: блок` работает, если объект имеет **`__enter__`** и **`__exit__`**:
1. Вызывается `__enter__()` — его **возврат** идёт в `as переменная`.
2. Выполняется блок.
3. При выходе (нормально или с ошибкой) вызывается `__exit__(exc_type, exc, tb)`:
   - если **нет** ошибки — `(None, None, None)`.
   - если **есть** — передаётся исключение; если `__exit__` вернёт **True** — ошибка **подавляется**, иначе — пробрасывается.

Файлы — частный случай: `__enter__` → сам файл, `__exit__` → `close()`.

### Свой контекстный менеджер (класс)

```python
class Timer:
    def __enter__(self):
        self.start = time.perf_counter()
        return self
    def __exit__(self, exc_type, exc, tb):
        self.elapsed = time.perf_counter() - self.start
        return False   # не подавлять ошибки
```

### `@contextmanager` (короче, генератором)

```python
from contextlib import contextmanager

@contextmanager
def timer(label: str):
    start = time.perf_counter()
    yield            # «before» — до yield, «after» — после (даже при ошибке)
    print(f"{label}: {time.perf_counter() - start:.3f}s")
```

Всё **до** `yield` — «вход», **после** — «выход» (гарантированно, как `__exit__`).

### Готовые: suppress, redirect_stdout

- `contextlib.suppress(ValueError): …` — «погасить» указанное исключение (вместо try/except-pass).
- `contextlib.redirect_stdout(io.StringIO())` — «перехватить» print (в тестирование).

TIP: `with` — для **всего**, что «открыл/закрыл», «включил/выключил», «заблокировал/разблокировал». Не «ручные» try/finally для парных операций.

NOTE: в песочнице — настоящий CPython: `with`, `__enter__/__exit__`, `contextlib` — идентичны терминалу.

## Пример

`main.py`:

```python
"""Контекстные менеджеры."""

import time
import io
from contextlib import contextmanager, suppress

# 1) Класс-менеджер (Timer)
class Timer:
    def __init__(self, label: str = "блок"):
        self.label = label
    def __enter__(self):
        self.start = time.perf_counter()
        return self
    def __exit__(self, exc_type, exc, tb):
        print(f"[{self.label}] {time.perf_counter() - self.start:.4f}s")
        return False

with Timer("цикл"):
    total = sum(range(100_000))
print("total:", total)

# 2) @contextmanager (генератор)
@contextmanager
def log_scope(name: str):
    print(f"→ вход в {name}")
    yield name          # «внутри» (as получает name)
    print(f"← выход из {name}")

with log_scope("секция A") as sec:
    print("  работа в", sec)
# «выход» напечатается даже при ошибке:
try:
    with log_scope("секция B"):
        raise RuntimeError("упс")
except RuntimeError:
    print("  (ошибка обработана, выход выполнен)")

# 3) suppress
with suppress(ValueError, KeyError):
    value = int("abc")   # ValueError → подавлен
print("после suppress, value =", value)

# 4) redirect_stdout (перехват print)
buffer = io.StringIO()
with redirect_stdout := contextlib.redirect_stdout(buffer):
    print("это уйдёт в buffer")
print("перехвачено:", buffer.getvalue().strip())
```

## Частые ошибки

WARN: **`yield` не один** в `@contextmanager` (или `return` вместо `yield`) — «менеджер» не работает (RuntimeError). Один `yield` = «граница» в/выход.

WARN: «забываете» код **после** `yield` при **ошибке** (он **выполнится** — как `__exit__`). Но если «выход» сам бросает исключение — «перекроется» оригинальное (осторожно).

WARN: `__exit__` **вернул True** «случайно» (подавил ошибку). True = «ошибка обработана, не пробрасывать»; для большинства — `return False` (или ничего).

WARN: **ручной** `try/finally` для «открыл/закрыл» вместо `with`. `with` — короче, безопаснее (даже при исключении «внутри»).

## Практическое задание

1. Класс-менеджер `WorkingDir(path)`: `__enter__` — `os.chdir(path)`, `__exit__` — возврат в исходный каталог. Проверьте (создайте `/tmp/work`).
2. `@contextmanager` `measure(label)`: измеряет время блока, возвращает (через `yield`) время. Используйте: `with measure("сумма") as t: …`.
3. `@contextmanager` `group(label)`: печатает `### label` до, `---` после (даже при ошибке). Проверьте на блоке с `raise`.
4. `suppress`: прочитайте «несуществующий» файл (FileNotFoundError подавлен) и `int("x")` (ValueError подавлен) — в двух `with suppress`.
5. `redirect_stdout`: «перехватите» вывод функции (которая print'ит 3 строки) в `StringIO`, выведите «перехвачено: …».
