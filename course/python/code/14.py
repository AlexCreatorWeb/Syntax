"""Урок 14. Контекстные менеджеры: __enter__/__exit__, contextlib."""

import time
import io
import contextlib
from contextlib import contextmanager, suppress

# TODO: class Timer: __init__(label), __enter__ (self.start = time.perf_counter()),
#       __exit__(…) (print(f"[{label}] …s"), return False)
# TODO: with Timer("цикл"): total = sum(range(100_000)); print(total)

# TODO: @contextmanager def log_scope(name): print(f"→ вход в {name}"); yield name; print(f"← выход из {name}")
# TODO: with log_scope("секция A") as sec: print("  работа в", sec)
# TODO: try: with log_scope("секция B"): raise RuntimeError("упс") except RuntimeError: print("  (обработано)")

# TODO: with suppress(ValueError): value = int("abc"); выведите value
# TODO: buffer = io.StringIO(); with contextlib.redirect_stdout(buffer): print("в buffer"); выведите buffer.getvalue()
