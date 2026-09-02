# Урок 26. Классы: class, constructor, наследование

## Цель
После урока студент сможет: написать «класс** «с** «конструктором** «и** «методами»; «использовать** «private** «поля** (#) «и** static; «наследовать** «класс** (extends, super); «понять**, «класс** — «синтаксис** «над** «прототипами».

## Теория
### class: «шаблон** «объектов**
```js
class User {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }
  greet() { return `Привет, ${this.name}`; }
  get isAdult() { return this.age >= 18; } // getter
  static createAnonymous() { return new User("anon", 0); }
}
const u = new User("A", 25);
console.log(u.greet(), u.isAdult); // "Привет, A" true
console.log(User.createAnonymous().name); // "anon"
```
**constructor** — «вызывается** «при** new (инициализация** «полей** через** this). **методы** — «в** «теле** «класса** (без** function). **static** — «метод** «класса** (не «инстанса**): User.createAnonymous() (без new). **get/set** — «вычисляемые** «свойства**: get isAdult() (вызов «как** «свойство** u.isAdult).

### «Поля** «и** «private** (#)
- «обычные** «поля** (ES2022): class User { name; age; constructor(n, a) { this.name = n; this.age = a; } } («объявление** «без** «значения** «в** «теле**);
- **«private** (#name) — «доступ** «только** «внутри** «класса**: #name «снаружи** «—» SyntaxError;
- **«#метод** — «private** «метод.

### Наследование: extends, super
```js
class Admin extends User {
  constructor(name, age, role = "admin") {
    super(name, age); // «вызвать** «конструктор** «родителя** («обязателен** «перед** this)
    this.role = role;
  }
  greet() { return super.greet() + ` (${this.role})`; } // «расширение** «метода** «родителя**
}
const a = new Admin("B", 30);
console.log(a.greet()); // "Привет, B (admin)"
console.log(a instanceof User); // true («и** User, «и** Admin)
```
**extends** — «дочерний** «класс** «наследует** «методы/поля** «родителя**. **super(...)** — «конструктор/метод** «родителя**. «Перед** «использованием** this «в** «дочернем** «конструкторе** — «обязателен** super(...). **instanceof** — «проверка** «на** «класс** («включая** «родителей**).

### «Классы** «—** «синтаксис** «над** «прототипами**
«Под** «капотом** «классы** — «функции** «с** «прототипами** (прототипная «цепочка**). «Практически**: «методы** «живут** «в** «prototype» (общие «на** «все** «инстансы** «— «экономия** «памяти**), «поля** «— «у** «каждого** «инстанса**. «Проверка**: "greet" in u → true («из** «прототипа**).

TIP: «классы** «—** «для** ««сущностей** «с** «поведением** (User, Cart, «модель** «документа**). «Для** ««группы** «функций** «вокруг** «данных** — «обычный** «объект** «с** «методами** (проще** «и** «достаточно**). «Не** «переводите** «всё** «в** «классы».

NOTE: «классы** «не** «всплывают** (let/const «—» «как** «объявление** «класса** «—» «hoisting «без** «инициализации**, «до** «строки** — TDZ). «Использовать** «класс** «до** «объявления** — ReferenceError.

## Пример
```js
class User {
  #active = true; // private
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }
  greet() { return `Привет, ${this.name}`; }
  get isAdult() { return this.age >= 18; }
  toggle() { this.#active = !this.#active; return this.#active; }
  static createAnonymous() { return new User("anon", 0); }
}

const u = new User("A", 25);
console.log(u.greet(), u.isAdult, u.toggle()); // "Привет, A" true false

class Admin extends User {
  constructor(name, age, role = "admin") {
    super(name, age);
    this.role = role;
  }
  greet() { return super.greet() + ` (${this.role})`; }
}
const a = new Admin("B", 30);
console.log(a.greet()); // "Привет, B (admin)"
console.log(a instanceof Admin, a instanceof User); // true true
```
Разбор: constructor — «инициализация**, # — «private**, extends/super — «наследование**, static — «метод** «класса**, get — «вычисляемое** «свойство**.

## Частые ошибки
WARN: «забыли** this «в** «конструкторе** (name = "A" «без** this) — «глобальная** «переменная** «(или** «ошибка** «в** «strict**); this.name = name.
WARN: «дочерний** «конструктор** «без** super(...) «до** this — ReferenceError («инициализация** «родителя** «обязательна»).
WARN: «вызов** «метода** «без** new (User() «вместо** new User()) — «обычная** «функция** (this «глобальный**); «классы** «—» «с** new.
WARN: «перезаписали** «метод** «родителя** «без** super «в** «конструкторе** — «поля** «родителя** «не** «инициализированы**; super(name, age) «всегда** «сначала**.
WARN: «полагаетесь** «на** «порядок** «полей** «в** «объекте** «(логика** «по** «ключам**) — «числовые** «ключи** «сортируются**, «остальные** «по** «вставке**; «порядок** «не** «гарантия**.

## Практическое задание
1. В скелете задания напишите «класс** Point { x, y } «с** «методом** distanceTo(other) (Math.hypot).
2. Напишите «класс** Circle extends Shape (периметр/площадь** «— «наследование** «+** «переопределение** «методов** «родителя**).
3. «Добавьте** #private** «поле** «в** «классе** (count) «и** «метод** «для** «изменения**.
4. Напишите static create() «в** «классе** (фабрика** «инстанса**).
5. Бонус: «объясните** «в** «комментарии**, «почему** «методы** «живут** «в** «prototype» («экономия** «памяти** «на** «инстансах»).
