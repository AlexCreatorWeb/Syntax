// Урок 28. try/catch/finally и throw. Запустите (Run) — смотрите консоль.

// TODO 1: «ловите** «ошибку**:
// try { console.log(unknownVar); } catch (err) { console.error(err.name, err.message); }

// finally:
function demo() {
  try {
    return 42;
  } finally {
    console.log("finally"); // «выведется** «перед** «return
  }
}
console.log(demo()); // ??? (порядок)

// TODO 2: safeDivide(a, b) — throw Error «при** b === 0, «иначе** a / b.
//         try { safeDivide(10, 0); } catch (e) { console.error(e.message); }

// TODO 3: safeParse(text) — JSON.parse «с** fallback (null «при** «битом** «JSON**)
//         console.log(safeParse('{"a":1}'), safeParse("«битый"))

// TODO 4 (бонус): «обработайте** «разные** «типы** (err instanceof TypeError «→** «один** «fallback**, «иначе** «—» «другой**)
