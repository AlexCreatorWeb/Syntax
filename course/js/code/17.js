// Урок 17. Обход: forEach, map, filter. Запустите (Run) — смотрите консоль.

const users = [
  { name: "a", age: 15, active: true },
  { name: "b", age: 25, active: false },
  { name: "c", age: 35, active: true },
];

users.forEach((u, i) => console.log(i, u.name));

const names = users.map((u) => u.name);
const adults = users.filter((u) => u.age >= 18);
console.log(names, adults.length);

// TODO 1: activeNames — «цепочка** filter(active) → map(toUpperCase). console.log
// TODO 2: evenSquares(nums) — «чётные** «в** «квадрате». evenSquares([1,2,3,4]) → [4, 16]
// TODO 3: namesLengths(users) — «длина** «имён** (map)
// TODO 4: summarize(nums) — { count, sum, max } (циклом «или** reduce)
// TODO 5 (бонус): «цепочка** users → «активные** → «имена** → «сортировка** → «первая** «буква
