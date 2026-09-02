// Урок 4. Строки и template literals. Запустите (Run) — смотрите консоль.

const name = "Syntax";
const level = 3;

// TODO 1: «анкета» через template literals (имя, уровень, статус: level > 2 ? "профи" : "новичок")
console.log(`Привет, ${name}!`); // ← начните с простого

// Методы:
const s = "  JavaScript ES6  ";
console.log(s.trim().length);       // ???
console.log(s.slice(2, 12));        // ???
console.log("a,b,c".split(","));    // ???

// TODO 2: greet(name) — через template literals (name.toUpperCase())
// TODO 3: parseList("js, css, html") → ["js", "css", "html"] (split + trim)
// TODO 4: maskCard("4532 1234 5678 9012") → "•••• •••• •••• 9012" (slice(-4))
// TODO 5 (бонус): numberToWords(42) — ["ноль", "один", ..., "девятнадцать"] + ["", "", "двадцать", ...] + join(" ")
