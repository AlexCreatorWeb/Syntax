// Урок 3. Числа и Math. Запустите (Run) — смотрите консоль.

// NaN:
console.log(0 / 0);                  // ???
console.log(NaN === NaN);            // ??? (знаменитое)
// TODO 1: выведите Number.isNaN(NaN) и Number.isFinite(1 / 0)

// Float:
console.log(0.1 + 0.2);              // ???
console.log(0.1 + 0.2 === 0.3);      // ???
// TODO 2: сравните через epsilon: Math.abs((0.1 + 0.2) - 0.3) < 1e-9

// Округления:
console.log(Math.round(2.5), Math.round(-2.5)); // ??? (второй «сюрприз»)
console.log((4.5).toFixed(2));       // ??? (тип результата?)
console.log((19.9 * 3).toFixed(2));  // «показываем» честно — но храните в копейках

// TODO 3: напишите isRealNumber(x) — true только для «конечных» чисел (Number.isFinite)
//         и проверьте: 5, NaN, Infinity, "5", null
// TODO 4: money(kopecks): 123456 → "1 234.56" (toFixed + пробелы через replace(/\B(?=(\d{3})+(?!\d))/g, " "))

const temps = [3, 17, -4, 25];
// TODO 5: выведите Math.min(...temps) и Math.max(...temps)
