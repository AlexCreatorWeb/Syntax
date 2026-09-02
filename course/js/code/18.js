// Урок 18. reduce: свёртка данных. Запустите (Run) — смотрите консоль.

const nums = [1, 2, 3, 4];

// TODO 1: sum — nums.reduce((acc, x) => acc + x, 0). console.log(sum) // 10
// TODO 2: max — reduce «с** Math.max (initial = nums[0] «или** -Infinity)

// «Подсчёт** «слов**:
const words = ["a", "b", "a", "c", "b", "a"];
// TODO 3: wordCounts — { a: 3, b: 2, c: 1 } (reduce, acc = {}, (acc[w] ?? 0) + 1)

// «Группировка**:
const users = [
  { name: "a", city: "MSK" },
  { name: "b", city: "SPB" },
  { name: "c", city: "MSK" },
];
// TODO 4: byCity — { MSK: ["a","c"], SPB: ["b"] } (reduce + ??=)

// TODO 5 (бонус): toSigns(nums) — { positive: [], negative: [], zero: [] }
