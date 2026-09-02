"""Урок 19. dataclass, ABC, Protocol."""

from dataclasses import dataclass, field, asdict
from abc import ABC, abstractmethod
from typing import Protocol

# TODO: @dataclass class Product: name: str; price: float; qty: int = 1;
#       tags: list[str] = field(default_factory=list)
# TODO: p = Product("Кофе", 300.0, 2, ["напиток"]); выведите p, asdict(p),
#       p == Product("Кофе", 300.0, 2, ["напиток"])

# TODO: @dataclass(frozen=True) class Point: x: int; y: int
#       pt = Point(1, 2); выведите hash(pt), {pt, Point(1, 2)}

# TODO: @dataclass(slots=True) class User: name: str; email: str (попробуйте u.other = 1 → AttributeError)

# TODO: class Storage(ABC): @abstractmethod save(key, value); @abstractmethod load(key)
#       class MemStorage(Storage): dict; реализуйте save/load
#       ms = MemStorage(); ms.save("k", "v"); выведите ms.load("k")

# TODO: class Greetable(Protocol): def greet(self) -> str: ...
#       def hello(obj: Greetable) -> str: return obj.greet()
#       class Bot: def greet(self): return "бот: привет"
#       выведите hello(Bot())
