// Урок 11. Область видимости и TDZ. Запустите (Run) — смотрите консоль.

const globalVar = 1;

function demo() {
  const local = 2;
  if (true) {
    const blockOnly = 3;
    console.log("inside:", globalVar, local, blockOnly); // ???
  }
  // console.log(blockOnly); // TODO: раскомментируйте → ReferenceError
  return local;
}
console.log("demo():", demo());
// console.log(local); // TODO: раскомментируйте → ReferenceError

// var «всплывает»:
if (true) {
  var hoisted = "yes";
}
console.log("hoisted:", hoisted); // ??? (почему «видно»?)

// TDZ:
// console.log(early); // TODO: раскомментируйте → ReferenceError
let early = "late";
console.log("early:", early);

// for + let:
for (let i = 0; i < 3; i++) { /* ... */ }
// console.log(i); // TODO: раскомментируйте → ReferenceError

// TODO (демо hoisting + setTimeout):
// for (var j = 0; j < 3; j++) setTimeout(() => console.log("var j:", j), 100);
// for (let k = 0; k < 3; k++) setTimeout(() => console.log("let k:", k), 100);
// «Почему» «разные» «результаты»? (var — «одна» «переменная», let — «каждая» «итерация»)
