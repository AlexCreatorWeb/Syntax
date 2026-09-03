---
id: py-basics
track: python
type: guide
section: basics
order: 1
title:
  en: "Python Basics"
  ru: "Основы Python"
excerpt:
  en: "Variables, control flow, loops, and fundamental data structures to get you started writing scripts immediately."
  ru: "Переменные, управление потоком, циклы и базовые структуры данных, чтобы сразу писать скрипты."
version: "python 3.9+"
updated: 2026-05-28
relatedTask: py-001
---

This guide takes you from an empty file to a working script. Everything here is used in every following module of the Python track.

## Variables and types

```python
count = 0
name = "Ada"
heights = [1.7, 1.8, 1.6]

# Types are printed — declarations are not needed
print(type(count))   # <class 'int'>
print(type(heights)) # <class 'list'>
```

No declarations, no semicolons — the interpreter tracks what gets assigned. A name is a reference to a value; reassigning points it at a new value.

## Control flow

### The for loop

```python
for h in heights:
    if h > 1.75:
        print("tall:", h)
    else:
        print("short:", h)
```

### The while loop

```python
count = 0
while count < 3:
    count += 1
```

> **TIP**
> Indentation in Python is syntax: 4 spaces and consistency (PEP 8).

## Your first function

```python
def average(nums):
    return sum(nums) / len(nums)

print(average(heights))
```

A function is a named block with parameters. Define it once, call it anywhere — that is the core of reusable code.

## Common mistakes

> **WARNING**
> A missing colon after if / for / def is the number one SyntaxError for beginners — check the end of the line first.

> **WARNING**
> Mixing tabs and spaces breaks indentation even when it looks right. Tell your editor to insert 4 spaces.

> **TIP**
> print() is a legitimate debugging tool — use it to inspect values at intermediate steps before reaching for a debugger.

Next: the Core Reference pages on data types and functions cover each structure in more detail.

<!-- RU -->

Этот гайд ведёт от пустого файла к рабочему скрипту. Всё, что здесь, используется в каждом следующем модуле Python-трека.

## Переменные и типы

```python
count = 0
name = "Ада"
heights = [1.7, 1.8, 1.6]

# Типы выводятся — объявления не нужны
print(type(count))   # <class 'int'>
print(type(heights)) # <class 'list'>
```

Без объявлений и точек с запятой — интерпретатор сам следит, что назначено. Имя — ссылка на значение; повторное назначение указывает его на новое.

## Управление потоком

### Цикл for

```python
for h in heights:
    if h > 1.75:
        print("высокий:", h)
    else:
        print("низкий:", h)
```

### Цикл while

```python
count = 0
while count < 3:
    count += 1
```

> **TIP**
> Отступы в Python — это синтаксис: 4 пробела и консистентность (PEP 8).

## Ваша первая функция

```python
def average(nums):
    return sum(nums) / len(nums)

print(average(heights))
```

Функция — именованный блок с параметрами. Определите один раз, вызывайте где угодно — это ядро переиспользуемого кода.

## Частые ошибки

> **WARNING**
> Забытое двоеточие после if / for / def — SyntaxError номер один у новичков: сначала проверяйте конец строки.

> **WARNING**
> Смешение табуляции и пробелов ломает отступы, даже если визуально всё правильно. Настройте редактор вставлять 4 пробела.

> **TIP**
> print() — легитимный инструмент отладки: осматривайте значения на промежуточных шагах, прежде чем запускать дебаггер.

Дальше: страницы Справочника по типам данных и функциям раскрывают каждую структуру подробнее.
