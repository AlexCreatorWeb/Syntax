"""Урок 5. dict и set: хешируемые структуры."""

stock = {"кофе": 10, "чай": 5, "печенье": 20}
# TODO: добавьте "молоко": 7; уменьшите "кофе" через .get (без KeyError); setdefault("сахар", 3)
# TODO: итерация for item, qty in stock.items(): print(f"  {item}: {qty}")

prices = {"кофе": 300, "чай": 200, "печенье": 150}
# TODO: dict comprehension: {товар: qty * цена} только для товаров, есть в prices; sum(…values())

visited = [1, 2, 2, 3, 3, 3, 4]
# TODO: set(visited); len; 5 in …

friends_anya = {"Боря", "Вера", "Гена"}
friends_borya = {"Аня", "Вера", "Дима"}
# TODO: общие (&), все (|), только у Ани (-); выведите

# TODO: try/except TypeError: bad = {[1, 2]: "x"}; good = {(1, 2): "точка"}
