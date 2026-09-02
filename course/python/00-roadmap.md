# Курс «Python 3.10+: от синтаксиса до REST API» (28 уроков) — дорожная карта

Целевая аудитория: студент, прошедший HTML/CSS/JS (понимает, что такое переменные, функции, типы). Результат: студент пишет чистый «питоничный» Python 3.10+ (type hints, f-строки, comprehensions, PEP 8), работает с файлами и виртуальными окружениями, пишет ООП-код (классы, наследование, dunder-методы, dataclass), обрабатывает исключения, понимает asyncio и работает с REST API (requests/httpx), собирает проект с тестами.

Источники: docs.python.org (3.12/3.10), PEP 8 / PEP 20 / PEP 484 (type hints) / PEP 483, PEP 494 (asyncio), real python (bест-практики), requests/httpx документация, «Fluent Python» (Lightman) — структура.

## Структура

M1. Основы (01-05)
01 — Python и интерпретатор: установка, python main.py, REPL, print, комментарии
02 — Переменные и базовые типы: int/float/str/bool, преобразования, //, %, **
03 — Строки и f-строки: срезы, методы, format vs f-string, join/split
04 — list и tuple: мутабельность, list comprehensions, распаковка
05 — dict и set: операции, .get, comprehensions, хешируемость

M2. Управление и функции (06-10)
06 — Условные конструкции: if/elif/else, тернарник, boolean-операции, truthiness
07 — Циклы: for/while, range, break/continue, enumerate/zip
08 — Функции: def, аргументы, return, область видимости (LEGB)
09 — Аргументы функций: значения по умолчанию, *args/**kwargs, lambda; мутабельные дефолты
10 — Type hints и PEP 8: аннотации, |, dataclass (введение), стиль

M3. Модули и файлы (11-14)
11 — Модули и импорты: import/from, пакеты, __name__ == "__main__"
12 — Виртуальные окружения: venv, pip, requirements.txt
13 — Файлы: open/read/write, режимы, with, encoding
14 — Контекстные менеджеры вглубь: __enter__/__exit__, contextlib, свой менеджер

M4. ООП (15-19)
15 — Классы: class, __init__, self, атрибуты экземпляра/класса
16 — Наследование и полиморфизм: super(), переопределение, MRO
17 — Dunder-методы: __str__/__repr__/__len__/__eq__/__add__
18 — property, classmethod, staticmethod, «приватность» _attr
19 — dataclass и продвинутое ООП: slots, ABC (abc), Protocol

M5. Исключения и stdlib (20-22)
20 — Исключения: try/except/else/finally, raise, свои Exception, contextlib.suppress
21 — stdlib: collections (Counter/defaultdict/namedtuple), itertools, functools, datetime
22 — Функциональные инструменты: map/filter, sorted(key), генераторы и yield

M6. Асинхронность и API (23-26)
23 — asyncio: event loop, coroutine, await, gather
24 — asyncio на практике: create_task, when to async
25 — REST-клиент: requests (GET/POST, JSON, статусы, timeout, errors)
26 — httpx и продвинутый REST: async-клиент, retries, best practices

M7. Финал (27-28)
27 — Структура проекта, logging, тесты (pytest-базис), main-вход
28 — Финальный проект: REST-клиент «Трекер задач» (CLI + API + тесты)

## Логическая цепочка

1. **Интерпретатор** (01): как запускать, REPL, print — точка входа.
2. **Типы** (02): int/float/str/bool, преобразования — «из чего состоит» данные.
3. **Строки** (03): f-строки и методы — самая частая операция.
4. **list/tuple** (04): коллекции + comprehensions — осн. структура данных.
5. **dict/set** (05): хешируемые структуры — вторая основа.
6. **Условия** (06): ветвление + truthiness.
7. **Циклы** (07): итерация + enumerate/zip (питоничность).
8. **Функции** (08): def/return + LEGB (видимость).
9. **Аргументы** (09): *args/**kwargs + мутабельные дефолты (ловушка №1).
10. **Type hints + PEP 8** (10): современный стиль (подготовляет к dataclass).
11. **Модули** (11): import, __main__ — как код модулируется.
12. **venv/pip** (12): окружения — «как ставятся пакеты».
13. **Файлы** (13): I/O + with.
14. **Контекстные менеджеры** (14): why with работает (протокол).
15. **Классы** (15): OOP-база.
16. **Наследование** (16): иерархии, MRO.
17. **Dunder** (17): как объекты ведут себя «как встроенные».
18. **property/staticmethod** (18): доступ к данным и класс-методы.
19. **dataclass/ABC** (19): modern OOP.
20. **Исключения** (20): устойчивость кода.
21. **stdlib** (21): готовые инструменты.
22. **Генераторы** (22): yield + ленивость.
23. **asyncio** (23): event loop.
24. **asyncio-практика** (24): tasks, when.
25. **requests** (25): REST-клиент.
26. **httpx** (26): async REST.
27. **Проект + тесты** (27): структура, logging, pytest.
28. **Финальный проект** (28): REST-клиент «Трекер задач».

## Контракт урока (фиксированный, QC в сидере)

5 разделов в строгом порядке:
1. `## Цель` — «После урока студент сможет: …»
2. `## Теория` — простые объяснения, `###`-подзаголовки
3. `## Пример` — рабочий код в ```python-блоке (полный `main.py` — воспроизводим в терминале Python и в раннере платформы)
4. `## Частые ошибки` — минимум 1 `WARN:` (по одной на ловушку)
5. `## Практическое задание` — нумерованный список с TODO

Правила контента:
- минимум 1 `TIP:` и 1 `WARN:`-callout; `NOTE:` — для «как это работает в платформе Syntax»
- без таблиц, без markdown-ссылок `[t](u)`
- объём content 4000–7000 зн.
- **`code/NN.py` = скелет ЗАДАНИЯ** (НЕ решение): исполняемый `main.py` (Python 3.10+) с `# TODO`
- весь код — Python 3.10+ (f-строки, type hints, `X | None`), PEP 8

## Механика платформы

- Файл задания Python-трека = `main.py` (TASK_FILE в lessonJob.js).
- **Python-раннер** (CodeEditor): `main.py` → `buildPythonDoc()`: код в `<script type="text/plain" id="syntax-py-src">` (экранируем `</script`) → **Pyodide** (CPython 3.12 в WASM, CDN jsDelivr v0.26.4, загрузка ~3–4с): `loadPyodide({indexURL})` → `setStdout/setStderr` (в console-перехват) → `runPythonAsync(code)` — **top-level await поддерживается** (asyncio-уроки!). Ошибки: Python-traceback в `e.message` с `File "<exec>", line N` — **N = строка файла** (код как есть, `window.__syntaxOffset = 0`) — клик по ошибке → строка. В песочнице: чистый Python (stdlib), файловая система — in-memory (pyodide), сеть — `pyodide.http.pyfetch` (для requests-уроков: NOTE, что в терминале — настоящий requests, в песочнице — pyfetch-обёртка или «имитация API» функцией). Монaco: `.py` → язык "python".
- Материал урока (markdown-lite): `##`/`###`, **жирный**, *курсив*, `код`, ```python-блоки (Copy), TIP:/NOTE:/WARN:-callout'ы.
- Сидер `seed-python-course.mjs`: IDEMPOTENT (удаляет ВСЕ tech='python', вставляет 28, id `80000000-…00NN`), встроенный QC (5 разделов, TIP/WARN, ```python, объём, ссылки) — падает до БД при нарушении; `DRY=1 node …` — только проверка.

## Источники (первичные)

- docs.python.org/3/tutorial — базовый туториал
- docs.python.org/3/library — stdlib (collections, itertools, functools, asyncio, json, logging)
- PEP 8 (стиль), PEP 20 (Zen), PEP 484 (type hints), PEP 572 (walrus), PEP 604 (X | Y)
- realpython.com — best practices (mutable defaults, with, generators)
- docs.python.org/3/library/asyncio — asyncio
- requests.readthedocs.io; httpx.org
