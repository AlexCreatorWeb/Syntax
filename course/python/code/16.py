"""Урок 16. Наследование и полиморфизм: super(), MRO."""

# TODO: class Shape: __init__(name); def area(self) -> float: raise NotImplementedError
#       def describe(self) -> str: return f"{self.name}: площадь {self.area():.2f}"

# TODO: class Circle(Shape): __init__(radius) — super().__init__("круг"); area() = 3.14159 * r^2
# TODO: class Square(Shape): __init__(side) — super().__init__("квадрат"); area() = side^2

# TODO: shapes = [Circle(2), Square(3), Circle(1)]; for s in shapes: print(s.describe())

# TODO: c = Circle(1); выведите isinstance(c, Shape), issubclass(Circle, Shape), isinstance(c, Square)

# TODO: class Loggable: def log(self, msg): return f"[log] {msg}"
#       class Serializable: def to_dict(self): return {"obj": self.__class__.__name__}
#       class Service(Loggable, Serializable): pass
#       выведите [c.__name__ for c in Service.__mro__]; svc.log("старт"); svc.to_dict()
