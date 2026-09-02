"""Урок 17. Dunder-методы: __str__, __repr__, __eq__, __add__, __contains__."""

# TODO: class Player: __init__(name, level)
#       __str__ (f"{name} (ур. {level})"), __repr__ (f"Player({name!r}, {level})")
#       __eq__ (isinstance + (name, level); иначе NotImplemented), __hash__ (hash((name, level)))

# TODO: a = Player("Аня", 3); b = Player("Аня", 3)
#       выведите str(a), repr(a), a == b, a in [b], hash(a) == hash(b)
# TODO: players = {a: "активен"}; выведите players[b]

# TODO: class Vec: __init__(x, y); __add__ (Vec(x+other.x, y+other.y)); __repr__
#       v = Vec(1, 2) + Vec(3, 4); print(v)

# TODO: class TagList: __init__(items); __len__, __contains__, __getitem__
#       tags = TagList(["python", "oop"]); выведите len, "python" in tags, tags[1]
