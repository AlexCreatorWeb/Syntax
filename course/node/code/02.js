// Урок 2: Event Loop — порядок макротасок и микротасок
console.log("1: sync");
// TODO: допишите код, чтобы вывод был РОВНО в этом порядке:
//   1: sync → 3: promise.then → 4: queueMicrotask → 2b: после await → 5: setTimeout 0 → 6: setTimeout 50
// Подсказка: Promise.resolve().then(…), queueMicrotask(…), async function с await, два setTimeout
setTimeout(() => console.log("5: setTimeout 0 (макротаска)"), 0);
setTimeout(() => console.log("6: setTimeout 50"), 50);
