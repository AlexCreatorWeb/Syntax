# Урок 28. Финальный проект: REST-клиент «Трекер задач» (CLI + API + тесты)

## Цель

После урока студент сможет: собрать проект «Трекер задач» (CLI-клиент REST API): модели (`@dataclass` Task), service (CRUD через API (имитация/requests), CLI (аргументы, команды), logging, тесты (assert/pytest-стиль), и применить всё с курса (dataclass, type hints, exceptions, logging, async «опционально).

## Теория

### Что будет в проекте

«Трекер задач»: CLI-клиент, который общается с REST API (создаёт/список/завершает/удаляет задачи). Структура (один `main.py` в песочнице; в терминале — пакет):
1. Модель: `@dataclass Task` (id, title, done, created) + `to_dict`/`from_dict` (JSON).
2. Ошибка: `TaskError` (база), `NotFoundError(TaskError)`, `ValidationError(TaskError)`.
3. API-клиент: `TaskAPI` (методы `list`, `get`, `create`, `complete`, `delete`; имитация (in-memory) с контрактом requests/httpx (status, json); в терминале — `requests`/`httpx`).
4. Service: `TaskService` (валидация, бизнес: `add_task` (проверка title), `complete_task` (404 если нет), `stats` (счётчики).
5. CLI: `main()` (команды: `list`, `add <title>`, `done <id>`, `rm <id>`, `stats`; вывод человекочитаемое).
6. Logging: `basicConfig` + логгер.
7. Тесты: `assert` на service (create/get/complete/not-found/validation).

### Принципы (весь курс)

- Type hints везде (функции, поля).
- dataclass для данных (Task).
- Исключения свои (NotFound/Validation) — не `except:`.
- logging (не print) в service/api.
- Тесты на service (чистые функции, не CLI).

TIP: «разбивайте на слои: модель (данные) → API (сеть) → service (логика) → CLI (ввод/вывод). Тестируйте service (чистое); CLI — «тонкий.

## Пример

`main.py` (скелет — заполните TODO):

```python
"""Трекер задач: CLI + API (имитация) + service + тесты."""

import logging
import sys
from dataclasses import dataclass
from datetime import datetime

# === 1) Модель ===
@dataclass
class Task:
    id: int
    title: str
    done: bool = False
    created: str = ""

    @classmethod
    def from_dict(cls, d: dict) -> "Task":
        return cls(id=d["id"], title=d["title"], done=d.get("done", False))

# === 2) Ошибки ===
class TaskError(Exception):
    """Базовая ошибка трекера."""

class NotFoundError(TaskError):
    def __init__(self, task_id: int):
        super().__init__(f"задача {task_id} не найдена")
        self.task_id = task_id

class ValidationError(TaskError):
    pass

# === 3) API-клиент (имитация: in-memory; контракт — requests/httpx) ===
class TaskAPI:
    """Имитация REST API (в терминале — requests/httpx с base_url)."""

    def __init__(self):
        self._db: dict[int, dict] = {}
        self._next_id = 1

    def list(self) -> list[dict]:
        return list(self._db.values())

    def get(self, task_id: int) -> dict:
        if task_id not in self._db:
            raise NotFoundError(task_id)
        return self._db[task_id]

    def create(self, title: str) -> dict:
        if not title.strip():
            raise ValidationError("title не может быть пустым")
        record = {"id": self._next_id, "title": title.strip(), "done": False,
                  "created": datetime.now().strftime("%Y-%m-%d")}
        self._db[self._next_id] = record
        self._next_id += 1
        return record

    def complete(self, task_id: int) -> dict:
        record = self.get(task_id)          # NotFoundError, если нет
        record["done"] = True
        return record

    def delete(self, task_id: int) -> None:
        self.get(task_id)                   # NotFoundError
        del self._db[task_id]

# === 4) Service (логика) ===
class TaskService:
    def __init__(self, api: TaskAPI):
        self.api = api
        self.log = logging.getLogger("tracker.service")

    def add_task(self, title: str) -> Task:
        self.log.info("создание: %r", title)
        return Task.from_dict(self.api.create(title))

    def complete_task(self, task_id: int) -> Task:
        self.log.info("завершение: %d", task_id)
        return Task.from_dict(self.api.complete(task_id))

    def list_tasks(self) -> list[Task]:
        return [Task.from_dict(d) for d in self.api.list()]

    def stats(self) -> dict:
        tasks = self.list_tasks()
        done = sum(1 for t in tasks if t.done)
        return {"total": len(tasks), "done": done, "open": len(tasks) - done}

# === 5) CLI ===
def render(tasks: list[Task]) -> None:
    for t in tasks:
        mark = "x" if t.done else " "
        print(f"[{mark}] {t.id}. {t.title} ({t.created})")

def main(argv: list[str]) -> int:
    logging.basicConfig(level=logging.INFO, stream=sys.stderr)
    service = TaskService(TaskAPI())
    if not argv or argv[0] == "list":
        render(service.list_tasks())
        return 0
    cmd, args = argv[0], argv[1:]
    try:
        if cmd == "add":
            t = service.add_task(" ".join(args))
            print(f"создана: {t.id}. {t.title}")
        elif cmd == "done":
            print(f"завершена: {service.complete_task(int(args[0])).id}")
        elif cmd == "rm":
            service.api.delete(int(args[0]))
            print(f"удалена: {args[0]}")
        elif cmd == "stats":
            print(service.stats())
        else:
            print("команды: list | add <title> | done <id> | rm <id> | stats")
            return 1
    except TaskError as e:
        print(f"ошибка: {e}", file=sys.stderr)
        return 1
    return 0

# === 6) Тесты (assert; в проекте — tests/test_service.py, pytest) ===
def _run_tests() -> None:
    pass
    # TODO: api = TaskAPI(); svc = TaskService(api)
    #       add_task ×2 → assert ids, stats == {"total": 2, "done": 0, "open": 2}
    #       complete_task(1) → assert stats["done"] == 1
    #       complete_task(99) → NotFoundError; add_task("   ") → ValidationError
    #       print("тесты: OK")

if __name__ == "__main__":
    pass
    # TODO: _run_tests(); демо: add ×2, complete_task(1), render(list_tasks()), print(stats())
    pass
```

## Частые ошибки

WARN: всё в main (CLI + логика + API «в одной функции. Слои: модель/API/service/CLI (тестируем service).

WARN: print «в service (не logging). logging (уровни/формат); print — «только CLI (вывод пользователю).

WARN: except Exception «в CLI (глотает всё. Ловите свои TaskError (и «показывать пользователю).

WARN: тесты «на CLI (print). Тестируйте service (чистые функции, return); CLI — «руками/интеграционно.

## Практическое задание

1. Доработайте модель: `Task` — `priority: int = 0`; `stats()` — по приоритету (счётчик). Тесты (assert).
2. API: `update(task_id, **fields)` (изменить title/priority; 404 если нет). Service: `set_priority`. Тесты.
3. CLI: команда `edit <id> <new_title>`; фильтр: `list --open` (только незавершённые). Выведите.
4. Тесты: 5 `assert`-групп на service (create, complete, not-found, validation, stats). Запустите (`_run_tests`).
5. (Терминал) Перепишите `TaskAPI` на `requests` (настоящий API (например httpbin/ваш флэск)): `base_url`, `timeout`, `raise_for_status`. Выведите контракт (методы, URL).
