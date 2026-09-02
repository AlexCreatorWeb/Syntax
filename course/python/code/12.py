"""Урок 12. Виртуальные окружения: venv, pip, requirements.txt (команды — в терминале)."""
# В терминале (НЕ в песочнице):
#   python -m venv .venv
#   source .venv/bin/activate
#   pip install requests
#   pip freeze > requirements.txt
#   pip install -r requirements.txt
#   deactivate

import os

# TODO: выведите os.environ.get("VIRTUAL_ENV") or "(нет venv)"

# TODO: requirements = ["requests==2.31.0", "httpx==0.26.0", "pytest==8.0.0"];
#       выведите "--- requirements.txt ---" + "\n".join(requirements)

# TODO: def parse_requirement(line: str) -> tuple[str, str | None] (partition("=="));
#       цикл по requirements: print(f"  {name:12} {version or '(любая)'}")

# TODO: gitignore_lines = [".venv/", "__pycache__/", "*.pyc", ".env"]; выведите
