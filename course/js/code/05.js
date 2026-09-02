// Урок 5. Булевы, null/undefined, truthy/falsy. Запустите (Run) — смотрите консоль.

// == vs ===:
console.log(5 === "5");          // ???
console.log(5 == "5");           // ???
console.log(null === undefined); // ???
console.log(null == undefined);  // ??? (единственный «уместный» ==)

// truthy/falsy:
const values = [false, 0, "", 0n, null, undefined, NaN, "0", [], {}, "hi", 42];
// TODO 1: for...of + console.log(Boolean(v), "←", v) — «прочитайте» таблицу

// ?? против ||:
console.log(0 || 10);  // ??? (почему 10?)
console.log(0 ?? 10);  // ??? (почему 0?)
console.log(null ?? "default"); // ???

// TODO 2: isFilled(value) — true, если НЕ (null/undefined/""/0). Проверьте: "hi", 0, null, "", 5
// TODO 3: safeDivide(a, b) — a / b, если b «валидный» (не 0, не null/undefined), иначе null
// TODO 4 (бонус): describe(x) — «пусто» / «ложь» / «истина» для 10 значений
