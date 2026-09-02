"""Урок 15. Классы: class, __init__, self, атрибуты."""

# TODO: class Player:
#       атрибут класса rank_default = "newbie", count = 0
#       __init__(self, name: str, level: int = 1): self.name, self.level, self.rank, Player.count += 1
#       def gain_xp(self, xp: int) -> None: self.level += xp // 100; print(f"{self.name}: +{xp} → уровень {self.level}")
#       def __str__(self) -> str: return f"Player({self.name}, lvl {self.level})"

# TODO: p1 = Player("Аня", 5); p2 = Player("Боря"); print(p1, "|", p2)
# TODO: выведите Player.count
# TODO: p1.gain_xp(250)
# TODO: атрибут класса vs экземпляра: p1.rank = "veteran"; выведите p1.rank, p2.rank, Player.rank_default
