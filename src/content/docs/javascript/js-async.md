---
id: js-async
track: javascript
type: guide
section: async
order: 5
title:
  en: "Async: Promises & async/await"
  ru: "Асинхронность: Promise и async/await"
excerpt:
  en: "Callbacks, the three promise states, all/race/allSettled/any, and async/await with try/catch — plus the real-world patterns of timeout and retry."
  ru: "Колбэки, три состояния promise, all/race/allSettled/any и async/await с try/catch — плюс реальные паттерны timeout и retry."
version: "es2023"
updated: 2026-09-03
relatedTask: js-011
---

JavaScript does one thing at a time, yet real programs wait on timers, network and disk all the time. This page explains how the language solves that: callbacks, promises with their three states, the combinators for running batches, and async/await — the syntax that makes asynchronous code read like sequential code.

## The problem with callbacks

Before promises, async code nested callbacks, and each additional step added another level of indentation. It works, but it reads like a staircase.

```js
setTimeout(() => {
  console.log("step 1");
  setTimeout(() => {
    console.log("step 2");
    setTimeout(() => console.log("step 3"), 10);
  }, 10);
}, 10);
```

The deeper problem is errors: they must be reported through a hidden second argument in every callback — the `(err, data)` convention — and there is no single place to handle a failure from five levels up. Promises were introduced to fix exactly this.

## Promises: three states

A promise is an object representing a future value. It starts `pending`, then becomes either `fulfilled` (with a value) or `rejected` (with a reason). The transition happens once and never reverses.

```js
const slow = new Promise((resolve, reject) => {
  setTimeout(() => resolve("done"), 30);
});

slow
  .then((value) => console.log("got:", value))       // runs on fulfill
  .catch((reason) => console.error("failed:", reason)) // runs on reject
  .finally(() => console.log("settled"));              // runs either way
```

You can build a promise from scratch with the `new Promise` constructor: the executor runs immediately and hands you two functions, `resolve` and `reject`. Calling one of them settles the promise, and the second call is simply ignored.

```js
const fromTimer = (ms, value) =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

fromTimer(20, "hi").then(console.log); // "hi" after ~20ms
```

### then, catch, finally

`then` accepts an onFulfilled callback, `catch` is sugar for `then(null, onRejected)`, and `finally` runs regardless of the outcome. Every one of them returns a new promise — that is how chains work, and it is also why a `return` inside a callback keeps the chain going.

```js
fetch("/api/user")
  .then((res) => res.json())          // returns a value → next then gets it
  .then((user) => user.name)          // returns "Ada" → next then gets "Ada"
  .then((name) => console.log(name))
  .catch((err) => console.error(err)) // one handler for the whole chain
  .finally(() => console.log("done"));
```

> **TIP**
> Inside a `then` callback, any returned value is automatically wrapped into a fulfilled promise. Throw — or return a rejected promise — to hand the failure to the next `catch`.

## Combinators: running batches

`Promise.all` waits for every promise to fulfill — but one rejection rejects the whole batch immediately, and the rest are abandoned. `Promise.race` settles with whichever settles first, in either state. `Promise.allSettled` never rejects; it reports the outcome of every promise. `Promise.any` fulfills with the first success and rejects with an AggregateError only when every promise fails.

```js
const fast = Promise.resolve(1);
const slowP = new Promise((r) => setTimeout(() => r(2), 40));
const bad = Promise.reject(new Error("boom"));

Promise.all([fast, slowP]);      // resolves [1, 2]
Promise.all([fast, bad]);        // rejects immediately: "boom"
Promise.race([fast, slowP]);     // resolves 1 — the first to settle
Promise.allSettled([fast, bad]); // [ {status: "fulfilled", value: 1}, {status: "rejected", reason: ...} ]
Promise.any([fast, bad]);        // resolves 1
```

Choosing the right combinator is a product decision: `all` when every result matters, `race` for the first response that arrives, `allSettled` when partial failure is acceptable, `any` when you are trying several sources and any one of them is enough.

## async/await

An `async` function always returns a promise, and `await` pauses that function until a promise settles — without blocking the rest of the program. The event loop keeps processing clicks and timers while one function waits.

```js
async function loadUser(id) {
  const res = await fetch(`/api/users/${id}`);
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}

// sequential: the second call depends on the first
async function loadDashboard(id) {
  const user = await loadUser(id);
  const posts = await loadPosts(user.id);
  return { user, posts };
}

// parallel: independent calls run together
async function loadDashboardParallel(id) {
  const [user, posts] = await Promise.all([loadUser(id), loadPosts(id)]);
  return { user, posts };
}
```

Read top to bottom and the code behaves like its synchronous version — but the page stays responsive the whole time. `await` also works on plain values: it simply passes them through, which makes functions that sometimes return promises easy to consume.

### try/catch with await

Inside async functions, errors surface exactly where you expect them: around the `await`. `try/catch/finally` works just as in synchronous code.

```js
async function safeLoad(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  } catch (err) {
    console.error("load failed:", err.message);
    return null;
  } finally {
    console.log("loading finished");
  }
}
```

Outside async functions you are back in promise-land: attach `.catch` somewhere in the chain, or wrap the call in an async function. At the module top level, a top-level `await` is allowed, and an unhandled rejection there terminates the module — so keep a catch even there.

## Real patterns: timeout and retry

Two combinator-based patterns cover most production needs. A timeout races your call against a timer that rejects — whichever settles first wins.

```js
async function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

const data = await withTimeout(fetch("/api/slow").then((r) => r.json()), 2000);
```

A retry loop re-attempts a flaky call a fixed number of times, pausing between attempts, and throws the last error if everything fails.

```js
async function retry(fn, times, delayMs) {
  let lastErr;
  for (let i = 1; i <= times; i += 1) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < times) await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}

const data = await retry(() => fetch("/api/flaky").then((r) => r.json()), 3, 200);
```

> **WARNING**
> `await` inside a `for` loop runs iterations one by one. For independent calls, map them to promises first and `await Promise.all` — that way the network work actually happens in parallel.

## Common mistakes

> **WARNING**
> Forgetting `await` on an async call gives you a promise where you expect data — every property access returns `undefined` and nothing throws. If your data "suddenly became a promise", search for the missing `await`.

> **WARNING**
> A rejected promise with no handler becomes an unhandled rejection. Either attach `.catch` somewhere in the chain or `await` it inside a `try`.

> **TIP**
> `setTimeout` delays, it does not pause: there is no built-in "wait for N milliseconds" you can await. Define `const sleep = (ms) => new Promise((r) => setTimeout(r, ms));` once and use it everywhere — the most useful one-liner in async code.

That is the async core. The final guide in the track rounds it off with the modern syntax that makes all of this shorter to write.

<!-- RU -->

JavaScript делает одну вещь за раз, но реальные программы всё время ждут: таймеры, сеть, диск. На этой странице — как язык это решает: колбэки, промисы с тремя состояниями, комбинаторы для партий и async/await — синтаксис, из-за которого асинхронный код читается как последовательный.

## Проблема с колбэками

До промисов асинхронный код вкладывал колбэки, и каждый следующий шаг добавлял уровень отступа. Работает, но читается как лестница.

```js
setTimeout(() => {
  console.log("шаг 1");
  setTimeout(() => {
    console.log("шаг 2");
    setTimeout(() => console.log("шаг 3"), 10);
  }, 10);
}, 10);
```

Более глубокая проблема — ошибки: их нужно сообщать через скрытый второй аргумент каждого колбэка — конвенцию `(err, data)` — и нет единого места, где можно перехватить сбой с пятого уровня вверх. Промисы были введены ровно для этого.

## Промисы: три состояния

Промис — объект, представляющий будущее значение. Он стартует в состоянии `pending`, затем становится либо `fulfilled` (со значением), либо `rejected` (с причиной). Переход случается один раз и не обращается назад.

```js
const slow = new Promise((resolve, reject) => {
  setTimeout(() => resolve("done"), 30);
});

slow
  .then((value) => console.log("got:", value))       // при успехе
  .catch((reason) => console.error("failed:", reason)) // при отказе
  .finally(() => console.log("settled"));              // в любом случае
```

Промис можно построить с нуля через конструктор `new Promise`: исполнитель запускается сразу и передаёт вам две функции, `resolve` и `reject`. Вызов одной из них селяет промис, второй вызов просто игнорируется.

```js
const fromTimer = (ms, value) =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

fromTimer(20, "hi").then(console.log); // "hi" через ~20мс
```

### then, catch, finally

`then` принимает колбэк onFulfilled, `catch` — сахар над `then(null, onRejected)`, а `finally` выполняется независимо от исхода. Каждый из них возвращает новый промис — именно так работают цепочки, и именно поэтому `return` внутри колбэка продолжает цепь.

```js
fetch("/api/user")
  .then((res) => res.json())          // возвращает значение → следующий then его получает
  .then((user) => user.name)          // возвращает "Ada" → следующий then получает "Ada"
  .then((name) => console.log(name))
  .catch((err) => console.error(err)) // один хендлер на всю цепь
  .finally(() => console.log("готово"));
```

> **TIP**
> Внутри колбэка `then` любое возвращённое значение автоматически оборачивается в fulfilled-промис. Чтобы передать сбой следующему `catch` — бросьте ошибку или верните отклонённый промис.

## Комбинаторы: запуск партий

`Promise.all` ждёт, пока все промисы не фулфиллятся, — но один reject мгновенно отклоняет всю партию, а остальные бросаются. `Promise.race` селяется тем, кто селится первым, в любом состоянии. `Promise.allSettled` никогда не отклоняется: он сообщает исход каждого промиса. `Promise.any` фулфиллится первым успехом и отклоняется AggregateError только когда все промисы упали.

```js
const fast = Promise.resolve(1);
const slowP = new Promise((r) => setTimeout(() => r(2), 40));
const bad = Promise.reject(new Error("boom"));

Promise.all([fast, slowP]);      // резолвится [1, 2]
Promise.all([fast, bad]);        // сразу отклоняется: "boom"
Promise.race([fast, slowP]);     // резолвится 1 — первый по сроку
Promise.allSettled([fast, bad]); // [ {status: "fulfilled", value: 1}, {status: "rejected", reason: ...} ]
Promise.any([fast, bad]);        // резолвится 1
```

Выбор комбинатора — продуктовое решение: `all`, когда важен каждый результат; `race`, когда нужен первый пришедший ответ; `allSettled`, когда допустим частичный сбой; `any`, когда вы пробуете несколько источников и хватает любого.

## async/await

`async`-функция всегда возвращает промис, а `await` останавливает эту функцию до момента, пока промис не селится, — без блокировки остальной программы. Event loop продолжает обрабатывать клики и таймеры, пока одна функция ждёт.

```js
async function loadUser(id) {
  const res = await fetch(`/api/users/${id}`);
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}

// последовательно: второй вызов зависит от первого
async function loadDashboard(id) {
  const user = await loadUser(id);
  const posts = await loadPosts(user.id);
  return { user, posts };
}

// параллельно: независимые вызовы идут вместе
async function loadDashboardParallel(id) {
  const [user, posts] = await Promise.all([loadUser(id), loadPosts(id)]);
  return { user, posts };
}
```

Читайте сверху вниз — и код ведёт себя как синхронная версия, но страница остаётся отзывчивой всё это время. `await` работает и с обычными значениями: просто пропускает их, что делает функции, иногда возвращающие промисы, удобными для потребления.

### try/catch с await

Внутри async-функций ошибки выходят ровно там, где вы их ждёте: вокруг `await`. `try/catch/finally` работает так же, как в синхронном коде.

```js
async function safeLoad(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  } catch (err) {
    console.error("load failed:", err.message);
    return null;
  } finally {
    console.log("загрузка завершена");
  }
}
```

Вне async-функций вы снова в мире промисов: прикрепите `.catch` где-нибудь в цепи или обервите вызов в async-функцию. На топ-уровне модуля разрешён top-level `await`, а незахваченный reject там завершает модуль — поэтому держите catch и там.

## Реальные паттерны: timeout и retry

Два комбинаторных паттерна накрывают большую часть нужд продакшена. Таймаут ставит ваш вызов в race против таймера, который отклоняется: побеждает, кто селится первым.

```js
async function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

const data = await withTimeout(fetch("/api/slow").then((r) => r.json()), 2000);
```

Цикл повторов вызывает капризную функцию фиксированное число раз, делает паузу между попытками и бросает последнюю ошибку, если всё упало.

```js
async function retry(fn, times, delayMs) {
  let lastErr;
  for (let i = 1; i <= times; i += 1) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < times) await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}

const data = await retry(() => fetch("/api/flaky").then((r) => r.json()), 3, 200);
```

> **WARNING**>
> `await` внутри `for` запускает итерации одна за другой. Для независимых вызовов сначала мапните их в промисы и `await Promise.all` — тогда сетевая работа действительно происходит параллельно.

## Частые ошибки

> **WARNING**>
> Забытый `await` на async-вызове даёт промис там, где вы ждёте данных: каждое обращение к свойству возвращает `undefined`, и ничего не падает. Если данные «вдруг стали промисом» — ищите пропущенный `await`.

> **WARNING**>
> Отклонённый промис без хендлера становится unhandled rejection. Либо прикрепите `.catch` где-нибудь в цепи, либо `await`-ните его внутри `try`.

> **TIP**>
> `setTimeout` задерживает, а не ставит на паузу: встроенного «подождать N миллисекунд» для await нет. Определите один раз `const sleep = (ms) => new Promise((r) => setTimeout(r, ms));` и используйте везде — самая полезная однострочная функция в асинхронном коде.

Это и есть ядро асинхронности. Последний гайд трека завершает картину современным синтаксисом, который делает всё это короче в написании.
