# Урок 15. Классы: class, __init__, self, атрибуты

## Цель

После урока студент сможет: описывать **классы** (`class`), понимать **`__init__`** (конструктор) и **`self`** (ссылка на экземпляр), различать **атрибуты экземпляра** (`self.x`) и **атрибуты класса** (`x` в теле класса), создавать объекты и вызывать методы, и объяснять, что метод — это функция, которая **получает объект** первым аргументом.

## Теория

### class и экземпляры

**Класс** — «чертёж» (тип); **экземпляр** (объект) — «конкретный» объект этого класса.

```python
class Dog:
    species = "canis"          # атрибут КЛАССА (общий для всех)
    def __init__(self, name: str, age: int):
        self.name = name       # атрибут ЭКЗЕМПЛЯРА (у каждого свой)
        self.age = age
    def bark(self) -> str:
        return f"{self.name}: гав!"

rex = Dog("Рекс", 3)           # экземпляр (вызывается __init__)
fido = Dog("Фидо", 5)
rex.name                        # "Рекс"
rex.bark()                      # "Рекс: гав!"
Dog.species                     # "canis" (у класса)
```

### self

`self` — **первый аргумент** каждого метода: «этот экземпляр». При вызове `rex.bark()` Python **сам** передаёт `rex` как `self` (вы пишете `bark()`, а не `bark(rex)`). `self` — **соглашение** (можно другое имя, но всегда `self`).

### Атрибуты экземпляра vs класса

- **Экземпляра** (`self.x`): у **каждого** объекта свой (создаются в `__init__`).
- **Класса** (`x = …` в теле): **общий** для всех экземпляров (доступен как `Dog.x` и `rex.x`, пока не «затенён» экземпляром).

«Счётчик» объектов — типичный атрибут класса:

```python
class Task:
    created = 0               # общий счётчик
    def __init__(self, title: str):
        self.title = title
        Task.created += 1     # через КЛАСС (не self.created!)
```

### Методы

Метод — функция **в** классе; получает `self` первым. Без `self` (и без доступа к состоянию) — кандидат в `@staticmethod` (урок 18).

TIP: __init__ — инициализация (присвоить self.x); «логика» — в отдельных методах (не «всё в __init__»).

NOTE: в песочнице — настоящий CPython: классы, __init__, self — идентичны терминалу.

## Пример

`main.py`:

```python
"""Классы: class, __init__, self."""

class Player:
    """Игрок."""
    rank_default = "newbie"      # атрибут класса
    count = 0                    # «счётчик» объектов

    def __init__(self, name: str, level: int = 1):
        self.name = name         # атрибут экземпляра
        self.level = level
        self.rank = Player.rank_default
        Player.count += 1

    def gain_xp(self, xp: int) -> None:
        self.level += xp // 100
        print(f"{self.name}: +{xp} XP → уровень {self.level}")

    def __str__(self) -> str:    # (dunder — урок 17, здесь для print)
        return f"Player({self.name}, lvl {self.level})"

# Экземпляры
p1 = Player("Аня", 5)
p2 = Player("Боря")
print(p1, "|", p2)
print("Player.count =", Player.count, "| p1.name =", p1.name)

# Метод (self передаётся автоматически)
p1.gain_xp(250)

# Атрибут класса vs экземпляра
print("rank_default (класс):", Player.rank_default)
p1.rank = "veteran"             # «затеняем» на экземпляре
print("p1.rank:", p1.rank, "| p2.rank:", p2.rank, "| Player.rank_default:", Player.rank_default)
```

## Частые ошибки

WARN: забываете self в аргументах метода (def bark(self.name): → SyntaxError; def bark(): → «не хватает аргумента» при вызове). Первый аргумент метода — self.

WARN: путаете атрибут класса и экземпляра: self.count += 1, когда count задуман как общий (создаёте «локальный» у каждого). Для общего — ClassName.count (через класс).

WARN: всё в __init__ (длинная «логика» в конструкторе). __init__ — только присвоение полей; логика — в методах.

WARN: сравниваете объекты через == по «памяти» (два одинаковых объекта — разные). == — по значению (нужен __eq__, урок 17); is — по объекту.

## Практическое задание

1. Класс `BankAccount`: `__init__(owner, balance=0)`, метод `deposit(amount)`, `withdraw(amount)` (бросает `ValueError` при нехватке), атрибут класса `accounts_created` (счётчик). Создайте 2 счета, операции, выведите счётчик.
2. Класс `Rectangle`: `__init__(w, h)`, свойства `area`, `perimeter` (пока — методы `area()`/`perimeter()`). Вычислите для 2 прямоугольников.
3. Класс `Inventory`: `__init__()` (пустой dict), `add(item, qty)`, `remove(item, qty)` (ValueError при нехватке), `total()`. Атрибут класса `instances` (счётчик).
4. Покажите: атрибут **класса** `shared = []` у двух экземпляров — **общий** список (изменили через `p1.shared.append` → видит `p2`). Объясните комментарием.
5. В комментарии: что такое `self` и почему `rex.bark()` «знает», какой это объект (1–2 предложения).
