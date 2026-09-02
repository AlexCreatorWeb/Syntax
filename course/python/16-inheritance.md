# Урок 16. Наследование и полиморфизм: super(), MRO

## Цель

После урока студент сможете: описывать **наследование** (`class B(A):`), использовать **`super()`** (вызов родителя), **переопределять** методы (полиморфизм), понимать **MRO** (порядок поиска методов при множественном наследовании) и применять паттерн **«измени и расширяй»** (override + super).

## Теория

### Наследование

`class Child(Parent):` — `Child` **наследует** атрибуты и методы `Parent` (и может **переопределить**). «Иерархия»: `Parent` — «общее», `Child` — «конкретное».

```python
class Animal:
    def __init__(self, name: str):
        self.name = name
    def speak(self) -> str:
        return "…"
    def describe(self) -> str:
        return f"{self.name}: {self.speak()}"

class Dog(Animal):
    def speak(self) -> str:      # переопределение
        return "гав"

class Cat(Animal):
    def speak(self) -> str:
        return "мяу"

rex = Dog("Рекс")
rex.speak()      # "гав" (Dog.speak)
rex.describe()   # "Рекс: гав" (Animal.describe → self.speak() — полиморфизм)
```

### super()

`super()` — «родитель» (по MRO). **`super().__init__(…)`** — вызвать конструктор родителя (не дублировать инициализацию). `super().speak()` — «метод родителя» (если нужно «до» своего).

```python
class Dog(Animal):
    def __init__(self, name: str, breed: str):
        super().__init__(name)   # Animal.__init__ (name)
        self.breed = breed
```

### Полиморфизм

«Один» интерфейс, **разное** поведение: `animal.speak()` — «гав»/«мяу» в зависимости от **типа** объекта (не от «кто вызывает»). Ключ к «гибким» API (список разнотипных объектов → один метод).

### MRO (Method Resolution Order)

При множественном наследовании (`class C(B, A)`) — **порядок** поиска методов: **C3-линейзация** (детерминирована). Посмотреть: `C.__mro__`. Правило: «слева направо, дети раньше родителей, родитель **один раз**».

TIP: «глубокие» иерархии (5+ уровней) — «запах» (часто лучше композиция: «has-a» вместо «is-a»). Наследование — для истинного «is-a» («Собака — животное»), не для «переиспользования кода» вслепую.

NOTE: в песочнице — настоящий CPython: наследование, super, MRO — идентичны терминалу.

## Пример

`main.py`:

```python
"""Наследование и полиморфизм."""

class Shape:
    def __init__(self, name: str):
        self.name = name
    def area(self) -> float:
        raise NotImplementedError("унаследуйте и переопределите")
    def describe(self) -> str:
        return f"{self.name}: площадь {self.area():.2f}"

class Circle(Shape):
    def __init__(self, radius: float):
        super().__init__("круг")       # Shape.__init__
        self.radius = radius
    def area(self) -> float:
        return 3.14159 * self.radius ** 2

class Square(Shape):
    def __init__(self, side: float):
        super().__init__("квадрат")
        self.side = side
    def area(self) -> float:
        return self.side ** 2

# Полиморфизм: один вызов, разное поведение
shapes = [Circle(2), Square(3), Circle(1)]
for s in shapes:
    print(s.describe())

# isinstance / issubclass
c = Circle(1)
print("isinstance(c, Shape):", isinstance(c, Shape))
print("issubclass(Circle, Shape):", issubclass(Circle, Shape))
print("isinstance(c, Square):", isinstance(c, Square))

# Множественное наследование + MRO
class Loggable:
    def log(self, msg: str) -> str:
        return f"[log] {msg}"

class Serializable:
    def to_dict(self) -> dict:
        return {"obj": self.__class__.__name__}

class Service(Loggable, Serializable):
    pass

svc = Service()
print("MRO:", [c.__name__ for c in Service.__mro__])
print(svc.log("старт"), "|", svc.to_dict())
```

## Частые ошибки

WARN: забываете super().__init__() — родитель «не инициализирован» (атрибуты родителя нет). В __init__ наследника — сначала super().__init__(…).

WARN: наследование «для переиспользования» (не «is-a»). «Класс» Employee наследует Vehicle «чтобы взять метод» — композиция (self.vehicle = Vehicle(…)), не наследование.

WARN: множественное наследование «на глаз» (два родителя с __init__ с разными аргументами). Pонимайте MRO (C.__mro__); для «миксинов» — имена с Mixin.

WARN: глубокие иерархии (5+ уровней) — «запах» (трудно читать/менять). Упрощайте: «плоско» + композиция.

## Практическое задание

1. Иерархия `Notification` → `EmailNotification`/`SmsNotification`: `send()` (у родителя — `NotImplementedError`), `preview()` (общий, использует `send()` — полиморфизм). Выведите `preview` для обоих.
2. `super()`: класс `BaseUser` (`__init__(name)`), `AdminUser(BaseUser)` (`__init__(name, role)` через `super().__init__` + свой `role`). Проверьте атрибуты.
3. Множественное: `class Report(Exportable, Printable)` (оба — «миксины» с методами `export()`/`print()`). Выведите `Report.__mro__` и вызовите оба метода.
4. Полиморфизм: список `[Circle, Square, Triangle]` (каждый — `area()`), функция `total_area(shapes) -> float` (сумма). Проверьте.
5. В комментарии: чем `isinstance(x, A)` отличается от `type(x) is A` (и почему первый «правильнее» для «иерархий»).
