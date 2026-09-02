# Урок 17. Dunder-методы: `__str__`, `__repr__`, `__len__`, `__eq__`, `__add__`

## Цель

После урока студент сможет: объяснять, что **dunder-методы** («двойное подчёркивание») — «протоколы», которые делают объекты «как встроенные» (`print`, `len`, `==`, `+`, `in`, `[]`…), и реализовать **`__str__`/`__repr__`**, **`__len__`**, **`__eq__`** (+ `__hash__`), **`__add__`**, **`__contains__`**, **`__getitem__`** для своих классов.

## Теория

### Что такое dunder-методы

Методы вида `__name__` («дандеры») — **протоколы** языка: вы реализуете — язык «вызывает» при определённых операциях. Примеры:
- `print(x)` → `__str__` (для человека).
- `repr(x)` (и `print` в списке/консоли) → `__repr__` (для разработчика).
- `len(x)` → `__len__`.
- `x == y` → `__eq__`; `hash(x)` (ключ dict/элемент set) → `__hash__`.
- `x + y` → `__add__`; `x in y` → `__contains__`; `x[i]` → `__getitem__`.

### `__str__` vs `__repr__`

- **`__str__`** — «читable» (для пользователя): `print(obj)` → `"Имя (3)"`.
- **`__repr__`** — «unambiguous» (для разработчика): `repr(obj)` → `"Player('Аня', 3)"` (желательно — «код», который создаёт объект).

Правило: **всегда** определите `__repr__`; `__str__` — если есть «пользовательский» вид (иначе `print` использует `__repr__`).

### `__eq__` и `__hash__`

`__eq__` — «равенство по значению». **Важно**: если переопределяете `__eq__` — Python **обнуляет** `__hash__` (объект становится **нехешируемым**!). Для «ключа dict» — реализуйте **и** `__eq__`, **и** `__hash__` (по тем же полям).

### Арифметика и «протоколы контейнера»

`__add__` (`+`), `__contains__` (`in`), `__getitem__` (`x[i]` / срезы), `__iter__` (итерация) — делают объект «похожим» на встроенные (список, число).

TIP: __repr__ — «по умолчанию» для отладки; не «забудьте» его у «своих» классов (иначе <__main__.Player object at 0x…>).

NOTE: в песочнице — настоящий CPython: dunder-методы — идентичны терминалу.

## Пример

`main.py`:

```python
"""Dunder-методы."""

class Player:
    def __init__(self, name: str, level: int):
        self.name = name
        self.level = level

    def __str__(self) -> str:
        return f"{self.name} (ур. {self.level})"

    def __repr__(self) -> str:
        return f"Player({self.name!r}, {self.level})"

    def __eq__(self, other) -> bool:
        if not isinstance(other, Player):
            return NotImplemented
        return (self.name, self.level) == (other.name, other.level)

    def __hash__(self) -> int:
        return hash((self.name, self.level))

a = Player("Аня", 3)
b = Player("Аня", 3)
print("str:", str(a))
print("repr:", repr(a))
print("a == b:", a == b, "| a in [b]:", a in [b], "| hash равен:", hash(a) == hash(b))
# a в dict/set (хешируемый):
players = {a: "активен"}
print("dict по obj:", players[b])   # b «равен» a → найдено

class Vec:
    def __init__(self, x: float, y: float):
        self.x, self.y = x, y
    def __add__(self, other: "Vec") -> "Vec":
        return Vec(self.x + other.x, self.y + other.y)
    def __repr__(self) -> str:
        return f"Vec({self.x}, {self.y})"

v = Vec(1, 2) + Vec(3, 4)
print("Vec +:", v)

class TagList:
    """Контейнер: len, in, []."""
    def __init__(self, items: list[str]):
        self._items = items
    def __len__(self) -> int:
        return len(self._items)
    def __contains__(self, tag: str) -> bool:
        return tag in self._items
    def __getitem__(self, i: int) -> str:
        return self._items[i]

tags = TagList(["python", "oop"])
print("len:", len(tags), "| 'python' in:", "python" in tags, "| tags[1]:", tags[1])
```

## Частые ошибки

WARN: __eq__ без __hash__ — объект «не хешируемый» (не ключ dict/элемент set; TypeError: unhashable). Если __eq__ — и __hash__ (по тем же полям).

WARN: __eq__ сравнивает через is (по объекту, не по значению). __eq__ — по полям (self.x == other.x); is — только для «одного объекта».

WARN: NotImplemented vs None в __eq__ (для «неизвестного типа»). Возвращайте NotImplemented (singleton), а не None/False (иначе == «не перевернётся»).

WARN: __str__ «молчит» (нет) — print покажет __repr__; если и его нет — <obj at 0x…>. Определите хотя бы __repr__.

## Практическое задание

1. Класс `Money(amount: int, currency: str = "RUB")`: `__repr__`, `__str__` (`"1 000 ₽"`), `__add__` (одна валюта; иначе `ValueError`), `__eq__` + `__hash__`. Проверьте `Money(100) + Money(50)`, `==`, dict.
2. Класс `Matrix(rows: list[list[int]])`: `__len__` (число строк), `__getitem__(i, j)` (через `__getitem__` с tuple-ключом) или `__getitem__(i)` → строка. Выведите `len` и доступ.
3. Класс `Ratione(items: list[str])`: `__contains__`, `__iter__` (возвращает `iter(self._items)`), `__len__`. Проверьте `in`, `for`, `len`.
4. `__eq__` + `NotImplemented`: класс `Point` (`__eq__` возвращает `NotImplemented` для не-`Point`). Проверьте `Point(1,2) == (1,2)` (кортеж) → False (через NotImplemented).
5. В комментарии: чем `__str__` отличается от `__repr__` и когда `print` использует **каждый**.
