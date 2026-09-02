# Урок 18. property, classmethod, staticmethod, «приватность»

## Цель

После урока студент сможете: использовать **`@property`** (геттер/сеттер с валидацией, «вычисляемые» атрибуты), **`@classmethod`** (`cls`, альтернативные конструкторы), **`@staticmethod`** (помощник без `self`/`cls`), понимать «приватность» через **`_leading`** (соглашение) и разницу с «двойным подчёркиванием» (name mangling).

## Теория

### `@property`: «атрибут» с логикой

`@property` превращает **метод** в «атрибут» (доступ `obj.x`, а не `obj.x()`). **Сеттер** — `@x.setter` (валидация при присваивании). **Вычисляемые** — только геттер (нет сеттера → «read-only»).

```python
class Circle:
    def __init__(self, radius: float):
        self.radius = radius          # вызывает сеттер

    @property
    def radius(self) -> float:
        return self._radius

    @radius.setter
    def radius(self, value: float) -> None:
        if value < 0:
            raise ValueError("радиус >= 0")
        self._radius = value

    @property
    def area(self) -> float:          # вычисляемый (read-only)
        return 3.14159 * self._radius ** 2
```

`c = Circle(2); c.area` → 12.57 (вычислено); `c.radius = -1` → ValueError.

### `@classmethod`: `cls` (класс)

Первый аргумент — **класс** (`cls`), не экземпляр. Классические случаи: **альтернативные конструкторы** (`from_json`, `create`), «фабрики».

```python
class User:
    def __init__(self, name: str, email: str):
        self.name, self.email = name, email
    @classmethod
    def from_string(cls, s: str) -> "User":
        name, email = s.split("|")
        return cls(name, email)      # cls = User (или наследник!)
```

`cls` (а не `User`) — чтобы **наследники** работали («фабрика» создаёт **свой** тип).

### `@staticmethod`: без `self`/`cls`

Метод «в классе», но **без доступа** к объекту/классу — «помощник», тематически связанный с классом.

```python
class Math:
    @staticmethod
    def clamp(x: float, lo: float, hi: float) -> float:
        return max(lo, min(hi, x))
```

(Можно и «вне» класса (обычная функция); `@staticmethod` — когда «логически» в классе.)

### «Приватность»: `_attr` vs `__attr`

- **`_leading`** — **соглашение** («внутреннее», не трогайте извне); доступ **возможен** (`obj._x`).
- **`__double`** — **name mangling**: Python «переименовывает» в `_ClassName__x` (защита от «перезатирания» в наследниках); доступ «извне» — только через мangled-имя.

Питонично: **`_`** (доверие); `__` — редко (только в «библиотечных» классах с наследованием).

TIP: @property — для валидации и «вычисляемых»; не «для инкапсуляции» ради инкапсуляции (Python — «договорённость», не «капсула»).

NOTE: в песочнице — настоящий CPython: property/classmethod/staticmethod — идентичны терминалу.

## Пример

`main.py`:

```python
"""property, classmethod, staticmethod."""

class Temperature:
    def __init__(self, celsius: float):
        self.celsius = celsius

    @property
    def celsius(self) -> float:
        return self._c

    @celsius.setter
    def celsius(self, v: float) -> None:
        if v < -273.15:
            raise ValueError("ниже абсолютного нуля")
        self._c = v

    @property
    def fahrenheit(self) -> float:     # вычисляемый
        return self._c * 9 / 5 + 32

    @property
    def is_freezing(self) -> bool:
        return self._c <= 0

t = Temperature(20)
print(f"{t.celsius}°C = {t.fahrenheit:.1f}°F | замерзает: {t.is_freezing}")
try:
    t.celsius = -300
except ValueError as e:
    print("setter:", e)

class Config:
    def __init__(self, data: dict):
        self._data = data

    @classmethod
    def from_lines(cls, lines: list[str]) -> "Config":
        data = dict(line.split("=", 1) for line in lines if "=" in line)
        return cls(data)

    @staticmethod
    def validate(key: str) -> bool:
        return key.isidentifier()

cfg = Config.from_lines(["host=localhost", "port=8000"])
print("Config:", cfg._data, "| validate('a-b'):", Config.validate("a-b"))

class Calc:
    def __init__(self, x: int):
        self.x = x
        self._cache = {}          # «приватное» (соглашение)

    def compute(self, n: int) -> int:
        if n not in self._cache:
            self._cache[n] = self.x * n
        return self._cache[n]

c = Calc(3)
print("compute(4):", c.compute(4), "| _cache:", c._cache)  # доступ к _ (доверие)
```

## Частые ошибки

WARN: @property + сеттер «без валидации» (тогда зачем property?). Property — ради логики (валидация/вычисление); «просто» хранение — обычный атрибут.

WARN: @classmethod использует User (имя класса) вместо cls — наследники «ломаются» (фабрика создаёт родителя, не наследника). Всегда cls.

WARN: путаете @staticmethod и обычную функцию в модуле. @staticmethod — когда «логически» в классе (API); иначе — функция в модуле (чистее).

WARN: __attr «для приватности» в «прикладном» коде (name mangling — от наследников, не от «честного» доступа). Для «не трогайте» — _attr.

## Практическое задание

1. `@property`: класс `Age` (`years` с валидацией 0–150), вычисляемые `is_adult`, `is_senior` (60+). Проверьте setter-ошибку.
2. `@classmethod`: `Point.from_polar(r, angle)` (полярные → `Point(x, y)`); `from_string("3,4")`. Проверьте оба.
3. `@staticmethod`: класс `Slug` (`@staticmethod def make(text)` — slug из строки: lower, не-`[a-z0-9]` → `-`). Выведите `Slug.make("Hello, World 2026!")`.
4. «Приватность»: класс `Wallet` с `_balance`; метод `top_up`. Попробуйте `w._balance = 999` (работает — «соглашение»), объясните в комментарии, почему `__balance` (mangling) «сложнее».
5. В комментарии: чем `@property` отличается от «обычного метода» `get_x()` и почему property «питоничнее».
