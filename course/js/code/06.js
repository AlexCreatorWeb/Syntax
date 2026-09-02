// Урок 6. Преобразование типов. Запустите (Run) — смотрите консоль.

// Неявные:
console.log(5 + "5");     // ??? (+ конкатенация?)
console.log("5" - 1);     // ??? (- только number?)
console.log(-"5");        // ???
console.log(!!"hi", !!"" ); // ???

// Явные:
console.log(Number(""));       // ??? (пустая строка!)
console.log(Number("5px"));    // ???
console.log(String(null));     // ??? ("null" или "undefined"?)
console.log(parseInt("42px")); // ???

// «Эксперименты» (попробуйте угадать ДО запуска):
console.log("5" + 5 + 5);   // ???
console.log(5 + 5 + "5");   // ???
console.log([] + []);       // ???

// TODO 1: toNumber(s) — Number(s), если не NaN, иначе 0. Проверьте: "5", "5px", "", "hi"
// TODO 2: concat(a, b) — «числовое» сложение, если оба «числовые», иначе строковая конкатенация
// TODO 3: euroToNumber("12,34") → 12.34 (replace + Number)
// TODO 4 (бонус): isNumeric(s) — true, если Number(s) «не NaN» и s.trim() «не пустая»
