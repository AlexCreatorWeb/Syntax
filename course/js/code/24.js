// Урок 24. keys, values, entries, assign, hasOwn. Запустите (Run) — смотрите консоль.

const user = { name: "A", age: 25, city: "MSK" };

// TODO 1: console.log(Object.keys(user), Object.values(user), Object.entries(user))
// TODO 2: sumValues(obj) — «сумма** «числовых** «значений** (values + filter + reduce)
// TODO 3: invert({ a: 1, b: 2 }) → { 1: "a", 2: "b" } (entries + fromEntries)

// «Объединение**:
const a = { x: 1, y: 2 };
const b = { y: 99, z: 3 };
console.log({ ...a, ...b }); // { x: 1, y: 99, z: 3 }

// «Проверка**:
console.log(Object.hasOwn(user, "name"));      // true
console.log(Object.hasOwn(user, "toString"));  // false («из** «прототипа»)

// TODO 4: pick(obj, ["name", "city"]) → «новый** «объект** «с** «этими** «ключами»
// TODO 5 (бонус): items → byId (fromEntries) — «объясните** «почему** «быстрее** «find
