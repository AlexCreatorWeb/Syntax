"""Урок 6. Условные конструкции: if/elif/else, тернарник, truthiness."""

temp = 28
# TODO: if/elif/else: "жара"/"тепло"/"прохладно"/"холодно" (пороги 30/20/10)
# TODO: выведите f"{temp}°C → {weather}"

age = 20
# TODO: тернарник: status = "взрослый" if age >= 18 else "несовершеннолетний"

price = 1000
# TODO: тернарник: discount = 0.1 if price > 500 else 0.0; выведите price * (1 - discount)

x = 7
# TODO: выведите 0 < x < 10; True and False; False or "да"; not 0

# TODO: цикл по falsy = [False, None, 0, 0.0, "", (), [], {}, set()]: print(f"falsy: {v!r}")

items = []
# TODO: выведите not items; затем items = [1, 2] и bool(items)
value = None
# TODO: выведите value is None, value is not None

flag = True
# TODO: выведите flag (питонично) — и в комментарии почему НЕ "flag == True"
