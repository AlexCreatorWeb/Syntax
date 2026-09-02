# Урок 11. Модули и импорты: import, пакеты, `__name__`

## Цель

После урока студент сможет: импортировать модули (`import m`, `from m import x`, `import m as alias`), понимать **пакеты** (каталоги с `__init__.py`), использовать **`if __name__ == "__main__":`** (код «только при запуске»), и избегать «циклических» импортов (основные причины).

## Теория

### Модули и импорты

**Модуль** — файл `.py`. **Импорт** «подгружает» модуль (однажды) и даёт доступ к его именам:

```python
import math                      # модуль (stdlib)
math.sqrt(16)                    # через «точку»

from math import sqrt, pi        # конкретные имена
sqrt(16); pi

import math as m                 # alias
m.ceil(1.2)

from pathlib import Path         # «класс» из модуля
```

Правила:
- Импорт **вверху** файла (PEP 8: группы stdlib → сторонние → локальные).
- `from m import *` — **избегайте** (заполняет пространство имён, неясно откуда что).
- Модуль импортируется **один раз** (кэш в `sys.modules`); повторный `import` — «быстро» (не перечитывает).

### Пакеты

**Пакет** — каталог с модулями (обычно с `__init__.py` — «это пакет», может содержать код). Структура:

```
myproject/
  __init__.py          # пакет
  utils.py             # модуль
  models/
    __init__.py
    user.py
```

Импорт: `from myproject.utils import helper`, `from myproject.models.user import User`.

### `if __name__ == "__main__":`

Каждый модуль имеет атрибут **`__name__`**. При **запуске** файла (`python main.py`) его `__name__ == "__main__"`; при **импорте** — имя модуля (`"main"`). Паттерн:

```python
def compute() -> int:
    return 42

if __name__ == "__main__":
    print(compute())   # выполнится ТОЛЬКО при python main.py
```

Зачем: «общий» код (функции/классы) импортируется **без** побочных эффектов (print/запуск), а «точка входа» — только при запуске.

### Циклические импорты

`a.py` импортирует `b.py`, а `b.py` — `a.py` (вверху) → «частично инициализированный» модуль (имена ещё не определены) → ImportError/NameError. Лечение: «общее» вынести в третий модуль, импорт «вниз»/в функцию, перестроить зависимости.

TIP: «общие» функции — в отдельных модулях (не в main.py); main.py — точка входа (сборка, запуск).

NOTE: в песочнице (Pyodide) — один файл main.py (пакеты не «монтируются»); import работает для stdlib (math, json, collections, …). __name__ == "__main__" — истина (мы «запускаем» main.py).

## Пример

`main.py`:

```python
"""Модули и импорты."""

# stdlib-импорты (вверху, по группам)
import math
import json
from pathlib import Path
from collections import Counter

# Использование
print("sqrt(2) =", math.sqrt(2))
print("pi (from) =", round(math.pi, 4))

data = {"name": "Аня", "scores": [90, 85, 92]}
as_json = json.dumps(data, ensure_ascii=False)
print("json:", as_json)
print("обратно:", json.loads(as_json)["name"])

# Counter (from collections)
print("Counter:", Counter("aabbc"))

# __name__
print("__name__ =", __name__)
def main() -> None:
    print("Точка входа: main()")

if __name__ == "__main__":
    main()   # выполнится при python main.py (и в песочнице)

# Путь к файлу (pathlib) — «где мы»
print("Текущий каталог:", Path.cwd())
```

## Частые ошибки

WARN: from m import * — «магия» (неясно, откуда x; перекрытия имён). Импортите конкретные имена или модуль (import m / from m import x).

WARN: циклический импорт (a ↔ b вверху файлов) → ImportError. Выносите «общее», меняйте порядок, импортируйте «внутри» функции (редко).

WARN: «забываете» if __name__ == "__main__": — при импорте вашего модуля «сработает» весь код (print, запуск). «Общее» — функции; «запуск» — в guard.

WARN: импорты «внутри» функций «везде» (медленнее, неясно зависимости). Импорт — вверху (кроме «тяжёлых/опциональных» — в функцию осознанно).

## Практическое задание

1. Создайте (в комментариях «каркас» для терминала): модуль `utils.py` (функция `normalize`), `main.py` импортирует `from utils import normalize` и вызывает. Покажите `if __name__ == "__main__":` в `main.py`.
2. В песочнице: `import` 3 stdlib-модуля (`math`, `random`, `string`), используйте каждый (расчёт, случайное, генерация пароля 12 символов из `string.ascii_letters + string.digits`).
3. `json`: словарь «студент» → `json.dumps` (ensure_ascii=False, indent=2) → `json.loads` → измените поле → снова dumps. Выведите.
4. `Path`: текущий каталог, «создайте» имя файла `report_2026.txt`, выведите `is_file()`/`suffix`.
5. В комментарии: почему `from m import *` плохо, и когда **допустим** `import inside function` (2 примера).
