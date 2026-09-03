---
id: py-exceptions
track: python
type: reference
section: exceptions
order: 4
title:
  en: "Exceptions & Handling"
  ru: "Исключения и обработка"
excerpt:
  en: "try / except / else / finally, custom exceptions and when to prefer EAFP over LBYL."
  ru: "try / except / else / finally, собственные исключения и когда EAFP лучше LBYL."
version: "python 3.9+"
updated: 2026-05-12
---

Exceptions are Python's control flow for the exceptional. Used well, they keep the happy path clean; used lazily, they hide bugs.

## try / except / else / finally

```python
def parse_int(text, fallback=0):
    try:
        return int(text)
    except ValueError:
        print(f"Could not parse: {text!r}")
        return fallback
    finally:
        pass  # runs no matter what

print(parse_int("42"))   # 42
print(parse_int("one"))  # 0
```

> **WARNING**
> A bare `except:` catches KeyboardInterrupt and SystemExit too. Catch the specific exception you expect.

> **TIP**
> EAFP (Easier to Ask Forgiveness than Permission) is the Pythonic idiom: try the operation, handle the failure — instead of checking a flag first.

<!-- RU -->

Исключения — управление потоком для необычного. Использованные умело, они держат счастливый путь чистым; лениво — прячут баги.

## try / except / else / finally

```python
def parse_int(text, fallback=0):
    try:
        return int(text)
    except ValueError:
        print(f"Не удалось разобрать: {text!r}")
        return fallback
    finally:
        pass  # выполняется всегда

print(parse_int("42"))   # 42
print(parse_int("один")) # 0
```

> **WARNING**
> Голый `except:` ловит даже KeyboardInterrupt и SystemExit. Ловите конкретное ожидание.

> **TIP**
> EAFP (легко попросить прощения, чем разрешения) — питонический идиом: сначала действие, потом обработка, а не проверка флага.
