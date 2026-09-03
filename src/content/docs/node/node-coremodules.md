---
id: node-coremodules
track: node
type: reference
section: reference
order: 1
title:
  en: "Core Modules"
  ru: "Встроенные модули"
excerpt:
  en: "A map of Node's built-in modules — what each one is for and the calls you will reach for first, all with the node: prefix."
  ru: "Карта встроенных модулей Node — для чего каждый и какие вызовы понадобятся в первую очередь, всё с префиксом node:."
version: "node 22"
updated: 2026-09-03
---

Node ships with dozens of built-in modules that need no install: files, networking, crypto, streams, process control. This is a map of the ones you will actually import, all loaded with the `node:` prefix.

## The most used modules

| Module | Purpose | Typical calls |
| node:fs | File system: sync, callbacks, promises | readFile, writeFile, mkdir, cp, glob |
| node:path | Path string manipulation (no I/O) | join, resolve, dirname, extname |
| node:http / node:https | HTTP client and server | createServer, request, get |
| node:url | URL parsing and building | new URL, URLSearchParams |
| node:crypto | Hashes, random values, key derivation | randomUUID, createHash, scrypt |
| node:stream | Streams and pipeline | pipeline, Readable.from |
| node:events | The event emitter | on, once, off, emit |
| node:child_process | Run external processes | execFile, spawn, exec |
| node:os | Operating system information | tmpdir, homedir, cpus |
| node:util | Cross-cutting helpers | promisify, parseArgs, inspect |
| node:readline | Terminal line input | question (readline/promises) |
| node:worker_threads | Parallel JavaScript threads | Worker, parentPort |
| node:buffer | Binary data handling | Buffer.from, subarray, toString |
| node:zlib | Compression | createGzip, brotliCompress |
| node:net / node:tls | Raw TCP sockets and TLS | net.Server, tls.connect |
| node:assert | Sanity checks and tests | strict.equal, deepEqual |
| node:perf_hooks | Timing and event loop metrics | performance.now, monitorEventLoopDelay |
| node:cluster | One process per CPU core | fork, worker, isMain |
| node:dns | Name resolution | dns.promises.lookup |
| node:sqlite | Embedded SQL database (experimental in Node 22) | new DatabaseSync, prepare |

The table is not exhaustive — there are more than sixty modules in total — but these cover the daily work of a Node developer. The rest (vm, inspector, async_hooks, dgram, http2) become relevant as you go deeper into tooling, observability, and low-level networking. What is not built-in is equally worth knowing: there is no DOM, no XML parser, and no database drivers other than the experimental `node:sqlite` — those live on npm.

## Conventions

Three rules make built-in imports predictable. First, always use the `node:` prefix: it says "this is a built-in, not an npm package", and it skips the file-resolution machinery entirely. Second, a built-in can be loaded in both module systems — `import fs from "node:fs"` in ESM and `const fs = require("node:fs")` in CommonJS — and Node 22 adds `process.getBuiltinModule("node:fs")` for programmatic access, useful from inside a bundler or a test that must not pollute the module cache.

```js
// ESM
import fs from "node:fs";
import { glob } from "node:fs";

// CommonJS
const fs = require("node:fs");
const { glob } = require("node:fs");
```

Third, check stability before relying on an API: stable modules keep their contracts across major versions, while experimental ones — marked as such in the docs, sometimes behind a `--experimental-*` flag — may change shape. `node:sqlite` and `fs.glob` in Node 22 are the current examples: available and useful, still flagged.

> **TIP**
> When unsure what a module offers, load it in the REPL and read its exports: `require("node:crypto")` and then `.help` shows every function.

<!-- RU -->

В Node несколько десятков встроенных модулей без установки: файлы, сеть, криптография, потоки, управление процессом. Это карта тех, что импортируются на самом деле, все — с префиксом `node:`.

## Самые используемые модули

| Модуль | Назначение | Типичные вызовы |
| node:fs | Файловая система: sync, колбэки, Promise | readFile, writeFile, mkdir, cp, glob |
| node:path | Манипуляции строками путей (без I/O) | join, resolve, dirname, extname |
| node:http / node:https | HTTP-клиент и сервер | createServer, request, get |
| node:url | Разбор и сборка URL | new URL, URLSearchParams |
| node:crypto | Хеши, случайные значения, вывод ключей | randomUUID, createHash, scrypt |
| node:stream | Потоки и pipeline | pipeline, Readable.from |
| node:events | Эмиттер событий | on, once, off, emit |
| node:child_process | Запуск внешних процессов | execFile, spawn, exec |
| node:os | Информация об ОС | tmpdir, homedir, cpus |
| node:util | Поперечные хелперы | promisify, parseArgs, inspect |
| node:readline | Ввод строк из терминала | question (readline/promises) |
| node:worker_threads | Параллельные JavaScript-потоки | Worker, parentPort |
| node:buffer | Работа с бинарными данными | Buffer.from, subarray, toString |
| node:zlib | Сжатие | createGzip, brotliCompress |
| node:net / node:tls | Сырые TCP-сокеты и TLS | net.Server, tls.connect |
| node:assert | Проверки и тесты | strict.equal, deepEqual |
| node:perf_hooks | Замеры и метрики event loop | performance.now, monitorEventLoopDelay |
| node:cluster | По процессу на ядро CPU | fork, worker, isMain |
| node:dns | Разрешение имён | dns.promises.lookup |
| node:sqlite | Встроенная SQL-база (experimental в Node 22) | new DatabaseSync, prepare |

Таблица неполная — модулей всего больше шестидесяти, — но она покрывает повседневную работу Node-разработчика. Остальные (vm, inspector, async_hooks, dgram, http2) становятся актуальны, когда вы углубляетесь в тулинг, наблюдаемость и низкоуровневую сеть. Стоит знать и то, чего нет из коробки: нет DOM, нет XML-парсера и нет драйверов баз данных, кроме experimental-модуля `node:sqlite` — всё это живёт на npm.

## Конвенции

Три правила делают импорт встроенных модулей предсказуемым. Первое — всегда использовать префикс `node:`: он говорит «это встроенное, а не npm-пакет» и пропускает всю механику разрешения файлов. Второе — встроенный модуль грузится в обеих системах: `import fs from "node:fs"` в ESM и `const fs = require("node:fs")` в CommonJS; Node 22 добавляет `process.getBuiltinModule("node:fs")` для программной загрузки — удобно из бандлера или из теста, который не должен засорять модульный кэш.

```js
// ESM
import fs from "node:fs";
import { glob } from "node:fs";

// CommonJS
const fs = require("node:fs");
const { glob } = require("node:fs");
```

Третье — проверять стабильность перед тем, как строить на API: стабильные модули держат контракт между мажорными версиями, а experimental (помеченные в доках, иногда за флагом `--experimental-*`) могут менять форму. Текущие примеры в Node 22 — `node:sqlite` и `fs.glob`: доступны и полезны, но помечены.

> **TIP**
> Если непонятно, что предлагает модуль, загрузите его в REPL и посмотрите экспорты: `require("node:crypto")` и затем `.help` покажет каждую функцию.
