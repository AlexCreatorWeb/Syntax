---
id: node-runtime
track: node
type: guide
section: basics
order: 1
title:
  en: "Runtime & REPL"
  ru: "Рантайм и REPL"
excerpt:
  en: "What the Node.js runtime is built from, how a process sees its arguments, environment and signals, and how to explore Node interactively in the REPL."
  ru: "Из чего состоит рантайм Node.js, как процесс видит аргументы, окружение и сигналы, и как интерактивно исследовать Node в REPL."
version: "node 22"
updated: 2026-09-03
---

Node.js is JavaScript outside the browser: the V8 engine, the libuv library for non-blocking I/O, and dozens of built-in modules for files, networking, and crypto. This page covers the runtime itself — how a process starts, what the global `process` object exposes, and the interactive REPL, which is one of the fastest ways to learn any API.

## What the runtime gives you

Node is a single process around a single JavaScript thread. V8 compiles and runs your code, while the event loop — driven by the C++ library libuv — schedules callbacks at the right moments: when a timer fires, when a socket delivers data, when a file read completes. That is why one Node process can handle thousands of concurrent connections without spawning a thread per client: waiting never blocks, only CPU-bound work does.

```js
console.log(process.version); // v22.x
console.log(process.arch, process.platform); // "x64" "linux"
console.log(process.versions.v8); // the embedded V8 version
console.log(typeof fetch); // "function" — fetch is a global since Node 18
```

The runtime also ships a large set of built-in modules — `fs`, `http`, `path`, `crypto`, `stream`, `worker_threads` — that need no `npm install` and are imported with the `node:` prefix. If a feature is missing, the npm ecosystem fills the gap; the runtime's job is to give you a fast, standard foundation to build on.

Node 22 is an LTS line, the safe choice for production. Headline features of the 22.x series worth knowing: global `fetch` and `WebSocket`, `process.getBuiltinModule()` for loading built-ins programmatically, `require()` of synchronous ES modules without a flag, and — in the newest 22.x releases — type stripping for `.ts` files on by default.

> **TIP**
> `node --watch app.js` re-runs the script whenever any imported file changes — the built-in development loop, no nodemon required.

## The process object

The global `process` object is the bridge between JavaScript and the operating system. Its `argv` array always starts with two entries — the path to the `node` binary and the path of the script — followed by everything after the script name on the command line. Environment variables live in `process.env`, and `cwd()` reports the directory the process was started in.

```js
console.log(process.argv);
// ["/usr/bin/node", "/app/server.js", "deploy", "--verbose"]
console.log(process.env.HOME);
console.log(process.cwd());
```

For termination, two different tools exist. `process.exit(code)` ends the process immediately; setting `process.exitCode` instead lets the loop drain its queue first, which matters because `stdout` and `stderr` are buffered when piped. For lifecycle hooks, `process` emits `exit`, and it can also catch errors that would otherwise be fatal: since Node 15 an unhandled Promise rejection crashes the process by default, so production servers usually attach a handler to log and recover.

```js
process.exitCode = 1; // the process exits with 1 after the loop drains

process.on("unhandledRejection", (reason) => {
  console.error("unhandled rejection:", reason);
});

process.on("exit", (code) => {
  console.log("bye, exit code", code); // only synchronous code runs here
});
```

> **WARNING**
> `process.exit()` returns immediately. Called right after `console.log()` on a piped `stdout` (CI, scripts) it can drop the last line. Set `process.exitCode` and let Node finish flushing.

## The REPL

Start the REPL by typing `node` with no arguments. You get a multi-line JavaScript console where every expression is evaluated and printed immediately. The REPL understands top-level `await`, so promises can be tried out directly; the last result is stored in `_`; dot-commands (`.help`, `.load`, `.save`) extend it. It is the fastest way to explore an unfamiliar module: load it, poke at it, and only then read the docs.

```js
const fs = require("node:fs"); // the REPL defaults to CJS
fs.readFileSync("package.json", "utf8").length;
await new Promise((r) => setTimeout(r, 500)); // top-level await
_ // the previous result
.load ./helpers.js // pull a file into the session
.help // list of dot-commands
```

Press `Ctrl+C` once to cancel the current expression, twice to quit. `.save file.js` dumps the whole transcript — handy for turning a REPL session into a runnable test script.

> **TIP**
> Treat the REPL as a scratchpad: `.load ./lib.js`, experiment until the behavior is clear, then `.save` the working lines into a real script.

## Running code: -e, modules, and inspect

Beyond plain `node file.js`, three entry modes are worth memorizing. `node -e "…"` evaluates an inline string; add `--input-type=module` when you want `import` and top-level `await` inside it. `node --inspect server.js` opens the debugger and prints a URL that Chrome DevTools attaches to — breakpoints, call stacks, the heap, for scripts and long-running servers alike. And the module system a `.js` file belongs to is decided by the nearest `package.json`: with `"type": "module"` the file is an ES module, without it — CommonJS.

```bash
node -e "console.log(2 ** 10)"
node --input-type=module -e 'const fs = await import("node:fs"); console.log((await fs.stat(".")).size)'
node --inspect server.js
```

In production the `--inspect` flag stays off, but it is the first thing to reach for when a process misbehaves: `node --inspect-brk server.js` pauses at the very first line, so you can step through a failing request without guessing.

<!-- RU -->

Node.js — это JavaScript за пределами браузера: движок V8, библиотека libuv для неблокирующего I/O и десяток встроенных модулей для файлов, сети и криптографии. Эта страница — про сам рантайм: как запускается процесс, что показывает глобальный объект `process` и интерактивный REPL, один из самых быстрых способов освоить любой API.

## Что даёт рантайм

Node — это один процесс вокруг одного JavaScript-потока. V8 компилирует и исполняет код, а event loop — на C-библиотеке libuv — расставляет колбэки в нужный момент: когда сработал таймер, когда сокет доставил данные, когда дочитан файл. Поэтому один процесс Node держит тысячи одновременных соединений, не создавая поток на клиента: ожидание никогда не блокирует, блокирует только CPU-работа.

```js
console.log(process.version); // v22.x
console.log(process.arch, process.platform); // "x64" "linux"
console.log(process.versions.v8); // версия встроенного V8
console.log(typeof fetch); // "function" — fetch стал глобальным с Node 18
```

Вместе с рантаймом идёт большой набор встроенных модулей — `fs`, `http`, `path`, `crypto`, `stream`, `worker_threads` — без `npm install` и с префиксом `node:` при импорте. Чего не хватает — добирается из npm-экосистемы; задача рантайма — дать быструю стандартную базу, на которой всё это строится.

Node 22 — это LTS-линия, безопасный выбор для продакшена. Ключевые фичи 22.x, которые стоит знать: глобальные `fetch` и `WebSocket`, `process.getBuiltinModule()` для программной загрузки встроенных модулей, `require()` синхронных ES-модулей без флага и — в самых новых 22.x — type stripping для `.ts`-файлов, включённый по умолчанию.

> **TIP**
> `node --watch app.js` перезапускает скрипт при каждом изменении импортированных файлов — встроенный dev-цикл, nodemon не нужен.

## Объект process

Глобальный объект `process` — мост между JavaScript и операционной системой. Массив `argv` всегда начинается с двух элементов — путь к бинарнику `node` и путь к скрипту — а дальше идёт всё, что было после имени скрипта в командной строке. Переменные окружения — в `process.env`, а `cwd()` сообщает директорию, из которой процесс запущен.

```js
console.log(process.argv);
// ["/usr/bin/node", "/app/server.js", "deploy", "--verbose"]
console.log(process.env.HOME);
console.log(process.cwd());
```

Для завершения процесса есть два разных инструмента. `process.exit(code)` убивает процесс сразу; присваивание `process.exitCode` сначала даёт event loop дослать очередь — важно, потому что `stdout` и `stderr` при pipe буферизуются. Для lifecycle-хуков `process` шлёт `exit`, а ещё через него ловят ошибки, которые иначе были бы фатальными: с Node 15 необработанный reject Promise по умолчанию роняет процесс, поэтому продакшен-серверы обычно вешают хендлер, чтобы залогировать и продолжить.

```js
process.exitCode = 1; // процесс завершится с кодом 1, когда цикл опустеет

process.on("unhandledRejection", (reason) => {
  console.error("unhandled rejection:", reason);
});

process.on("exit", (code) => {
  console.log("bye, exit code", code); // здесь выполняется только синхронный код
});
```

> **WARNING**
> `process.exit()` возвращается сразу. Вызванный сразу после `console.log()` на piped `stdout` (CI, скрипты), он может потерять последнюю строку. Ставьте `process.exitCode` и дайте Node дослать вывод.

## REPL

REPL запускается командой `node` без аргументов. Это многострочная JavaScript-консоль, где каждое выражение сразу вычисляется и печатается. REPL понимает top-level `await`, так что промисы можно пробовать прямо здесь; последний результат хранится в `_`; доточки (`.help`, `.load`, `.save`) добавляют функции. Это самый быстрый способ изучить непривычный модуль: загрузить, пощупать, и только потом читать доки.

```js
const fs = require("node:fs"); // по умолчанию REPL — CJS
fs.readFileSync("package.json", "utf8").length;
await new Promise((r) => setTimeout(r, 500)); // top-level await
_ // предыдущий результат
.load ./helpers.js // подтянуть файл в сессию
.help // список доточек
```

`Ctrl+C` один раз — отменить текущее выражение, два раза — выйти. `.save file.js` выгружает весь транскрипт — удобно превращать сессию в исполняемый тест-скрипт.

> **TIP**
> Используйте REPL как черновик: `.load ./lib.js`, экспериментируйте, пока поведение не станет ясным, затем `.save` рабочие строки в настоящий скрипт.

## Запуск кода: -e, модули и inspect

Помимо обычного `node file.js` стоит запомнить три режима входа. `node -e "…"` исполняет строку на месте; флаг `--input-type=module` включает в ней `import` и top-level `await`. `node --inspect server.js` включает дебаггер и печатает URL, к которому подключается Chrome DevTools — breakpoints, call stacks, куча; работает и для скриптов, и для долгоживущих серверов. А к какой системе модулей относится `.js`-файл, решает ближайший `package.json`: с `"type": "module"` файл — ES-модуль, без него — CommonJS.

```bash
node -e "console.log(2 ** 10)"
node --input-type=module -e 'const fs = await import("node:fs"); console.log((await fs.stat(".")).size)'
node --inspect server.js
```

В продакшене `--inspect` обычно выключен, но при странном поведении процесса это первый инструмент: `node --inspect-brk server.js` ставит паузу с самой первой строки — можно пошагово пройти падающий запрос без догадок.
