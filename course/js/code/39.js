// Урок 39. Promise: then, catch, finally. Запустите (Run) — смотрите консоль.

// TODO 1: wait(ms) → Promise («setTimeout** «+** «resolve**
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// TODO 2: «цепочка**: wait(300).then(() => wait(200)).then(() => console.log("«готово** «через** «500ms"))

// «Ошибочная** «цепочка**:
function result(ok) {
  return new Promise((resolve, reject) =>
    setTimeout(() => (ok ? resolve("ок") : reject(new Error("сбой"))), 500)
  );
}
// TODO 3: result(false) → «поймать** «в** «catch** + ««лог** «в** «finally**
result(false)
  .then((v) => console.log("«не** ««вызовется**"))
  .catch((e) => console.error("«поймали**:", e.message))
  .finally(() => console.log("«всё равно**"));

// TODO 4: «сравните** «callback hell** «(урок** 14** «с** then-цепочкой** «для** «трёх** «шагов** «(комментарии**)
// TODO 5 (бонус): Promise.race([wait(300), wait(100)]) — ««какой** ««сработает** «первым** «и** «почему**
