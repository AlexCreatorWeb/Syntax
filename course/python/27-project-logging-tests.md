# Урок 27. Структура проекта, logging, тесты (pytest)

## Цель

После урока студент сможет: выстроить структуру Python-проекта (пакеты, `main.py`, `pyproject.toml`/`requirements.txt`, `.gitignore`), использовать `logging` (вместо `print`: уровни, форматы, `basicConfig`), и писать тесты на pytest (`test_*.py`, `assert`, `pytest.raises`, фикстуры `@pytest.fixture`).

## Теория

### Структура проекта

```
myproject/
  pyproject.toml          # метаданные + зависимости (поэти) ИЛИ
  requirements.txt        # зависимости (pip)
  .gitignore              # .venv/, __pycache__/, *.pyc, .env
  README.md
  src/
    myproject/
      __init__.py
      main.py             # точка входа (CLI)
      models.py           # данные (dataclass/классы)
      service.py          # логика
      api.py              # REST-клиент
  tests/
    test_service.py       # pytest
```

`src`-layout (код в `src/myproject/`) — импорт из установленного пакета (не случайные локальные файлы. `main.py` — точка входа (аргументы, запуск); логика — в модулях (импортируемая, тестируемая).

### `logging` (вместо `print`)

`print` — отладка; `logging` — производство: уровни (DEBUG < INFO < WARNING < ERROR < CRITICAL), формат (время, уровень, модуль), рутки (консоль, файл).

```python
import logging
logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger(__name__)
log.info("старт")
log.warning("мало памяти: %d", mem)   # ленивый формат (не строит, если уровень «не тот»)
log.exception("сбой")                 # в except: traceback
```

`log = logging.getLogger(__name__)` — логгер на модуль (иерархия); не `logging.info` прямиком.

### pytest: тесты

Тест — функция `test_*` в `test_*.py`; `assert` — проверка (не `self.assertEqual`). Запуск: `pytest` (или `pytest tests/ -v`).

```python
# tests/test_service.py
import pytest
from myproject.service import total, find

def test_total():
    assert total([1, 2, 3]) == 6

def test_find_missing():
    assert find([1, 2], 9) is None

def test_raises():
    with pytest.raises(ValueError):
        divide(1, 0)

# Фикстуры (подготовка/очистка)
@pytest.fixture
def sample():
    return [1, 2, 3]
def test_with_fixture(sample):
    assert len(sample) == 3
```

`pytest.raises` — ожидаем исключение; `@pytest.fixture` — объект на тест (создаётся перед, передаётся аргументом.

TIP: логика «в функциях (чистые, без print; logging «в «границах (старт/стоп/ошибки); тесты — «на функции (не «на print»). print — «в dev; logging — «в prod.

NOTE: в песочнице — logging работает (CPython); pytest — «в терминале (песочница — «один файл; тесты — «в проекте.

## Пример

`main.py`:

```python
"""Структура проекта, logging, тесты (демо)."""

import logging
import sys

# logging (вместо print)
logging.basicConfig(level=logging.DEBUG,
                    format="%(asctime)s %(levelname)-7s %(name)s: %(message)s",
                    stream=sys.stdout)
log = logging.getLogger("demo")

log.debug("debug-сообщение")
log.info("инфо: старт")
log.warning("предупреждение: мало места")

try:
    raise ValueError("что-то пошло не так")
except ValueError:
    log.exception("обработано (traceback в логе)")

# «Логгер» на «модуль» (иерархия)
child = logging.getLogger("demo.sub")
child.info("из под-модуля")

# «Тесты» (демо: «вручную» assert, как в pytest)
def total(nums: list[int]) -> int:
    return sum(nums)

def find(nums: list[int], x: int) -> int | None:
    for i, v in enumerate(nums):
        if v == x:
            return i
    return None

def divide(a: float, b: float) -> float:
    if b == 0:
        raise ZeroDivisionError("деление на 0")
    return a / b

# «Тесты» (assert — как в pytest)
assert total([1, 2, 3]) == 6
assert find([10, 20], 20) == 1
assert find([10], 99) is None
try:
    divide(1, 0)
    assert False, "должен был бросить"
except ZeroDivisionError:
    pass
print("все assert прошли (как pytest)")

# «Структура» проекта (каркас)
tree = """myproject/
  pyproject.toml
  requirements.txt
  .gitignore
  src/myproject/{__init__.py, main.py, models.py, service.py, api.py}
  tests/test_service.py"""
print("Структура проекта:\n" + tree)
```

## Частые ошибки

WARN: print «в production (не «уровни, не «формат, «трудно отфильтровать. logging (уровни, формат, рутки).

WARN: logging.basicConfig «в «каждом модуле (настраивает корневой «один раз; «в «точке входа. Логгер — getLogger(__name__) «в модуле.

WARN: тест «с print (не assert). Тест — assert (pytest «покажет «что именно упало. print — «не тест.

WARN: тесты «зависят (общее состояние, порядок). Тесты — независимые (фикстуры «создают «своё; pytest «может «перемешать.

## Практическое задание

1. `logging`: настройте `basicConfig` (INFO, формат с временем/уровнем/модулем); логгер `__name__`; выведите debug/info/warning/error (последний — через `log.exception` в `except`).
2. Логгер-иерархия: `app` → `app.db` → `app.db.query`; выведите названия (покажите иерархию).
3. Тесты (assert): `total`, `find`, `divide` (3 функции); 5 `assert` (включая `pytest.raises`-стиль через `try/except` + `assert False`).
4. Фикстура (имитация): функция `make_data()` (создаёт список); 3 теста используют её (как `@pytest.fixture`).
5. В комментарии: чем `logging` лучше `print` для большого приложения (3 пункта).
