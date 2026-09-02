# Урок 7. Циклы: for/while, range, break/continue, enumerate/zip

## Цель

После урока студент сможет: писать циклы `for` (по итерируемым) и `while` (по условию), использовать `range` (start/stop/step), управлять циклом через `break`/`continue`/`else` (ветка «без break»), применять **`enumerate`** (индекс+элемент) и **`zip`** (параллельная итерация) и понимать, что «цикл по числу» в Python — это `for i in range(n)`.

## Теория

### for: итерация по коллекции

`for x in итерируемое:` — «для каждого элемента». Итерируемое — list, str, dict (по ключам), range, файл и др. **Нет** «C-стиля» `for (i=0; i<n; i++)` — вместо него `for i in range(n)`.

```python
for word in ["a", "bb", "ccc"]:
    print(len(word))

for i in range(5):        # 0,1,2,3,4
    pass
for i in range(2, 8, 2):  # 2,4,6 (start, stop, step)
    pass
```

### range: «генератор чисел»

`range(stop)` → 0..stop-1; `range(start, stop)`; `range(start, stop, step)`. `range` — **ленивый** (не список в памяти; `list(range(5))` — если нужен список). Отрицательный step — «вниз»: `range(10, 0, -2)` → 10, 8, …, 2.

### while: по условию

`while условие:` — «пока». Обязательна «смена состояния» (иначе бесконечный цикл). Для «цикла с шагом» чаще `for range`, `while` — для «пока не произойдёт X».

### break / continue / else

- `break` — выйти из цикла (нашёл — останавливаемся).
- `continue` — пропустить **итерацию** (к следующей).
- **`else` у цикла** — блок, который выполнится, если цикл **закончился без `break`** (дошёл до конца). Редкий, но полезный паттерн (поиск «не найден»):

```python
for x in nums:
    if x < 0:
        print("Есть отрицательные")
        break
else:
    print("Все не отрицательные")  # только если break не было
```

### enumerate и zip

- **`enumerate(seq)`** — `(индекс, элемент)`: `for i, w in enumerate(words):` (вместо `i = 0; for w in …: i += 1`). Аргумент `start=1` — нумерация с 1.
- **`zip(a, b)`** — параллельно: `for name, score in zip(names, scores):`. `zip` «обрезает» до самого короткого (лишнее молча отбрасывается).

`zip` + `enumerate` покрывают 90% «цикл с индексом/параллельно» без ручного счётчика.

TIP: «цикл по строкам с номером» — enumerate; «две параллельные коллекции» — zip. Не ведите счётчик руками.

NOTE: в песочнице — настоящий CPython: циклы, range, enumerate/zip — идентичны терминалу.

## Пример

`main.py`:

```python
"""Циклы."""

# for + range
total = 0
for i in range(1, 101):
    total += i
print("Сумма 1..100:", total)  # 5050

# step
print("Чётные 2..10:", list(range(2, 11, 2)))
print("Разворот range:", list(range(10, 0, -2)))

# while
n = 1
while n <= 1000:
    n *= 2
print("Первое > 1000:", n)  # 1024

# break / continue / else
for x in [11, 15, 12, 7, 20]:
    if x % 2 == 1:
        print("Первое нечётное:", x)
        break
else:
    print("Нет нечётных")  # не выполнится

# continue: пропустить
for n in range(1, 11):
    if n % 2 == 0:
        continue
    print("нечётные:", n, end=" ")
print()

# enumerate (индекс + элемент)
tasks = ["код", "тесты", "доки"]
for i, t in enumerate(tasks, start=1):
    print(f"{i}. {t}")

# zip (параллельно)
names = ["Аня", "Боря", "Вера"]
scores = [92, 78, 88]
for name, score in zip(names, scores):
    print(f"{name}: {score}", end=" | ")
print()

# sum + генератор (вместо цикла-сумматора)
print("Сумма через sum:", sum(scores))
```

## Частые ошибки

WARN: пишете «C-цикл» for i in range(len(items)): и берёте items[i]. Проще for item in items: (а с индексом — enumerate).

WARN: бесконечный while (не сменяете условие). Проверьте, что условие изменяется и когда-то станет False.

WARN: break «везде» (выходите при первом «не подходящем»). Нужен break, только если «нашли то, что искали»; иначе — continue (пропустить) или сборка результата.

WARN: zip «молча» обрезает до короткого (неравные длины — хвост пропадает). Для «по полной длине» — itertools.zip_longest (урок 21) или проверка длин.

## Практическое задание

1. `for i in range(1, 51)`: сумма чётных, произведение нечётных < 20 (через переменные + if/continue).
2. «Найдите первый элемент > 50» в списке (break + else «не найден»).
3. `enumerate`: пронумеруйте список покупок (start=1), выведите «стоимость строки N».
4. `zip`: списки `items` и `prices` → строка чека (item + price + сумма); что будет, если списки разной длины?
5. Напишите «факториал n» через `while` и через `for range` — сравните (что читабельнее).
