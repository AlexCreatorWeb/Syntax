"""Урок 3. Строки и f-строки: срезы, методы, форматирование."""

s = "  Hello, Python World!  "
# TODO: выведите s.strip(), s.strip().upper(), s.replace("Python", "Syntax")

t = "python"
# TODO: выведите t[0], t[-1], t[1:4], t[:3], t[2:], t[::2], t[::-1]

# TODO: csv = "apple,banana,cherry" → split → list; join с " | "; разворот "".join(reversed(…))
csv = "apple,banana,cherry"

word = "Syntax2026"
# TODO: выведите word.isalpha(), isalnum(), isdigit()
# TODO: выведите s.strip().startswith("Hello"), "World" in s

name, age, score = "Аня", 30, 94.678
# TODO: f-строки: приветствие с age+1; f"{score:.2f}"; f"{255:#x}"; выравнивание f"{'код':>10}"

# TODO: removeprefix("https://") для "https://example.com/page"; removesuffix(".py") для "main.py"
