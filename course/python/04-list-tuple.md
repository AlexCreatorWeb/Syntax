# Урок 4. list и tuple: коллекции, comprehensions, распаковка

## Цель

После урока студент сможет: отличать **list** (мутабельный) от **tuple** (неизменяемый) и выбирать, когда что, работать со списками (индексы, срезы, `append`/`extend`/`insert`/`remove`/`pop`), писать **list comprehensions** (вместо циклов), использовать **распаковку** (`a, b = …`) и понимать, что `copy` ≠ `append`.

## Теория

### list: основной «контейнер»

`list` — упорядоченная **изменяемая** (мутабельная) коллекция:

```python
items = [1, "два", 3.0]
items.append(4)       # добавить в конец
items.extend([5, 6])  # добавить несколько
items.insert(0, 0)    # вставить по индексу
items.remove(3)       # убрать по ЗНАЧЕНИЮ (первый найденный)
items.pop()           # убрать и вернуть последний (или pop(i))
len(items); items[1]; items[1:3]; 2 in items
```

Списки — «растут» (в отличие от tuple). Мутабельность — сила (меняйте на лету) **и** ловушка (неслучайные изменения, `==` vs `is` для копий).

### tuple: неизменяемый «набор»

`tuple` — как list, но **нельзя** менять (`t[0] = 5` → TypeError). Когда: «фиксированный набор» (координаты `(x, y)`, «запись» (id, name, role)), ключи dict (только хешируемое — tuple, не list), возврат «нескольких значений» из функции.

```python
point = (3, 4)
point[0]          # 3
x, y = point      # распаковка
```

### List comprehensions — «питоничный» цикл

`[выражение for x in итерируемое if условие]` — создаёт список «за одну строку» (быстрее и читаемее цикла с `append`):

```python
nums = [1, 2, 3, 4, 5, 6]
sq = [n ** 2 for n in nums]                 # квадраты
even = [n for n in nums if n % 2 == 0]      # чётные
up = [w.upper() for w in words if len(w) > 3]  # + условие
```

«Вложенный» comprehension (матрица → плоский список) и «матрица из вложенного» — в задании.

### Распаковка

`a, b = 1, 2`; `first, *rest = [1, 2, 3, 4]` (`rest == [2, 3, 4]`); обмен `a, b = b, a`; `_, x, y = coords` (`_` — «не нужно»).

TIP: «список для итерации/изменения» → list; «стабильная кортежная структура» → tuple. Comprehension вместо `for + append` — по умолчанию.

NOTE: в песочнице — настоящий CPython: list/tuple/comprehensions — идентичны терминалу.

## Пример

`main.py`:

```python
"""list и tuple."""

# list: операции
items = [10, 20, 30]
items.append(40)
items.extend([50, 60])
items.insert(1, 15)
print("После append/extend/insert:", items)
items.remove(15)
last = items.pop()
print("remove(15), pop() →", last, "| теперь:", items)

# Срезы и проверки
print("Срез:", items[1:3], "| разворот:", items[::-1], "| 30 in:", 30 in items)

# tuple
point = (3, 4)
x, y = point
print(f"Точка: ({x}, {y}), расстояние: {(x**2 + y**2) ** 0.5:.2f}")
# point[0] = 99  → TypeError (immutable)

# comprehensions
nums = list(range(1, 11))
squares = [n ** 2 for n in nums]
evens = [n for n in nums if n % 2 == 0]
print("Квадраты:", squares)
print("Чётные:", evens)

words = ["python", "is", "awesome", "and", "clean"]
long_upper = [w.upper() for w in words if len(w) > 3]
print("Длинные (upper):", long_upper)

# «Матрица» → плоский список (вложенный comprehension)
matrix = [[1, 2, 3], [4, 5, 6]]
flat = [v for row in matrix for v in row]
print("Плоско:", flat)

# Распаковка
first, *rest = [1, 2, 3, 4]
print("first:", first, "| rest:", rest)
a, b = 1, 2
a, b = b, a
print("Обмен:", a, b)
```

## Частые ошибки

WARN: **изменяете** tuple (`t[0] = 5` → TypeError) или передаёте list там, где нужен «стабильный» набор (ключ dict — только tuple/str, не list).

WARN: `remove(x)` vs `pop(i)`: первый — по **значению** (ValueError, если нет), второй — по **индексу** (возвращает элемент). Не путайте.

WARN: «копия» через `b = a` для списка — **не копия** (одинаковый объект!). Копия: `b = a.copy()` или `b = a[:]`.

WARN: comprehension «со side-effect» (`[items.append(f(x)) for x in …]` — возвращает список None). Для «сделать» — цикл; для «создать список» — comprehension.

## Практическое задание

1. Список `nums = list(range(1, 51))`: через comprehensions — квадраты чётных, кубы нечётных < 1000.
2. Список слов: отфильтруйте «палиндромы» (`w == w[::-1]`), отсортируйте по длине (sorted + key — упоминание).
3. Матрица 3×3 → плоский список (вложенный comprehension); плоский список 9 → матрица 3×3.
4. Tuple «координаты» (x, y, z): распакуйте, выведите расстояние до начала координат (`math.sqrt` — `import math`).
5. Покажите (кодом): `b = a` (список) → изменение `b` меняет `a`; затем `b = a.copy()` → не меняет. Объясните комментарием.
