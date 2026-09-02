"""Урок 18. property, classmethod, staticmethod, «приватность»."""

# TODO: class Temperature: __init__(celsius) — self.celsius = celsius
#       @property celsius (get → self._c); @celsius.setter (ValueError если < -273.15)
#       @property fahrenheit (self._c * 9/5 + 32); @property is_freezing (self._c <= 0)
# TODO: t = Temperature(20); выведите t.celsius, t.fahrenheit, t.is_freezing
# TODO: try: t.celsius = -300 except ValueError as e: print(e)

# TODO: class Config: __init__(data); @classmethod from_string(cls, lines: list[str]) (split("="));
#       @staticmethod validate(key) -> bool (key.isidentifier())
# TODO: cfg = Config.from_string(["host=localhost", "port=8000"]); выведите cfg._data, Config.validate("a-b")

# TODO: class Calc: __init__(x); self._cache = {}; compute(n) (кэш); выведите c._cache
