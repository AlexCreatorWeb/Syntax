# Урок 24. keys, values, entries, assign и hasOwn

## Цель
После урока студент сможет: «обойти** «ключи/значения/пары** «объекта** (Object.keys/values/entries); «объединить** «объекты** (Object.assign / spread); «проверить** «свойство** (hasOwn, in); «преобразовать** «объект** «↔** «массив** пар (fromEntries).

## Теория
### «Обход**: keys, values, entries
- **Object.keys(obj)** → «массив** «ключей** (строки): Object.keys({ a: 1, b: 2 }) → ["a", "b"];
- **Object.values(obj)** → «массив** «значений**: [1, 2];
- **Object.entries(obj)** → «массив** «пар** [key, value]: [["a", 1], ["b", 2]].

«Обход** «через** «массивы** (map/filter):
```js
const prices = { apple: 10, pear: 20 };
const keys = Object.keys(prices);           // ["apple", "pear"]
const total = Object.values(prices).reduce((s, p) => s + p, 0); // 30
const upper = Object.fromEntries(
  Object.entries(prices).map(([k, v]) => [k.toUpperCase(), v * 2])
);
console.log(upper); // { APPLE: 20, PEAR: 40 }
```
«for...in**: for (const key in obj) — «обход** «ключей** («включая** «наследованные** «(прототип**); «для** «своих** «— hasOwn-проверка.

### «Объединение**: assign «и** spread
- **Object.assign(target, ...sources)** — «копирует** «свойства** «из** «источников** «в** «target» («возвращает** target): «МУТИРУЕТ** «target»;
- **spread**: const merged = { ...a, ...b } — «новый** «объект** (не «мутация», «предпочтительнее**).

«Порядок**: «позднее** «источник** «перебивает** «раннее** ({ ...a, ...b } — b «сверху**).

### «Проверка**: hasOwn, in, === undefined
- **Object.hasOwn(obj, key)** (или obj.hasOwnProperty(key)) — «своё** «свойство** (не «из** «прототипа**);
- **key in obj** — «любое** «свойство** («своё** «и** «наследованные**);
- **obj[key] === undefined** — «нет** «или** «undefined».

«Правило**: «проверка** «своего** «свойства** → hasOwn (надёжно** «для** «пользовательских** «ключей** — "constructor" «может** «быть** «из** «прототипа»).

### fromEntries: «массив** «пар** → «объект**
**Object.fromEntries(pairs)** — «обратный** «операция** «к** entries:
```js
const pairs = [["a", 1], ["b", 2]];
const obj = Object.fromEntries(pairs); // { a: 1, b: 2 }
```
«Паттерн**: «таблица** «поиска** «из** «массива** (items.map(i => [i.id, i]) → fromEntries → «поиск** «по** «id** O(1).

TIP: «обход** «объекта** «для** «простого** «суммирования/списка** — Object.values + reduce/map («короче** for...in). «Для** «ключей** «в** «логике** (условия** «по** «ключу**) — for...in «или** entries.

NOTE: Object.keys «видит** «только** «собственные** «свойства** (не «прототип**). «Числовые** «ключи** («индексы** «массива**) — «отсортированы** «по** «числу», «остальные** — «по** «порядку** «вставки».

## Пример
```js
const user = { name: "A", age: 25, city: "MSK" };

// «Обход**:
console.log(Object.keys(user));    // ["name", "age", "city"]
console.log(Object.values(user));  // ["A", 25, "MSK"]
console.log(Object.entries(user)); // [["name","A"], ["age",25], ["city","MSK"]]

// «Обход** «через** «массивы**:
const sum = Object.values({ a: 1, b: 2, c: 3 }).reduce((s, x) => s + x, 0);
console.log(sum); // 6

// «Объединение**:
const a = { x: 1, y: 2 };
const b = { y: 99, z: 3 };
const merged = { ...a, ...b };
console.log(merged); // { x: 1, y: 99, z: 3 }

// «Проверка**:
console.log(Object.hasOwn(user, "name"));    // true
console.log("name" in user);                 // true
console.log(Object.hasOwn(user, "toString"));// false («из** «прототипа»)

// fromEntries:
const items = [{ id: 1, name: "a" }, { id: 2, name: "b" }];
const byId = Object.fromEntries(items.map((i) => [i.id, i]));
console.log(byId[2].name); // "b" («поиск** «по** «id» O(1))
```
Разбор: keys/values/entries — «обход**, assign/spread — «объединение**, hasOwn — «своё**, fromEntries — «таблица**.

## Частые ошибки
WARN: for...in «без** hasOwn — «идут** «и** «наследованные** «свойства** (прототип**: "toString", "constructor"); «свои** — if (Object.hasOwn(obj, key)).
WARN: Object.assign(target, src) «ожидаете** «новый** «объект** — «мутация** «target** (возвращает target); «новый** — { ...target, ...src }.
WARN: hasOwnProperty «вызываете** «как** obj.hasOwnProperty.call(obj, key) «из-за** «перезаписи** «в** «объекте** — «используйте** Object.hasOwn (надёжно** «с** «ES2022»).
WARN: Object.keys «для** ««всех** «ключей** «включая** «прототип** — «только** «свои**; «все** «— for...in.
WARN: fromEntries «с** «дублирующимися** «ключами** — «позднее** «перебивает** (как «в** «объекте**).

## Практическое задание
1. В скелете задания «обойдите** «объект** «через** keys/values/entries — console.log «каждый**.
2. Напишите sumValues(obj): «сумма** «числовых** «значений** (values + filter + reduce).
3. Напишите invert(obj): «поменять** «местами** «ключи/значения** (entries + fromEntries).
4. Напишите pick(obj, keys): «новый** «объект** «только** «с** «ключами** keys (entries + filter + fromEntries).
5. Бонус: «таблица** «поиска**: items → byId (fromEntries) — «найдите** «элемент** «по** «id** «и** «объясните** «почему** «быстрее** «find.
