// Урок 22. Объекты: свойства и методы. Запустите (Run) — смотрите консоль.

const user = {
  name: "A",
  "full name": "A B",
  age: 25,
  address: { city: "MSK", zip: "101000" },
  greet() { return `Привет, ${this.name}!`; },
};

console.log(user.name, user["full name"], user.address.city); // A "A B" MSK
console.log(user.greet()); // "Привет, A!"

// «Динамический** «ключ»:
const key = "age";
console.log(user[key]); // 25

// TODO 1: getProperty(obj, "address.city") → obj.address.city (split + bracket)
// TODO 2: update(user, "name", "B") → «новый** «объект** ({ ...user, name: "B" }) — «оригинал** «цел**
// TODO 3: user.count ??= 0; user.count++; console.log(user.count) // 1
// TODO 4 (бонус): const g = user.greet; g() — «почему** "undefined"? «Как** «исправить**
