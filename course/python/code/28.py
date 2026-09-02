"""Урок 28. Финальный проект: REST-клиент «Трекер задач» (CLI + API + service + тесты)."""

import logging
import sys
from dataclasses import dataclass, asdict
from datetime import datetime


# === 1) Модель ===
@dataclass
class Task:
    id: int
    title: str
    done: bool = False
    created: str = ""

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict) -> "Task":
        return cls(id=d["id"], title=d["title"], done=d.get("done", False), created=d.get("created", ""))


# === 2) Ошибки ===
class TaskError(Exception):
    """Базовая ошибка трекера."""


class NotFoundError(TaskError):
    def __init__(self, task_id: int):
        super().__init__(f"задача {task_id} не найдена")
        self.task_id = task_id


class ValidationError(TaskError):
    pass


# === 3) API-клиент (имитация: in-memory) ===
class TaskAPI:
    def __init__(self) -> None:
        self._db: dict[int, dict] = {}
        self._next_id = 1

    def list(self) -> list[dict]:
        return list(self._db.values())

    def get(self, task_id: int) -> dict:
        if task_id not in self._db:
            raise NotFoundError(task_id)
        return self._db[task_id]

    def create(self, title: str) -> dict:
        # TODO: валидация title (не пустой → ValidationError); создать record; self._next_id += 1
        raise NotImplementedError

    def complete(self, task_id: int) -> dict:
        # TODO: record = self.get(task_id); record["done"] = True; return record
        raise NotImplementedError

    def delete(self, task_id: int) -> None:
        # TODO: self.get(task_id) (NotFoundError); del self._db[task_id]
        raise NotImplementedError


# === 4) Service (логика) ===
class TaskService:
    def __init__(self, api: TaskAPI) -> None:
        self.api = api
        self.log = logging.getLogger("tracker.service")

    # TODO: add_task(title) -> Task (log.info + api.create + from_dict)
    # TODO: complete_task(task_id) -> Task
    # TODO: list_tasks() -> list[Task]
    # TODO: stats() -> dict {"total", "done", "open"}


# === 5) CLI ===
def render(tasks: list[Task]) -> None:
    for t in tasks:
        mark = "x" if t.done else " "
        print(f"[{mark}] {t.id}. {t.title} ({t.created})")


def main(argv: list[str]) -> int:
    # TODO: basicConfig (INFO, stderr); service = TaskService(TaskAPI())
    # TODO: команды: list | add <title> | done <id> | rm <id> | stats
    # TODO: except TaskError as e: print(f"ошибка: {e}", file=sys.stderr); return 1
    raise NotImplementedError


# === 6) Тесты (assert) ===
def _run_tests() -> None:
    pass  # TODO: раскомментируйте
    # TODO: api = TaskAPI(); svc = TaskService(api)
    #       add_task ×2; assert ids, stats == {"total": 2, "done": 0, "open": 2}
    #       complete_task(1); assert stats["done"] == 1
    #       complete_task(99) → NotFoundError; add_task("   ") → ValidationError
    #       print("тесты: OK")


if __name__ == "__main__":
    # TODO: _run_tests(); демо: add ×2, complete, render(list_tasks()), print(stats())
    print("TODO: реализуйте TaskAPI/TaskService/main/_run_tests")
