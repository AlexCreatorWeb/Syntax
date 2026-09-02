"""Урок 13. Файлы: open, read/write, режимы, with."""

# TODO: with open("/tmp/names.txt", "w", encoding="utf-8") as f:
#       f.write("Аня\n"); f.writelines(["Боря\n", "Вера\n", "Гена\n"])

# TODO: чтение: весь текст (f.read()); выведите
# TODO: чтение: построчно (for line in f: print("  ", line.strip()))
# TODO: readlines(); выведите lines и len(lines)

# TODO: a — дописать "Дима\n"; перечитайте и выведите
# TODO: try/except FileNotFoundError: open("/tmp/нет.txt")

data = "имя;балл\nАня;92\nБоря;78\n"
# TODO: запишите в /tmp/scores.csv; прочитайте: rows = [line.strip().split(";") for line in f if line.strip()]
