"""Урок 22. Генераторы, yield, map/filter/sorted."""

# TODO: def chunks(items: list, size: int): for i in range(0, len(items), size): yield items[i:i+size]
#       nums = list(range(10)); for c in chunks(nums, 3): print("chunk:", c)

# TODO: def count(from_=0, step=1): while True: yield n; n += step
#       from itertools import islice; выведите list(islice(count(10, 3), 5))

# TODO: genexpr: sq = (n * n for n in range(5)); next(sq), next(sq), list(sq)
# TODO: total = sum(n for n in range(1000) if n % 2 == 0); выведите

words = ["python", "is", "awesome"]
# TODO: upper = list(map(str.upper, words)); long_words = list(filter(lambda w: len(w) > 3, words)); выведите

students = [("Аня", 92), ("Боря", 78), ("Вера", 88)]
# TODO: by_score = sorted(students, key=lambda s: s[1], reverse=True); по имени; выведите
# TODO: max(students, key=lambda s: s[1]); max(words, key=len)
