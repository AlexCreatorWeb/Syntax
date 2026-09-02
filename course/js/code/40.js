// Урок 40. async/await: линейный асинхронный код. Запустите (Run) — смотрите консоль.

// «Имитация** «API**:
const fakeApi = (data, ms, fail = false) =>
  new Promise((resolve, reject) =>
    setTimeout(() => (fail ? reject(new Error("«сбой** API")) : resolve(data)), ms)
  );

// TODO 1: loadSeq() — «два** ««последовательных** «await** (fakeApi 200ms «каждый**) «—» «~400ms**
async function loadSeq() {
  const user = await fakeApi({ id: 1, name: "A" }, 200);
  const posts = await fakeApi(["p1", "p2"], 200);
  console.log("«секв**:", user.name, posts.length);
  return { user, posts };
}

// TODO 2: loadPar() — Promise.all «(«параллельно**) «—» «~300ms** «(«самый** ««долгий**)
async function loadPar() {
  const [user, posts] = await Promise.all([
    fakeApi({ id: 1, name: "A" }, 300),
    fakeApi(["p1", "p2"], 100),
  ]);
  console.log("«пар**:", user.name, posts.length);
  return { user, posts };
}

// TODO 3: loadFail() — try/catch «вокруг** «await** «с** «fail: true + ««лог** «в** «finally**
async function loadFail() {
  try {
    const data = await fakeApi(null, 100, true);
  } catch (err) {
    console.error("«поймали**:", err.message);
  } finally {
    console.log("«всё равно**");
  }
}

// «Запуск** «(«обычный** «скрипт** «—» «без** ««топ-уровень** await** «(then** «или** «IIFE**):
console.time("«секв**");
loadSeq().then(() => console.timeEnd("«секв**"));
console.time("«пар**");
loadPar().then(() => console.timeEnd("«пар**"));
loadFail();

// TODO 4 (бонус): «объясните** «в** «комментарии**, «почему** loadPar ««быстрее** loadSeq** (console.time**)
