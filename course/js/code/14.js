// Урок 14. Колбэки: функция как значение. Запустите (Run) — смотрите консоль.

// «Синхронный» «колбэк»:
const users = ["A", "B", "C"];
users.forEach((name) => console.log("user:", name));
console.log(users.map((n) => n + "!")); // ["A!", "B!", "C!"]

// «Асинхронный» «колбэк»:
console.log("до");
setTimeout(() => console.log("через 300мс"), 300);
console.log("после"); // «порядок» — урок 38

// TODO 1: safeDivide(a, b, callback) — callback(ok, result).
//         safeDivide(10, 2, (ok, r) => console.log(ok, r))  // true 5
//         safeDivide(10, 0, (ok, r) => console.log(ok, r))  // null null

// TODO 2: repeat(action, times, done) — action times «раз», «потом» done()
//         repeat(() => console.log("tick"), 3, () => console.log("done"))

// TODO 3: «цепочка» fetchUsers → fetchPosts → render («нарисуйте** «пирамиду», «объясните», «что» «не так»)

// TODO 4 (бонус): «объясните» в «комментариях», «почему** «после** «до** «через 300мс»
