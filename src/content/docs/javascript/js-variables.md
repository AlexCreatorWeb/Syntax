---
id: js-variables
track: javascript
type: guide
section: basics
order: 1
title:
  en: "Variables & Types"
  ru: "Переменные и типы данных"
excerpt:
  en: "How let, const and var really work, the seven primitive types, typeof quirks, and the coercion rules that explain most 'why is this NaN?' surprises."
  ru: "Как на самом деле работают let, const и var, семь примитивных типов, странности typeof и правила приведения, объясняющие большинство сюрпризов вида «почему это NaN?»"
version: "es2023"
updated: 2026-09-03
relatedTask: js-001
---

Every JavaScript program starts with variables: named bindings that hold values. This page covers the three declaration keywords — `const`, `let` and `var` — the seven primitive types, and the coercion rules that explain most of the "why is this NaN?" surprises you will see in the console.

## Declaring variables: const, let, var

Modern JavaScript code is written with two keywords: `const` by default and `let` when a value must be reassigned. `var` is the legacy option, kept only for backward compatibility with old libraries.

```js
const appName = "Syntax"; // the binding is fixed
let score = 0;            // this one will change
score += 10;
console.log(score); // 10

// const protects the binding, not the value
const user = { name: "Ada" };
user.name = "Grace"; // OK — the same object is being modified
user = {};           // TypeError: Assignment to constant variable
```

`const` protects the binding, not the value: reassigning `user` throws, but mutating the object it points at is perfectly fine. That distinction causes the first wave of surprises, so let it sink in early.

```js
for (var i = 0; i < 3; i += 1) { /* loop body */ }
console.log(typeof i); // "number" — i escaped the block

for (let j = 0; j < 3; j += 1) { /* loop body */ }
console.log(typeof j); // "undefined" — j belongs to the block
```

`var` hoists to the top of its function, is function-scoped, and can be redeclared without a warning. The loop above shows the practical damage: the loop variable escapes the block and stays visible. In modern code `var` is almost always a mistake — reach for `let` in loops and for counters, and keep `const` everywhere else.

There is a third, less visible difference: `let` and `const` sit in a temporal dead zone until their declaration line, while `var` is visible from the top of the function with the value `undefined`. Reading a `let` variable before its line throws a ReferenceError; reading a `var` variable before its line gives you `undefined` and quietly proceeds.

> **TIP**
> Start every declaration as `const`. Switch to `let` only when you actually need reassignment — the linter will point out the `let`s you do not.

## The seven primitive types

JavaScript has exactly seven primitives: `string`, `number`, `boolean`, `undefined`, `null`, `symbol` and `bigint`. Everything else you can build — arrays, objects, functions, dates — is an object under the hood.

```js
typeof "Syntax";        // "string"
typeof 42;              // "number"
typeof 3.14;            // "number" — one number type, no int/float split
typeof true;            // "boolean"
typeof missing;         // "undefined" — typeof never throws
typeof Symbol("id");    // "symbol"
typeof 9007199254740993n; // "bigint"
```

`undefined` is what a variable holds before initialization, what a function returns without `return`, and the value of a missing property. `null` is an intentional empty value that you assign yourself — "no value here, on purpose". Symbols are unique, mostly invisible labels used as property keys that must never collide; frameworks lean on them heavily. Bigints cover integers beyond the safe range and are written with the `n` suffix.

Numbers deserve a special note: there is a single number type, and it is a 64-bit float. That gives you `3.14` and `1e10` for free, but also the classic artifact `0.1 + 0.2 !== 0.3`. For money and other exact decimals, keep integer cents or use bigint — never raw floats.

In day-to-day code you will mostly meet five of the seven: string, number, boolean, undefined and null. Symbols and bigints appear in specific APIs — component keys, big counters — not in everyday logic.

### typeof and its quirks

`typeof` returns a string name and is the safest probe in the language — it never throws, even for variables that do not exist. But it has two famous wrong answers. `null` reports as `object` (a bug from the first edition that can never be fixed), and arrays report as `object` because arrays are objects.

```js
typeof null;  // "object" — historical accident
typeof [];    // "object" — an array is an object
typeof /ab/;  // "object" — so is a regex
```

That is why a precise type checker needs extra steps before falling back to `typeof`. The standard recipe: check `null` first, then `Array.isArray`, then hand the rest to `typeof`. The nuclear option — `Object.prototype.toString.call(value)` — returns `"[object Array]"` and distinguishes every built-in, but it is verbose and rarely worth it outside library code.

```js
function preciseType(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

preciseType(null);      // "null"
preciseType([1, 2]);    // "array"
preciseType({ a: 1 });  // "object"
preciseType(42);        // "number"
```

## Coercion: when types mix

Operators convert types silently, and that is where beginners lose the plot. Arithmetic operators turn strings into numbers, `+` concatenates when either side is a string, and loose equality `==` normalizes both operands before comparing them.

```js
"5" + 1;   // "51" — a string on either side means concatenation
"5" - 1;   // 4    — any other arithmetic coerces to number
null == 0; // false — null equals only undefined (and itself)
0 == "";   // true  — the loose-equality trap
0 === "";  // false — strict equality never coerces
```

Use `===` and `!==` by default — they compare values without conversion, which is what you want in almost every case. The one `==` idiom worth keeping: `value == null` is true for both `null` and `undefined`, which makes it a compact "is empty" check.

When you need an explicit conversion, use the right tool rather than an operator trick: `Number(x)` for a strict string-to-number conversion (it returns `NaN` for junk), `String(x)` for the reverse, `Boolean(x)` to force the truthiness decision, and unary `+x` in hot loops where the operator form is shorter.

### Truthy and falsy

Any value can be used as a condition, and the language decides "empty or not" with a fixed list. Exactly seven values are falsy: `false`, `0`, `-0`, `0n`, `""`, `null` and `undefined`. Everything else is truthy — including empty arrays, empty objects, and the string `"0"`.

```js
!false;      // true
!0;          // true
!"";         // true
!null;       // true
!undefined;  // true

!!"0";       // true — a non-empty string is always truthy
!![];        // true — even an empty array
!!{ a: 1 };  // true
```

The practical pattern is the guard: `if (!items.length) return;` — explicit, and it says exactly what you mean. Avoid bare `if (x)` for strings and arrays, because the truthiness of `"0"` and `[]` is the opposite of what the eye expects.

> **WARNING**
> `"0"` and `[]` look empty but are truthy. Check `str.length === 0` or `arr.length === 0` explicitly instead of relying on the value itself.

## A working example

Let's combine everything: a small profile builder that validates types before it trusts any input. The function never throws — garbage in, sensible defaults out — which is exactly how a type-checking boundary should behave.

```js
function makeProfile(rawName, age, isAdmin) {
  const name = typeof rawName === "string" && rawName.trim() ? rawName.trim() : "Anonymous";
  const years = typeof age === "number" && Number.isFinite(age) ? Math.floor(age) : 0;
  const admin = isAdmin === true;
  return { name, years, admin };
}

makeProfile("  Ada  ", 36.9, true);  // { name: "Ada", years: 36, admin: true }
makeProfile(null, "36", "yes");      // { name: "Anonymous", years: 0, admin: false }
console.log(typeof makeProfile(null, null, null)); // "object"
```

Strict checks up front — `typeof x === "number"`, `x === true` — cost nothing at runtime and remove an entire class of failures downstream, where the same bad value would surface as a confusing `NaN` or a missing property three functions later.

## Common mistakes

> **WARNING**
> `typeof undeclaredVariable` returns `"undefined"` instead of throwing — the throw happens when you read the variable directly. `typeof` is your safe probe.

> **WARNING**
> `const` with an object or array is not immutable: `user.name = "x"` works perfectly. For real immutability use `Object.freeze()`, and remember it is shallow.

> **TIP**
> When a value looks wrong in the console, log it twice: `console.log(value, typeof value)`. Half of the type bugs vanish the moment you see the actual type.

Next up in the basics: functions and scope, the next layer of the language.

<!-- RU -->

Каждая программа на JavaScript начинается с переменных — именованных связей, хранящих значения. На этой странице: три ключевых слова объявления — `const`, `let` и `var`, семь примитивных типов и правила приведения типов, которые объясняют большинство сюрпризов вида «почему это NaN?»

## Объявление переменных: const, let, var

Современный JavaScript пишется с двумя ключевыми словами: `const` по умолчанию и `let`, когда значение нужно менять. `var` — наследие из прошлого, оставленное только для совместимости со старыми библиотеками.

```js
const appName = "Syntax"; // связь зафиксирована
let score = 0;            // это значение будет меняться
score += 10;
console.log(score); // 10

// const защищает связь, а не значение
const user = { name: "Ada" };
user.name = "Grace"; // ок — меняется тот же объект
user = {};           // TypeError: Assignment to constant variable
```

`const` защищает связь, а не значение: переназначить `user` нельзя, но менять объект, на который он указывает, вполне можно. Это различие даёт первую волну сюрпризов, так что уясните его сразу.

```js
for (var i = 0; i < 3; i += 1) { /* тело цикла */ }
console.log(typeof i); // "number" — i вылез за пределы блока

for (let j = 0; j < 3; j += 1) { /* тело цикла */ }
console.log(typeof j); // "undefined" — j принадлежит блоку
```

`var` поднимается (hoist) наверх своей функции, живёт в области видимости функции и может быть объявлен повторно без предупреждения. Цикл выше показывает реальный урон: переменная цикла вылезает за блок и остаётся видимой. В современном коде `var` — почти всегда ошибка: в циклах и для счётчиков берите `let`, везде else — `const`.

Есть и третья, менее заметная разница: `let` и `const` находятся во временной мёртвой зоне (temporal dead zone) до своей строки объявления, а `var` виден с начала функции со значением `undefined`. Чтение `let`-переменной до её строки бросает ReferenceError; чтение `var`-переменной до её строки молча даёт `undefined` и идёт дальше.

> **TIP**
> Начинайте каждое объявление с `const`. Переключайтесь на `let` только когда реально нужно переназначение — линтер сам укажет лишние `let`.

## Семь примитивных типов

В JavaScript ровно семь примитивов: `string`, `number`, `boolean`, `undefined`, `null`, `symbol` и `bigint`. Всё остальное, что можно построить — массивы, объекты, функции, даты, — под капотом это объекты.

```js
typeof "Syntax";        // "string"
typeof 42;              // "number"
typeof 3.14;            // "number" — один числовой тип, без разделения int/float
typeof true;            // "boolean"
typeof missing;         // "undefined" — typeof никогда не падает
typeof Symbol("id");    // "symbol"
typeof 9007199254740993n; // "bigint"
```

`undefined` — то, что хранит переменная до инициализации, что возвращает функция без `return` и значение отсутствующего свойства. `null` — намеренно пустое значение, которое вы назначаете сами: «значения здесь нет, специально». Символы — уникальные, почти невидимые метки для ключей свойств, которые не должны сталкиваться; фреймворки активно на них опираются. BigInt накрывает целые числа за пределами безопасного диапазона и пишется с суффиксом `n`.

Числам — особое внимание: числовой тип всего один, и это 64-битный float. Это даёт `3.14` и `1e10` бесплатно, но и классический артефакт `0.1 + 0.2 !== 0.3`. Для денег и других точных дробей храните целые копейки или используйте bigint — никогда не «сырые» float.

В повседневном коде вы встретите в основном пять из семи: string, number, boolean, undefined и null. Символы и bigint появляются в специфичных API — ключи компонентов, большие счётчики — а не в обычной логике.

### typeof и его странности

`typeof` возвращает имя типа строкой — это самый безопасный зонд в языке: он никогда не падает, даже для несуществующих переменных. Но у него два знаменитых неверных ответа. `null` сообщает `object` (баг первого издания, который нельзя исправить никогда), а массивы тоже сообщают `object`, потому что массивы — это объекты.

```js
typeof null;  // "object" — исторический случай
typeof [];    // "object" — массив это объект
typeof /ab/;  // "object" — как и regex
```

Поэтому точный тип-чекер нуждается в дополнительных шагах перед fallback на `typeof`. Стандартный рецепт: сначала проверка `null`, потом `Array.isArray`, остальное — `typeof`. Вариант «с большой дробью» — `Object.prototype.toString.call(value)` — возвращает `"[object Array]"` и различает все встроенные типы, но это глаголом и почти никогда не оправдано вне библиотечного кода.

```js
function preciseType(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

preciseType(null);      // "null"
preciseType([1, 2]);    // "array"
preciseType({ a: 1 });  // "object"
preciseType(42);        // "number"
```

## Приведение типов: когда типы смешиваются

Операторы молча конвертируют типы — именно на этом новички теряют нить. Арифметические операторы превращают строки в числа, `+` склеивает, если хотя бы одна сторона — строка, а нестрогое сравнение `==` приводит оба операнда к одному виду перед сравнением.

```js
"5" + 1;   // "51" — строка с любой стороны означает склейку
"5" - 1;   // 4    — любая другая арифметика приводит к числу
null == 0; // false — null равен только undefined (и самому себе)
0 == "";   // true  — ловушка нестрогого равенства
0 === "";  // false — строгое равенство никогда не приводит
```

По умолчанию используйте `===` и `!==` — они сравнивают значения без преобразований, а это то, что нужно почти всегда. Один идиом `==` стоит оставить: `value == null` истинно и для `null`, и для `undefined` — компактная проверка «пусто или нет».

Когда нужна явная конвертация, используйте правильный инструмент, а не трюк с операторами: `Number(x)` для строгого перевода строки в число (для мусора вернёт `NaN`), `String(x)` для обратного, `Boolean(x)`, чтобы принудительно решить вопрос truthiness, и унарный `+x` в горячих циклах, где операторная форма короче.

### Truthy и falsy

В качестве условия работает любое значение, а решение «пусто или нет» язык принимает по фиксированному списку. Ровно семь значений falsy: `false`, `0`, `-0`, `0n`, `""`, `null` и `undefined`. Всё остальное — truthy, включая пустой массив, пустой объект и строку `"0"`.

```js
!false;      // true
!0;          // true
!"";         // true
!null;       // true
!undefined;  // true

!!"0";       // true — непустая строка всегда truthy
!![];        // true — даже пустой массив
!!{ a: 1 };  // true
```

Практичный паттерн — защита: `if (!items.length) return;` — явно и точно говорит о смысле. Избегайте голого `if (x)` для строк и массивов: truthiness строк `"0"` и `[]` — противоположность того, что ожидает глаз.

> **WARNING**
> `"0"` и `[]` выглядят пусто, но они truthy. Проверяйте явно `str.length === 0` или `arr.length === 0`, а не полагайтесь на само значение.

## Практический пример

Соберём всё вместе: небольшой конструктор профиля, который проверяет типы, прежде чем доверять входу. Функция никогда не падает — мусор на входе, осмысленные дефолты на выходе, — ровно так должна вести себя граница проверки типов.

```js
function makeProfile(rawName, age, isAdmin) {
  const name = typeof rawName === "string" && rawName.trim() ? rawName.trim() : "Anonymous";
  const years = typeof age === "number" && Number.isFinite(age) ? Math.floor(age) : 0;
  const admin = isAdmin === true;
  return { name, years, admin };
}

makeProfile("  Ada  ", 36.9, true);  // { name: "Ada", years: 36, admin: true }
makeProfile(null, "36", "yes");      // { name: "Anonymous", years: 0, admin: false }
console.log(typeof makeProfile(null, null, null)); // "object"
```

Строгая проверка в начале — `typeof x === "number"`, `x === true` — ничего не стоит в рантайме и убирает целый класс сбоев ниже по цепочке, где то же плохое значение вылезло бы как запутанный `NaN` или отсутствующее свойство тремя функциями позже.

## Частые ошибки

> **WARNING**
> `typeof undeclaredVariable` возвращает `"undefined"`, а не падает — падение происходит, когда вы читаете переменную напрямую. `typeof` — ваш безопасный зонд.

> **WARNING**
> `const` с объектом или массивом не делает их неизменяемыми: `user.name = "x"` работает идеально. Для настоящей неизменяемости используйте `Object.freeze()` — и помните, что она поверхностная.

> **TIP**
> Если значение в консоли выглядит неверно, логируйте дважды: `console.log(value, typeof value)`. Половина багов типов исчезает, как только вы видите реальный тип.

Дальше в основах: функции и область видимости — следующий слой языка.
