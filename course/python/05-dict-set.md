# Урок 5. dict и set: хешируемые структуры

## Цель

После урока студент сможет: работать со **словарями** (создание, доступ, `.get`, `setdefault`, `update`, итерация по ключам/значениям/парам, comprehensions для dict) и с **множествами** (добавление, объединение/пересечение/разность, проверка принадлежности), объяснять **хешируемость** (что может быть ключом, а что — нет) и выбирать между list/dict/set по задаче.

## Теория

### dict: «ключ → значение»

`dict` — хеш-таблица: доступ по ключу за **O(1)** (в отличие от списка — O(n)). Ключ — **хешируемый** (str, int, tuple); значение — любое.

```python
user = {"name": "Аня", "age": 30, "active": True}
user["name"]              # доступ (KeyError, если нет)
user.get("email")         # None, если нет (без ошибки)
user.get("email", "—")    # значение по умолчанию
user["email"] = "a@b.c"   # добавить/изменить
user.setdefault("role", "user")  # поставить, если нет
user.update({"age": 31})  # слить
"user" in user            # проверка КЛЮЧА
del user["active"]        # удалить
user.keys(); user.values(); user.items()  # итерация
```

Итерация:
```python
for k, v in user.items():
    print(k, v)
```

**Dict comprehension**: `{ключ: значение for …}`:
```python
squares = {n: n ** 2 for n in range(6)}      # {0: 0, 1: 1, …}
lengths = {w: len(w) for w in words}         # слово → длина
```

### set: «множество» (уникальные элементы)

`set` — неупорядоченная коллекция **уникальных** хешируемых элементов:

```python
tags = {"a", "b", "a"}        # {'a', 'b'} (дубли ушли)
tags.add("c")
"x" in tags                    # O(1) (быстрее, чем в списке)
s1 | s2                        # объединение
s1 & s2                        # пересечение
s1 - s2                        # разность
s1 ^ s2                        # симметрическая разность
s1 <= s2                       # подмножество
```

Когда set: «уникальные значения», «есть/нет» (быстрая проверка), «совпадения двух списков».

### Хешируемость

Ключ dict / элемент set — **хешируемые**: `str`, `int`, `float`, `tuple` (из хешируемых), `frozenset`. **Не** хешируемые: `list`, `dict`, `set` (мутабельные — хеш мог бы «измениться»).

TIP: «сколько раз встретилось» → dict (или collections.Counter, урок 21); «какие уникальные» → set; «список с порядком» → list.

NOTE: в песочнице — настоящий CPython: dict/set — идентичны терминалу (порядок dict — вставка с 3.7).

## Пример

`main.py`:

```python
"""dict и set."""

# dict: создание и доступ
stock = {"кофе": 10, "чай": 5, "печенье": 20}
stock["молоко"] = 7                # добавить
stock["кофе"] = stock.get("кофе", 0) - 1  # купить (без KeyError)
stock.setdefault("сахар", 3)       # если нет — 3
print("Склад:", stock)

# Итерация
print("--- по items:")
for item, qty in stock.items():
    print(f"  {item}: {qty}")

# dict comprehension
prices = {"кофе": 300, "чай": 200, "печенье": 150}
total = {i: q * prices.get(i, 0) for i, q in stock.items() if i in prices}
print("Суммы:", total, "| итого:", sum(total.values()))

# set: уникальность и операции
visited = [1, 2, 2, 3, 3, 3, 4]
uniq = set(visited)
print("Уникальных:", len(uniq), "| 5 в:", 5 in uniq)

friends_anya = {"Боря", "Вера", "Гена"}
friends_borya = {"Аня", "Вера", "Дима"}
mutual = friends_anya & friends_borya          # общие
all_friends = friends_anya | friends_borya     # все
only_anya = friends_anya - friends_borya       # только у Ани
print("Общие:", mutual, "| Только у Ани:", only_anya, "| Всего:", len(all_friends))

# Хеш-ловушка
try:
    bad = {[1, 2]: "x"}
except TypeError as e:
    print("list как ключ → TypeError:", e)
good = {(1, 2): "точка"}
print("tuple как ключ:", good)
```

## Частые ошибки

WARN: доступ d["нет_ключа"] → KeyError. Если ключ может не быть — d.get("ключ", default).

WARN: list/dict/set как ключ dict (или элемент set) → TypeError: unhashable type. Ключ — хешируемый (str/int/tuple).

WARN: «поиск» в списке (x in my_list — O(n)) там, где нужен set (O(1)). Для «есть/нет» по большим данным — set.

WARN: перебираете dict и меняете его размер в цикле (добавляете/удаляете ключи) → RuntimeError: dictionary changed size. Собирайте «новый» dict comprehension или меняйте после цикла.

## Практическое задание

1. Словарь «страна → население» (5 стран): найдите самую населённую (max по values), отсортируйте по населению (sorted + key), выведите топ-3.
2. Список слов: dict comprehension «слово → количество вхождений символов» (для одного слова: частоты букв).
3. Два списка «покупки» (с дублями): через set — «что общего», «что только в первом», «сколько уникальных всего».
4. Dict «студент → [оценки]»: через comprehension «студент → средняя» (round 2), затем «только те, кто > 4.0».
5. В комментарии: почему `dict` сохраняет порядок (3.7+), а `set` — нет, и когда это важно.
