"""Урок 4. list и tuple: comprehensions, распаковка."""

items = [10, 20, 30]
# TODO: append(40), extend([50, 60]), insert(1, 15); выведите items
# TODO: remove(15), pop(); выведите результат pop и items

print("Срез:", items[1:3], "| разворот:", items[::-1], "| 30 in:", 30 in items)

point = (3, 4)
# TODO: распакуйте x, y = point; выведите расстояние до начала координат ((x**2+y**2)**0.5)

nums = list(range(1, 11))
# TODO: comprehension: квадраты всех; чётные
# TODO: words = ["python", "is", "awesome", "and", "clean"] → [w.upper() for w in words if len(w) > 3]

matrix = [[1, 2, 3], [4, 5, 6]]
# TODO: вложенный comprehension: матрица → плоский список

# TODO: распаковка: first, *rest = [1, 2, 3, 4]; обмен a, b = b, a
