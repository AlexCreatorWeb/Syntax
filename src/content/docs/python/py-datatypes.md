---
id: py-datatypes
track: python
type: reference
section: datatypes
order: 1
title:
  en: "Data Types & Structures"
  ru: "Типы данных и структуры"
excerpt:
  en: "Numbers, strings, lists, dicts, sets and tuples — the building blocks of every Python program."
  ru: "Числа, строки, списки, словари, множества и кортежи — основы любой программы на Python."
version: "python 3.9+"
updated: 2026-05-12
relatedTask: py-004
---

Every Python program is built from a handful of core types. Choosing the right one for each job is the first skill that separates scripts that work from scripts that scale.

## Core types

```python
# Numbers, text and booleans
x = 10          # int
name = "Ada"     # str
ok = True       # bool
pi = 3.14       # float

# Containers
nums  = [1, 2, 3]       # list  — ordered, mutable
point = (3, 4)          # tuple — ordered, immutable
sizes = {1, 2, 3}       # set   — unique items
user  = {"name": "Ada"}  # dict  — key → value
```

> **TIP**
> Prefer tuples for fixed records (coordinates, RGB colors) — they are cheaper and signal intent.

## Choosing a structure

Lists are the default sequence. Use a set when you only care about membership, a dict when you need to look values up by key, and a tuple when the shape must never change.

> **TIP**
> Dict lookups are O(1) on average — that is why they power 90% of the performance-critical mappings in real codebases.

<!-- RU -->

Каждая программа на Python собирается из горстки базовых типов. Умение выбрать подходящий для каждой задачи — первый навык, отделяющий рабочие скрипты от масштабируемых.

## Базовые типы

```python
# Числа, текст и булевы
x = 10          # int
name = "Ada"     # str
ok = True       # bool
pi = 3.14       # float

# Контейнеры
nums  = [1, 2, 3]       # list  — упорядочено, изменяемо
point = (3, 4)          # tuple — упорядочено, неизменяемо
sizes = {1, 2, 3}       # set   — уникальные элементы
user  = {"name": "Ada"}  # dict  — ключ → значение
```

> **TIP**
> Для фиксированных записей (координаты, RGB) выбирайте tuple — они дешевле и сразу считываются.

## Как выбрать структуру

Список — структура по умолчанию. Множество — когда важна лишь принадлежность, словарь — когда ищете значение по ключу, кортеж — когда форма никогда не меняется.

> **TIP**
> Поиск в словаре в среднем O(1) — поэтому 90% критичных маппингов в реальных кодовых базах построены на dict.
