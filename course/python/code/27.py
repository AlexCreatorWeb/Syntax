"""Урок 27. Структура проекта, logging, тесты (демо)."""

import logging
import sys

# TODO: logging.basicConfig(level=logging.DEBUG, format="%(asctime)s %(levelname)-7s %(name)s: %(message)s",
#                           stream=sys.stdout); log = logging.getLogger("demo")
# TODO: log.debug/info/warning; try: raise ValueError except: log.exception("обработано")
# TODO: child = logging.getLogger("demo.sub"); child.info("из под-модуля")

# TODO: def total(nums: list[int]) -> int; def find(nums, x) -> int | None; def divide(a, b) (ZeroDivisionError)

# TODO: тесты (assert): total([1,2,3]) == 6; find([10,20], 20) == 1; find([10], 99) is None;
#       try: divide(1, 0); assert False except ZeroDivisionError: pass
#       print("все assert прошли (как pytest)")

# TODO: выведите "структуру проекта" (строка: src/myproject/{__init__.py, main.py, …}, tests/test_service.py)
