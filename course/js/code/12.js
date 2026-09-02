// Урок 12. Замыкания. Запустите (Run) — смотрите консоль.

// TODO 1: makeCounter(step) → { inc, dec, get, reset }.
//         «Два» «счётчика» (c1, c2) — «независимые». console.log(c1.get(), c2.get())

// «Фабрика» «демо»:
function makeLogger(prefix) {
  return (msg) => console.log(`[${prefix}] ${msg}`);
}
const logApi = makeLogger("API");
logApi("fetch users"); // [API] fetch users

// TODO 2: makeRange(from) → () => `${from}-${n}` (n «растёт»). range(10)() → "10-1"

// «Параметр» «в» «замыкании»:
const double = (x) => () => x * 2;
const double5 = double(5);
console.log(double5()); // 10

// «Внешняя» «меняет» — «вложенная» «видит»:
function demo() {
  let value = 1;
  const read = () => value;
  value = 99;
  return read;
}
console.log(demo()()); // 99 («ссылка», не «копия»)

// TODO 3: once(fn) — «вызывает» fn ОДИН раз, «дальше» — «кэшированный» результат
// TODO 4 (бонус): «объясните» в «комментарии» — «почему» demo()() «даёт» 99, «а не» 1
