---
id: js-operators
track: javascript
type: reference
section: reference
order: 1
title:
  en: "Operators & Syntax"
  ru: "Операторы и синтаксис"
excerpt:
  en: "Every JavaScript operator on one page: arithmetic, comparison, logical and assignment operators, the precedence order, and the statement syntax of if, for, switch, ternary and labels."
  ru: "Все операторы JavaScript на одной странице: арифметика, сравнение, логика и присваивание, порядок приоритетов и синтаксис операторов if, for, switch, тернарника и labels."
version: "es2023"
updated: 2026-09-03
---

Every operator the language has, plus the statement syntax around them, gathered on one page: what each operator does, in what order the engine evaluates them, and the traps that mixed precedence creates. This is the page to keep open while you are reading an error message and trying to understand what the expression actually did.

## Operator reference

| Operator | What it does | Notes |
| --- | --- | --- |
| + | adds numbers, concatenates strings | a string on either side wins |
| - * / % | subtract, multiply, divide, remainder | 7 % 2 → 1, 10 / 4 → 2.5 |
| ** | exponent | 2 ** 3 → 8 |
| = | assignment | returns the assigned value |
| += -= *= /= %= **= | compound assignment | x += 1 is x = x + 1 |
| === !== | strict equality and inequality | no coercion: 1 === "1" → false |
| == != | loose equality and inequality | coerces both sides first: 0 == "" → true (a trap) |
| < <= > >= | comparisons | the result is a boolean |
| ! | logical NOT | !false → true |
| && | logical AND | short-circuits, returns an operand, not a boolean |
| OR (two bars) | logical OR | short-circuits, returns an operand, not a boolean |
| ?? | nullish coalescing | right side only for null / undefined |
| ?. | optional chaining | the chain stops with undefined |
| in | key-in-object check | "a" in { a: 1 } → true |
| of | value iteration in for…of | works with any iterable |
| typeof | type name as a string | typeof 1 → "number", never throws |
| void | evaluates and returns undefined | void 0 |
| delete | removes an own property | delete obj.key → true |
| , | comma | left to right, returns the last value |
| ... | rest and spread | in parameters, arrays, objects |
| ? : | ternary | cond ? a : b |
| << >> >>> | bitwise shifts | 1 << 3 → 8 |
| & ^ | bitwise AND and XOR | 5 & 3 → 1, 5 ^ 3 → 6 |
| bitwise OR (single bar) | bitwise OR | 5 bitwise-OR 3 → 7 |
| ~ | bitwise NOT | ~1 → -2 |
| new | constructs through a constructor | new Date() |
| backticks with ${} | template literal | `n=${1}` |

Two operators deserve more than a row: AND and OR both return one of their operands instead of a boolean. That is why `"" && "x"` gives `""`, why `null || 5` gives `5`, and why the `x || fallback` idiom works at all. The moment you need a real boolean, wrap the value: `Boolean(value)` or `!!value`.

```js
"5" + 1;        // "51" — строка с любой стороны означает склейку
null || 5;      // 5 — null falsy, возвращается 5
0 && 10;        // 0 — AND возвращает первый falsy-операнд
"a" && "b";     // "b" — все truthy: возвращается последний
!true === true; // false — ! связывается крепче, чем ===
1 << 3;         // 8 — сдвиг влево на 3
~0;             // -1 — битовый NOT не то же самое, что смена знака
```

Two last operators from the table deserve a sentence each. `void` evaluates its argument and returns `undefined` — the idiom `void 0` exists because `undefined` used to be a reassignable global property in the early days of the language; in modern code plain `undefined` is fine. And the comma operator exists to make the for-loop header work: `(i += 1, j -= 1)` in one cell of the loop. Outside the loop header it is mostly a source of confusion, so prefer two statements.

Strict equality is the default in modern code: `===` compares values without any conversion. The one loose check worth keeping is `value == null`, which is true for both `null` and `undefined` — a compact "is empty" test. Everything else — `0 == ""`, `1 == "1"` — is a trap waiting for a refactor.

## Precedence and grouping

The engine evaluates operators in a fixed order, from tightest binding to loosest. You rarely need to memorize the whole ladder — you need the top of it and the few places where intuition lies.

| Binding | Operators | Note |
| --- | --- | --- |
| 1 | grouping (), member . ?. [], computed [] | evaluated first |
| 2 | exponent ** | right-associative: `2 ** 3 ** 2` → 512 |
| 3 | unary: !, ~, +, -, typeof, void, delete, ++, -- | looser than `**`: `-1 ** 2` → -1 |
| 4 | multiplicative *, /, % | left to right |
| 5 | additive +, - | left to right |
| 6 | shift <<, >>, >>> | |
| 7 | relational <, >, <=, >=, in, instanceof | not chainable: 0 < 1 < 2 → true |
| 8 | equality ===, !==, ==, != | |
| 9 | bitwise AND, then XOR, then bitwise OR | |
| 10 | logical AND, then OR | short-circuit |
| 11 | nullish ?? | cannot mix with AND / OR without parens |
| 12 | assignment = and compound | chains right to left: a = b = 5 |
| 13 | ternary ? : | |
| 14 | comma , | loosest, returns the last value |

```js
2 ** 3 ** 2;      // 512 — правоассоциативно
-1 ** 2;          // -1 — ** крепче унарного минуса
2 + 3 * 4;        // 14
let a, b;
a = b = 5;        // оба равны 5 — цепочка присваивания справа налево
0 < 1 < 2;        // true — первое сравнение даёт true, и true < 2
```

The practical rule: arithmetic binds tighter than comparisons, comparisons tighter than logic. `x + y === 0` is `(x + y) === 0`, which is almost always what you meant. The places where it fails are exactly the rows above — exponent versus unary minus, non-chaining comparisons, and the `??` / AND / OR parenthesization rule.

> **TIP**
> If you have to think about the order, parenthesize. `(2 + 3) * 4` costs nothing and removes the doubt from the code — and from every future reader.

## Statement and expression syntax

| Construct | Syntax | What it does |
| --- | --- | --- |
| if / else if / else | if (cond) { … } else { … } | conditional branching |
| ternary | cond ? a : b | an expression that returns a value |
| for | for (let i = 0; i < n; i += 1) | classic counter loop |
| for…of | for (const x of arr) | values of any iterable |
| for…in | for (const k in obj) | keys — including inherited ones |
| while / do…while | while (cond) { … } | runs while the condition holds |
| switch | switch (x) { case 1: … break } | multi-way branch; falls through without break |
| break / continue | break outer; | exit the loop; with a label — the outer one |
| try / catch / finally | try { … } catch (e) { … } finally { … } | error handling |
| comma expression | (init, value) | evaluates both, returns the last |
| IIFE | (() => { … })() | a function that runs immediately |
| function declaration | function f() { … } | hoisted — callable before its line |
| arrow function | const f = () => { … } | not hoisted — TDZ until the line |
| class | class A { m() { … } } | syntactic sugar over prototypes |

```js
const items = ["a", "b", "c"];
for (const [i, v] of items.entries()) console.log(i, v); // 0 "a", 1 "b", 2 "c"
for (const key in { x: 1, y: 2 }) console.log(key);      // x, y
```

Labels let you address a named loop from inside:

```js
outer: for (let i = 0; i < 3; i += 1) {
  for (let j = 0; j < 3; j += 1) {
    if (j === 1) continue outer; // внутренний цикл по сути пропускается
  }
}
```

The hoisting difference between the two function forms matters when code runs top to bottom: a `function` declaration is visible throughout its scope before its line, while an arrow in a `const` is not — reading it early is a ReferenceError, the temporal dead zone. In modules with imports at the top you rarely feel it; in a long script it is the difference between "works" and "undefined is not a function". Labels, in turn, have exactly one honest use: breaking out of nested loops by name — without them the alternative is a boolean flag outside, which is more code and more state.

> **WARNING**
> `for…in` walks keys in an unpredictable order and includes the prototype chain. Use `for…of` for arrays and maps; use `for…in` only for the keys of plain objects — and even then prefer `Object.keys`.

> **WARNING**
> A `case` without `break` (or `return`) silently executes the next case. That is the source of half of all mysterious switch bugs; when the fall-through is intentional, mark it with a comment.

<!-- RU -->

Все операторы языка, плюс окружающий их синтаксис операторов, собраны на одной странице: что делает каждый оператор, в каком порядке движок их вычисляет и какие ловушки создаёт смешение приоритетов. Это страница, которую держат открытой, когда читаешь сообщение об ошибке и пытаешься понять, что выражение сделало на самом деле.

## Справочник по операторам

| Оператор | Что делает | Примечание |
| --- | --- | --- |
| + | складывает числа, склеивает строки | строка с любой стороны побеждает |
| - * / % | вычитание, умножение, деление, остаток | 7 % 2 → 1, 10 / 4 → 2.5 |
| ** | возведение в степень | 2 ** 3 → 8 |
| = | присваивание | возвращает присвоенное значение |
| += -= *= /= %= **= | составное присваивание | x += 1 то же, что x = x + 1 |
| === !== | строгое равенство и неравенство | без приведения: 1 === "1" → false |
| == != | нестрогое равенство и неравенство | сначала приводит обе стороны: 0 == "" → true (ловушка) |
| < <= > >= | сравнения | результат — булево |
| ! | логическое отрицание | !false → true |
| && | логическое И | short-circuit, возвращает операнд, а не булево |
| ИЛИ (две палочки) | логическое ИЛИ | short-circuit, возвращает операнд, а не булево |
| ?? | nullish coalescing | правая часть только для null / undefined |
| ?. | optional chaining | цепочка останавливается с undefined |
| in | проверка «ключ в объекте» | "a" in { a: 1 } → true |
| of | итерация значений в for…of | работает с любым итерируемым |
| typeof | имя типа строкой | typeof 1 → "number", никогда не падает |
| void | вычисляет и возвращает undefined | void 0 |
| delete | удаляет собственное свойство | delete obj.key → true |
| , | запятая | слева направо, возвращает последнее значение |
| ... | rest и spread | в параметрах, массивах, объектах |
| ? : | тернарник | cond ? a : b |
| << >> >>> | битовые сдвиги | 1 << 3 → 8 |
| & ^ | битовое И и XOR | 5 & 3 → 1, 5 ^ 3 → 6 |
| битовое ИЛИ (одна палочка) | битовое ИЛИ | 5 bitwise-OR 3 → 7 |
| ~ | битовое отрицание | ~1 → -2 |
| new | конструирование через конструктор | new Date() |
| обратные кавычки с ${} | шаблонная строка | `n=${1}` |

Два оператора заслуживают больше, чем строку в таблице: И и ИЛИ возвращают один из своих операндов, а не булево. Поэтому `"" && "x"` даёт `""`, `null || 5` даёт `5`, и именно поэтому работает идиом `x || fallback`. Как только нужно настоящее булево — оберните значение: `Boolean(value)` или `!!value`.

```js
"5" + 1;        // "51" — строка с любой стороны означает склейку
null || 5;      // 5 — null falsy, возвращается 5
0 && 10;        // 0 — AND возвращает первый falsy-операнд
"a" && "b";     // "b" — все truthy: возвращается последний
!true === true; // false — ! связывается крепче, чем ===
1 << 3;         // 8 — сдвиг влево на 3
~0;             // -1 — битовый NOT не то же самое, что смена знака
```

Два последних оператора из таблицы заслуживают по предложению. `void` вычисляет аргумент и возвращает `undefined` — идиом `void 0` существует потому, что в ранние дни языка `undefined` был переприсваиваемым глобальным свойством; в современном коде достаточно обычного `undefined`. А оператор запятой существует, чтобы работал заголовок цикла for: `(i += 1, j -= 1)` в одной ячейке цикла. Вне заголовка цикла он — в основном источник путаницы, поэтому лучше два отдельных оператора.

Строгое равенство — стандарт современного кода: `===` сравнивает значения без каких-либо преобразований. Единственная нестрогая проверка, которую стоит держать: `value == null` — она истинна и для `null`, и для `undefined`, это компактный тест «пусто или нет». Всё остальное — `0 == ""`, `1 == "1"` — ловушка, ждущая рефакторинга.

## Приоритеты и группировка

Движок вычисляет операторы в фиксированном порядке — от самого крепкого связывания к самому слабому. Запоминать всю лестницу почти никогда не нужно — нужно её начало и несколько мест, где интуиция подводит.

| Связывание | Операторы | Примечание |
| --- | --- | --- |
| 1 | группировка (), обращение . ?. [], вычисляемый [] | вычисляется первым |
| 2 | степень ** | правоассоциативный: `2 ** 3 ** 2` → 512 |
| 3 | унарные: !, ~, +, -, typeof, void, delete, ++, -- | слабее, чем `**`: `-1 ** 2` → -1 |
| 4 | умножение *, /, % | слева направо |
| 5 | сложение +, - | слева направо |
| 6 | сдвиги <<, >>, >>> | |
| 7 | сравнения <, >, <=, >=, in, instanceof | не цепляются: 0 < 1 < 2 → true |
| 8 | равенство ===, !==, ==, != | |
| 9 | битовое И, потом XOR, потом битовое ИЛИ | |
| 10 | логическое И, потом ИЛИ | short-circuit |
| 11 | nullish ?? | нельзя смешивать с И / ИЛИ без скобок |
| 12 | присваивание = и составное | цепляется справа налево: a = b = 5 |
| 13 | тернарник ? : | |
| 14 | запятая , | самое слабое, возвращает последнее значение |

```js
2 ** 3 ** 2;      // 512 — правоассоциативно
-1 ** 2;          // -1 — ** крепче унарного минуса
2 + 3 * 4;        // 14
let a, b;
a = b = 5;        // оба равны 5 — цепочка присваивания справа налево
0 < 1 < 2;        // true — первое сравнение даёт true, и true < 2
```

Практическое правило: арифметика связывается крепче сравнений, сравнения — крепче логики. `x + y === 0` читается как `(x + y) === 0`, и почти всегда это то, что вы имели в виду. Места, где правило ломается, — ровно те строки таблицы выше: степень против унарного минуса, несцепляющиеся сравнения и правило скобок для `??` / И / ИЛИ.

> **TIP**
> Если вам приходится думать о порядке — поставьте скобки. `(2 + 3) * 4` ничего не стоит и убирает сомнение из кода — и из головы каждого будущего читателя.

## Синтаксис операторов и выражений

| Конструкт | Синтаксис | Что делает |
| --- | --- | --- |
| if / else if / else | if (cond) { … } else { … } | ветвление по условию |
| тернарник | cond ? a : b | выражение, возвращающее значение |
| for | for (let i = 0; i < n; i += 1) | классический цикл со счётчиком |
| for…of | for (const x of arr) | значения любого итерируемого |
| for…in | for (const k in obj) | ключи — включая наследованные |
| while / do…while | while (cond) { … } | идёт, пока условие истинно |
| switch | switch (x) { case 1: … break } | многоветочное; без break — fallthrough |
| break / continue | break outer; | выход из цикла; с меткой — из внешнего |
| try / catch / finally | try { … } catch (e) { … } finally { … } | обработка ошибок |
| выражение с запятой | (init, value) | вычисляет оба, возвращает последнее |
| IIFE | (() => { … })() | функция, которая выполняется сразу |
| объявление функции | function f() { … } | hoisted — вызывается до своей строки |
| arrow-функция | const f = () => { … } | не hoisted — TDZ до строки |
| class | class A { m() { … } } | синтаксический сахар над прототипами |

```js
const items = ["a", "b", "c"];
for (const [i, v] of items.entries()) console.log(i, v); // 0 "a", 1 "b", 2 "c"
for (const key in { x: 1, y: 2 }) console.log(key);      // x, y
```

Метки (labels) позволяют обратиться к именованному циклу изнутри:

```js
outer: for (let i = 0; i < 3; i += 1) {
  for (let j = 0; j < 3; j += 1) {
    if (j === 1) continue outer; // внутренний цикл по сути пропускается
  }
}
```

Разница в hoisting между двумя формами функций важна, когда код исполняется сверху вниз: объявление `function` видно во всей области видимости до своей строки, а arrow в `const` — нет: раннее чтение — это ReferenceError, временная мёртвая зона. В модулях с импортами наверху вы её почти не чувствуете; в длинном скрипте это разница между «работает» и «undefined is not a function». У меток, в свою очередь, ровно одно честное применение: выход из вложенных циклов по имени — без них альтернатива это булев флаг снаружи, а это больше кода и больше состояния.

> **WARNING**
> `for…in` обходит ключи в непредсказуемом порядке и включает цепочку прототипов. Для массивов и map используйте `for…of`; `for…in` — только для ключей плоских объектов, и то лучше `Object.keys`.

> **WARNING**
> `case` без `break` (или `return`) молча исполняет следующий case. Это источник половины всех загадочных switch-багов; если fallthrough намеренный — пометьте его комментарием.
