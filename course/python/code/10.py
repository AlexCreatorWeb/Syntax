"""Урок 10. Type hints и PEP 8."""

# TODO: аннотируйте переменные: username: str, level: int, progress: float,
#       tags: list[str], config: dict[str, int | str], origin: tuple[int, int],
#       nickname: str | None = None

# TODO: def top_scores(scores: list[float], n: int = 3) -> list[float] (sorted reverse, [:n]); вызовите
# TODO: def find_index(items: list[int], target: int) -> int | None (enumerate); вызовите (найдено и нет)

# TODO: выведите top_scores.__annotations__

# TODO: from collections.abc import Callable
#       def apply_twice(func: Callable[[int], int], x: int) -> int; def double(x: int) -> int
#       выведите apply_twice(double, 3)

# TODO: PEP 8-имена: MAX_RETRIES: int = 3; user_name: str = "a"; class Task: _internal: int = 0
