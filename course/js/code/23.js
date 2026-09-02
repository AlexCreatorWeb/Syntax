// Урок 23. Деструктуризация и spread. Запустите (Run) — смотрите консоль.

const user = {
  name: "A",
  age: 25,
  address: { city: "MSK", zip: "101000" },
};

// TODO 1: «извлечь** name, age, city (вложенная «деструктуризация**). console.log
const { name, age } = user;
console.log(name, age);

// TODO 2: extractUser(user) → { name, age, city } (функция «с** «деструктуризацией**)

// «Массив**:
const [first, ...rest] = [10, 20, 30];
console.log(first, rest); // 10 [20, 30]
let a = 1, b = 2;
[a, b] = [b, a];
console.log(a, b); // 2 1

// TODO 3: withDefaults(options) — { ...defaults, ...options } (defaults = { theme: "dark", size: 16 })

// TODO 4: «перепишите** function f(x, y, z = 0) «с** «объектным** «аргументом** ({ x, y, z = 0 })
// TODO 5 (бонус): «swap** «трёх** «переменных** «деструктуризацией**
