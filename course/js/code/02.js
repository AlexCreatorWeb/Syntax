// Урок 2. Типы данных и typeof. Запустите (Run) — смотрите консоль.

const values = [42, 3.14, "hello", true, null, undefined, 10n, Symbol("id")];

// TODO 1: пройдитесь typeof по всем значениям (for...of + console.log(typeof v, v))

// Особые случаи:
console.log(typeof null);        // ??? (исторический баг)
console.log(typeof undefined);   // ???

const arr = [1, 2];
// TODO 2: выведите typeof arr и Array.isArray(arr) — почему два разных ответа?

// TODO 3: безопасная проверка несуществующей переменной:
// console.log(typeof maybeNotDefined === "undefined");
// console.log(maybeNotDefined);  // раскомментируйте → ReferenceError. Почему?
