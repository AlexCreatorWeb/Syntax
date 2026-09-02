// Урок 37. Таймеры, debounce, throttle. Запустите (Run) — смотрите консоль.

// setTimeout «с** ««отменой**:
const id = setTimeout(() => console.log("поздно"), 2000);
clearTimeout(id); // «не** «сработает**

// TODO 1: «счётчик** «setInterval «—» «остановка** «после** «3 тиков (clearInterval)
let ticks = 0;
const int = setInterval(() => {
  ticks++;
  console.log("тик", ticks);
  if (ticks >= 3) clearInterval(int);
}, 300);

// TODO 2: debounce(fn, ms) — «закрытие** «с** «clearTimeout «в** «каждом** «вызове**
function debounce(fn, ms) {
  let id;
  return (...args) => { clearTimeout(id); id = setTimeout(() => fn(...args), ms); };
}
const search = debounce((q) => console.log("поиск:", q), 500);
search("j"); search("js"); search("jss"); // «только** «"jss"**

// TODO 3: throttle(fn, ms) — Date.now() «(«прошло** «≥ ms** «→» «вызов**)
function throttle(fn, ms) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= ms) { last = now; fn(...args); }
  };
}
const onScroll = throttle(() => console.log("scroll"), 1000);
for (let i = 0; i < 10; i++) onScroll(); // «только** «первый**

// TODO 4 (бонус): «объясните** «когда** «debounce**, «когда** «throttle** (комментарии**
