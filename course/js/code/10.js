// Урок 10. Стрелочные функции. Запустите (Run) — смотрите консоль.

// «Формы»:
const square = (x) => x * x;
const one = x => x + 1;
const none = () => "ничего";
console.log(square(5), one(0), none()); // 25 1 "ничего"

// TODO 1: «перепишите» «в» «стрелки»:
// function add(a, b) { return a + b; }
// function greet(name) { return `Привет, ${name}`; }

// «Колбэки»:
const nums = [1, 2, 3, 4];
// TODO 2: nums.map(x => x * 2) + nums.filter(x => x > 2) — console.log «результаты»

// «Блок» «тела»:
const multi = (a, b) => {
  const product = a * b;
  return product + 1;
};
console.log(multi(3, 4)); // 13

// this: «ловушка»:
const obj = {
  value: 10,
  regular() { return this.value; },
  arrow: () => this.value,
};
console.log(obj.regular(), obj.arrow()); // 10 undefined (this «из» «окружения»)
// TODO 3: «объясните» «в» «комментарии», «почему» «разные»

// TODO 4: Calculator «объект» (add/sub/mul/div) — «выберите» «формы» «методов»
// TODO 5 (бонус): numToWord(n) — «таблица» {1:"один",2:"два",3:"три"} + ??
