---
id: node-streamtypes
track: node
type: reference
section: reference
order: 3
title:
  en: "Stream Types"
  ru: "Типы потоков"
excerpt:
  en: "The four stream classes, the ways to read and pipe them, and how backpressure and pipeline() keep data moving safely."
  ru: "Четыре класса потоков, способы чтения и pipe, и как backpressure и pipeline() безопасно двигают данные."
version: "node 22"
updated: 2026-09-03
---

Every flow of data in Node — a file, a socket, a request body — is a stream: one of four classes with a common interface, plus the `pipeline()` helper that makes them safe to chain.

## The four classes

| Class | Direction | Key methods | Where you meet it |
| Readable | source → your code | on("data"), read(), pipe(), for await | fs.createReadStream, the request (req) of http |
| Writable | your code → destination | write(), end() | fs.createWriteStream, the response (res) of http |
| Duplex | both, at the same time | everything from both | net.Socket, TLS connections |
| Transform | reads and rewrites each chunk | Duplex with a transform step | zlib streams, custom filters, string encoders |

A `Readable` can be consumed three ways: the `data` event in flowing mode, explicit `read()` calls in paused mode, or async iteration with `for await`. A `Writable` accepts `write()` calls and `end()`. Every stream emits `end` when the data is finished and `close` when the underlying handle is released. Some streams work with objects instead of buffers — a JSON parser, a line splitter — that is `objectMode`, declared at construction time.

## Reading and piping patterns

| Pattern | Shape | Use when |
| Event handlers | stream.on("data", (c) => …) | fine-grained control, legacy code |
| pipe | readable.pipe(writable) | one-way transfer, errors handled elsewhere |
| pipeline | pipeline(a, b, c) | production: error propagation plus cleanup |
| for await | for await (const chunk of readable) | custom per-chunk logic |
| Readable.from | Readable.from(asyncIterable) | turn any iterable into a stream |

```js
import { Readable } from "node:stream";

const numbers = Readable.from([1, 2, 3]);
for await (const n of numbers) {
  console.log(n * 2);
}
```

## Backpressure and pipeline

`write()` returns `false` when the internal buffer is full; at that point you should stop writing until the `drain` event fires. Doing it by hand is error-prone — which is exactly what `pipeline()` automates: it pauses upstream when downstream is slow, destroys every stream in the chain on the first error, and settles its promise accordingly.

```js
import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream";

await pipeline(createReadStream("in.bin"), createWriteStream("out.bin"));
```

```js
const dest = createWriteStream("slow.txt");
const ok = dest.write(bigChunk);
if (!ok) {
  dest.once("drain", () => console.log("safe to write again"));
}
```

> **TIP**
> Reach for `pipeline()` first; a plain `pipe()` is fine only when you already handle errors and cleanup on the source stream.

<!-- RU -->

Каждый поток данных в Node — файл, сокет, тело запроса — это стрим: один из четырёх классов с общим интерфейсом, плюс хелпер `pipeline()`, делающий их безопасными для цепочек.

## Четыре класса

| Класс | Направление | Ключевые методы | Где встречается |
| Readable | источник → ваш код | on("data"), read(), pipe(), for await | fs.createReadStream, запрос (req) http |
| Writable | ваш код → назначение | write(), end() | fs.createWriteStream, ответ (res) http |
| Duplex | и то, и другое одновременно | всё от обоих | net.Socket, TLS-соединения |
| Transform | читает и переписывает каждый чанк | Duplex с шагом трансформации | zlib-потоки, собственные фильтры, строковые кодировщики |

`Readable` можно потреблять тремя способами: событие `data` в flowing-режиме, явные вызовы `read()` в paused-режиме или асинхронная итерация через `for await`. `Writable` принимает вызовы `write()` и `end()`. Каждый поток шлёт `end`, когда данные закончились, и `close`, когда освобождается лежащий под ним хэндл. Некоторые потоки работают с объектами вместо буферов — JSON-парсер, сплиттер строк; это `objectMode`, объявляемый при создании.

## Паттерны чтения и pipe

| Паттерн | Форма | Когда использовать |
| Event-хендлеры | stream.on("data", (c) => …) | тонкий контроль, legacy-код |
| pipe | readable.pipe(writable) | перенос в одну сторону, ошибки обрабатываются отдельно |
| pipeline | pipeline(a, b, c) | продакшен: распространение ошибок плюс очистка |
| for await | for await (const chunk of readable) | своя логика на чанк |
| Readable.from | Readable.from(asyncIterable) | превратить любой итерируемый в поток |

```js
import { Readable } from "node:stream";

const numbers = Readable.from([1, 2, 3]);
for await (const n of numbers) {
  console.log(n * 2);
}
```

## Backpressure и pipeline

`write()` возвращает `false`, когда внутренний буфер полон; в этот момент нужно перестать писать до события `drain`. Делать это руками — легко ошибиться, и именно это автоматизирует `pipeline()`: он ставит upstream на паузу, когда downstream медленный, уничтожает все потоки в цепочке при первой ошибке и разрешает свой Promise по результату.

```js
import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream";

await pipeline(createReadStream("in.bin"), createWriteStream("out.bin"));
```

```js
const dest = createWriteStream("slow.txt");
const ok = dest.write(bigChunk);
if (!ok) {
  dest.once("drain", () => console.log("safe to write again"));
}
```

> **TIP**
> Сначала — `pipeline()`; обычный `pipe()` уместен, только если ошибки и очистку по source-потоку вы уже обрабатываете сами.
