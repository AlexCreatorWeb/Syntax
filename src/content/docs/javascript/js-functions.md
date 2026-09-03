---
id: js-functions
track: javascript
type: guide
section: basics
order: 2
title:
  en: "Functions & Scope"
  ru: "Функции и область видимости"
excerpt:
  en: "Three ways to define a function, parameters and returns, how scope really works, and closures — the mechanism behind callbacks, memoization and private state."
  ru: "Три способа определить функцию, параметры и возвращаемые значения, как на самом деле работает область видимости, и замыкания — механизм за колбэками, мемоизацией и приватным состоянием."
version: "es2023"
updated: 2026-09-03
relatedTask: js-002
---

Functions are the basic unit of reuse in JavaScript: a named block of logic you can call as often as you like. This page covers the three definition styles, how parameters and return values work, the scope rules that decide which `x` is which `x`, and closures — the small mechanism that powers a huge amount of real code.

## Three ways to define a function

JavaScript gives you three styles for the same thing. They differ in syntax, in hoisting, and in one subtle detail — the value of `this`.

```js
// 1. Declaration — hoisted, callable before its definition line
function add(a, b) {
  return a + b;
}

// 2. Expression — a function value stored in a variable
const mul = function (a, b) {
  return a * b;
};

// 3. Arrow — short syntax, no own this
const sub = (a, b) => a - b;

add(2, 3);  // 5
mul(2, 3);  // 6
sub(5, 2);  // 3
```

Declarations are hoisted: the engine registers the whole function before any code runs, so you can call `add` above its definition. Expressions and arrows are values, so they behave like `const` — not usable before the line that creates them.

Which style to pick? Declarations for top-level and nested named functions — they are hoisted and read well. Arrows for callbacks and short inline logic. Expressions when you need a function as a first-class value without a name in scope, or when the body is long enough that the arrow form would get clumsy.

## Parameters: defaults, destructuring, rest

Parameters can have default values, be destructured on arrival, and be collected into a rest array. All three compose in a single signature, which is why modern function headers look the way they do.

```js
function connect(host = "localhost", port = 3000) {
  return host + ":" + port;
}
connect();           // "localhost:3000"
connect("0.0.0.0");  // "0.0.0.0:3000"

const makeUser = ({ name, role = "student" }, ...tags) => ({ name, role, tags });
makeUser({ name: "Ada" }, "admin", "mentor");
// { name: "Ada", role: "student", tags: ["admin", "mentor"] }
```

Defaults apply whenever the argument is `undefined` — including when you pass nothing at all. Watch the edge: `f(undefined)` triggers the default, but `f(null)` does not, because `null` is a real value. Passing `null` where a default is expected is a classic integration bug between a backend and the frontend.

The rest parameter `...args` is the opposite of spread: it packs all trailing arguments into a real array. There can be at most one rest parameter, and it must be last in the list.

## Return values

A function returns with `return` and stops executing at that point; without it, it falls off the end and returns `undefined`. Arrows add a shorthand: with a single expression and no braces, the value is returned automatically.

```js
const square = (x) => x * x; // implicit return
const describe = (x) => {
  return x > 0 ? "positive" : "non-positive";
};

square(4);      // 16
describe(-2);   // "non-positive"
const nothing = () => { console.log("side effect only"); };
console.log(nothing()); // undefined
```

> **WARNING**
> The arrow shorthand breaks the moment you add braces: `() => { x + 1 }` returns `undefined`, because the braces now open a block, not an object. This is the most common "my arrow function returns nothing" bug.

The same rule hides a second trap: an arrow with braces can return an object only with parentheses — `() => ({ ok: true })`. Without the parentheses, the braces are a block body, and the object expression inside is never returned.

## Scope: where names live

Every name resolves against the nearest enclosing declaration. JavaScript has three scope layers: global, function, and block — the `{ }` around `let`/`const` and around `for` loops. An inner declaration shadows the outer one for the rest of the block.

```js
const level = "global";
function check() {
  const level = "function";
  if (true) {
    const level = "block";
    console.log(level); // "block"
  }
  console.log(level); // "function"
}
check();
console.log(level); // "global"
```

Two more rules matter in practice. First, `function` declarations are hoisted within their scope, so calling before defining works. Second, `let` and `const` sit in a temporal dead zone from the top of their block until their declaration line — reading them early throws a ReferenceError, not a friendly `undefined`.

```js
show(); // "hello" — the declaration is hoisted
function show() { console.log("hello"); }

console.log(late); // ReferenceError: late is not initialized
const late = 1;
```

On the browser, the global scope is the `window` object: every global `var` and function becomes a property of it. Modern module code hides this away, but it explains why old scripts could "just use" a name defined in another file.

### Closures

A closure is a function that remembers the variables of the scope where it was created — even after that scope has finished executing. This is how JavaScript stores state without classes or globals.

```js
function makeCounter(start = 0) {
  let count = start;
  return {
    inc: () => ++count,
    value: () => count,
  };
}

const counter = makeCounter(10);
counter.inc();
counter.inc();
console.log(counter.value()); // 12 — count survived the outer call
```

Wrap a function together with its state in a closure and you get private variables for free: nothing outside can touch `count` directly, it can only change through `inc`. That is the entire mechanism behind the classic `once` task — a wrapper that executes the wrapped function only on the first call and replays the stored result afterwards.

```js
function once(fn) {
  let called = false;
  let result;
  return function (...args) {
    if (!called) {
      called = true;
      result = fn.apply(this, args);
    }
    return result;
  };
}

let n = 0;
const inc = once(() => ++n);
inc(); inc(); inc();
console.log(n); // 1 — fn ran exactly once
```

The pattern has a name — an IIFE, an immediately invoked function expression — when you combine it with an instant call: `(function (state) { /* private world */ })(initialState)`. Modules in the old days were built exactly this way, before `import`/`export` existed.

### The loop pitfall

Closures over loop variables trip up almost everyone once. With `var`, one variable is shared by every iteration, so every callback remembers the final value. With `let`, each iteration gets its own fresh copy of the variable — which is exactly the behavior you want when storing callbacks.

```js
const shared = [];
for (var i = 0; i < 3; i += 1) shared.push(() => i);
console.log(shared.map((f) => f())); // [3, 3, 3]

const fresh = [];
for (let j = 0; j < 3; j += 1) fresh.push(() => j);
console.log(fresh.map((f) => f()));  // [0, 1, 2]
```

If you ever have to live with `var`, the old workaround was to wrap each iteration in a function that receives the current value as a parameter — another closure. In 2026 the answer is simply: use `let`.

## Functions as values

Functions are first-class values: you can store them in variables, pass them as arguments, and return them from other functions. That is what makes callbacks, higher-order functions and the whole `Array.map` ecosystem possible.

```js
const predicates = {
  isEven: (n) => n % 2 === 0,
  isBig: (n) => n > 10,
};

const numbers = [1, 2, 3, 4, 11, 12];
const even = numbers.filter(predicates.isEven); // [2, 4, 12]
const big = numbers.filter(predicates.isBig);   // [11, 12]
```

Two names to know: a function that receives a function as an argument is a higher-order function, and the argument itself is the callback. `map`, `filter`, `sort`, `setTimeout` — all of them are higher-order, and you have been writing callbacks since the first array lesson.

## this: the context

`this` is a special variable whose value depends on how the function is called, not where it is defined. On a method call, `this` is the object before the dot: `obj.method()` runs `method` with `this` equal to `obj`.

```js
const player = {
  name: "Ada",
  announce() {
    console.log("playing:", this.name);
  },
};

player.announce();      // "playing: Ada" — this is player
const fn = player.announce;
fn();                   // "playing: undefined" — detached from the object
```

Arrows break the pattern on purpose: they have no own `this` and inherit it from the enclosing scope. That makes them perfect as method callbacks — the timer below still sees the object — and a silent trap when you expect `this` to be the receiver.

```js
const timer = {
  seconds: 0,
  start() {
    setInterval(() => {
      this.seconds += 1; // arrow: this is timer
    }, 1000);
  },
};
```

## Common mistakes

> **WARNING**
> Declaring a `const` with the same name as a function declaration in the same scope throws at parse time — do not reuse names across the two styles.

> **WARNING**
> Arrow functions do not have their own `this`. Perfect for callbacks; a trap the moment you detach a method or write an object literal full of arrows.

> **TIP**
> Before debugging "undefined was returned", check the four usual suspects: a missing `return`, braces on the arrow, a forgotten `await`, or a shadowed variable name.

That is the whole foundation of functions. The next guide moves to the data structures they manipulate.

<!-- RU -->

Функции — базовая единица переиспользования в JavaScript: именованный блок логики, который можно вызывать сколько угодно раз. На этой странице: три стиля объявления, параметры и возвращаемые значения, правила области видимости, которые решают, какой `x` есть какой `x`, и замыкания — небольшой механизм, на котором держится огромная часть реального кода.

## Три способа определить функцию

JavaScript даёт три стиля для одной и той же вещи. Они отличаются синтаксисом, hoisting-ом и одной тонкой деталью — значением `this`.

```js
// 1. Объявление — hoisted, вызывается до строки определения
function add(a, b) {
  return a + b;
}

// 2. Выражение — значение функции в переменной
const mul = function (a, b) {
  return a * b;
};

// 3. Стрелка — короткий синтаксис, без собственного this
const sub = (a, b) => a - b;

add(2, 3);  // 5
mul(2, 3);  // 6
sub(5, 2);  // 3
```

Объявления поднимаются (hoist): движок регистрирует всю функцию до выполнения кода, поэтому `add` можно вызвать выше своего определения. Выражения и стрелки — это значения, так что ведут себя как `const` — не доступны до строки, которая их создаёт.

Какой стиль выбрать? Объявления — для топ-уровневых и вложенных именованных функций: они hoisted и хорошо читаются. Стрелки — для колбэков и короткой инлайн-логики. Выражения — когда функция нужна как first-class значение без имени в области видимости, или когда тело длинное и стрелочная форма начинает спотыкаться.

## Параметры: дефолты, деструктуризация, rest

У параметров могут быть значения по умолчанию, их можно деструктурировать при входе и собрать в rest-массив. Все три приёма складываются в одной сигнатуре — поэтому современные заголовки функций выглядят так, как выглядят.

```js
function connect(host = "localhost", port = 3000) {
  return host + ":" + port;
}
connect();           // "localhost:3000"
connect("0.0.0.0");  // "0.0.0.0:3000"

const makeUser = ({ name, role = "student" }, ...tags) => ({ name, role, tags });
makeUser({ name: "Ada" }, "admin", "mentor");
// { name: "Ada", role: "student", tags: ["admin", "mentor"] }
```

Дефолты срабатывают, когда аргумент `undefined` — включая случай, когда ничего не передали. Смотри на край: `f(undefined)` включает дефолт, а `f(null)` — нет, потому что `null` — реальное значение. Передача `null` там, где ожидается дефолт, — классический интеграционный баг между бэкендом и фронтендом.

Rest-параметр `...args` — противоположность spread: упаковывает все хвостовые аргументы в настоящий массив. Rest-параметр может быть только один, и он обязан стоять последним.

## Возвращаемые значения

Функция возвращает значение через `return` и останавливается на этой строке; без него она доходит до конца и возвращает `undefined`. У стрелок есть сокращение: одно выражение без фигурных скобок возвращается автоматически.

```js
const square = (x) => x * x; // неявный return
const describe = (x) => {
  return x > 0 ? "positive" : "non-positive";
};

square(4);      // 16
describe(-2);   // "non-positive"
const nothing = () => { console.log("только side effect"); };
console.log(nothing()); // undefined
```

> **WARNING**
> Стрелочное сокращение ломается в момент, когда вы добавляете фигурные скобки: `() => { x + 1 }` вернёт `undefined`, потому что скобки теперь открывают блок, а не объект. Это самый частый баг «моя стрелочная функция ничего не возвращает».

То же правило прячет вторую ловушку: стрелка с фигурными скобами может вернуть объект только в круглых скобках — `() => ({ ok: true })`. Без них скобки — тело-блок, и выражение объекта внутри так и не вернётся.

## Область видимости: где живут имена

Каждое имя разрешается по ближайшему замыкающему объявлению. В JavaScript три слоя области видимости: глобальная, функционная и блочная — `{ }` вокруг `let`/`const` и вокруг циклов `for`. Внутреннее объявление затеняет внешнее до конца блока.

```js
const level = "global";
function check() {
  const level = "function";
  if (true) {
    const level = "block";
    console.log(level); // "block"
  }
  console.log(level); // "function"
}
check();
console.log(level); // "global"
```

Два правила ещё важны на практике. Первое: объявления функций поднимаются внутри своей области, поэтому вызов до определения работает. Второе: `let` и `const` сидят во временной мёртвой зоне (temporal dead zone) от начала блока до строки объявления — раннее чтение бросает ReferenceError, а не дружелюбное `undefined`.

```js
show(); // "hello" — объявление поднято
function show() { console.log("hello"); }

console.log(late); // ReferenceError: late is not initialized
const late = 1;
```

В браузере глобальная область — это объект `window`: каждая глобальная `var`-переменная и функция становятся его свойствами. Современный модульный код это прячет, но так объясняется, почему старые скрипты могли «просто использовать» имя, объявленное в другом файле.

### Замыкания

Замыкание (closure) — функция, которая помнит переменные области, где была создана, даже после того, как эта область завершила выполнение. Именно так JavaScript хранит состояние без классов и глобальных.

```js
function makeCounter(start = 0) {
  let count = start;
  return {
    inc: () => ++count,
    value: () => count,
  };
}

const counter = makeCounter(10);
counter.inc();
counter.inc();
console.log(counter.value()); // 12 — count пережила внешний вызов
```

Упакуйте функцию вместе с её состоянием в замыкание — и у вас бесплатно появятся приватные переменные: никто снаружи не тронет `count` напрямую, менять её можно только через `inc`. Это весь механизм классической задачи `once` — обёртка, которая вызывает упакованную функцию только при первом обращении и потом повторяет сохранённый результат.

```js
function once(fn) {
  let called = false;
  let result;
  return function (...args) {
    if (!called) {
      called = true;
      result = fn.apply(this, args);
    }
    return result;
  };
}

let n = 0;
const inc = once(() => ++n);
inc(); inc(); inc();
console.log(n); // 1 — fn выполнилась ровно один раз
```

У паттерна есть имя — IIFE, immediately invoked function expression, «немедленно вызываемое функциональное выражение», — когда замыкание совмещают с немедленным вызовом: `(function (state) { /* приватный мир */ })(initialState)`. Модули в старые времена строились ровно так, до появления `import`/`export`.

### Ловушка цикла

Замыкания над переменной цикла спотыкают почти всех один раз. С `var` одна переменная общая для всех итераций, и каждый колбэк помнит финальное значение. С `let` каждая итерация получает свою свежую копию переменной — ровно то поведение, которое нужно, когда вы храните колбэки.

```js
const shared = [];
for (var i = 0; i < 3; i += 1) shared.push(() => i);
console.log(shared.map((f) => f())); // [3, 3, 3]

const fresh = [];
for (let j = 0; j < 3; j += 1) fresh.push(() => j);
console.log(fresh.map((f) => f()));  // [0, 1, 2]
```

Если всё-таки пришлось жить с `var`, старый обходной путь — обернуть каждую итерацию в функцию, принимающую текущее значение как параметр: ещё одно замыкание. В 2026 году ответ прост: используйте `let`.

## Функции как значения

Функции — first-class значения: их можно хранить в переменных, передавать аргументами и возвращать из других функций. Именно это делает возможным колбэки, higher-order функции и весь экосистемный `Array.map`.

```js
const predicates = {
  isEven: (n) => n % 2 === 0,
  isBig: (n) => n > 10,
};

const numbers = [1, 2, 3, 4, 11, 12];
const even = numbers.filter(predicates.isEven); // [2, 4, 12]
const big = numbers.filter(predicates.isBig);   // [11, 12]
```

Два имени, которые нужно знать: функция, принимающая функцию как аргумент, — это higher-order функция, а сам аргумент — колбэк. `map`, `filter`, `sort`, `setTimeout` — все они higher-order, и вы пишете колбэки с первого урока про массивы.

## this: контекст

`this` — специальная переменная, значение которой зависит от того, как функцию вызвали, а не от того, где она определена. При вызове метода `this` — объект перед точкой: `obj.method()` запускает `method` с `this`, равным `obj`.

```js
const player = {
  name: "Ada",
  announce() {
    console.log("playing:", this.name);
  },
};

player.announce();      // "playing: Ada" — this есть player
const fn = player.announce;
fn();                   // "playing: undefined" — оторвано от объекта
```

Стрелки ломают паттерн намеренно: у них нет собственного `this`, они наследуют его из замыкающей области. Это делает их идеальными как колбэки методов — таймер ниже по-прежнему видит объект, — и тихой ловушкой, когда вы ждёте, что `this` будет получателем.

```js
const timer = {
  seconds: 0,
  start() {
    setInterval(() => {
      this.seconds += 1; // стрелка: this есть timer
    }, 1000);
  },
};
```

## Частые ошибки

> **WARNING**
> Объявление `const` с тем же именем, что у function-объявления в той же области, падает на этапе парсинга — не переиспользуйте имена между двумя стилями.

> **WARNING**
> У стрелочных функций нет собственного `this`. Идеально для колбэков; ловушка в момент, когда вы отрываете метод или пишете объект-литерал, полный стрелок.

> **TIP**
> Прежде чем отлаживать «вернули undefined», проверьте четырёх главных подозреваемых: пропущенный `return`, фигурные скобки на стрелке, забытый `await` или затенённое имя переменной.

Это весь фундамент функций. Следующий гайд переходит к структурам данных, которыми они манипулируют.
