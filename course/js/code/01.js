// Урок 1. Переменные: let, const и var.
// Запустите файл (Run) — смотрите консоль.

const name = "Syntax";
let level = 1;

level = 2; // let: можно переназначить

// TODO 1: раскомментируйте строку ниже и посмотрите TypeError
// name = "Other";

if (level > 1) {
  const passed = true; // const живёт в этом блоке
  console.log("level:", level, "| passed:", passed);
}

// TODO 2: раскомментируйте — ReferenceError (passed «не виден» снаружи)
// console.log(passed);

let total = 10;
for (let i = 1; i <= 3; i++) {
  total += i;
}
console.log("total:", total);

// TODO 3: раскомментируйте — ReferenceError (i «не утёк» из for...let)
// console.log(i);

// TODO 4: замените let i на var i в цикле выше — и console.log(i) заговорит.
//         Верните let и объясните в комментарии разницу.
