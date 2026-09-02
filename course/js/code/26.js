// Урок 26. Классы: class, constructor, наследование. Запустите (Run) — смотрите консоль.

// TODO 1: class Point { constructor(x, y) { this.x = x; this.y = y; }
//         distanceTo(other) { return Math.hypot(this.x - other.x, this.y - other.y); } }
//         const p1 = new Point(0, 0); const p2 = new Point(3, 4);
//         console.log(p1.distanceTo(p2)) // 5

// «Демо» «класса**:
class User {
  #active = true;
  constructor(name, age) { this.name = name; this.age = age; }
  greet() { return `Привет, ${this.name}`; }
  get isAdult() { return this.age >= 18; }
  toggle() { this.#active = !this.#active; return this.#active; }
  static createAnonymous() { return new User("anon", 0); }
}
const u = new User("A", 25);
console.log(u.greet(), u.isAdult, u.toggle()); // "Привет, A" true false

// TODO 2: class Circle extends Shape (Shape: «базовый** «периметр**/площадь**; Circle: «переопределение**)
// TODO 3: #private** «поле** (count) + «метод** «изменения** (в «классе** User «или** «своём**)
// TODO 4: static create() — «фабрика** «инстанса**
// TODO 5 (бонус): «объясните** «почему** «методы** «в** «prototype» («экономия** «памяти**)
