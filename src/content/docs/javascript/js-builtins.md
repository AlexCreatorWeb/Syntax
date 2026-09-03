---
id: js-builtins
track: javascript
type: reference
section: reference
order: 2
title:
  en: "Built-in Objects"
  ru: "Встроенные объекты"
excerpt:
  en: "The standard objects every JavaScript environment ships with — Object, Array, String, Number, Math, JSON, Date, RegExp, Map, Set, Promise — plus the global functions, in compact tables."
  ru: "Стандартные объекты, которые есть в любом JavaScript-окружении — Object, Array, String, Number, Math, JSON, Date, RegExp, Map, Set, Promise — плюс глобальные функции, в компактных таблицах."
version: "es2023"
updated: 2026-09-03
relatedTask: js-001
---

The standard objects that come with every JavaScript environment, plus the global functions around them. The format is table-driven: method, what it does, when to reach for it. This page is a lookup sheet — keep it open while you write and stop googling the same questions.

## Object

| Method | What it does |
| --- | --- |
| Object.keys(obj) | array of own enumerable string keys |
| Object.values(obj) | array of own values, in the same order |
| Object.entries(obj) | pairs of key and value — for for…of and map |
| Object.assign(target, …sources) | shallow copy of own enumerable properties |
| Object.fromEntries(pairs) | the inverse of entries |
| Object.freeze(obj) | shallow immutability: no adding or removing keys |
| Object.is(a, b) | strict compare that also handles NaN and 0 / -0 |
| Object.hasOwn(obj, key) | ES2023: true for own keys, false for inherited |
| Object.create(proto) | a new object with the given prototype |
| Object.getOwnPropertyNames(obj) | all own keys, even non-enumerable |

```js
const user = { name: "Ada", age: 36 };
Object.keys(user);        // ["name", "age"]
Object.values(user);      // ["Ada", 36]
Object.entries(user);     // [["name", "Ada"], ["age", 36]]

const merged = Object.assign({}, { a: 1 }, { b: 2 }); // { a: 1, b: 2 }
Object.fromEntries([["x", 1], ["y", 2]]);             // { x: 1, y: 2 }
```

Key order is predictable: integer-like keys first (ascending), then the rest in insertion order. The type-checking corner of Object deserves special attention, because `typeof` has two famous wrong answers:

```js
typeof [];                 // "object" — знаменитый неверный ответ
Array.isArray([1]);         // true — правильный инструмент для массивов
Object.prototype.toString.call(new Date()); // "[object Date]" — точная метка
```

`Array.isArray` is the fast, readable check for arrays; `Object.prototype.toString.call` gives the precise internal label for every built-in and is the tool for a precise type checker — the nuclear option when `typeof` is not enough.

## Array

| Method | What it does | Mutates? |
| --- | --- | --- |
| push / pop | add or remove at the end | yes |
| shift / unshift | remove or add at the beginning | yes |
| slice(start, end) | a copy of a part | no |
| splice(start, n) | remove n items, return them | yes |
| concat | a new joined array | no |
| join(sep) / split | array to string and back | no |
| indexOf / lastIndexOf / includes | search by value | no |
| find / findIndex | first item matching a condition | no |
| findLast / findLastIndex | ES2023, from the end | no |
| map / filter / reduce | the transform trio | no |
| sort(cmp) | in-place sort; default is lexicographic | yes |
| reverse | in-place reversal | yes |
| toSorted / toReversed / toSpliced | ES2023, immutable versions | no |
| flat(depth) / flatMap | flatten nesting | no |
| entries / keys / values | iterators | no |
| at(i) | index, negative counts from the end | no |
| length | a property, not a function | — |

```js
const a = [1, 2, 3];
a.push(4);        // 4 — возвращает новую длину, a = [1, 2, 3, 4]
a.slice(1, 3);    // [2, 3] — копия
a.splice(0, 1);   // [1] — удалено, a теперь [2, 3, 4]
a.toSorted((x, y) => x - y); // отсортированная копия, a не тронут
```

The methods split into two families, and confusing them is the classic beginner bug. The mutating family — push, pop, shift, unshift, splice, sort, reverse — changes the array in place, and most of them return something other than the array (push returns the new length). The non-mutating family — slice, concat, map, filter, reduce, flat, toSorted — always hands you a new array and leaves the input alone.

> **WARNING**
> `sort()` without a comparator sorts by string code units: `[10, 9, 2].sort()` gives `[10, 2, 9]`, and `["10", "9"].sort()` gives `["10", "9"]`. Numbers need an explicit comparator: `arr.sort((a, b) => a - b)`.

## String

Strings are immutable: every method returns a new string, nothing is ever changed in place.

| Method | What it does |
| --- | --- |
| charAt / at / charCodeAt | the character (or code) at an index; `at` allows negative |
| slice / substring / substr | a part of the string; substr is legacy |
| indexOf / lastIndexOf / includes | search by a substring |
| startsWith / endsWith | prefix and suffix checks |
| split(sep) | the string as an array |
| trim / trimStart / trimEnd | strip whitespace |
| toUpperCase / toLowerCase | case conversion |
| repeat(n) | repeat the string n times |
| padStart / padEnd(len, fill) | pad to a length |
| replace / replaceAll | pattern replacement; replaceAll needs every match |
| match / matchAll / search | regex search |

```js
"Hello, world".split(", ");         // ["Hello", "world"]
"a b, c".trim().split(/\s*,\s*/);   // ["a b", "c"]
"price: 7".replace("7", "10");      // "price: 10" — только первое
"1,2,3".replaceAll(",", ";");       // "1;2;3"
"abc".at(-1);                       // "c"
```

## Number, Math, and type checks

| API | What it does |
| --- | --- |
| Number.isInteger / isFinite / isNaN / isSafeInteger | type checks without coercion |
| Number.MAX_SAFE_INTEGER / MIN_SAFE_INTEGER | the bounds of 2 to the 53 minus 1 |
| Number.EPSILON | the distance between 1 and the next representable number |
| toFixed / toPrecision / toExponential | formatting a number as a string |
| Math.floor / ceil / round / trunc | rounding in four directions |
| Math.abs / sign | absolute value, sign |
| Math.max / Math.min | with any number of arguments |
| Math.random / sqrt / hypot / pow | random number and the usual functions |

```js
Number.isNaN(Number("abc"));   // true
isNaN("abc");                  // тоже true — глобальный isNaN приводит, не используйте
Number.isSafeInteger(2 ** 53); // false
1.005.toFixed(2);              // "1.00" — артефакт float, а не баг
Math.floor(0.1 + 0.7 * 10) / 10; // 0.7 — «денежный» приём округления
Math.max(3, 7, 2);             // 7
```

`NaN !== NaN` — the only value in the language not equal to itself — which is why the check is `Number.isNaN(x)`, never `x !== x` tricks and never the global `isNaN` (it coerces its argument, so `isNaN("abc")` and `isNaN("hello")` both come back true for different reasons). The global `isFinite` coerces the same way; the `Number.*` statics do not.

## JSON, Date, RegExp

```js
JSON.stringify({ a: 1, b: undefined, c: null, d: () => {} }, null, 2);
// {
//   "a": 1,
//   "c": null
// }
JSON.parse('{"a": 1}'); // { a: 1 }
```

The JSON round-trip has honest losses: `undefined` and functions drop out, `NaN` and `Infinity` become `null`, dates become strings (and come back as strings), and Map or Set become plain objects. `JSON.parse` throws `SyntaxError` on any input that is not valid JSON — the only place in everyday code where try/catch is the idiomatic shape.

| Date API | What it does |
| --- | --- |
| Date.now() | milliseconds since the epoch |
| getFullYear / getMonth / getDate | local parts; getMonth is 0-based |
| getUTCHours and friends | the same in UTC |
| getTime / set | the millisecond value |
| toISOString | always UTC, "2026-09-03T00:00:00.000Z" |
| Date.parse / Date.UTC | parse or build from parts |
| toLocaleDateString | locale-aware formatting |

```js
new Date("2026-09-03").getMonth();    // 8 — месяцы считаются с нуля
new Date("2026-09-03").getDay();      // 4 — четверг, воскресенье = 0
new Date().toISOString();             // всегда UTC
```

> **WARNING**
> A date-only string "2026-09-03" is parsed as UTC, but "2026-09-03 10:00" is parsed as local time — the same-looking inputs take different roads. And `getMonth()` returns 8 for September: add one when you display.

Regexps travel in pairs: the literal `/pattern/flags` and the methods. The flags you will meet: `g` global, `i` case-insensitive, `m` multiline, `s` dot-matches-newline, `u` unicode.

```js
const re = /sy(ntax)?/gi;
re.test("Syntax");      // true
re.exec("SYNTAX");      // ["SYNTAX", "NTAX"]
"one two two".replace(/two/g, "3"); // "one 3 3"
```

String methods `match`, `matchAll`, `replace` and `split` all accept a regex, which is why you rarely need to construct `new RegExp` by hand in everyday code.

## Collections: Set, Map, WeakMap, WeakSet

| Collection | For | Key methods |
| --- | --- | --- |
| Set | unique values | add, has, delete, size, for…of |
| Map | any key to a value, insertion order | set, get, has, delete, size, entries |
| WeakMap | object keys to metadata, GC-able | set, get, delete — no size, no iteration |
| WeakSet | object flags, GC-able | add, has, delete |

```js
const seen = new Set();
seen.add(1); seen.add(1); seen.add(2);
[...seen]; // [1, 2] — уникальные значения

const sizes = new Map([["s", 8], ["m", 10]]);
sizes.get("m");     // 10
sizes.has("xl");    // false
sizes.set("xl", 12); // Map — итерация в порядке вставки
```

An object looks like a map, but its keys are strings (and symbols) only, it drags the prototype chain into `in` and `hasOwnProperty` checks, and counting its entries is extra code. A `Map` is the honest tool: any key type, no prototype noise, iteration in insertion order. A `Set` is the standard answer to "remove the duplicates" — build it from the array, spread it back.

## Promise and async globals

| API | What it does |
| --- | --- |
| Promise.resolve / reject | a promise that is already settled |
| p.then / .catch / .finally | the chain |
| Promise.all | everything, or the first rejection |
| Promise.race | the first to settle |
| Promise.allSettled | all statuses, never rejects |
| Promise.any | the first success; AggregateError if none |
| setTimeout / setInterval | timers (host functions, milliseconds) |
| clearTimeout / clearInterval | cancel a timer |
| queueMicrotask | a microtask after the current task |
| structuredClone | a deep copy of plain data |
| globalThis | the global object |

The full treatment of promises — states, chaining, async/await, the timeout and retry patterns — lives in the Async guide; this section is just the surface of the API so the names are at hand.

## Global functions and constants

| Function | What it does |
| --- | --- |
| parseInt(str, 10) | a number from a string; stops at the first bad character |
| parseFloat(str) | the same, keeping the fraction |
| isNaN / isFinite (global) | coerce their argument — prefer the Number.* versions |
| encodeURI / encodeURIComponent | URL escaping, page-level and segment-level |
| decodeURI / decodeURIComponent | the reverse |
| eval | runs a string as code — avoid |
| escape / unescape | legacy, avoid |
| Infinity, -Infinity, NaN, undefined | the constants |
| console.log / warn / error | output in every environment |

```js
parseInt("42px", 10);       // 42 — останавливается на "p"
parseInt("  7.5", 10);      // 7
parseFloat("7.5px");        // 7.5
encodeURIComponent("a b&c"); // "a%20b%26c"
```

> **TIP**
> Always pass the radix to `parseInt` — it is the habit that prevents the leading-zero surprises — and prefer `Number.isNaN` over the global `isNaN`, because the global one coerces and hides type bugs.

<!-- RU -->

Стандартные объекты, которые есть в любом JavaScript-окружении, плюс окружающие их глобальные функции. Формат — табличный: метод, что делает, когда тянуться. Это страница-справочник: держите её открытой, пока пишете, и перестаньте гуглить одни и те же вопросы.

## Object

| Метод | Что делает |
| --- | --- |
| Object.keys(obj) | массив собственных перечисляемых строковых ключей |
| Object.values(obj) | массив собственных значений в том же порядке |
| Object.entries(obj) | пары ключ и значение — для for…of и map |
| Object.assign(target, …sources) | поверхностная копия собственных перечисляемых свойств |
| Object.fromEntries(pairs) | обратное к entries |
| Object.freeze(obj) | поверхностная неизменяемость: нельзя добавлять и убирать ключи |
| Object.is(a, b) | строгое сравнение, которое ещё и с NaN и 0 / -0 справляется |
| Object.hasOwn(obj, key) | ES2023: true для собственных ключей, false для наследованных |
| Object.create(proto) | новый объект с данным прототипом |
| Object.getOwnPropertyNames(obj) | все собственные ключи, даже неперечисляемые |

```js
const user = { name: "Ada", age: 36 };
Object.keys(user);        // ["name", "age"]
Object.values(user);      // ["Ada", 36]
Object.entries(user);     // [["name", "Ada"], ["age", 36]]

const merged = Object.assign({}, { a: 1 }, { b: 2 }); // { a: 1, b: 2 }
Object.fromEntries([["x", 1], ["y", 2]]);             // { x: 1, y: 2 }
```

Порядок ключей предсказуем: целочисленные ключи первыми (по возрастанию), затем остальные в порядке вставки. Углы проверки типов у Object заслуживают особого внимания, потому что у `typeof` два знаменитых неверных ответа:

```js
typeof [];                 // "object" — знаменитый неверный ответ
Array.isArray([1]);         // true — правильный инструмент для массивов
Object.prototype.toString.call(new Date()); // "[object Date]" — точная метка
```

`Array.isArray` — быстрая и читаемая проверка на массив; `Object.prototype.toString.call` даёт точную внутреннюю метку для любого встроенного типа — это инструмент точного тип-чекера, «вариант с большой дробью», когда `typeof` не хватает.

## Array

| Метод | Что делает | Мутирует? |
| --- | --- | --- |
| push / pop | добавить или убрать в конце | да |
| shift / unshift | убрать или добавить в начале | да |
| slice(start, end) | копия части | нет |
| splice(start, n) | убрать n элементов, вернуть их | да |
| concat | новый склеенный массив | нет |
| join(sep) / split | массив в строку и обратно | нет |
| indexOf / lastIndexOf / includes | поиск по значению | нет |
| find / findIndex | первый элемент по условию | нет |
| findLast / findLastIndex | ES2023, с конца | нет |
| map / filter / reduce | тройка трансформаций | нет |
| sort(cmp) | сортировка на месте; по умолчанию — лексикографическая | да |
| reverse | разворот на месте | да |
| toSorted / toReversed / toSpliced | ES2023, неизменяемые версии | нет |
| flat(depth) / flatMap | распрямление вложенности | нет |
| entries / keys / values | итераторы | нет |
| at(i) | индекс, отрицательный — от конца | нет |
| length | свойство, а не функция | — |

```js
const a = [1, 2, 3];
a.push(4);        // 4 — возвращает новую длину, a = [1, 2, 3, 4]
a.slice(1, 3);    // [2, 3] — копия
a.splice(0, 1);   // [1] — удалено, a теперь [2, 3, 4]
a.toSorted((x, y) => x - y); // отсортированная копия, a не тронут
```

Методы делятся на два семейства, и путаница между ними — классический баг новичка. Мутирующее семейство — push, pop, shift, unshift, splice, sort, reverse — меняет массив на месте, и большинство из них возвращает не массив (push возвращает новую длину). Немутирующее семейство — slice, concat, map, filter, reduce, flat, toSorted — всегда отдаёт новый массив и не трогает вход.

> **WARNING**
> `sort()` без компаратора сортирует по строковым кодовым единицам: `[10, 9, 2].sort()` даст `[10, 2, 9]`, а `["10", "9"].sort()` — `["10", "9"]`. Числам нужен явный компаратор: `arr.sort((a, b) => a - b)`.

## String

Строки неизменяемы: каждый метод возвращает новую строку, ничего никогда не меняется на месте.

| Метод | Что делает |
| --- | --- |
| charAt / at / charCodeAt | символ (или код) по индексу; `at` позволяет отрицательный |
| slice / substring / substr | часть строки; substr — legacy |
| indexOf / lastIndexOf / includes | поиск подстроки |
| startsWith / endsWith | проверки префикса и суффикса |
| split(sep) | строка как массив |
| trim / trimStart / trimEnd | срезка пробельных |
| toUpperCase / toLowerCase | смена регистра |
| repeat(n) | повторить строку n раз |
| padStart / padEnd(len, fill) | дополнить до длины |
| replace / replaceAll | замена по паттерну; replaceAll — все совпадения |
| match / matchAll / search | поиск по regex |

```js
"Hello, world".split(", ");         // ["Hello", "world"]
"a b, c".trim().split(/\s*,\s*/);   // ["a b", "c"]
"price: 7".replace("7", "10");      // "price: 10" — только первое
"1,2,3".replaceAll(",", ";");       // "1;2;3"
"abc".at(-1);                       // "c"
```

## Number, Math и проверка типов

| API | Что делает |
| --- | --- |
| Number.isInteger / isFinite / isNaN / isSafeInteger | проверки типов без приведения |
| Number.MAX_SAFE_INTEGER / MIN_SAFE_INTEGER | границы 2 в степени 53 минус 1 |
| Number.EPSILON | расстояние от 1 до следующего представимого числа |
| toFixed / toPrecision / toExponential | форматирование числа в строку |
| Math.floor / ceil / round / trunc | округление в четырёх направлениях |
| Math.abs / sign | абсолютное значение, знак |
| Math.max / Math.min | с любым числом аргументов |
| Math.random / sqrt / hypot / pow | случайное число и обычные функции |

```js
Number.isNaN(Number("abc"));   // true
isNaN("abc");                  // тоже true — глобальный isNaN приводит, не используйте
Number.isSafeInteger(2 ** 53); // false
1.005.toFixed(2);              // "1.00" — артефакт float, а не баг
Math.floor(0.1 + 0.7 * 10) / 10; // 0.7 — «денежный» приём округления
Math.max(3, 7, 2);             // 7
```

`NaN !== NaN` — единственное значение в языке, не равное самому себе, — поэтому проверка пишется как `Number.isNaN(x)`, без трюков `x !== x` и без глобального `isNaN` (он приводит аргумент, поэтому `isNaN("abc")` и `isNaN("hello")` дают true по разным причинам). Глобальный `isFinite` приводит так же; статические `Number.*` — нет.

## JSON, Date, RegExp

```js
JSON.stringify({ a: 1, b: undefined, c: null, d: () => {} }, null, 2);
// {
//   "a": 1,
//   "c": null
// }
JSON.parse('{"a": 1}'); // { a: 1 }
```

У JSON-круга есть честные потери: `undefined` и функции исчезают, `NaN` и `Infinity` становятся `null`, даты превращаются в строки (и возвращаются строками), а Map и Set — в плоские объекты. `JSON.parse` бросает `SyntaxError` на любом входе, который не валидный JSON, — единственное место в повседневном коде, где try/catch это идиоматичная форма.

| Date API | Что делает |
| --- | --- |
| Date.now() | миллисекунды с эпохи |
| getFullYear / getMonth / getDate | локальные части; getMonth с нуля |
| getUTCHours и другие | то же в UTC |
| getTime / set | значение в миллисекундах |
| toISOString | всегда UTC, "2026-09-03T00:00:00.000Z" |
| Date.parse / Date.UTC | разбор или сборка из частей |
| toLocaleDateString | локальное форматирование |

```js
new Date("2026-09-03").getMonth();    // 8 — месяцы считаются с нуля
new Date("2026-09-03").getDay();      // 4 — четверг, воскресенье = 0
new Date().toISOString();             // всегда UTC
```

> **WARNING**
> Строка только с датой "2026-09-03" разбирается как UTC, а "2026-09-03 10:00" — как локальное время: похожие на вход уходят разными дорогами. И `getMonth()` возвращает 8 для сентября: при отображении прибавляйте один.

Регулярные выражения ходят парами: литерал `/pattern/flags` и методы. Флаги, которые вы встретите: `g` глобальный, `i` без учёта регистра, `m` многострочный, `s` точка матчит перенос, `u` юникод.

```js
const re = /sy(ntax)?/gi;
re.test("Syntax");      // true
re.exec("SYNTAX");      // ["SYNTAX", "NTAX"]
"one two two".replace(/two/g, "3"); // "one 3 3"
```

Строковые методы `match`, `matchAll`, `replace` и `split` принимают regex, поэтому `new RegExp` вручную в повседневном коде почти никогда не нужен.

## Коллекции: Set, Map, WeakMap, WeakSet

| Коллекция | Для чего | Ключевые методы |
| --- | --- | --- |
| Set | уникальные значения | add, has, delete, size, for…of |
| Map | любое ключ-значение, порядок вставки | set, get, has, delete, size, entries |
| WeakMap | объект-ключи в метаданные, собираемо GC | set, get, delete — без size, без итерации |
| WeakSet | флаги на объектах, собираемо GC | add, has, delete |

```js
const seen = new Set();
seen.add(1); seen.add(1); seen.add(2);
[...seen]; // [1, 2] — уникальные значения

const sizes = new Map([["s", 8], ["m", 10]]);
sizes.get("m");     // 10
sizes.has("xl");    // false
sizes.set("xl", 12); // Map — итерация в порядке вставки
```

Объект выглядит как map, но его ключи только строки (и символы), он тащит цепочку прототипов в проверки `in` и `hasOwnProperty`, а подсчёт записей — лишний код. `Map` — честный инструмент: любой тип ключа, без прототипного шума, итерация в порядке вставки. `Set` — стандартный ответ на «убери дубликаты»: соберите его из массива и разложите обратно.

## Promise и глобалы асинхронности

| API | Что делает |
| --- | --- |
| Promise.resolve / reject | уже севший promise |
| p.then / .catch / .finally | цепочка |
| Promise.all | все, либо первый reject |
| Promise.race | первый севший |
| Promise.allSettled | все статусы, никогда не rejects |
| Promise.any | первый успех; AggregateError, если нет |
| setTimeout / setInterval | таймеры (хост-функции, миллисекунды) |
| clearTimeout / clearInterval | отмена таймера |
| queueMicrotask | микротаск после текущего |
| structuredClone | глубокая копия плоских данных |
| globalThis | глобальный объект |

Полное разбирательство promise — состояния, цепочки, async/await, паттерны timeout и retry — живёт в гайде по асинхронности; этот раздел — просто поверхность API, чтобы имена были под рукой.

## Глобальные функции и константы

| Функция | Что делает |
| --- | --- |
| parseInt(str, 10) | число из строки; останавливается на первом «плохом» символе |
| parseFloat(str) | то же, сохраняя дробную часть |
| isNaN / isFinite (глобальные) | приводят аргумент — предпочитайте версии Number.* |
| encodeURI / encodeURIComponent | URL-экранирование, на уровне страницы и сегмента |
| decodeURI / decodeURIComponent | обратное |
| eval | исполняет строку как код — избегайте |
| escape / unescape | legacy, избегайте |
| Infinity, -Infinity, NaN, undefined | константы |
| console.log / warn / error | вывод в любом окружении |

```js
parseInt("42px", 10);       // 42 — останавливается на "p"
parseInt("  7.5", 10);      // 7
parseFloat("7.5px");        // 7.5
encodeURIComponent("a b&c"); // "a%20b%26c"
```

> **TIP**
> Всегда передавайте radix в `parseInt` — это привычка, которая спасает от сюрпризов с ведущим нулём, — и предпочитайте `Number.isNaN` глобальному `isNaN`, потому что глобальный приводит и скрывает баги типов.
