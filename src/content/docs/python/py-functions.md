---
id: py-functions
track: python
type: reference
section: functions
order: 2
title:
  en: "Functions & Scope"
  ru: "Функции и области видимости"
excerpt:
  en: "Parameters, defaults, *args/**kwargs, closures and the LEGB scoping rules in practice."
  ru: "Параметры, значения по умолчанию, *args/**kwargs, замыкания и правило LEGB на практике."
version: "python 3.9+"
updated: 2026-05-20
relatedTask: py-003
---

Functions are the primary unit of reuse in Python. This page covers the parameter forms you will meet in the wild and the rules that decide where a name is resolved.

## Parameters & defaults

```python
def add(a, b, *, verbose=False):
    """Sum two numbers."""
    if verbose:
        print(a, "+", b)
    return a + b

# *args / **kwargs collect the rest
def log(*args, **kw):
    print(args, kw)

log(1, 2, level="info")
```

> **WARNING**
> Never use a mutable object (list, dict) as a default value — it is created once and shared across every call.

## Scoping: LEGB

Python resolves a name in four nested scopes: Local, Enclosing, Global, Built-in. A closure captures the enclosing scope, which is what makes decorators and factory functions possible.

<!-- RU -->

Функция — основная единица переиспользования в Python. Разбираем формы параметров, которые встречаются в реальном коде, и правила, по которым имя ищет своё значение.

## Параметры и значения по умолчанию

```python
def add(a, b, *, verbose=False):
    """Сумма двух чисел."""
    if verbose:
        print(a, "+", b)
    return a + b

# *args / **kwargs собирают остаток
def log(*args, **kw):
    print(args, kw)

log(1, 2, level="info")
```

> **WARNING**
> Не передавайте изменяемый объект (list, dict) значением по умолчанию — он создаётся один раз и делится между всеми вызовами.

## Область видимости: LEGB

Python разрешает имя в четырёх вложенных областях: Local, Enclosing, Global, Built-in. Замыкание захватывает замыкающую область — на этом работают декораторы и фабричные функции.
