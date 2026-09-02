# Урок 19. dataclass и продвинутое ООП: slots, ABC, Protocol

## Цель

После урока студент сможете: описывать «данные» через **`@dataclass`** (`field`, `default`, `frozen`, `slots`), понимать **абстрактные** классы (**`abc.ABC`**, `@abstractmethod`) и **структурную** типизацию (**`Protocol`** — «duck typing» для лент-чекера), и выбирать, когда dataclass, а когда «обычный» класс.

## Теория

### `@dataclass`: «данные» без ручной рутины

`@dataclass` **генерирует** `__init__`, `__repr__`, `__eq__` (и др.) из **аннотированных** полей:

```python
from dataclasses import dataclass, field

@dataclass
class Book:
    title: str
    author: str
    year: int = 2026                    # значение по умолчанию
    tags: list[str] = field(default_factory=list)  # «свежий» список (не общий!)

b = Book("Флоу", "Лайтман")
print(b)                    # Book(title='Флоу', author='Лайтман', year=2026, tags=[])
print(b == Book("Флоу", "Лайтман"))   # True (__eq__ по полям)
```

Опции:
- **`frozen=True`** — «неизменяемый» (иммутабельный; `__hash__` включён) — «ключ dict».
- **`slots=True`** (3.10+) — `__slots__` (меньше памяти, быстрее доступ; нельзя «новые» атрибуты).
- **`field(default_factory=…)`** — «свежий» мутабельный дефолт (вместо ловушки `[]`).

### ABC: «контракт» (абстрактные классы)

`abc.ABC` + `@abstractmethod` — «родитель», который **нельзя** создать (пока не реализованы все абстрактные методы):

```python
from abc import ABC, abstractmethod

class Renderer(ABC):
    @abstractmethod
    def render(self, data: dict) -> str:
        ...
class JsonRenderer(Renderer):
    def render(self, data: dict) -> str:
        return str(data).replace("'", '"')
# Renderer()          → TypeError: abstract
JsonRenderer().render({"a": 1})
```

### Protocol: «структурный» тип (duck typing + лент-чек)

`Protocol` — «тип по форме» (не по наследованию): любой класс с «нужными» методами/атрибутами **подходит** (лент-чекер «понимает»):

```python
from typing import Protocol

class Printable(Protocol):
    def print(self) -> str: ...

def show(obj: Printable) -> None:   # «любой» с .print()
    print(obj.print())
```

TIP: dataclass — для **«данных»** (контейнеры, DTO, конфиги); «обычный» класс — для **логики**; ABC — для **«контракта»** (реализовать **обязательно**); Protocol — для **«структурной»** совместимости (без наследования).

NOTE: в песочнице — настоящий CPython: dataclass/abc/Protocol — идентичны терминалу.

## Пример

`main.py`:

```python
"""dataclass, ABC, Protocol."""

from dataclasses import dataclass, field, asdict
from abc import ABC, abstractmethod
from typing import Protocol

# dataclass
@dataclass
class Product:
    name: str
    price: float
    qty: int = 1
    tags: list[str] = field(default_factory=list)

p = Product("Кофе", 300.0, 2, ["напиток"])
print("p:", p)
print("asdict:", asdict(p))
print("eq:", p == Product("Кофе", 300.0, 2, ["напиток"]))

# frozen + hash
@dataclass(frozen=True)
class Point:
    x: int
    y: int
pt = Point(1, 2)
print("frozen hash:", hash(pt), "| в set:", {pt, Point(1, 2)})

# slots (3.10+)
@dataclass(slots=True)
class User:
    name: str
    email: str
u = User("Аня", "a@b.c")
# u.other = 1   → AttributeError (slots)

# ABC
class Storage(ABC):
    @abstractmethod
    def save(self, key: str, value: str) -> None: ...
    @abstractmethod
    def load(self, key: str) -> str | None: ...

class MemStorage(Storage):
    def __init__(self):
        self._d = {}
    def save(self, key, value):
        self._d[key] = value
    def load(self, key):
        return self._d.get(key)

# Storage()  → TypeError (abstract)
ms = MemStorage()
ms.save("k", "v")
print("Storage.load:", ms.load("k"))

# Protocol (структурный тип)
class Greetable(Protocol):
    def greet(self) -> str: ...

def hello(obj: Greetable) -> str:
    return obj.greet()

class Bot:
    def greet(self) -> str:
        return "бот: привет"
print("Protocol:", hello(Bot()))   # Bot «не наследует» Greetable, но подходит
```

## Частые ошибки

WARN: **`tags: list = []`** в dataclass (без `default_factory`) — «общий» список (ловушка мутабельных дефолтов). `field(default_factory=list)`.

WARN: **dataclass для «логики»** (методы с «состоянием/эффектами»). Dataclass — **данные** (+ простые свойства); логика — «обычный» класс.

WARN: **ABC «на глаз»** (забыли `@abstractmethod` / не унаследовали от `ABC`) — «абстрактный» не работает (создаётся, методы «пустые»). Оба: `class X(ABC)` + `@abstractmethod`.

WARN: **Protocol «для наследования»** (class X(Protocol)) — Protocol — **структурный** тип (проверка «по форме»), не «родитель». Для «контракта с наследованием» — ABC.

## Практическое задание

1. `@dataclass`: `Order(id, items: list[str], created: datetime = field(default_factory=datetime.now))`. Выведите `asdict`, `repr`.
2. `frozen` + `slots`: `@dataclass(frozen=True, slots=True) Color(r, g, b)`; создайте 2 «одинаковых», проверьте `==`, `hash`, set; попробуйте `c.r = 99` (AttributeError).
3. ABC: `Validator(ABC)` (`@abstractmethod validate(value) -> bool`); `EmailValidator` (содержит `@`); `NotValidator` (без `validate`) — покажите `TypeError` при создании.
4. Protocol: `IterableLike(Protocol)` (`__iter__`); функция `count(obj) -> int` (через `len(list(iter(obj)))`); передайте `list` и `range` (без наследования).
5. В комментарии: когда `@dataclass`, когда «обычный» класс, когда ABC (по 1 примеру).
