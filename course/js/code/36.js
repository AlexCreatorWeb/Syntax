// Урок 36. localStorage: сохранение данных. Запустите (Run) — смотрите консоль.

const KEY = "app.counter";

// TODO 1: save(n) — try/catch + setItem(KEY, String(n))
// TODO 2: load() — getItem(KEY) → «если** null** «→» 0, «иначе** Number(v)
function save(n) {
  try { localStorage.setItem(KEY, String(n)); } catch { console.warn("квота"); }
}
function load() {
  const v = localStorage.getItem(KEY);
  return v === null ? 0 : Number(v);
}

let count = load();
console.log("старт:", count); // 0 («первый** «запуск**)
count++;
save(count);
console.log("после**: ", count); // 1
// «перезагрузите** «страницу** (F5) — «старт** «будет** 1

// TODO 3: «объект** «настройки** { theme: "dark", size: 16 } «с** «JSON + ««фолбэком**
// TODO 4: «обойдите** localStorage (length + key(i)) — «выведите** «все** «ключи** «и** «значения**
// TODO 5 (бонус): «объясните** localStorage «vs** sessionStorage «(где** «что** «сбрасывается**)
