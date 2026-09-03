---
id: node-eventloop
track: node
type: reference
section: reference
order: 2
title:
  en: "The Event Loop Model"
  ru: "Модель event loop"
excerpt:
  en: "The six libuv phases, which queue each API lands in, and the ordering rules that explain seemingly strange console output."
  ru: "Шесть фаз libuv, в какие очереди попадают разные API и правила порядка, объясняющие странный вывод в консоли."
version: "node 22"
updated: 2026-09-03
---

All JavaScript in Node runs on a single thread; the event loop is the scheduler that makes one thread feel fast. This reference lists the phases, the queues behind them, and the ordering rules that explain seemingly strange output.

## The phases

libuv drives the loop as a cycle through six phases. Each pass of the cycle gives the loop a chance to run due timers, complete I/O, and handle close events — and between phases the microtask queue is always drained first.

| Phase | What runs there |
| timers | setTimeout and setInterval callbacks whose deadline has come |
| pending callbacks | a handful of system operations, e.g. TCP error callbacks |
| idle, prepare | internal bookkeeping only |
| poll | I/O completion callbacks; also where the loop fetches new work and may block |
| check | setImmediate callbacks |
| close callbacks | e.g. the "close" handler of a socket |

A timer is not a promise of immediacy: `setTimeout(fn, 0)` waits for at least about a millisecond and for the loop to reach the timers phase, while `setImmediate(fn)` runs as soon as the loop reaches the check phase — which, for code in the main module, comes after the very first poll.

## Which queue is which

| API | Where it lands |
| setTimeout(fn, 0) | timers phase, minimum ~1 ms |
| setImmediate(fn) | check phase |
| queueMicrotask(fn), promise .then() | microtask queue, drained after every phase |
| process.nextTick(fn) | next-tick queue, drained before microtasks |
| fs.readFile callback | poll phase (I/O completion) |
| http response callback | poll phase |

Microtasks and next-tick callbacks are "close to the current code": they run before the loop advances to the next phase, so use them for continuation logic, not for deferring I/O.

## Ordering in practice

The snippet below is the canonical ordering probe. In the main module the output is `sync`, `nextTick`, `microtask`, `timer`, `immediate`: the script itself is a task, so both the timer and the immediate are registered before the first poll, and the timers phase wins that race.

```js
setTimeout(() => console.log("timer"), 0);
setImmediate(() => console.log("immediate"));
queueMicrotask(() => console.log("microtask"));
process.nextTick(() => console.log("nextTick"));
console.log("sync");
```

Inside I/O callbacks the picture flips: the immediate is registered while the loop is already in poll, so `setImmediate` usually prints before `setTimeout(fn, 0)`. The practical rules that follow: do not block the loop (offload CPU work to worker threads), keep next-tick chains shallow, and when you suspect a stall, measure with `perf_hooks.monitorEventLoopDelay`.

```js
import { monitorEventLoopDelay } from "node:perf_hooks";

const h = monitorEventLoopDelay({ resolution: 20 });
h.enable();
// … do work …
console.log(h.mean / 1e6, "ms average delay");
h.disable();
```

> **TIP**
> `perf_hooks.monitorEventLoopDelay` gives p50/p99 loop delays — the one metric that tells you whether something is blocking the thread.

<!-- RU -->

Весь JavaScript в Node исполняется на одном потоке; event loop — это планировщик, который заставляет один поток ощущаться быстрым. В этом справочнике — фазы, очереди за ними и правила порядка, объясняющие «странное» поведение вывода.

## Фазы

libuv гоняет цикл как цикл из шести фаз. Каждый проход даёт циклу возможность исполнить просроченные таймеры, завершить I/O и обработать close-события — а между фазами очередь microtask всегда опустеет первой.

| Фаза | Что там исполняется |
| timers | колбэки setTimeout и setInterval, чья пора наступила |
| pending callbacks | горстка системных операций, например колбэки ошибок TCP |
| idle, prepare | только внутренняя бухгалтерия |
| poll | колбэки завершения I/O; здесь же цикл берёт новую работу и может блокироваться |
| check | колбэки setImmediate |
| close callbacks | например хендлер "close" сокета |

Таймер — не гарантия мгновенности: `setTimeout(fn, 0)` ждёт как минимум около миллисекунды и того, что цикл дойдёт до фазы timers, а `setImmediate(fn)` исполняется, когда цикл доходит до фазы check — для кода в главном модуле это после самого первого poll.

## Какая очередь за чем

| API | Куда попадает |
| setTimeout(fn, 0) | фаза timers, минимум ~1 мс |
| setImmediate(fn) | фаза check |
| queueMicrotask(fn), promise .then() | очередь microtask, опустошается после каждой фазы |
| process.nextTick(fn) | очередь next-tick, опустошается до microtasks |
| колбэк fs.readFile | фаза poll (завершение I/O) |
| колбэк http-ответа | фаза poll |

Microtasks и next-tick-колбэки «близки к текущему коду»: они исполняются, прежде чем цикл шагнёт к следующей фазе, поэтому используйте их для continuation-логики, а не для откладывания I/O.

## Порядок на практике

Сниппет ниже — классический зонд порядка. В главном модуле вывод: `sync`, `nextTick`, `microtask`, `timer`, `immediate`: сам скрипт — это задача, так что и таймер, и immediate регистрируются до первого poll, и в этой гонке выигрывает фаза timers.

```js
setTimeout(() => console.log("timer"), 0);
setImmediate(() => console.log("immediate"));
queueMicrotask(() => console.log("microtask"));
process.nextTick(() => console.log("nextTick"));
console.log("sync");
```

Внутри I/O-колбэков картина переворачивается: immediate регистрируется, когда цикл уже в poll, поэтому `setImmediate` обычно печатается раньше `setTimeout(fn, 0)`. Практические правила, из этого следующие: не блокируйте цикл (выносите CPU-работу в worker threads), держите next-tick-цепочки короткими, а при подозрении на застревание измеряйте `perf_hooks.monitorEventLoopDelay`.

```js
import { monitorEventLoopDelay } from "node:perf_hooks";

const h = monitorEventLoopDelay({ resolution: 20 });
h.enable();
// … делаем работу …
console.log(h.mean / 1e6, "ms average delay");
h.disable();
```

> **TIP**
> `perf_hooks.monitorEventLoopDelay` даёт p50/p99 задержек цикла — единственную метрику, которая говорит, блокирует ли что-то поток.
