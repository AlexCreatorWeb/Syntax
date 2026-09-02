# Урок 21. stdlib: collections, itertools, functools, datetime

## Цель

После урока студент сможет: использовать **`collections`** (`Counter`, `defaultdict`, `namedtuple`, `deque`), **`itertools`** (`chain`, `product`, `groupby`, `islice`), **`functools`** (`lru_cache`, `partial`, `reduce`), и **`datetime`** (`date`, `datetime`, `timedelta`, форматирование) — «готовые» инструменты stdlib.

## Теория

### collections

- **`Counter`** — «счётчик» (dict подмножество): `Counter("aab")` → `{'a': 2, 'b': 1}`; `most_common(n)`, `+`/`-` (сложение/разность), `c[x]` (0, если нет).
- **`defaultdict`** — dict с **дефолт-фабрикой**: `defaultdict(list)` (`d[k].append` без проверки), `defaultdict(int)` (счётчики).
- **`namedtuple`** — «кортеж с именами» (иммутабельный, `Point.x`); (в 3.10+ — `@dataclass(slots=True)` часто лучше).
- **`deque`** — «двусторонняя очередь» (`appendleft`, `popleft` — O(1); для «окна»/очереди).

### itertools

- **`chain(*ит)`** — «сшить» итерируемые (`chain([1,2], [3])` → 1,2,3).
- **`product(a, b)`** — «декартово» (все пары).
- **`groupby(ит, key)`** — «группы» **по подряд** (вход **отсортирован** по key!).
- **`islice`**, `count`, `repeat`, `starmap` — «генераторы» (лениво).

### functools

- **`@lru_cache`** — «кэш» результатов (по аргументам); `f.cache_info()`. (Для «чистых» функций с **хешируемыми** аргументами.)
- **`partial`** — «частичное» применение (`double = partial(mul, 2)`).
- **`reduce`** — «свёртка» (`reduce(operator.add, nums)` = сумма).

### datetime

- **`date`** (год, месяц, день), **`datetime`** (+время), **`timedelta`** (разница/сдвиг).
- `datetime.now()`, `date.today()`, `d.strftime("%Y-%m-%d")`, `datetime.strptime("2026-09-02", "%Y-%m-%d")`.
- `d1 - d2` → `timedelta`; `d + timedelta(days=7)`.

TIP: «сколько раз/суммы» — Counter/defaultdict; «все комбинации» — product; «кэш дорогого» — lru_cache; «даты» — datetime (не time+ручные).

NOTE: в песочнице — настоящий CPython: stdlib (collections, itertools, functools, datetime) — доступен (pyodide-stdlib). lru_cache — работает.

## Пример

`main.py`:

```python
"""stdlib: collections, itertools, functools, datetime."""

from collections import Counter, defaultdict, deque, namedtuple
from itertools import chain, product, groupby
from functools import lru_cache, partial, reduce
from datetime import date, datetime, timedelta
import operator

# Counter
words = ["питон", "код", "питон", "тест", "питон", "код"]
c = Counter(words)
print("Counter:", c, "| most_common(2):", c.most_common(2))
print("c['нет'] =", c["нет"], "(0, без KeyError)")

# defaultdict
by_tag = defaultdict(list)
for item, tag in [("а", "x"), ("б", "y"), ("в", "x")]:
    by_tag[tag].append(item)
print("defaultdict:", dict(by_tag))

# namedtuple
Point = namedtuple("Point", ["x", "y"])
p = Point(3, 4)
print("namedtuple:", p, p.x, p.y)

# deque (окно)
dq = deque(maxlen=3)
for i in range(6):
    dq.append(i)
print("deque(maxlen=3):", list(dq))   # [3, 4, 5]

# itertools
print("chain:", list(chain([1, 2], "ab", [3])))
print("product:", list(product("AB", [1, 2])))
data = [("a", 1), ("a", 2), ("b", 1)]
groups = {k: list(v) for k, v in groupby(data, key=lambda t: t[0])}
print("groupby:", groups)

# functools
@lru_cache(maxsize=None)
def fib(n: int) -> int:
    return n if n < 2 else fib(n - 1) + fib(n - 2)
print("fib(20):", fib(20), "| cache:", fib.cache_info().currsize)

double = partial(operator.mul, 2)
print("partial:", double(5), double(10))
print("reduce:", reduce(operator.add, [1, 2, 3, 4]))

# datetime
today = date.today()
print("today:", today.strftime("%Y-%m-%d %A"))
dt = datetime(2026, 9, 2, 14, 30)
print("dt:", dt.strftime("%d.%m.%Y %H:%M"))
parsed = datetime.strptime("2026-09-02 14:30", "%Y-%m-%d %H:%M")
print("strptime:", parsed, "| +7д:", (parsed + timedelta(days=7)).strftime("%Y-%m-%d"))
diff = date(2026, 9, 2) - date(2026, 8, 1)
print("разница дней:", diff.days)
```

## Частые ошибки

WARN: groupby без сортировки (группирует по подряд; дубли «не рядом» → несколько групп). Отсортируйте вход по key (или Counter/defaultdict для «всех»).

WARN: lru_cache на нечистых функциях (с состоянием/эффектами) или с нехешируемыми аргументами (list) → «кэш» «лежит»/TypeError. Только чистые + хешируемые.

WARN: Counter vs defaultdict(int) путаете: Counter — «счётчик» (most_common, +/-); defaultdict(int) — «dict с 0» (ручной d[k] += 1). Для «частот» — Counter.

WARN: datetime vs date (смешиваете): date - date → timedelta; datetime — с временем. Не « date.now() (нет), а date.today() / datetime.now().

## Практическое задание

1. `Counter`: «топ-5 слов» в тексте (разбить по пробелам, lower, убрать пунктуацию). Выведите `most_common(5)`.
2. `defaultdict`: «группа оценок по предмету» (список кортежей (предмет, балл) → dict). Выведите среднюю по каждому.
3. `itertools.product`: «все комбинации» (цвет × размер): `["red","blue"] × ["S","M","L"]` → список строк `color-size`.
4. `lru_cache`: «коллайд-свободные» (рекурсивная сумма цифр до однозначного) — вычислите для 10 чисел, выведите `cache_info`.
5. `datetime`: «сколько дней до/после» (дата рождения → возраст в днях и годах); «формат» `"%d %B %Y"` (loCALE — выведите).
