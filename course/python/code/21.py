"""Урок 21. stdlib: collections, itertools, functools, datetime."""

from collections import Counter, defaultdict, deque, namedtuple
from itertools import chain, product, groupby
from functools import lru_cache, partial, reduce
from datetime import date, datetime, timedelta
import operator

# TODO: words = ["питон", "код", "питон", "тест", "питон", "код"]; c = Counter(words)
#       выведите c, c.most_common(2), c["нет"]

# TODO: by_tag = defaultdict(list); for item, tag in [("а","x"),("б","y"),("в","x")]: by_tag[tag].append(item)
#       выведите dict(by_tag)

# TODO: Point = namedtuple("Point", ["x", "y"]); p = Point(3, 4); выведите p, p.x, p.y

# TODO: dq = deque(maxlen=3); for i in range(6): dq.append(i); выведите list(dq)

# TODO: выведите list(chain([1, 2], "ab", [3])); list(product("AB", [1, 2]))
data = [("a", 1), ("a", 2), ("b", 1)]
# TODO: groups = {k: list(v) for k, v in groupby(data, key=lambda t: t[0])}; выведите

# TODO: @lru_cache(maxsize=None) def fib(n) (рекурсия); выведите fib(20), fib.cache_info().currsize
# TODO: double = partial(operator.mul, 2); выведите double(5), double(10); reduce(operator.add, [1,2,3,4])

# TODO: today = date.today(); выведите today.strftime("%Y-%m-%d %A")
# TODO: dt = datetime(2026, 9, 2, 14, 30); strptime("2026-09-02 14:30", "%Y-%m-%d %H:%M") + timedelta(days=7)
# TODO: diff = date(2026, 9, 2) - date(2026, 8, 1); выведите diff.days
