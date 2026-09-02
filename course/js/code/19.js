// Урок 19. find, some, every, includes. Запустите (Run) — смотрите консоль.

const users = [
  { id: 1, name: "a", age: 15 },
  { id: 2, name: "b", age: 25 },
  { id: 3, name: "c", age: 35 },
];
const tags = ["js", "css", "html"];

// «Демо»:
const adult = users.find((u) => u.age >= 18);
console.log(adult?.name); // "b"
console.log(users.findIndex((u) => u.id === 3)); // 2
console.log(users.some((u) => u.age < 18));      // true
console.log(tags.includes("css"));               // true

// TODO 1: findBy(arr, key, value) — find «по** «свойству**. findBy(users, "name", "c")?.id // 3
// TODO 2: hasAdults(ages) — some (есть «≥ 18»). hasAdults([10, 20]) → true
// TODO 3: allUnique(arr) — every + includes («все** «уникальные»). allUnique([1,2,2]) → false
// TODO 4 (бонус): «объясните** «в** «комментарии**, «почему** [].every(() => false) → true
