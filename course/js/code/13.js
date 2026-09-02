// Урок 13. Default, rest, spread. Запустите (Run) — смотрите консоль.

// Default:
function power(base, exp = 2) { return base ** exp; }
console.log(power(5), power(5, 3)); // 25 125

// Rest:
// TODO 1: sum(...nums) — «сумма» «аргументов». console.log(sum(1, 2), sum(1, 2, 3, 4))
// TODO: average(...nums) — «среднее» (sum / nums.length)

// Spread:
const nums = [3, 1, 2];
console.log(Math.max(...nums)); // 3
const a = [1, 2], b = [3, 4];
console.log([...a, ...b]); // [1, 2, 3, 4]
const base = { x: 1, y: 2 };
console.log({ ...base, y: 99, z: 3 }); // { x: 1, y: 99, z: 3 }

// TODO 2: applyDiscount(price, discount = 0, ...extras) — price × (1 - discount) + sum(extras)
//         Проверьте: applyDiscount(100), applyDiscount(100, 0.1), applyDiscount(100, 0.1, 5, 5)
// TODO 3: removeAt(arr, i) — «массив» «без» «элемента» i (slice + spread)
// TODO 4 (бонус): stats(...nums) → { min, max, sum }
