---
id: js-cheatsheet
track: javascript
type: reference
section: reference
order: 4
title:
  en: "ES2023 Syntax Cheat Sheet"
  ru: "ES2023: шпаргалка"
excerpt:
  en: "The whole modern syntax surface in three blocks: a table of features, the patterns you copy-paste into real code, and the traps that cause most of the 'why is this doing this?'"
  ru: "Вся поверхность современного синтаксиса в трёх блоках: таблица фич, паттерны, которые копируете в реальный код, и ловушки, из-за которых чаще всего звучит «почему это так?»"
version: "es2023"
updated: 2026-09-03
---

The entire ES2023 syntax surface on one page: a table of the features, a block of patterns you will copy into real code, and a table of the traps behind most of the "why is this doing this?" moments in the console. Bookmark it — this is the page you send to a new team member on day one.

## Modern syntax at a glance

| Feature | Syntax | Example |
| --- | --- | --- |
| arrow function | (a, b) => a + b | const add = (a, b) => a + b |
| const / let | block-scoped variables | const x = 1; let y = 2; |
| template literal | backticks with ${} | `Hi, ${name}` |
| object destructuring | const { a, b } = obj | with defaults: const { a = 1 } = obj |
| array destructuring | const [x, y] = arr | swap: [a, b] = [b, a] |
| rest and spread | ... in params, arrays, objects | { ...obj, extra: 1 } |
| default parameters | f(x = 1) | f() uses 1 |
| optional chaining | obj?.a?.b | undefined stops the chain |
| nullish coalescing | x ?? "fallback" | only null / undefined trigger it |
| logical assignment | a ??= b (and the AND / OR variants) | assign only when nullish |
| class | class A { m() {} } | methods, getters, static |
| modules | import / export | import { x } from "./m.js" |
| async / await | async function, await expr | const v = await fetchJson() |
| for…of | for (const x of arr) | values, with entries() for indices |
| generator | function* f() { yield 1 } | pull-based iteration |
| computed key | { [name]: value } | the key from a variable |
| getter / setter | get x() {} / set x(v) {} | on classes and objects |
| numeric separator | 1_000_000 | readability of big numbers |
| JSON | JSON.parse / JSON.stringify | the round-trip has losses |
| destructured parameter | function f({ a } = {}) {} | safe options bag |

Every row is working code in the sandbox: paste the example, run it, see the value. The rows you will type every day are the top eight; the rest you look up here instead of in a book.

Two rows need a sentence more than a cell. Generators: a `function*` body runs only when someone pulls it — `next()` returns `{ value, done }`, and `yield` pauses right where it was. In everyday code they mostly appear as sources for `for…of` and in async iteration, not as hand-rolled engines. And modules: `export default` gives exactly one anonymous value per file, while named exports (`export const x`) are the pattern for everything else — import what you need, rename on the way in, and the bundler does the rest.

## Working patterns

```js
// swap without a temp variable
let a = 1, b = 2;
[a, b] = [b, a];

// guard clause — invalid input returns early
function divide(x, y) {
  if (y === 0) return NaN;
  return x / y;
}

// options pattern — one object, safe defaults
function createList({ items = [], sort = false } = {}) {
  const list = [...items];
  return sort ? list.sort((x, y) => x - y) : list;
}

// pick and omit — keep or drop keys without mutating
const pick = (obj, keys) =>
  keys.reduce((acc, k) => (k in obj ? ((acc[k] = obj[k]), acc) : acc), {});
const omit = (obj, keys) =>
  Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));

pick({ a: 1, b: 2, c: 3 }, ["a", "c"]); // { a: 1, c: 3 }
omit({ a: 1, b: 2, c: 3 }, ["b"]);      // { a: 1, c: 3 }

// group by key
const groupBy = (arr, key) =>
  arr.reduce((acc, item) => ((acc[item[key]] ??= []).push(item), acc), {});

// debounce — fire only after ms of quiet
function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
```

A note on the two most-copied blocks. The pick/omit pair is written once per codebase and then reused everywhere — if you end up typing it twice, promote it to a utility file. And the debounce closes over a single timer variable: that is the whole trick, because every call cancels the previous call's timer, so only the last call in a burst survives. The same closure idea powers once, throttle, and retry-with-backoff.

The guard clause is the pattern to internalize first: instead of wrapping the whole body in an `if`, check the edge case on top and `return` early. The function body then reads as the happy path, and the indentation depth stays at one. The options pattern with a destructured default parameter is the modern replacement for the three-boolean-parameter API — `createList({ sort: true })` reads at a glance, `createList(false, true, true)` does not.

## Traps that cause most of the "why?"

| Symptom | Cause | Fix |
| --- | --- | --- |
| 0.1 + 0.2 → 0.30000000000000004 | floats are binary fractions | integer cents, or compare with an epsilon |
| typeof null → "object" | a bug from the first edition | check value === null first |
| [1, 2] + [3, 4] → "1,23,4" | + calls toString on arrays | concat or spread |
| [10, 9, 2].sort() → [10, 2, 9] | the default sort is lexicographic | pass a comparator (a, b) => a - b |
| 0 == "" → true | loose equality coerces | === and !== everywhere |
| a var counter visible after the loop | var is function-scoped | let for loop variables |
| count replaced by the fallback when it was 0 | OR sees every falsy value | ?? — only null / undefined |
| JSON.parse(undefined) throws | the input must be a string | guard before parsing |
| new Date("2026-09-03").getMonth() → 8 | months are 0-based | add one when displaying |
| mutating a const object works fine | const protects the binding, not the value | Object.freeze, or immutable updates |
| arr.flat() still leaves nesting | the default depth is 1 | flat(Infinity) |
| functions survive a JSON round-trip as nothing | JSON knows no functions | rebuild from a registry |

```js
// the float trap, made visible
0.1 + 0.2;                    // 0.30000000000000004
Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON; // true — the honest compare

// the sort trap, side by side
["10", "9"].sort();                  // ["10", "9"] — lexicographic
[10, 9, 2].sort((a, b) => a - b);    // [2, 9, 10] — numeric
```

The last two rows of the table are the ones that surface in code review. The const-mutation row is the first thing to check when someone says "but I used const" — the keyword never promised value immutability. And the JSON-functions row is the reason API responses that "worked locally" suddenly miss fields in production: the server dropped the functions on the way out, and nobody had read the loss table.

Read the trap table top to bottom once a week for the first month; after that you will recognize the symptom before you even type the expression. Each row is a whole class of bug reports — the "why?" stops once the cause column is yours.

> **TIP**
> When you hit a symptom from the last table, do not delete the code — wrap it in a small reproduction in the sandbox, confirm the cause column, and fix with the third column. The five-minute repro beats the thirty-minute guess, every single time.

<!-- RU -->

Вся поверхность синтаксиса ES2023 на одной странице: таблица фич, блок паттернов, которые вы будете копировать в реальный код, и таблица ловушек — тех, что стоят за большинством «почему это так?» в консоли. Заколдте её — это та страницу, которую отправляют новому члену команды в первый день.

## Современный синтаксис одним взглядом

| Фича | Синтаксис | Пример |
| --- | --- | --- |
| arrow-функция | (a, b) => a + b | const add = (a, b) => a + b |
| const / let | блок-область видимости | const x = 1; let y = 2; |
| шаблонная строка | обратные кавычки с ${} | `Hi, ${name}` |
| деструктуризация объекта | const { a, b } = obj | с дефолтами: const { a = 1 } = obj |
| деструктуризация массива | const [x, y] = arr | swap: [a, b] = [b, a] |
| rest и spread | ... в параметрах, массивах, объектах | { ...obj, extra: 1 } |
| параметры по умолчанию | f(x = 1) | f() использует 1 |
| optional chaining | obj?.a?.b | undefined останавливает цепочку |
| nullish coalescing | x ?? "fallback" | срабатывает только для null / undefined |
| логическое присваивание | a ??= b (и варианты И / ИЛИ) | присваивать только если nullish |
| class | class A { m() {} } | методы, геттеры, static |
| модули | import / export | import { x } from "./m.js" |
| async / await | async function, await expr | const v = await fetchJson() |
| for…of | for (const x of arr) | значения; с entries() — индексы |
| генератор | function* f() { yield 1 } | pull-итерация |
| вычисляемый ключ | { [name]: value } | ключ из переменной |
| геттер / сеттер | get x() {} / set x(v) {} | у классов и объектов |
| разделитель чисел | 1_000_000 | читаемость больших чисел |
| JSON | JSON.parse / JSON.stringify | у круга есть потери |
| деструктурированный параметр | function f({ a } = {}) {} | безопасный мешок опций |

Каждая строка — рабочий код в песочнице: вставьте пример, запустите, увидите значение. Строки, которые вы будете писать каждый день, — это верхние восемь; остальные ищите здесь, а не в книге.

Две строки заслуживают предложения больше, чем ячейки. Генераторы: тело `function*` исполняется только когда кто-то тянет — `next()` возвращает `{ value, done }`, а `yield` ставит паузу ровно там, где стоял. В повседневном коде они появляются в основном как источники для `for…of` и в асинхронной итерации, а не как ручные движки. И модули: `export default` даёт ровно одно безымянное значение на файл, тогда как именованные экспорты (`export const x`) — паттерн для всего остального: импортируйте нужное, переименуйте на входе, а остальное сделает бандлер.

## Рабочие паттерны

```js
// swap без временной переменной
let a = 1, b = 2;
[a, b] = [b, a];

// guard clause — невалидный ввод возвращает сразу
function divide(x, y) {
  if (y === 0) return NaN;
  return x / y;
}

// options-паттерн — один объект, безопасные дефолты
function createList({ items = [], sort = false } = {}) {
  const list = [...items];
  return sort ? list.sort((x, y) => x - y) : list;
}

// pick и omit — оставить или убрать ключи без мутаций
const pick = (obj, keys) =>
  keys.reduce((acc, k) => (k in obj ? ((acc[k] = obj[k]), acc) : acc), {});
const omit = (obj, keys) =>
  Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));

pick({ a: 1, b: 2, c: 3 }, ["a", "c"]); // { a: 1, c: 3 }
omit({ a: 1, b: 2, c: 3 }, ["b"]);      // { a: 1, c: 3 }

// группировка по ключу
const groupBy = (arr, key) =>
  arr.reduce((acc, item) => ((acc[item[key]] ??= []).push(item), acc), {});

// debounce — срабатываем только после ms тишины
function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
```

Примечание о двух самых копируемых блоках. Пара pick/omit пишется один раз на кодбазу и дальше переиспользуется везде — если ловите себя на том, что набираете её второй раз, вынесите в утилитарный файл. А debounce замыкается на одну переменную-таймер: в этом весь трюк, потому что каждый вызов отменяет таймер предыдущего вызова, и из всей серии срабатывает только последний. Та же идея замыкания стоит за once, throttle и retry-with-backoff.

Guard clause — паттерн, который стоит интернализировать в первую очередь: вместо того чтобы оборачивать всё тело в `if`, проверьте граничный случай сверху и `return` сразу. Тогда тело функции читается как счастливый путь, а глубина вложенности остаётся на уровне одного. Options-паттерн с деструктурированным параметром-дефолтом — современный заменитель API с тремя булевыми параметрами: `createList({ sort: true })` читается с первого взгляда, а `createList(false, true, true)` — нет.

## Ловушки, из-за которых чаще всего «почему?»

| Симптом | Причина | Лечение |
| --- | --- | --- |
| 0.1 + 0.2 → 0.30000000000000004 | float — двоичные дроби | целые копейки или сравнение с эпсилон |
| typeof null → "object" | баг первого издания | сначала проверяйте value === null |
| [1, 2] + [3, 4] → "1,23,4" | + вызывает toString у массивов | concat или spread |
| [10, 9, 2].sort() → [10, 2, 9] | сортировка по умолчанию лексикографическая | передайте компаратор (a, b) => a - b |
| 0 == "" → true | нестрогое равенство приводит | === и !== везде |
| var-счётчик виден после цикла | var живёт в области функции | let для переменных циклов |
| count заменён на fallback, хотя был 0 | ИЛИ видит каждый falsy | ?? — только null / undefined |
| JSON.parse(undefined) падает | на входе должна быть строка | проверьте до парсинга |
| new Date("2026-09-03").getMonth() → 8 | месяцы считаются с нуля | прибавляйте один при отображении |
| мутация const-объекта работает нормально | const защищает связь, а не значение | Object.freeze или неизменяемые обновления |
| arr.flat() оставляет вложенность | глубина по умолчанию — 1 | flat(Infinity) |
| функции после JSON-круга становятся ничем | JSON не знает функций | пересоздавайте из реестра |

```js
// ловушка float, сделанная видимой
0.1 + 0.2;                    // 0.30000000000000004
Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON; // true — честное сравнение

// ловушка сортировки рядом
["10", "9"].sort();                  // ["10", "9"] — лексикографически
[10, 9, 2].sort((a, b) => a - b);    // [2, 9, 10] — по числам
```

Последние две строки таблицы — те, что всплывают на код-ревью. Строка про мутацию const — первое, что проверяют, когда говорят «а я же использовал const»: ключевое слово никогда не обещало неизменяемость значения. А строка про функции в JSON — причина, по которой ответы API, которые «работали локально», вдруг теряют поля в продакшене: сервер уронил функции по дороге, и никто не читал таблицу потерь.

Прочитайте таблицу ловушек сверху вниз один раз в неделю на протяжении первого месяца; после этого вы будете узнавать симптом, ещё даже не набрав выражение. Каждая строка — целый класс баг-репортов: «почему?» перестаёт звучать, как только колонка причин становится вашей.

> **TIP**
> Когда нарвались на симптом из последней таблицы — не удаляйте код: оберните его в маленькую репродукцию в песочнице, подтвердите колонку причин и почините по третьей колонке. Пятиминутная репродукция бьёт тридцатиминутное угадывание, каждый раз.
