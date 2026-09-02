// Урок 15. Чистые функции и побочные эффекты. Запустите (Run) — смотрите консоль.

// «Чистые» «демо»:
const sum = (a, b) => a + b;
const formatMoney = (k) => (k / 100).toFixed(2) + " ₽";
console.log(sum(2, 3), formatMoney(2588)); // 5 "25.88 ₽"

// «Нечистая» (глобальный stock):
let stock = 10;
const buy = (qty) => { stock -= qty; return stock; };
console.log(buy(3), buy(3)); // 7 4 («состояние» «накапливается»)

// «Чистая» «версия»:
const buyPure = (s, qty) => s - qty;
console.log(buyPure(10, 3), buyPure(10, 3)); // 7 7

// TODO 1: «разметьте** «все** «функции** «чистые/нечистые» (комментарии)
// TODO 2: calcCart(items) — «сумма** price × qty. items = [{price:1990,qty:1},{price:299,qty:2}]
// TODO 3: applyDiscount(items, pct) — «новый** «массив** «со** «скидкой» (map + spread, «без** «мутиации»)
// TODO 4: «объясните** в «комментариях», «почему** buy «нечистая», buyPure «чистая»
