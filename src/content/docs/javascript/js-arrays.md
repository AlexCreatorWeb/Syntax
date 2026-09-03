---
id: js-arrays
track: javascript
type: guide
section: data
order: 3
title:
  en: "Arrays & Objects"
  ru: "Массивы и объекты"
excerpt:
  en: "The two structures that carry most of your data: iteration, map/filter/reduce, reshaping methods, object destructuring and spread, and the difference between shallow and deep copies."
  ru: "Две структуры, на которые приходится большинство ваших данных: итерация, map/filter/reduce, методы перестроения, деструктуризация и spread для объектов, а также разница между поверхностной и глубокой копиями."
version: "es2023"
updated: 2026-09-03
relatedTask: js-004
---

Arrays and objects carry almost all data in JavaScript code. This page covers how to build them, the iteration tools you will use daily, the transform trio map/filter/reduce, object techniques like destructuring and spread, and the copy semantics that cause the classic "I mutated the wrong object" bug.

## Building arrays and objects

Arrays are ordered lists; objects are key-value maps. Both have literal syntax, and both are mutable by default.

```js
const scores = [87, 92, 78];                      // array literal
const user = { name: "Ada", role: "admin", age: 36 }; // object literal

scores.length;       // 3
user.name;           // "Ada" — dot access
user["role"];        // "admin" — bracket access, key can be any string
"user" in user;      // true — membership check

user.city = "London"; // add a key
delete user.city;     // remove a key
```

Object keys are always strings (or symbols). `user.1` is not valid property syntax — use `user["1"]`. Number-like keys in array literals are a special case: array indices are string keys under the hood, which is why `arr[0]` and `arr["0"]` are the same thing.

Which structure to pick? An array when the items form a sequence and order matters. An object when you need named access — "give me the price" instead of "give me element three". A list of records is almost always an array of objects, and that combination is the shape of most application data.

## Iteration

`for...of` walks values, `for...in` walks object keys, and `forEach` runs a callback per element. In modern code you reach for `for...of` or the callback methods; plain `for` remains when you need index math or an early `break`.

```js
const tags = ["js", "web", "css"];

for (const tag of tags) console.log(tag); // js web css

tags.forEach((tag, i) => console.log(i, tag)); // 0 js 1 web 2 css

const user = { name: "Ada", role: "admin" };
for (const key of Object.keys(user)) console.log(key); // name role
```

One warning about `for...in`: it walks the whole prototype chain and does not guarantee order, so it is meant for configuration-style objects, not for data you need to process. For arrays, always prefer `for...of` or `forEach`.

`forEach` is a loop with a callback; `for...of` is a loop with a body. There is no meaningful performance difference, so pick by readability — and note that neither one can `break` cleanly without extra flags, which is why `find` and friends exist.

## The transform trio: map, filter, reduce

These three methods express most data processing, and none of them mutates the source array.

```js
const prices = [1200, 450, 890, 2300];

const withTax = prices.map((p) => p * 1.2);
// [1440, 540, 1068, 2760]

const cheap = prices.filter((p) => p < 1000);
// [450, 890]

const total = prices.reduce((sum, p) => sum + p, 0);
// 4840
```

`map` transforms each element into a new one, `filter` keeps the elements that pass a test, `reduce` folds the whole array into a single value. Compose them left to right: each method hands its result to the next.

```js
// sum of squared odd numbers
const result = [1, 2, 3, 4, 5]
  .filter((n) => n % 2 === 1)
  .map((n) => n * n)
  .reduce((a, b) => a + b, 0);
// 50
```

Pay attention to `reduce`'s second argument — the initial value. Without it, the first element becomes the accumulator, and an empty array throws. With `0`, sums are safe; with `[]`, `reduce` becomes a group-by.

## Reshaping arrays

Several methods return a new array from an old one. `slice(start, end)` copies a range without touching the source.

```js
const week = ["mon", "tue", "wed", "thu", "fri"];
week.slice(0, 2); // ["mon", "tue"]
week.slice(-2);   // ["thu", "fri"]
```

`splice` is the opposite: it mutates the array in place and returns the removed items. Mixing the two up is one of the most frequent array bugs in code review.

```js
const list = [1, 2, 3, 4];
list.splice(1, 2); // removes 2 items at index 1, returns [2, 3]
list;              // [1, 4]
```

`includes(value)` checks membership, `find` and `findIndex` return the first element (or its index) matching a predicate, and `sort` reorders the array — in place, which surprises people who expected a copy.

```js
[1, 2, 3].includes(2); // true
[{ id: 1 }, { id: 7 }].find((x) => x.id === 7); // { id: 7 }
```

> **WARNING**
> `sort()` mutates and, without a comparator, sorts as strings — `[10, 9, 21].sort()` gives `[10, 21, 9]`. Always pass `(a, b) => a - b` for numbers, and copy first if the source must stay intact: `[...arr].sort(cmp)`.

## Object techniques

Object destructuring pulls values into variables, with renaming and defaults. Spread builds a new object from old parts. Together they replace most hand-rolled copying code.

```js
const product = { id: 7, name: "Laptop", price: 1200, inStock: true };

const { name, price, inStock = false } = product;
const { id: productId } = product; // rename

const promo = { ...product, price: 990 };
promo.price;      // 990
product.price;    // 1200 — the original is untouched

Object.keys(product);    // ["id", "name", "price", "inStock"]
Object.values(product);  // [7, "Laptop", 1200, true]
Object.entries(product); // [["id", 7], ["name", "Laptop"], ...]
```

`Object.entries` plus a loop or `map` covers most "do something with every key-value pair" needs: filtering an object by a rule, transforming every value, building a new object on the fly.

```js
const mapValues = (obj, fn) => {
  const out = {};
  for (const [key, value] of Object.entries(obj)) out[key] = fn(value, key);
  return out;
};
mapValues({ a: 1, b: 2 }, (v) => v * 10); // { a: 10, b: 20 }
```

And the reverse direction — `Object.fromEntries` rebuilds an object from pairs, which pairs perfectly with `filter`: keep only the keys you want.

```js
const only = (obj, keys) =>
  Object.fromEntries(Object.entries(obj).filter(([k]) => keys.includes(k)));
only(product, ["name", "price"]); // { name: "Laptop", price: 1200 }
```

## Copying: shallow vs deep

`{ ...obj }` and `[...arr]` copy one level. Nested objects inside remain shared references — mutating the copy mutates the original's inner state, and that is the "I mutated the wrong object" bug.

```js
const config = { theme: "dark", limits: { cpu: 1, mem: 512 } };
const copy = { ...config };
copy.limits.cpu = 8;
config.limits.cpu; // 8 — the inner object is shared!
```

For plain JSON-compatible data there are two real options: `structuredClone(value)`, the built-in that handles arrays, objects, Maps and Dates, and `JSON.parse(JSON.stringify(value))`, the older trick that breaks on functions, `undefined` values and circular references. A recursive function is the third option when you need custom rules.

> **TIP**
> Ask one question before copying: "will anyone mutate the nested parts?" If no — shallow spread is enough and faster. If yes — use `structuredClone`.

## Common mistakes

> **WARNING**
> `push` returns the new length, not the array: `arr.push(1).push(2)` throws because a number has no `push`. Chain transforms only with methods that return arrays.

> **WARNING**
> Assigning to a non-existent deep path throws: `user.address.city = "London"` crashes when `user.address` is undefined. Build the path step by step, or read through optional chaining.

> **TIP**
> When deduplicating, reach for `Set`: `[...new Set(arr)]` kills duplicates in one line — for primitive values. Objects compare by reference, so you need a key-based approach for them.

With arrays and objects covered, the next guide leaves pure data and touches the page itself: the DOM.

<!-- RU -->

Массивы и объекты несут почти все данные в коде JavaScript. На этой странице: как их строить, инструменты итерации, которыми вы пользуетесь каждый день, тройка трансформаций map/filter/reduce, приёмчики с объектами вроде деструктуризации и spread, и семантика копий, которая даёт классический баг «я изменил не тот объект».

## Построение массивов и объектов

Массивы — упорядоченные списки; объекты — карты ключ-значение. У обоих есть литеральный синтаксис, и оба изменяемые по умолчанию.

```js
const scores = [87, 92, 78];                      // литерал массива
const user = { name: "Ada", role: "admin", age: 36 }; // литерал объекта

scores.length;       // 3
user.name;           // "Ada" — доступ через точку
user["role"];        // "admin" — доступ в скобках, ключ — любая строка
"user" in user;      // true — проверка принадлежности

user.city = "London"; // добавить ключ
delete user.city;     // удалить ключ
```

Ключи объекта — всегда строки (или символы). `user.1` — невалидный синтаксис свойства — используйте `user["1"]`. Числовые ключи в литерале массива — особый случай: индексы массива под капотом строковые ключи, поэтому `arr[0]` и `arr["0"]` — одно и то же.

Какую структуру выбрать? Массив, когда элементы образуют последовательность и важен порядок. Объект, когда нужен именованный доступ: «дай цену», а не «дай третий элемент». Список записей — почти всегда массив объектов, и эта комбинация — форма большинства данных приложения.

## Итерация

`for...of` идёт по значениям, `for...in` — по ключам объекта, а `forEach` запускает колбэк на каждый элемент. В современном коде берут `for...of` или callback-методы; обычный `for` остаётся, когда нужна индексная математика или ранний `break`.

```js
const tags = ["js", "web", "css"];

for (const tag of tags) console.log(tag); // js web css

tags.forEach((tag, i) => console.log(i, tag)); // 0 js 1 web 2 css

const user = { name: "Ada", role: "admin" };
for (const key of Object.keys(user)) console.log(key); // name role
```

Одно предупреждение про `for...in`: он идёт по всей цепочке прототипов и не гарантирует порядок, так что он для конфигурационных объектов, а не для данных, которые нужно обработать. Для массивов всегда предпочитайте `for...of` или `forEach`.

`forEach` — это цикл с колбэком; `for...of` — цикл с телом. Существенной разницы в производительности нет, поэтому выбирайте по читабельности — и注意, что ни тот, ни другой нельзя чисто `break`-нуть без дополнительных флагов, поэтому и существуют `find` и компании.

## Тройка трансформаций: map, filter, reduce

Эти три метода выражают большую часть обработки данных, и ни один из них не мутирует исходный массив.

```js
const prices = [1200, 450, 890, 2300];

const withTax = prices.map((p) => p * 1.2);
// [1440, 540, 1068, 2760]

const cheap = prices.filter((p) => p < 1000);
// [450, 890]

const total = prices.reduce((sum, p) => sum + p, 0);
// 4840
```

`map` трансформирует каждый элемент в новый, `filter` оставляет элементы, прошедшие проверку, `reduce` сворачивает весь массив в одно значение. Сочетайте их слева направо: каждый метод передаёт результат следующему.

```js
// сумма квадратов нечётных чисел
const result = [1, 2, 3, 4, 5]
  .filter((n) => n % 2 === 1)
  .map((n) => n * n)
  .reduce((a, b) => a + b, 0);
// 50
```

Обратите внимание на второй аргумент `reduce` — начальное значение. Без него первым накопителем становится первый элемент, а пустой массив бросает ошибку. С `0` суммы безопасны; с `[]` `reduce` превращается в group-by.

## Перестроение массивов

Несколько методов возвращают новый массив из старого. `slice(start, end)` копирует диапазон, не трогая источник.

```js
const week = ["mon", "tue", "wed", "thu", "fri"];
week.slice(0, 2); // ["mon", "tue"]
week.slice(-2);   // ["thu", "fri"]
```

`splice` — противоположность: мутирует массив на месте и возвращает удалённые элементы. Путать их — одна из самых частых багов массивов на ревью.

```js
const list = [1, 2, 3, 4];
list.splice(1, 2); // удаляет 2 элемента с индекса 1, возвращает [2, 3]
list;              // [1, 4]
```

`includes(value)` проверяет принадлежность, `find` и `findIndex` возвращают первый элемент (или его индекс), подходящий предикату, а `sort` переставляет массив — на месте, что удивляет тех, кто ждал копию.

```js
[1, 2, 3].includes(2); // true
[{ id: 1 }, { id: 7 }].find((x) => x.id === 7); // { id: 7 }
```

> **WARNING**
> `sort()` мутирует и, без компаратора, сортирует как строки — `[10, 9, 21].sort()` даёт `[10, 21, 9]`. Для числов всегда передавайте `(a, b) => a - b`, а если источник должен остаться целым — сначала скопируйте: `[...arr].sort(cmp)`.

## Приёмы с объектами

Деструктуризация объекта вытягивает значения в переменные — с переименованием и дефолтами. Spread собирает новый объект из старых частей. Вместе они заменяют большинство ручного кода копирования.

```js
const product = { id: 7, name: "Laptop", price: 1200, inStock: true };

const { name, price, inStock = false } = product;
const { id: productId } = product; // переименование

const promo = { ...product, price: 990 };
promo.price;      // 990
product.price;    // 1200 — оригинал не тронут

Object.keys(product);    // ["id", "name", "price", "inStock"]
Object.values(product);  // [7, "Laptop", 1200, true]
Object.entries(product); // [["id", 7], ["name", "Laptop"], ...]
```

`Object.entries` плюс цикл или `map` накрывают большинство нужд вида «сделай что-то с каждой парой ключ-значение»: фильтрация объекта по правилу, трансформация каждого значения, сборка нового объекта на лету.

```js
const mapValues = (obj, fn) => {
  const out = {};
  for (const [key, value] of Object.entries(obj)) out[key] = fn(value, key);
  return out;
};
mapValues({ a: 1, b: 2 }, (v) => v * 10); // { a: 10, b: 20 }
```

И обратное направление — `Object.fromEntries` собирает объект из пар, что идеально сочетается с `filter`: оставляем только нужные ключи.

```js
const only = (obj, keys) =>
  Object.fromEntries(Object.entries(obj).filter(([k]) => keys.includes(k)));
only(product, ["name", "price"]); // { name: "Laptop", price: 1200 }
```

## Копирование: поверхностное против глубокого

`{ ...obj }` и `[...arr]` копируют один уровень. Вложенные объекты внутри остаются общими ссылками — мутация копии мутирует внутреннее состояние оригинала, и это тот самый баг «я изменил не тот объект».

```js
const config = { theme: "dark", limits: { cpu: 1, mem: 512 } };
const copy = { ...config };
copy.limits.cpu = 8;
config.limits.cpu; // 8 — внутренний объект общий!
```

Для «плоских» JSON-совместимых данных есть два реальных варианта: `structuredClone(value)` — встроенная функция, которая разбирает массивы, объекты, Map и Date, и `JSON.parse(JSON.stringify(value))` — старый трюк, который ломается на функциях, значениях `undefined` и циклических ссылках. Рекурсивная функция — третий вариант, когда нужны свои правила.

> **TIP**
> Задайте один вопрос перед копированием: «кто-нибудь будет мутировать вложенные части?» Если нет — поверхностного spread достаточно, и он быстрее. Если да — используйте `structuredClone`.

## Частые ошибки

> **WARNING**
> `push` возвращает новую длину, а не массив: `arr.push(1).push(2)` падает, потому что у числа нет `push`. Цепляйте только методы, возвращающие массивы.

> **WARNING**
> Назначение на несуществующий глубокий путь падает: `user.address.city = "London"` крашится, когда `user.address` — undefined. Стройте путь по шагам или читайте через опциональную цепочку.

> **TIP**
> Для дедупликации берите `Set`: `[...new Set(arr)]` убивает дубликаты в одну строку — для примитивных значений. Объекты сравниваются по ссылке, для них нужен подход через ключи.

Массивы и объекты покрыты. Следующий гайд выходит за пределы чистых данных и трогает саму страницу: DOM.
