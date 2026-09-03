---
id: js-errors
track: javascript
type: reference
section: reference
order: 3
title:
  en: "Error Handling"
  ru: "Обработка ошибок"
excerpt:
  en: "Every built-in error type, the try/catch/finally syntax, how errors behave in promises and async/await, and how to build your own error classes."
  ru: "Все встроенные типы ошибок, синтаксис try/catch/finally, как ошибки ведут себя в promise и async/await и как строить собственные классы ошибок."
version: "es2023"
updated: 2026-09-03
---

Every error type the engine throws, the try/catch/finally syntax, how errors behave in promises and async/await, and how to build your own error classes. Error handling is the difference between a program that crashes with a stack trace at 3 a.m. and one that fails gracefully and tells you why.

## Built-in error types

| Type | When the engine throws it | Example |
| --- | --- | --- |
| Error | generic, unknown reason | new Error("failed") |
| TypeError | wrong type, not callable, member of undefined | f(), undefined.foo() |
| ReferenceError | reading an undeclared variable | console.log(notDeclared) |
| RangeError | a value out of its allowed range | new Array(-1), recursion depth |
| SyntaxError | invalid syntax in a parsed source | JSON.parse("{bad}"), new Function("let") |
| URIError | malformed URI components | decodeURI("%%%") |
| EvalError | reserved for eval, almost never thrown | — |
| AggregateError | several errors bundled into one | Promise.any([... all rejected]) |

```js
const f = undefined;
f(); // TypeError: f is not a function

let total;
total += 1; // total объявлен, но undefined: undefined + 1 → NaN (без ошибки)

console.log(notDeclared); // ReferenceError

new Array(-1); // RangeError
JSON.parse("{ not json }"); // SyntaxError
decodeURI("%%%"); // URIError
```

Every Error instance carries three fields you will actually use: `message` (the string you pass to the constructor), `name` (the type) and `stack` (the call chain at the throw moment). Logging `err.stack` instead of `err.message` is what turns "something went wrong" into a bug you can find.

## try / catch / finally

```js
function safeParse(text) {
  try {
    const value = JSON.parse(text);
    if (typeof value !== "object") throw new SyntaxError("expected an object");
    return value;
  } catch (err) {
    if (err instanceof SyntaxError) return null; // ожидаемое падение: гасим
    throw err;                                   // неожиданное: пробрасываем
  } finally {
    console.log("parse attempt finished"); // выполняется на любом пути
  }
}
```

The mechanics, one rule per line. The `catch` block runs only if something in `try` throws. The `finally` block runs on every path — normal completion, `return`, or a throw that escapes. You can `throw` any value, but `throw new Error(...)` is the habit, because only Error instances come with a stack. The catch parameter is block-scoped: it does not leak out of the `catch`. And a `try` without a `catch` is legal when you only need the `finally` for cleanup.

> **WARNING**
> Swallowing every error (`catch (e) { }`) is the classic way a bug goes missing. Catch narrowly, inspect with `instanceof`, and rethrow what you do not understand.

## Errors in promises and async/await

Synchronous `try/catch` does not see asynchronous failures unless you cross the `await`. In promise chains the `catch` sits on the chain itself; in async functions, `await` brings the rejection back into `try/catch` range.

```js
fetch("/api/users")
  .then((res) => {
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  })
  .catch((err) => console.error("load failed:", err.message));

async function loadUser(id) {
  try {
    const res = await fetch("/api/users/" + id);
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  } catch (err) {
    if (err instanceof TypeError) throw new Error("network down");
    throw err;
  }
}
```

A rejected promise with no `.catch` anywhere and no `await` inside a `try` becomes an unhandled rejection — in the browser it shows up as an `unhandledrejection` event, in Node as a warning (and a crash since the modern defaults). The retry pattern from the task catalog is just `catch` plus a timer: try again until the attempt budget is spent, then throw the last error.

> **WARNING**
> Only `await`ed rejections reach the `catch`. A promise created inside `try` but never awaited — `const p = api();` and then `return p` — escapes the block, and its failure lands in "unhandled" instead of your handler.

## Custom error classes

When a failure has a shape, give it a class. Extend `Error`, call `super` with the message, set `this.name`, and add the payload fields the caller needs.

```js
class ValidationError extends Error {
  constructor(field, message) {
    super(message);                    // ставит this.message
    this.name = "ValidationError";     // ставит this.name
    this.field = field;                // собственный payload
  }
}

function validateEmail(email) {
  if (!email || !email.includes("@")) {
    throw new ValidationError("email", "email is required");
  }
}

try {
  validateEmail("");
} catch (err) {
  if (err instanceof ValidationError) {
    console.log(err.field, "→", err.message); // email → email is required
  } else {
    throw err; // чужая ошибка — пробрасываем дальше
  }
}
```

The class is what lets the caller branch on the failure kind instead of parsing message text: `instanceof ValidationError` is stable, `message.includes("email")` is not. In modern engines the stack of a subclassed error is captured correctly; the one thing you must keep doing yourself is setting `this.name`, because the default stays "Error".

## When to check, and how

| Situation | What to do |
| --- | --- |
| network request | check res.ok, throw with the status in the message |
| JSON.parse | try/catch, expect SyntaxError |
| Map lookup | check has or undefined — not an error |
| array index out of range | arr[i] is undefined — not an error |
| file read in Node | reject with err.code "ENOENT" — check the code |
| user input | validate and throw ValidationError |
| the very end of a web app | listeners for error and unhandledrejection |

```js
// страховка на весь веб-приложение
window.addEventListener("unhandledrejection", (e) => {
  console.error("unhandled:", e.reason);
});
```

The split is simple: expected failures (bad input, a missing row, a 404) are checked and handled at the boundary; unexpected ones (TypeError deep in logic) are allowed to fly — the top-level listener logs them, and you fix the code. Error objects are a transport, not a log: throw with context, catch at the layer that can do something.

> **TIP**
> Log `err.stack`, not just `err.message`. The message says what happened; the stack says where — and "where" is what you actually fix.

<!-- RU -->

Все типы ошибок, которые бросает движок, синтаксис try/catch/finally, как ошибки ведут себя в promise и async/await и как строить собственные классы ошибок. Обработка ошибок — это разница между программой, которая в три часа ночи падает со stack trace, и программой, которая падает аккуратно и говорит, почему.

## Встроенные типы ошибок

| Тип | Когда движок его бросает | Пример |
| --- | --- | --- |
| Error | универсальный, причина не определена | new Error("failed") |
| TypeError | неправильный тип, не вызывается, член undefined | f(), undefined.foo() |
| ReferenceError | чтение не объявленной переменной | console.log(notDeclared) |
| RangeError | значение вне допустимого диапазона | new Array(-1), глубина рекурсии |
| SyntaxError | невалидный синтаксис в разбораемом источнике | JSON.parse("{bad}"), new Function("let") |
| URIError | некорректные компоненты URI | decodeURI("%%%") |
| EvalError | зарезервирован для eval, почти не бросается | — |
| AggregateError | несколько ошибок в одном | Promise.any([... все rejected]) |

```js
const f = undefined;
f(); // TypeError: f is not a function

let total;
total += 1; // total объявлен, но undefined: undefined + 1 → NaN (без ошибки)

console.log(notDeclared); // ReferenceError

new Array(-1); // RangeError
JSON.parse("{ not json }"); // SyntaxError
decodeURI("%%%"); // URIError
```

Каждый инстанс Error несёт три поля, которые вы реально используете: `message` (строка, которую вы передаёте в конструктор), `name` (тип) и `stack` (цепочка вызовов на момент броска). Логировать `err.stack` вместо `err.message` — это то, что превращает «что-то пошло не так» в баг, который можно найти.

## try / catch / finally

```js
function safeParse(text) {
  try {
    const value = JSON.parse(text);
    if (typeof value !== "object") throw new SyntaxError("expected an object");
    return value;
  } catch (err) {
    if (err instanceof SyntaxError) return null; // ожидаемое падение: гасим
    throw err;                                   // неожиданное: пробрасываем
  } finally {
    console.log("parse attempt finished"); // выполняется на любом пути
  }
}
```

Механика, по правилу на строку. Блок `catch` выполняется только если в `try` что-то бросилось. Блок `finally` выполняется на любом пути — нормальное завершение, `return` или вылетевший throw. Бросать можно что угодно, но `throw new Error(...)` — это привычка, потому что только у инстансов Error есть stack. Параметр catch живёт в своём блоке: он не вылезает наружу. И `try` без `catch` — законно, когда нужен только `finally` для уборки.

> **WARNING**
> Глотать каждую ошибку (`catch (e) { }`) — классический способ, которым баг исчезает без следа. Ловите узко, проверяйте `instanceof` и пробрасывайте то, что не понимаете.

## Ошибки в promise и async/await

Синхронный `try/catch` не видит асинхронные сражения, пока вы не пересечёте `await`. В цепочках promise `catch` стоит на самой цепочке; в async-функциях `await` возвращает rejection обратно в область видимости `try/catch`.

```js
fetch("/api/users")
  .then((res) => {
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  })
  .catch((err) => console.error("load failed:", err.message));

async function loadUser(id) {
  try {
    const res = await fetch("/api/users/" + id);
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  } catch (err) {
    if (err instanceof TypeError) throw new Error("network down");
    throw err;
  }
}
```

Reject-обещание без `.catch` где-либо и без `await` внутри `try` становится unhandled rejection — в браузере это событие `unhandledrejection`, в Node — предупреждение (а в современных дефолтах и крах). Паттерн retry из каталога задач — это просто `catch` плюс таймер: повторяйте, пока не кончится бюджет попыток, затем бросайте последнюю ошибку.

> **WARNING**
> В `catch` доходят только `await`-ed rejection. Обещание, созданное внутри `try`, но так и не дождавшееся `await` — `const p = api();` и затем `return p` — вылетает из блока, и его сражение попадает в «unhandled», а не в ваш хендлер.

## Собственные классы ошибок

Когда у сражения есть форма — дайте ему класс. Наследуйте от `Error`, вызовите `super` с сообщением, поставьте `this.name` и добавьте поля payload, которые нужны вызывающему.

```js
class ValidationError extends Error {
  constructor(field, message) {
    super(message);                    // ставит this.message
    this.name = "ValidationError";     // ставит this.name
    this.field = field;                // собственный payload
  }
}

function validateEmail(email) {
  if (!email || !email.includes("@")) {
    throw new ValidationError("email", "email is required");
  }
}

try {
  validateEmail("");
} catch (err) {
  if (err instanceof ValidationError) {
    console.log(err.field, "→", err.message); // email → email is required
  } else {
    throw err; // чужая ошибка — пробрасываем дальше
  }
}
```

Именно класс позволяет вызывающему ветвиться по виду сражения, а не разбирать текст сообщения: `instanceof ValidationError` стабилен, `message.includes("email")` — нет. В современных движках stack у наследуемого от Error класса снимается корректно; то, что вы обязаны делать сами, — ставить `this.name`, потому что по умолчанию остаётся "Error".

## Когда и что проверять

| Ситуация | Что делать |
| --- | --- |
| сетевой запрос | проверять res.ok, бросать со статусом в сообщении |
| JSON.parse | try/catch, ждать SyntaxError |
| lookup в Map | проверять has или undefined — это не ошибка |
| индекс массива вне диапазона | arr[i] будет undefined — это не ошибка |
| чтение файла в Node | reject с err.code "ENOENT" — проверять код |
| пользовательский ввод | валидировать и бросать ValidationError |
| самый конец веб-приложения | слушатели error и unhandledrejection |

```js
// страховка на весь веб-приложение
window.addEventListener("unhandledrejection", (e) => {
  console.error("unhandled:", e.reason);
});
```

Разделение простое: ожидаемые сражения (плохой ввод, отсутствующая строка, 404) проверяются и обрабатываются на границе; неожиданные (TypeError глубоко в логике) пускают летать — топовый слушатель логирует, а код чините вы. Объекты ошибок — транспорт, а не лог: бросайте с контекстом, ловите на том уровне, где можно что-то сделать.

> **TIP**
> Логируйте `err.stack`, а не только `err.message`. Сообщение говорит, что случилось; stack говорит, где — а «где» это то, что вы на самом деле чините.
