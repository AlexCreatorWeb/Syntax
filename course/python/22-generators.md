# Урок 22. Генераторы, yield, ленивость; map/filter/sorted

## Цель

После урока студент сможет: писать **генераторы** (`yield`, `yield from`), объяснять **ленивость** (вычисление «по запросу», O(1) память), использовать **generator expressions** (`(x for …)`), применять **`map`/`filter`** и **`sorted(key=…)`** (включая «лямбда-ключ»), и понимать, когда генератор «лучше» списка.

## Теория

### Генераторы: `yield`

Функция с **`yield`** — **генератор**: возвращает **итератор**, который «производит» значения **лениво** (по `next()`), «запоминает» состояние (локальные, строку цикла):

```python
def countdown(n: int):
    while n > 0:
        yield n        # «пауза» (состояние сохранено)
        n -= 1

for x in countdown(3):
    print(x)           # 3, 2, 1
```

`next(gen)` — «следующее» (или `StopIteration`); `for` — «пока есть». Генератор — **однократный** (вычерпан → пуст).

### Generator expressions

`(выражение for …)` — «генератор» в одну строку (аналог list comprehension, но **лениво**, без списка в памяти):

```python
total = sum(n * n for n in range(1_000_000))   # без списка на 10^6
first5 = next((x for x in range(100) if x % 7 == 0), None)
```

### Ленивость: когда генератор «лучше»

- **Большие** последовательности (строк файла, строк потока) — не «вся память».
- **Бесконечные** (`count()`, `repeat()`) — «по запросу».
- **Цепочки** (filter → map → take) — «ленивая конвейер» (вычисляет «то, что нужно»).

### `map` / `filter` / `sorted(key=…)`

- `map(f, ит)` — «применить f к каждому» (лениво); `list(map(str, nums))`.
- `filter(pred, ит)` — «оставить, где pred True» (лениво).
- `sorted(ит, key=fn, reverse=True)` — «сортировка» **по ключу** (`key=lambda t: t[1]`); возвращает **список** (вход не меняется). `max/min(ит, key=fn)`.

(Питонично: **comprehension** часто читабельнее `map`/`filter`; но `sorted(key=…)` — стандарт.)

TIP: «список в памяти» (нужен **многократно**) vs «генератор» (один проход, **лениво**). Для «одного» прохода по большому — генератор.

NOTE: в песочнице — настоящий CPython: генераторы, `yield`, `map`/`filter`/`sorted` — идентичны терминалу.

## Пример

`main.py`:

```python
"""Генераторы, yield, map/filter/sorted."""

# Генератор (функция с yield)
def chunks(items: list, size: int):
    """Режет список на «куски» size (лениво)."""
    for i in range(0, len(items), size):
        yield items[i:i + size]

nums = list(range(10))
for c in chunks(nums, 3):
    print("chunk:", c)

# «Бесконечный» генератор + islice
def count(from_=0, step=1):
    n = from_
    while True:
        yield n
        n += step
from itertools import islice
print("count:", list(islice(count(10, 3), 5)))   # 10, 13, 16, 19, 22

# Generator expression (лениво)
sq = (n * n for n in range(5))
print("genexpr:", next(sq), next(sq), "| остаток:", list(sq))

# sum без списка (лениво)
total = sum(n for n in range(1000) if n % 2 == 0)
print("сумма чётных 0..999:", total)

# map / filter
words = ["python", "is", "awesome"]
upper = list(map(str.upper, words))
long_words = list(filter(lambda w: len(w) > 3, words))
print("map:", upper, "| filter:", long_words)

# sorted(key=…)
students = [("Аня", 92), ("Боря", 78), ("Вера", 88)]
by_score = sorted(students, key=lambda s: s[1], reverse=True)
print("по баллам:", by_score)
by_name = sorted(students, key=lambda s: s[0])
print("по имени:", by_name)

# max/min с key
print("макс балл:", max(students, key=lambda s: s[1]))
print("самое длинное слово:", max(words, key=len))
```

## Частые ошибки

WARN: **генератор «вычерпан»** (второй `for` по нему — пуст). Генератор — **однократный**; для «повторно» — **функция** (создаёт новый) или список.

WARN: **`yield` в «обычной» функции** (ожидаете «возврат» списка). `yield` → **генератор** (итератор), не значение. Для «списка» — `return [ … ]` (или comprehension).

WARN: **`map`/`filter` «вложенные»** (трудно читается). Для «сложного» — **comprehension** (читабельнее); `map`/`filter` — для «простого» (одна функция/предикат).

WARN: **`sorted` меняет «вход»** (нет, возвращает **новый** список; «in-place» — `list.sort()`). Не «`sorted_inplace`».

## Практическое задание

1. Генератор `rle_encode(text)` («run-length»: `"aaabbc"` → `("a",3),("b",2),("c",1)`). Проверьте на 3 строках.
2. Генератор `prime_gen(limit)` (простые до limit, «решето» или перебор). Выведите первые 10.
3. Generator expression: «сумма квадратов чётных» 1..1000 (без списка); `next((x for x in … if pred), None)` — «первый» подходящий.
4. `sorted(key=…)`: список `(имя, возраст, город)` — отсортируйте по (возраст, затем имя) (key=lambda: (v, name)); `max` по «длине имени».
5. В комментарии: почему `sum(n*n for n in range(10**7))` «экономнее» `sum([n*n for n in range(10**7)])` (память).
