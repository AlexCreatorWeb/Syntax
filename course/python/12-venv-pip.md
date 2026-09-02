# Урок 12. Виртуальные окружения: venv, pip, requirements.txt

## Цель

После урока студент сможет: объяснять, зачем **виртуальные окружения** (изоляция зависимостей проекта), создавать и активировать **venv** (Linux/macOS/Windows), устанавливать/удалять пакеты через **pip**, фиксировать зависимости в **requirements.txt** (и ставить из него), и понимать роль **PyPI** (реестр пакетов).

## Теория

### Зачем виртуальное окружение

Python «ставит» пакеты (библиотеки) в **site-packages** интерпретатора. Без изоляции: проект A требует `requests 2.28`, проект B — `2.31` → **конфликт** (одна версия на систему). **Виртуальное окружение (venv)** — «копия» Python + свои site-packages **для проекта**: каждый проект — свои пакеты, версии, без «мусора» в системе.

### PyPI и pip

- **PyPI** (pypi.org) — публичный реестр пакетов (миллионы: requests, flask, numpy, pytest…).
- **pip** — менеджер пакетов: `pip install <пакет>`, `pip show`, `pip list`, `pip uninstall`.

### venv: создание и активация

```bash
# Создание (в корне проекта)
python -m venv .venv

# Активация (путь меняется в prompt)
source .venv/bin/activate        # Linux/macOS
.venv\Scripts\activate           # Windows (cmd)
.venv\Scripts\Activate.ps1       # Windows (PowerShell)

# Деактивация
deactivate
```

Пока venv активен — `pip`/`python` — **венв-версии** (пакеты ставятся в `.venv`). `.venv` — в `.gitignore` (не коммитится).

### requirements.txt: «рецепт» зависимостей

```bash
pip freeze > requirements.txt     # «заморозить» всё, что в venv
pip install -r requirements.txt   # «восстановить» (новый компьютер/команда)
```

Формат: `пакет==версия` (по строке). **Коммитится** в git (чтобы все ставили **одинаковые** версии).

### poetry (альтернатива)

**poetry** — «пакетный менеджер + менеджер окружений + сборка»: `pyproject.toml` (зависимости), `poetry install` (создаст venv + поставит), `poetry add <пакет>`. В индустрии — и venv+pip (классика), и poetry/uv (новее). Курс — venv+pip (универсально).

TIP: **первое** действие в проекте — `python -m venv .venv` + активация + `requirements.txt`. «Голый» pip в системный Python — путь к «у меня работает».

NOTE: в песочнице (Pyodide) — **свои** «пакеты» (stdlib + pyodide-набор); venv/pip — **в терминале**. Урок — «как в жизни», команды — в примерах/комментариях.

## Пример

`main.py` (песочница: «демо» логики; команды — в комментариях):

```python
"""Виртуальные окружения: venv, pip, requirements.txt (команды — в терминале)."""

# В терминале (НЕ в песочнице):
#   python -m venv .venv
#   source .venv/bin/activate        # Linux/macOS  (Windows: .venv\Scripts\activate)
#   pip install requests             # поставить пакет (в venv)
#   pip list                         # что установлено
#   pip freeze > requirements.txt    # «рецепт» (коммитим)
#   pip install -r requirements.txt  # «восстановить» (новый ПК)
#   deactivate                       # выйти из venv

# «Проверка» venv: переменная VIRTUAL_ENV установлена, когда venv активен
import os
venv = os.environ.get("VIRTUAL_ENV")
print("VIRTUAL_ENV:", venv or "(нет venv — системный Python или песочница)")

# «Рецепт» зависимостей (пример структуры requirements.txt)
requirements = [
    "requests==2.31.0",
    "httpx==0.26.0",
    "pytest==8.0.0",
]
print("--- requirements.txt ---")
print("\n".join(requirements))

# «Разбор» строки "пакет==версия"
def parse_requirement(line: str) -> tuple[str, str | None]:
    """Возвращает (имя, версия|None)."""
    name, sep, version = line.partition("==")
    return name.strip(), version.strip() if sep else None

for line in requirements:
    name, version = parse_requirement(line)
    print(f"  {name:12} {version or '(любая)'}")

# .gitignore для venv
gitignore_lines = [".venv/", "__pycache__/", "*.pyc", ".env"]
print("--- .gitignore ---")
print("\n".join(gitignore_lines))
```

## Частые ошибки

WARN: **ставите пакеты в системный Python** (без venv) — «загадки» версий, конфликты, «у меня работает». Первый шаг — `python -m venv .venv`.

WARN: **забываете активировать** venv (или активировали в одном терминале, а `pip` вызвали в другом) — пакеты «уезжают» не туда. Проверьте prompt (префикс `(.venv)`) / `which python`.

WARN: **не коммитите** `requirements.txt` (или коммитите `.venv/`) — команда/новый ПК «не знает» версии. Requirements — в git, `.venv` — в gitignore.

WARN: `pip freeze` «замораживает» **всё** (включая транзитивные) — файл «раздувается». Для «чистого» — `pip freeze` с фильтром (или poetry/uv, которые пишут только «прямые»).

## Практическое задание

1. (Терминал) Создайте venv в папке `demo`: `python -m venv .venv`, активируйте, `pip install requests`, `pip list | grep requests`, `pip freeze > requirements.txt`, `deactivate`. Выведите `requirements.txt`.
2. (Терминал) Создайте **второй** venv, `pip install -r requirements.txt`, убедитесь, что `requests` той же версии.
3. В песочнице: функция `parse_requirements(text: str) -> list[tuple[str, str | None]]` (разбор многострочного requirements: `==`, `>=`, `~>`, комментарий `#`). Проверьте на 5 строках.
4. Функция `suggest_gitignore(uses_venv: bool = True) -> list[str]` — список строк `.gitignore` (`.venv/`, `__pycache__/`, `*.pyc`, `.env`, `dist/`). Выведите.
5. В комментарии: чем `poetry install` отличается от `venv + pip install -r` (по шагам).
