// Урок 25. this и связывание. Запустите (Run) — смотрите консоль.

const obj = {
  value: 1,
  method() { return this.value; },
  arrow: () => this.value,
};

console.log(obj.method()); // ??? (this = obj)
console.log(obj.arrow());  // ??? (this «из** «окружения)

const f = obj.method;
console.log(f());          // ??? (this «потерян**)
console.log(f.call(obj));  // ??? (call)

const bound = obj.method.bind(obj);
console.log(bound()); // ??? (bind)

// TODO 1: «объект** Timer { start() } «с** setTimeout — «выберите** «синтаксис** «для** this (стрелка/bind)
// TODO 2: «исправьте** const g = obj.method; g() → «правильный** this
// TODO 3: fn.bind(null, 10) — «объясните** «что** «закреплено** (this, «аргументы)
// TODO 4 (бонус): «объясните** «почему** «в** «модулях** «топ-уровневый** this — undefined
