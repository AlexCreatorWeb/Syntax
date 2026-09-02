"""Урок 9. Аргументы функций: *args, **kwargs, мутабельные дефолты."""

# TODO: def power(base, exp=2); выведите power(3) и power(2, 10)

# TODO: def total(*numbers) -> int: return sum(numbers); вызовите total(1,2,3) и total(*[4,5])

# TODO: def describe(**fields) -> str (", ".join(f"{k}={v}")); вызовите describe(name="Аня", age=30)

# TODO: def log_call(func, *args, **kwargs) — print(f"вызов {func.__name__}{args} {kwargs}"), return func(*args, **kwargs)
# TODO: def add(a, b=0); выведите log_call(add, 5, b=10)

# TODO: def f(a, /, b, *, c=1): return a, b, c; вызовите f(1, 2, c=3)

# TODO: ЛОВУШКА: def bad(item, bucket=[]): bucket.append(item); return bucket — вызовите bad(1), bad(2)
# TODO: чините: def good(item, bucket=None) — вызовите good(1), good(2)
