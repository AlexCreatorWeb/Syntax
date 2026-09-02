# Урок 6. Условные конструкции: if/elif/else, truthiness

## Цель

После урока студент сможет: писать ветвления `if/elif/else` (с отступами — блок), использовать **тернарный** оператор (`x if cond else y`), оперировать логическими операциями (`and`/`or`/`not`), понимать **truthiness** (какие значения «ложные»: `0`, `""`, `[]`, `None`, `False`, `()`, `{}`) и писать «питоничные» проверки (`if items:`, `if x is None:`).

## Теория

### if / elif / else

Ветвление определяется **отступом** (4 пробела, PEP 8) и двоеточием. `elif` — «иначе-если» (сколько нужно). `else` — опционально:

```python
if score >= 90:
    grade = "A"
elif score >= 75:
    grade = "B"
elif score >= 60:
    grade = "C"
else:
    grade = "D"
```

Важно: условие — **выражение** (bool или «что-то» с truthiness). Скобки вокруг условия **не нужны** (в отличие от C/JS).

### Тернарный оператор

`значение_если_истина if условие else значение_если_ложь` — «одна строка» вместо if/else-присваивания:

```python
status = "взрослый" if age >= 18 else "несовершеннолетний"
```

Читаемость: только для **коротких** выражений; сложное — обычный if.

### Логика: and / or / not

- `and` — оба (короткое замыкание: `A and B` — если A ложь, B не считается).
- `or` — хотя бы один.
- `not` — инверсия.

«Цепочки» сравнения (питонично, без `and`): `0 < x < 10` (x больше 0 И меньше 10).

### Truthiness: «ложные» значения

Значение, которое в условии «равно False», называется **falsy**: `False`, `None`, `0`, `0.0`, `""`, `()`, `[]`, `{}`, `set()`. Всё остальное — **truthy** (включая `"0"`, `"False"`, `[" "]`).

Питоничные проверки:
```python
if items:            # не пусто (и не None)
if not items:        # пусто ИЛИ None
if x is None:        # именно None (is, не ==)
if x is not None:    # не None
```

TIP: «есть/нет» через truthiness (`if data:`), а не `if data == True` (анти-стиль, PEP 8: «Avoid comparing booleans to True/False using ==»).

NOTE: в песочнице — настоящий CPython: условия, логика, truthiness — идентичны терминалу.

## Пример

`main.py`:

```python
"""Условные конструкции."""

# if/elif/else
temp = 28
if temp > 30:
    weather = "жара"
elif temp > 20:
    weather = "тепло"
elif temp > 10:
    weather = "прохладно"
else:
    weather = "холодно"
print(f"{temp}°C → {weather}")

# Тернарник
age = 20
status = "взрослый" if age >= 18 else "несовершеннолетний"
print("Статус:", status)

price, discount = 1000, 0.1 if price > 500 else 0.0
print("Скидка:", discount, "→", price * (1 - discount))

# Логика + цепочки
x = 7
print("0 < x < 10:", 0 < x < 10)
print("and:", True and False, "| or:", False or "да", "| not:", not 0)
# Короткое замыкание:
print("Замыкание:", (False and print("не выполнится")) is None)

# Truthiness
falsy = [False, None, 0, 0.0, "", (), [], {}, set()]
for v in falsy:
    if not v:
        print(f"falsy: {v!r}")

# Питоничные проверки
items = []
print("items пусто/None:", not items)
items = [1, 2]
print("items не пуст:", bool(items))

value = None
print("is None:", value is None, "| is not None:", value is not None)

# «Правильно» vs «неправильно»
flag = True
print("Питонично:", flag, "| Анти-стиль (не пишите):", flag == True)
```

## Частые ошибки

WARN: сравниваете булевы через `==`: `if x == True:`. Пишите `if x:` (truthiness) / `if x is True:` (если **именно** bool нужен).

WARN: `if x = 5:` (присваивание вместо сравнения) → SyntaxError. Сравнение — `==` (или `is` для None).

WARN: ожидаете скобки вокруг условия: `if (x > 5):` — допустимо, но **не принято** (PEP 8: без лишних скобок).

WARN: «проверяете» пустую строку/список через `len(x) > 0`. Пишите `if x:` / `if not x:` (truthiness).

## Практическое задание

1. Функция `describe(n: int) -> str`: «отрицательное/ноль/положительное» + «чётное/нечетное» (через if/elif + тернарник для чётности).
2. «Возраст и права»: `can_drive = age >= 18 and not suspended`; `vip = age >= 60 or member`. Выведите для 3 профилей.
3. Проверьте (кодом): `bool([])`, `bool([0])`, `bool("0")`, `bool("False")`, `bool(0.0)`. Объясните каждый (комментарий).
4. Напишите «если список пуст — заполнить дефолтом» **тернарником** и через `or` (`items = items or [1, 2]`) — что даёт `None or [1]`?
5. В комментарии: чем `is` отличается от `==` и почему для `None` — именно `is`.
