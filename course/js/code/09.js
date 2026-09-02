// Урок 9. Функции: параметры и return. Запустите (Run) — смотрите консоль.

// «Декларация» «и» expression:
function add(a, b) { return a + b; }
const mul = function (a, b) { return a * b; };
console.log(add(2, 3), mul(2, 3)); // 5 6

// TODO 1: power(base, exp) — «степень» «циклом» (без **). console.log(power(2, 10)) // 1024

// «Ранний» return «демо»:
function divide(a, b) {
  if (b === 0) return null;
  return a / b;
}
console.log(divide(10, 2), divide(10, 0)); // 5 null

// TODO 2: absDiff(a, b) — |a - b| (ранний return «для» a >= b)
// TODO 3: analyze(arr) — { min, max, sum } (циклом, «без» Math.min/max)
// TODO 4: clamp(x, min, max) — x «в» [min, max] («ранние» return). clamp(15, 0, 10) → 10

// «Вызов» vs «ссылка»:
const double = (x) => x * 2;
console.log(typeof double);     // "function" («ссылка»)
console.log(double(21));        // 42 («результат»)
// TODO 5 (бонус): format(1234567, { decimals: 2 }) → "1 234 567.00"
