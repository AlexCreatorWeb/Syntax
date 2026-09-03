---
id: py-modules
track: python
type: reference
section: modules
order: 3
title:
  en: "Modules & Packages"
  ru: "Модули и пакеты"
excerpt:
  en: "Importing, package layout, relative imports and building your own reusable modules."
  ru: "Импорт, структура пакетов, относительные импорты и собственные переиспользуемые модули."
version: "python 3.9+"
updated: 2026-04-02
relatedTask: py-008
---

A module is any .py file; a package is a directory of modules. The import system is what turns a folder of files into a project.

## Imports

```python
# Two import styles
import json                    # then json.loads(...)
from pathlib import Path        # then Path(...)

# Packages: syntax/core/engine.py
from syntax.core import engine

print(engine.version)
```

> **TIP**
> Import at the top of the file and use `from module import name` only for a small, stable set of names — it keeps reload and tooling happy.

## Packages

Add an `__init__.py` to each directory you want importable. Relative imports (`from . import utils`) work only inside a package — top-level scripts should use absolute paths.

<!-- RU -->

Модуль — любой .py-файл; пакет — каталог модулей. Система импорта превращает папку с файлами в проект.

## Импорт

```python
# Два стиля импорта
import json                    # затем json.loads(...)
from pathlib import Path        # затем Path(...)

# Пакеты: syntax/core/engine.py
from syntax.core import engine

print(engine.version)
```

> **TIP**
> Импортируйте в начале файла; `from module import name` — только для маленького и стабильного набора имён.

## Пакеты

Добавьте `__init__.py` в каждый каталог, который нужно импортировать. Относительные импорты (`from . import utils`) работают только внутри пакета — в топ-уровневых скриптах используйте абсолютные пути.
