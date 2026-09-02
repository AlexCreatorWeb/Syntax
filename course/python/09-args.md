# Урок 9. Аргументы функций: *args, kwargs, мутабельные дефолты

## Цель

После урока студент сможет: использовать **значения по умолчанию**, **`*args`** (произвольное число позиционных) и **`**kwargs`** (произвольные именованные), применять **keyword-only** параметры (`/` и `*` в сигнатуре), понимать **порядок** аргументов (позиционные → по умолчанию → *args → keyword-only → `**kwargs`) и избегать **мутабельных аргументов по умолчанию** (главная ловушка Python).

## Теория

### Значения по умолчанию

`def f(a, b=10):` — `b` опционален (если не передан — 10). Дефолт вычисляется **один раз** при определении функции (это причина главной ловушки ниже).

### *args и kwargs

- **`*args`** — «собрать» **лишние позиционные** аргументы в **кортеж**: `def f(*args): args` → `f(1,2,3)` → `args == (1, 2, 3)`.
- **`**kwargs`** — «собрать» **лишние именованные** в **dict**: `def f(**kwargs):` → `f(x=1, y=2)` → `kwargs == {"x": 1, "y": 2}`.

Имена `args`/`kwargs` — **соглашение** (можно любое, но так принято).

### Порядок в сигнатуре (обязателен)

`def f(pos, pos2, /, pos_or_kw, *, kw_only, **kwargs):`
1. **Позиционные** (pos, pos2) — только по позиции (`/` — «до» них только positional-only).
2. **Позиционные-или-именованные** (pos_or_kw) — и так, и так.
3. **`*`** — «разделитель»: после — **только именованные** (keyword-only).
4. **`*args`**, затем **keyword-only**, затем **`**kwargs`**.

### Ловушка: мутабельные дефолты

Дефолт-`[]`/`{}` — **один объект** на **все** вызовы:

```python
def f(item, bucket=[]):   # bucket — ОДИН список на всё время!
    bucket.append(item)
    return bucket
f(1)  # [1]
f(2)  # [1, 2]  ← не [2]! тот же список
```

Правильно: `def f(item, bucket=None): if bucket is None: bucket = []`.

TIP: *args/kwargs — для «обёрток» (прокси) и «гибких» API; для «обычной» функции — явные параметры (читабельность).

NOTE: в песочнице — настоящий CPython: *args/kwargs/дефолты — идентичны терминалу.

## Пример

`main.py`:

```python
"""Аргументы функций."""

# Значения по умолчанию
def power(base, exp=2):
    return base ** exp
print("power(3) =", power(3), "| power(2, 10) =", power(2, 10))

# *args
def total(*numbers):
    return sum(numbers)
print("total(1, 2, 3) =", total(1, 2, 3))
print("total(*[4, 5]) =", total(*[4, 5]))  # «распаковка» списка

# **kwargs
def describe(**fields):
    return ", ".join(f"{k}={v}" for k, v in fields.items())
print(describe(name="Аня", age=30, active=True))

# *args + **kwargs вместе («обёртка»)
def log_call(func, *args, **kwargs):
    print(f"вызов {func.__name__}{args} {kwargs}")
    return func(*args, **kwargs)
def add(a, b=0):
    return a + b
print("log_call:", log_call(add, 5, b=10))

# positional-only (/) и keyword-only (*)
def f(a, /, b, *, c=1):
    return a, b, c
print("f(1, 2, c=3) =", f(1, 2, c=3))
# f(1, 2, 3)   → TypeError: c — только именованное
# f(a=1, …)    → TypeError: a — только позиционное

# Мутабельный дефолт (ЛОВУШКА)
def bad(item, bucket=[]):
    bucket.append(item)
    return bucket
print("bad(1) =", bad(1))
print("bad(2) =", bad(2))   # [1, 2] — тот же список!

# Правильно
def good(item, bucket=None):
    if bucket is None:
        bucket = []
    bucket.append(item)
    return bucket
print("good(1) =", good(1))
print("good(2) =", good(2))  # [2] — свежий список
```

## Частые ошибки

WARN: мутабельный дефолт (def f(x, acc=[])) — общий объект на все вызовы (дефолт вычисляется один раз при def). Дефолт None + создание внутри.

WARN: *args/kwargs «везде» (вместо явных параметров) — «магический» API, который не читается. Для «обычной» функции — именованные параметры.

WARN: порядок аргументов перепутан (keyword-only до *, *args после kwargs) → SyntaxError/неожиданное поведение. Порядок: pos → pos/kw → * → keyword-only → *args → kwargs.

WARN: «забываете», что дефолт один на все вызовы (см. ловушку) — особенно с dict/list/объектами.

## Практическое задание

1. Функция `apply_discount(price, tax=0.2, **modifiers)`: применяет скидку `tax` и **произвольные** модификаторы (`{"vip": 0.1}` — ещё скидка). Выведите для 3 вызовов.
2. `*args`: функция `spread(values, separator=" | ")` — объединяет **все** аргументы (через `str`) разделителем. Проверьте `spread(1, 2, 3)` и `spread(*["a","b"])`.
3. `**kwargs`: функция `build_url(base, **params)` — `base + "?" + "k=v&k=v"` (отсортировано по ключам).
4. `positional-only`/`keyword-only`: `def connect(host, /, port=5432, *, timeout=5)` — выведите «подпись» (`help` или `inspect.signature`) и 2 вызова.
5. Покажите (кодом): мутабельный дефолт «ломает» (два вызова → общий список) и «чините» через `None`. Объясните комментарием, **почему** (дефолт вычисляется один раз).
