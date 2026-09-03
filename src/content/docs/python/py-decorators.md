---
id: py-decorators
track: python
type: guide
section: decorators
order: 2
title:
  en: "Advanced Decorators"
  ru: "Продвинутые декораторы"
excerpt:
  en: "Master functional programming patterns. Learn to write parameterized decorators and class-based decorators for clean code."
  ru: "Функциональные паттерны: параметризованные и классовые декораторы для чистого кода."
version: "python 3.9+"
updated: 2026-04-15
relatedTask: py-005
---

A decorator is a function that takes a function and returns a new function. Once the mental model clicks, framework magic like routing and auth becomes just Python.

## Your first decorator

```python
import time

def timed(fn):
    def wrapper(*args, **kw):
        t0 = time.perf_counter()
        result = fn(*args, **kw)
        print(f"{fn.__name__} took {time.perf_counter() - t0:.3f}s")
        return result
    return wrapper

@timed
def slow_sum(n):
    return sum(range(n))
```

## Parameterized decorators

```python
def retry(times=3):
    def decorator(fn):
        def wrapper(*args, **kw):
            for _ in range(times):
                try:
                    return fn(*args, **kw)
                except Exception:
                    pass
            raise RuntimeError(f"{fn.__name__} failed after {times} tries")
        return wrapper
    return decorator

@retry(times=5)
def fetch(url):
    ...
```

> **TIP**
> Without `@functools.wraps(fn)` the wrapper loses the original function's name and docstring.

## Preserving metadata

```python
from functools import wraps

def log_calls(fn):
    @wraps(fn)  # keeps __name__, __doc__, signature
    def wrapper(*args, **kw):
        print(f"call: {fn.__name__}{args}")
        return fn(*args, **kw)
    return wrapper
```

<!-- RU -->

Декоратор — функция, которая принимает функцию и возвращает новую. Как только модель «щёлкнула», магия фреймворков — роутинг, аутентификация — оказывается просто Python.

## Ваш первый декоратор

```python
import time

def timed(fn):
    def wrapper(*args, **kw):
        t0 = time.perf_counter()
        result = fn(*args, **kw)
        print(f"{fn.__name__} took {time.perf_counter() - t0:.3f}s")
        return result
    return wrapper

@timed
def slow_sum(n):
    return sum(range(n))
```

## Параметризованные декораторы

```python
def retry(times=3):
    def decorator(fn):
        def wrapper(*args, **kw):
            for _ in range(times):
                try:
                    return fn(*args, **kw)
                except Exception:
                    pass
            raise RuntimeError(f"{fn.__name__} failed after {times} tries")
        return wrapper
    return decorator

@retry(times=5)
def fetch(url):
    ...
```

> **TIP**
> Без `@functools.wraps(fn)` обёртка теряет имя и docstring оригинала.

## Сохранение метаданных

```python
from functools import wraps

def log_calls(fn):
    @wraps(fn)  # сохраняет __name__, __doc__, сигнатуру
    def wrapper(*args, **kw):
        print(f"call: {fn.__name__}{args}")
        return fn(*args, **kw)
    return wrapper
```
