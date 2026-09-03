---
id: js-modern
track: javascript
type: guide
section: modern
order: 6
title:
  en: "Modern ES2023"
  ru: "Современный JavaScript (ES2023)"
excerpt:
  en: "The syntax modern code is written with: destructuring, spread, template literals, optional chaining, nullish coalescing, and the ES2023 additions — toSorted, toReversed, toSpliced, Object.hasOwn and findLast."
  ru: "Синтаксис, которым пишется современный код: деструктуризация, spread, шаблонные строки, optional chaining, nullish coalescing и additions ES2023 — toSorted, toReversed, toSpliced, Object.hasOwn и findLast."
version: "es2023"
updated: 2026-09-03
relatedTask: js-006
---

JavaScript evolves in annual releases, and the current version — ES2023 — is what new code is written with. Old-style JavaScript still works everywhere, but the modern syntax is shorter, safer and easier to review. This page collects the working set: destructuring and spread, template literals, optional chaining and nullish coalescing, plus the newest ES2023 additions — non-mutating array methods, Object.hasOwn and findLast.

## Destructuring and spread

Destructuring unpacks arrays and objects into variables without a chain of dot accesses. It works in plain assignments, in function parameters and with return values, and the `...` rest element collects whatever was not named.

```js
const user = { name: "Ada", city: "London", role: { title: "Engineer" } };

// деструктуризация объекта: дефолты, переименование, rest
const { name, city = "Nowhere", role: job } = user;
console.log(name, city, job.title); // Ada London Engineer

const { name: _n, ...rest } = user; // rest собирает остаток
console.log(rest); // { city: "London", role: { title: "Engineer" } }

// деструктуризация массива и идиом смены местами
const [first, , third] = [10, 20, 30];
console.log(first, third); // 10 30
let a = 1, b = 2;
[a, b] = [b, a]; // swap без временной переменной
console.log(a, b); // 2 1
```

The `=` inside a pattern is a default and applies only when the source value is `undefined` — a `null` in the source keeps `null`. The `:` renames: the left side is the key in the source, the right side is the local variable. Nesting works the same way as in the object itself:

```js
const config = { theme: { mode: "dark", accent: "#0f0" } };
const { theme: { mode, accent = "#fff" } } = config;
console.log(mode, accent); // dark #0f0
```

> **TIP**
> Put defaults in the function signature, not in the body. `function greet({ name, city = "Syntax City" } = {})` documents the expected shape and replaces the whole options-or-empty-object ceremony in the body.

```js
function greet({ name, city = "Syntax City", mood = "great" } = {}) {
  return `Hi, ${name}! You are from ${city}. Mood: ${mood}.`;
}
greet({ name: "Ada" }); // Hi, Ada! You are from Syntax City. Mood: great.
```

Spread does the opposite: it unpacks a structure into a list of values or a list of keys. In an object literal it copies enumerable own properties — the standard way to make a shallow copy with overrides.

```js
const nums = [1, 2];
const more = [...nums, 3, 4]; // [1, 2, 3, 4]

const defaults = { theme: "dark", size: 14 };
const config = { ...defaults, size: 16 }; // { theme: "dark", size: 16 }
console.log(defaults.size); // 14 — оригинал не тронут
```

Array rest works in function parameters too, which is how you write "this function takes one or more items" without the legacy `arguments` object. The named parameters come first, and the rest parameter collects everything else — always as a real array, with `length` and all the methods.

```js
function summarize(label, ...items) {
  return `${label}: ${items.length} items, first is ${items[0] ?? "none"}`;
}
summarize("cart", "a", "b", "c"); // "cart: 3 items, first is a"
```

## Template literals and modern string methods

Backticks open a template literal: the text can span lines, and any expression goes inside `${...}`. For one-off concatenation `+` is fine, but the moment a message has two or more dynamic parts, the template literal wins on readability.

```js
const plan = "pro";
const features = ["login", "search"];
const msg = `Plan: ${plan.toUpperCase()}
features: ${features.join(", ")}`;
console.log(msg);
```

The modern string API closed the gaps the old one left. These are the methods you will reach for daily:

```js
"  hi  ".trimStart();          // "hi  "
"hi ".trimEnd();               // "hi"
"file.txt".startsWith("file"); // true
"file.txt".endsWith(".txt");   // true
"hello".includes("ell");       // true
"7".padStart(5, "0");          // "00007"
"ab".repeat(3);                // "ababab"
"1,2,3".replaceAll(",", "-");  // "1-2-3"
"abc".at(-1);                  // "c" — отрицательный индекс от конца
"abc".at(10);                  // undefined — без RangeError
```

Two differences matter in practice. `str.replace("a", "b")` swaps only the first occurrence when the pattern is a plain string; `replaceAll` replaces every match. And `at(-1)` is the safe successor of `str[str.length - 1]` — out of bounds gives `undefined` without any arithmetic and no off-by-one risk.

Two habits keep template literals clean. Interpolate values, not formatting: `Hi, ${name.toUpperCase()}` is fine, but building a whole sentence inside `${}` is where the expression gets harder to read than the concatenation it replaced. And remember the quoting: the backticks delimit the whole literal, so a string inside an expression still needs its own quotes — `${ "a" + "b" }`, not `${ "a" + b }` unless you know what you are doing.

## Optional chaining and nullish coalescing

Old defensive code is a pyramid of null checks: `if (user && user.profile && user.profile.email)`. Optional chaining collapses the pyramid: `?.` reads the property and returns `undefined` the moment the left side is `null` or `undefined`. It also works on method calls and array indices.

```js
const state = { user: { profile: null } };

state.user?.profile?.email; // undefined — нет TypeError
state.items?.[0];           // undefined, когда items отсутствует
state.format?.();           // undefined — вызов пропущен, без броска
```

`??` is the fallback operator old code missed: the right side is used only when the left side is `null` or `undefined`. That precision is exactly what `||` cannot give you.

```js
const readConfig = (key) => undefined; // представим, что читаем реальную конфигурацию
const port = readConfig("port") ?? 3000;      // 3000
const count = 0 ?? 5;                           // 0 — ноль это реальное значение
const level = readConfig("level") ?? "debug";   // "debug"
```

The two operators compose into a one-line default chain that used to need a paragraph of guards: `const email = state.user?.profile?.email ?? "no-email@example.com"`. Every `?.` can stop the read early, every `??` can replace the result — and the whole expression still fits on one line, with a name on every part.

> **WARNING**
> `||` and `??` solve different problems. `count || 5` replaces `0` with `5` — a bug when zero is a valid value. `count ?? 5` touches only `null` and `undefined`. And you cannot mix them in one expression without parentheses: `a ?? b || c` is a SyntaxError.

## ES2023: non-mutating arrays and Object.hasOwn

ES2023 gave the classic mutating array methods immutable twins: `toSorted`, `toReversed` and `toSpliced`. Each returns a new array and leaves the original untouched. In frameworks like React or Vue, where state must not be mutated in place, these are the right tools.

```js
const nums = [3, 1, 2];

nums.toSorted();      // [1, 2, 3]
nums.toReversed();    // [2, 1, 3]
nums.toSpliced(1, 1); // [3, 2] — убираем один элемент с индекса 1
console.log(nums);    // [3, 1, 2] — не тронут
```

The same release added `Object.hasOwn` — the built-in for the check that before required the `Object.prototype.hasOwnProperty.call(obj, key)` ceremony. That ceremony exists because an object with its own `hasOwnProperty` key would shadow the method and break the direct call; `hasOwn` sidesteps the trap entirely.

```js
const bag = Object.create(null); // вообще без прототипа
bag.owner = "Ada";

Object.hasOwn(bag, "owner");     // true — собственное свойство
Object.hasOwn(bag, "toString");  // false — не своё и не наследованное
Object.hasOwn({}, "toString");   // false — наследуется от Object.prototype
```

Also new in ES2023: `findLast` and `findLastIndex`, the backwards-going twins of `find` and `findIndex`.

```js
const events = ["login", "buy", "logout", "buy"];
events.findLast((e) => e === "buy");        // "buy" — последнее совпадение
events.findLastIndex((e) => e === "buy");   // 3
```

## Copying data: structuredClone

Shallow copies — spread, `Object.assign` — share nested objects, so a mutation of a nested field lands in both copies. `structuredClone` builds a deep copy of plain data: objects, arrays, dates, maps, sets, typed arrays — without a JSON round-trip and its losses (functions, `undefined`, dates). It is part of the web platform and available in Node 17+.

```js
const original = { user: "Ada", tags: ["a", "b"], nested: { x: 1 } };
const copy = structuredClone(original);

copy.tags.push("c");
copy.nested.x = 99;

console.log(original.tags);    // ["a", "b"] — не тронуто
console.log(original.nested);  // { x: 1 }
```

Where the older tools fail, structuredClone succeeds: it handles cycles (a structure that refers to itself), dates stay dates, and maps and sets keep their types. What it cannot clone is the exotic end — functions and DOM nodes throw a DataCloneError — so for those, JSON or a manual copy is still the answer.

> **TIP**
> In React or Vue state prefer the immutable pattern: build new arrays and objects with `toSorted`, `filter` and spread instead of mutating. `structuredClone` is for hand-offs — sending a complex object to a worker or into a cache where later edits must not reach the original.

## Everyday pattern: a report builder

Everything above composes into ordinary working code. This report builder is dense, but every token is one of the pieces from this page: destructuring with defaults, `??`, `?.`, `toSorted`, arrow functions.

```js
function buildReport(users, options) {
  const { since = 0, sort = true } = options ?? {};
  const active = users.filter((u) => (u.seenAt ?? 0) >= since);
  const ranked = sort
    ? active.toSorted((x, y) => (y.score ?? 0) - (x.score ?? 0))
    : active;
  return ranked.map((u) => ({
    name: u.name ?? "Anonymous",
    role: u.role?.title ?? "member",
    score: u.score ?? 0,
  }));
}

const users = [
  { name: "Ada", score: 12, seenAt: 9, role: { title: "admin" } },
  { score: 7, seenAt: 5 },
  { name: "Grace", seenAt: 1 },
];
console.log(buildReport(users, { since: 5 }));
// [
//   { name: "Ada", role: "admin", score: 12 },
//   { name: "Anonymous", role: "member", score: 7 }
// ]
```

The function never throws on sparse input: missing fields simply fall back to defaults. That is the style to imitate — modern syntax is not decoration, it is the reason the null-checks disappeared.

## Common mistakes

> **WARNING**
> Optional chaining cannot sit in the assignment target: `obj?.x = 1` is a SyntaxError, because if `obj` is `null` there is nothing to assign the property to. Read through `?.`, write through a guarded variable.

> **WARNING**
> The rest element in a destructure — `const { a, ...rest } = obj` — produces a copy of the remaining keys. Mutating `rest` does not change `obj`, and vice versa. It is a new object, not a view.

> **TIP**
> When a one-liner with `?.` and `??` starts needing a second read, split it: compute the intermediate value into a `const` with a name that says what it is. Readable beats clever in every code review.

<!-- RU -->

JavaScript развивается ежегодными релизами, и актуальная версия — ES2023 — та, которой пишется новый код. Старый стиль JavaScript работает везде, но современный синтаксис короче, безопаснее и легче читается при ревью. На этой странице — рабочий набор: деструктуризация и spread, шаблонные строки, optional chaining и nullish coalescing, а также самые свежие additions ES2023 — немутативные методы массивов, Object.hasOwn и findLast.

## Деструктуризация и spread

Деструктуризация распаковывает массивы и объекты в переменные без цепочки точек. Она работает в обычных назначениях, в параметрах функций и с возвращаемыми значениями, а rest-элемент `...` собирает всё, что не назвали.

```js
const user = { name: "Ada", city: "London", role: { title: "Engineer" } };

// деструктуризация объекта: дефолты, переименование, rest
const { name, city = "Nowhere", role: job } = user;
console.log(name, city, job.title); // Ada London Engineer

const { name: _n, ...rest } = user; // rest собирает остаток
console.log(rest); // { city: "London", role: { title: "Engineer" } }

// деструктуризация массива и идиом смены местами
const [first, , third] = [10, 20, 30];
console.log(first, third); // 10 30
let a = 1, b = 2;
[a, b] = [b, a]; // swap без временной переменной
console.log(a, b); // 2 1
```

`=` внутри паттерна — это дефолт, и он применяется только когда исходное значение `undefined` — `null` в источнике остаётся `null`. `:` переименовывает: левая часть — ключ в источнике, правая — локальная переменная. Вложенность работает так же, как в самом объекте:

```js
const config = { theme: { mode: "dark", accent: "#0f0" } };
const { theme: { mode, accent = "#fff" } } = config;
console.log(mode, accent); // dark #0f0
```

> **TIP**
> Дефолты ставьте в сигнатуре функции, а не в теле. `function greet({ name, city = "Syntax City" } = {})` документирует ожидаемую форму и заменяет всю церемонию «опции или пустой объект» в теле.

```js
function greet({ name, city = "Syntax City", mood = "great" } = {}) {
  return `Hi, ${name}! You are from ${city}. Mood: ${mood}.`;
}
greet({ name: "Ada" }); // Hi, Ada! You are from Syntax City. Mood: great.
```

Spread делает обратное: распаковывает структуру в список значений или в список ключей. В литерале объекта он копирует перечисляемые собственные свойства — стандартный способ сделать поверхностную копию с переопределениями.

```js
const nums = [1, 2];
const more = [...nums, 3, 4]; // [1, 2, 3, 4]

const defaults = { theme: "dark", size: 14 };
const config = { ...defaults, size: 16 }; // { theme: "dark", size: 16 }
console.log(defaults.size); // 14 — оригинал не тронут
```

Array rest тоже работает в параметрах функций — это способ написать «функция принимает один или больше элементов» без legacy-объекта `arguments`. Именованные параметры идут первыми, а rest-параметр собирает всё остальное — всегда как настоящий массив, со `length` и всеми методами.

```js
function summarize(label, ...items) {
  return `${label}: ${items.length} items, first is ${items[0] ?? "none"}`;
}
summarize("cart", "a", "b", "c"); // "cart: 3 items, first is a"
```

## Шаблонные строки и современные методы строк

Обратные кавычки открывают шаблонную строку: текст может занимать несколько строк, а внутрь `${...}` идёт любое выражение. Для одноразовой склейки `+` подходит, но как только в сообщении две и более динамические части, шаблонная строка выигрывает по читаемости.

```js
const plan = "pro";
const features = ["login", "search"];
const msg = `Plan: ${plan.toUpperCase()}
features: ${features.join(", ")}`;
console.log(msg);
```

Современный API строк закрыл пробелы, которые оставил старый. Это методы, к которым тянетесь ежедневно:

```js
"  hi  ".trimStart();          // "hi  "
"hi ".trimEnd();               // "hi"
"file.txt".startsWith("file"); // true
"file.txt".endsWith(".txt");   // true
"hello".includes("ell");       // true
"7".padStart(5, "0");          // "00007"
"ab".repeat(3);                // "ababab"
"1,2,3".replaceAll(",", "-");  // "1-2-3"
"abc".at(-1);                  // "c" — отрицательный индекс от конца
"abc".at(10);                  // undefined — без RangeError
```

Две разницы имеют практическое значение. `str.replace("a", "b")` меняет только первое вхождение, когда паттерн — обычная строка; `replaceAll` меняет все совпадения. А `at(-1)` — безопасный наследник `str[str.length - 1]`: выход за границы даёт `undefined` без арифметики и без риска off-by-one.

Две привычки держат шаблонные строки чистыми. Интерполируйте значения, а не форматирование: `Hi, ${name.toUpperCase()}` в порядке, а строительство целого предложения внутри `${}` — это место, где выражение становится труднее для чтения, чем та склейка, которую оно заменило. И помните о кавычках: обратные кавычки ограничивают весь литерал, поэтому строка внутри выражения по-прежнему нужна в своих кавычках — `${ "a" + "b" }`, а не `${ "a" + b }`, если не знаете, что делаете.

## Optional chaining и nullish coalescing

Старый защитный код — это пирамида null-проверок: `if (user && user.profile && user.profile.email)`. Optional chaining схлопывает пирамиду: `?.` читает свойство и возвращает `undefined`, как только левая часть оказывается `null` или `undefined`. Он работает и для вызовов методов, и для индексов массивов.

```js
const state = { user: { profile: null } };

state.user?.profile?.email; // undefined — нет TypeError
state.items?.[0];           // undefined, когда items отсутствует
state.format?.();           // undefined — вызов пропущен, без броска
```

`??` — оператор fallback, которого не хватало старому коду: правая часть используется только когда левая — `null` или `undefined`. Именно эту точность `||` дать не может.

```js
const readConfig = (key) => undefined; // представим, что читаем реальную конфигурацию
const port = readConfig("port") ?? 3000;      // 3000
const count = 0 ?? 5;                           // 0 — ноль это реальное значение
const level = readConfig("level") ?? "debug";   // "debug"
```

Два оператора складываются в однострочную цепочку дефолтов, для которой раньше нужен был абзац защит: `const email = state.user?.profile?.email ?? "no-email@example.com"`. Каждый `?.` может остановить чтение, каждый `??` может заменить результат — а всё выражение всё ещё умещается в одну строку, и у каждой части есть имя.

> **WARNING**
> `||` и `??` решают разные задачи. `count || 5` заменяет `0` на `5` — баг, когда ноль валидное значение. `count ?? 5` трогает только `null` и `undefined`. И смешивать их в одном выражении без скобок нельзя: `a ?? b || c` — это SyntaxError.

## ES2023: немутативные массивы и Object.hasOwn

ES2023 дал классическим мутирующим методам массивов неизменяемых близнецов: `toSorted`, `toReversed` и `toSpliced`. Каждый возвращает новый массив и не трогает оригинал. В фреймворках вроде React или Vue, где state нельзя мутировать на месте, это правильный инструмент.

```js
const nums = [3, 1, 2];

nums.toSorted();      // [1, 2, 3]
nums.toReversed();    // [2, 1, 3]
nums.toSpliced(1, 1); // [3, 2] — убираем один элемент с индекса 1
console.log(nums);    // [3, 1, 2] — не тронут
```

Тот же релиз добавил `Object.hasOwn` — встроенный вариант проверки, которая раньше требовала церемонии `Object.prototype.hasOwnProperty.call(obj, key)`. Церемония существует потому, что объект с собственным ключом `hasOwnProperty` затеняет метод и ломает прямой вызов; `hasOwn` обходит ловушку целиком.

```js
const bag = Object.create(null); // вообще без прототипа
bag.owner = "Ada";

Object.hasOwn(bag, "owner");     // true — собственное свойство
Object.hasOwn(bag, "toString");  // false — не своё и не наследованное
Object.hasOwn({}, "toString");   // false — наследуется от Object.prototype
```

Также новое в ES2023: `findLast` и `findLastIndex` — идущие с конца близнецы `find` и `findIndex`.

```js
const events = ["login", "buy", "logout", "buy"];
events.findLast((e) => e === "buy");        // "buy" — последнее совпадение
events.findLastIndex((e) => e === "buy");   // 3
```

## Копирование данных: structuredClone

Поверхностные копии — spread, `Object.assign` — разделяют вложенные объекты, поэтому мутация вложенного поля попадает в обе копии. `structuredClone` строит глубокую копию плоских данных: объекты, массивы, даты, map, set, typed arrays — без JSON-туда-обратно и его потерь (функции, `undefined`, даты). Это часть веб-платформы, доступно в Node 17+.

```js
const original = { user: "Ada", tags: ["a", "b"], nested: { x: 1 } };
const copy = structuredClone(original);

copy.tags.push("c");
copy.nested.x = 99;

console.log(original.tags);    // ["a", "b"] — не тронуто
console.log(original.nested);  // { x: 1 }
```

Там, где старые инструменты пасуют, structuredClone справляется: он переживает циклы (структуру, которая ссылается на себя), даты остаются датами, а map и set сохраняют свои типы. Что он склонировать не может, — это экзотика: функции и DOM-узлы бросают DataCloneError, и для них JSON или ручная копия по-прежнему в силе.

> **TIP**
> В state React или Vue предпочитайте неизменяемый паттерн: собирайте новые массивы и объекты через `toSorted`, `filter` и spread вместо мутаций. `structuredClone` — для передачи: сложному объекту в воркер или в кэш, где поздние правки не должны дойти до оригинала.

## Паттерн повседневности: сборщик отчёта

Всё вышеперечисленное складывается в обычный рабочий код. Этот сборщик отчёта плотный, но каждый токен — один из кирпичиков страницы: деструктуризация с дефолтами, `??`, `?.`, `toSorted`, стрелочные функции.

```js
function buildReport(users, options) {
  const { since = 0, sort = true } = options ?? {};
  const active = users.filter((u) => (u.seenAt ?? 0) >= since);
  const ranked = sort
    ? active.toSorted((x, y) => (y.score ?? 0) - (x.score ?? 0))
    : active;
  return ranked.map((u) => ({
    name: u.name ?? "Anonymous",
    role: u.role?.title ?? "member",
    score: u.score ?? 0,
  }));
}

const users = [
  { name: "Ada", score: 12, seenAt: 9, role: { title: "admin" } },
  { score: 7, seenAt: 5 },
  { name: "Grace", seenAt: 1 },
];
console.log(buildReport(users, { since: 5 }));
// [
//   { name: "Ada", role: "admin", score: 12 },
//   { name: "Anonymous", role: "member", score: 7 }
// ]
```

Функция никогда не падает на разреженном входе: отсутствующие поля просто откатываются к дефолтам. Именно этот стиль стоит воспроизводить — современный синтаксис не украшение, он причина того, что null-проверки исчезли.

## Частые ошибки

> **WARNING**
> Optional chaining нельзя ставить в цели назначения: `obj?.x = 1` — это SyntaxError, потому что если `obj` равен `null`, то присваивать свойство некуда. Читайте через `?.`, пишите через проверенную переменную.

> **WARNING**
> Rest-элемент в деструктуризации — `const { a, ...rest } = obj` — создаёт копию оставшихся ключей. Мутация `rest` не меняет `obj`, и наоборот. Это новый объект, а не представление.

> **TIP**
> Если однострочник с `?.` и `??` требует второго прочтения — разделите его: вынесите промежуточное значение в `const` с именем, которое говорит о нём. Читаемость бьёт хитроумность в любом ревью.
