---
id: node-cli
track: node
type: guide
section: tooling
order: 6
title:
  en: "Building CLI Applications"
  ru: "CLI-приложения"
excerpt:
  en: "Shebang, the bin field, argument parsing, stdout versus stderr, and exit codes: the conventions that turn a script into an installable tool."
  ru: "Shebang, поле bin, парсинг аргументов, stdout против stderr и коды завершения: конвенции, превращающие скрипт в устанавливаемый инструмент."
version: "node 22"
updated: 2026-09-03
relatedTask: node-003
---

A CLI is a Node script that reads `process.argv`, does its work, and exits with a meaningful code. The conventions — the shebang line, the `bin` field, stderr for errors — turn that script into a tool people install, pipe, and trust.

## Anatomy: shebang, bin, install

The entry file starts with a shebang so it can be executed directly, and the package declares the command it installs via the `bin` field. When someone runs `npm install your-package`, npm links the command into `node_modules/.bin`; `npm link` (or a global install) puts it on the system PATH.

```js
#!/usr/bin/env node
import { parseArgs } from "./args.js";

const { command, flags } = parseArgs(process.argv);
console.log(`running: ${command}`, flags);
```

```json
{
  "name": "mytool",
  "version": "1.0.0",
  "type": "module",
  "bin": { "mytool": "./cli.js" }
}
```

```bash
chmod +x cli.js
npm link        # puts "mytool" on PATH for local testing
mytool deploy --verbose
```

## Parsing arguments

`process.argv` always starts with the node binary and the script path; everything from index 2 is yours. A small parser splits the rest into a command, boolean flags, and positionals, and understands `--key=value` for flags that take a value.

```js
export function parseArgs(argv) {
  const args = argv.slice(2);
  const out = { command: undefined, flags: {}, positionals: [] };

  for (const a of args) {
    if (a.startsWith("--")) {
      const [key, inline] = a.slice(2).split("=");
      out.flags[key] = inline !== undefined ? inline : true;
    } else if (a.startsWith("-")) {
      out.flags[a.slice(1)] = true;
    } else if (out.command === undefined) {
      out.command = a;
    } else {
      out.positionals.push(a);
    }
  }
  return out;
}
```

```js
const parsed = parseArgs(process.argv);

if (parsed.flags.h || parsed.flags.help) {
  console.log("mytool <command> [--verbose] [--out <file>]");
  process.exitCode = 0;
}
```

For bigger tools the built-in `node:util` parser does the job without any hand-written code: declare the options once and get typed values and positionals back.

```js
import { parseArgs } from "node:util";

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    verbose: { type: "boolean", short: "v" },
    out: { type: "string", short: "o" },
  },
});
```

## Output: stdout, stderr, and interaction

The golden rule of CLI design is to keep `stdout` machine-readable: data goes to `stdout`, humans' messages and errors go to `stderr`. That is what makes `mytool list --json | jq` work. When a real terminal is attached (`process.stdout.isTTY` is true), colors and progress spinners are fine; when piped, they are noise.

For questions, `readline/promises` wraps the old callback API in Promises.

```js
import { createInterface } from "node:readline/promises";

const rl = createInterface({ input: process.stdin, output: process.stdout });
const target = await rl.question("Deploy to? [prod] ");
rl.close();
console.error(`deploying to ${target || "prod"}`);
```

Exit codes are part of the interface: `0` means success, `1` a failure, `2` a usage error by common convention. Prefer setting `process.exitCode` over calling `process.exit()`, so pending writes can flush.

> **TIP**
> Write the `--help` text and the `--version` flag first. A tool whose help matches its real behavior is halfway trusted.

> **WARNING**
> Calling `process.exit()` right after `console.log()` on a piped `stdout` can drop the last line — the write is still in the buffer. Set `process.exitCode` and let the process end on its own.

<!-- RU -->

CLI — это Node-скрипт, который читает `process.argv`, делает работу и завершается с осмысленным кодом. Конвенции — shebang-строка, поле `bin`, stderr для ошибок — превращают этот скрипт в инструмент, который ставят, пайпят и которому доверяют.

## Анатомия: shebang, bin, установка

Файл-точка входа начинается с shebang, чтобы его можно было исполнять напрямую, а пакет объявляет устанавливаемую команду через поле `bin`. Когда кто-то выполняет `npm install your-package`, npm связывает команду в `node_modules/.bin`; `npm link` (или глобальная установка) кладёт её в системный PATH.

```js
#!/usr/bin/env node
import { parseArgs } from "./args.js";

const { command, flags } = parseArgs(process.argv);
console.log(`running: ${command}`, flags);
```

```json
{
  "name": "mytool",
  "version": "1.0.0",
  "type": "module",
  "bin": { "mytool": "./cli.js" }
}
```

```bash
chmod +x cli.js
npm link        # кладёт "mytool" в PATH для локальных тестов
mytool deploy --verbose
```

## Парсинг аргументов

`process.argv` всегда начинается с бинарника node и пути к скрипту; всё с индекса 2 — ваше. Небольшой парсер делит остальное на команду, boolean-флаги и позиционные аргументы и понимает `--key=value` для флагов, принимающих значение.

```js
export function parseArgs(argv) {
  const args = argv.slice(2);
  const out = { command: undefined, flags: {}, positionals: [] };

  for (const a of args) {
    if (a.startsWith("--")) {
      const [key, inline] = a.slice(2).split("=");
      out.flags[key] = inline !== undefined ? inline : true;
    } else if (a.startsWith("-")) {
      out.flags[a.slice(1)] = true;
    } else if (out.command === undefined) {
      out.command = a;
    } else {
      out.positionals.push(a);
    }
  }
  return out;
}
```

```js
const parsed = parseArgs(process.argv);

if (parsed.flags.h || parsed.flags.help) {
  console.log("mytool <command> [--verbose] [--out <file>]");
  process.exitCode = 0;
}
```

Для крупных инструментов встроенный парсер `node:util` делает дело без рукописного кода: опишите опции один раз — получите типизированные значения и позиционные аргументы обратно.

```js
import { parseArgs } from "node:util";

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    verbose: { type: "boolean", short: "v" },
    out: { type: "string", short: "o" },
  },
});
```

## Вывод: stdout, stderr и интерактив

Золотое правило CLI-дизайна — держать `stdout` машиночитаемым: данные идут в `stdout`, сообщения для людей и ошибки — в `stderr`. Именно поэтому работает `mytool list --json | jq`. Когда подключён настоящий терминал (`process.stdout.isTTY` — true), цвета и спиннеры уместны; при pipe это шум.

Для вопросов `readline/promises` оборачивает старый callback-API в Promise.

```js
import { createInterface } from "node:readline/promises";

const rl = createInterface({ input: process.stdin, output: process.stdout });
const target = await rl.question("Deploy to? [prod] ");
rl.close();
console.error(`deploying to ${target || "prod"}`);
```

Коды завершения — часть интерфейса: `0` — успех, `1` — сбой, `2` — ошибка использования по общему согласованию. Предпочитайте присваивание `process.exitCode` вызову `process.exit()`, чтобы отложенные записи успели слиться.

> **TIP**
> Пишите текст `--help` и флаг `--version` первыми. Инструмент, чья справка соответствует реальному поведению, уже наполовину заслужил доверие.

> **WARNING**
> Вызов `process.exit()` сразу после `console.log()` на piped `stdout` может потерять последнюю строку — запись ещё в буфере. Ставьте `process.exitCode` и дайте процессу завершиться сам.
