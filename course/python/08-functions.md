# Урок 8. Функции: def, return, область видимости (LEGB)

## Цель

После урока студент сможет: описывать функции через `def` (имя, параметры, тело, `return`), отличать `return` от `print` (функция **возвращает**, а не «печатает»), объяснять **область видимости** по правилу **LEGB** (Local → Enclosing → Global → Built-in), использовать **глобальные** переменные осознанно (`global` — редко) и возвращать **несколько значений** (кортеж).

## Теория

### def и return

```python
def greet(name: str) -> str:
    """Приветствие."""
    return f"Привет, {name}!"
```

- `def имя(параметры) -> тип:` — описание; `->` — аннотация возвращаемого (урок 10).
- **`return`** — «отдать результат» и **выйти** из функции. Без `return` (или `return` без значения) функция возвращает **`None`**.
- `print` **не** return: `def f(): print(5)` → `f()` печатает 5, но **возвращает None**.

Несколько значений — **кортеж**:
```python
def divide(a, b):
    return a // b, a % b      # (часть, остаток)
q, r = divide(17, 5)          # распаковка
```

### Область видимости: LEGB

Имя ищется по 4 уровням (в порядке):
1. **L**ocal — текущая функция.
2. **E**nclosing — «вложенные» функции (если есть, наружу).
3. **G**lobal — модуль (глобальные имена файла).
4. **B**uilt-in — встроенные (`print`, `len`, `list`…).

Пример «подвоха»:
```python
x = 10            # global
def f():
    x = 5         # local (не меняет global!)
    print(x)      # 5
f()
print(x)          # 10 (global не тронут)
```

Чтобы **изменить** global из функции — `global x` (редко, лучше «принимайте и возвращайте»). **Нельзя** менять «нелокальную» переменную из **вложенной** функции без `nonlocal` (урок — в задании).

TIP: функции — **чистые**, когда можно: «вход → выход» без побочных эффектов (без `print`, без изменения глобального). Легче тестировать.

NOTE: в песочнице — настоящий CPython: функции, LEGB, return/None — идентичны терминалу.

## Пример

`main.py`:

```python
"""Функции и область видимости."""

# return vs print
def add(a, b):
    return a + b

def show(a, b):
    print(a + b)          # печатает, но возвращает None

print("add(2, 3) =", add(2, 3))       # 5 (значение)
print("show(2, 3) =", show(2, 3))     # 5  | None (печать + None)

# Несколько значений (кортеж)
def divide(a, b):
    return a // b, a % b

q, r = divide(17, 5)
print("17 // 5 =", q, "| 17 % 5 =", r)

# LEGB
x = "global"
def outer():
    x = "enclosing"
    def inner():
        # x = "local"  # если раскомментировать — Local
        print("inner видит:", x)   # enclosing (нет local)
    inner()
outer()
print("модуль видит:", x)          # global (outer не тронул)

# global (осторожно!)
count = 0
def increment():
    global count
    count += 1
increment(); increment()
print("count (global):", count)

# nonlocal (вложенная функция меняет «среднюю»)
def make_counter():
    n = 0
    def inc():
        nonlocal n
        n += 1
        return n
    return inc
c = make_counter()
print("счётчик:", c(), c(), c())

# Чистая функция (вход → выход)
def normalize(words):
    return [w.strip().lower() for w in words if w.strip()]
print("normalize:", normalize(["  Hi ", "", "BYE "]))
```

## Частые ошибки

WARN: **`print` вместо `return`** — функция «печатает», а «возвращает» None (не складывается в выражениях: `add(1,2) + 1` → TypeError).

WARN: «меняете» global без `global` (тихо создаёте **local**). `def f(): x = 5` не тронет глобальный `x`; для изменения — `global x` (или лучше — аргумент/return).

WARN: **тень** (shadowing): локальный аргумент с именем global (`def f(print): …`) — «перекрывает» встроенный. Не называйте аргументы как `print`, `len`, `list`.

WARN: ожидаете, что `return` «печатает». `return` — только «отдать вызывающему»; печать — на стороне вызова.

## Практическое задание

1. Функция `stats(nums) -> tuple`: возвращает `(min, max, sum, avg)` (avg — round 2). Проверьте распаковку.
2. Функция `clamp(x, lo, hi)` — «зажать» в диапазон. Проверьте на 5 значений.
3. LEGB: создайте global `mode`, функцию, которая **читает** его (без global), и функцию с `global mode`, которая **меняет**. Выведите до/после.
4. «Фабрика счётчиков» (как `make_counter`): `make_adder(step)` → функция, добавляющая `step` (через nonlocal). Проверьте: `add5 = make_adder(5)` → `add5()` → 5, 10, 15.
5. В комментарии: почему «чистые» функции (без global/без print) проще тестировать.
