// Урок 38. Event loop: синхронное и асинхронное. Запустите (Run) — смотрите консоль.

// TODO 1: «предскажите** «порядок** «(комментарии** «до** «запуска** «и** ««сверьте**:
console.log("1: «синхронный** «начало**");
setTimeout(() => console.log("5: «setTimeout** «(macro**"), 0);
console.log("2: «синхронный** «продолжение**");
Promise.resolve().then(() => console.log("4: «Promise** «(micro**"));
console.log("3: «синхронный** «конец**");
// «Ожидаемый** «вывод**: 1, 2, 3, 4, 5

// TODO 2: «добавьте** «setTimeout «200ms + «ещё** «Promise — ««пересчитайте** «порядок**

// «setTimeout** ««после** ««синхронного**:
console.log("«до** «setTimeout**");
setTimeout(() => console.log("«после** «setTimeout** «(100ms**"), 100);
console.log("«сразу** «после** «вызова**");
// «Вывод**: «до**, «сразу**, «после** «через** «100ms»

// TODO 3: «объясните** «в** «комментарии**, «почему** «Promise ««быстрее** «setTimeout(0**
// TODO 4 (бонус): sleep(ms) → Promise («через** «new Promise + «setTimeout «+** «resolve**
