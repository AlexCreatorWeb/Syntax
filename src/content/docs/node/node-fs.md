---
id: node-fs
track: node
type: guide
section: io
order: 3
title:
  en: "File System & Streams"
  ru: "Файловая система и потоки"
excerpt:
  en: "The node:fs module in its three API styles, error codes, directory utilities, and streams for data that must not live in memory."
  ru: "Модуль node:fs в трёх API-стилях, коды ошибок, утилиты для директорий и потоки для данных, которым не место в памяти."
version: "node 22"
updated: 2026-09-03
---

The `node:fs` module is the workhorse for files and directories. The same operations exist in three API styles — callbacks, Promises, and synchronous functions — and once the data grows beyond what you want to hold in memory, streams take over.

## The promises API

The cleanest style is `fs.promises`: every method returns a Promise, so the code reads top to bottom with `await`. It works in ES modules (where top-level `await` is allowed) and inside `async` functions in any module.

```js
import { promises as fs } from "node:fs";

await fs.mkdir("out", { recursive: true }); // no throw if it already exists
await fs.writeFile("out/report.json", JSON.stringify({ ok: true }), "utf8");

const raw = await fs.readFile("out/report.json", "utf8");
console.log(JSON.parse(raw));

const stat = await fs.stat("out/report.json");
console.log(stat.size, stat.isFile());

await fs.rm("out", { recursive: true, force: true }); // force: missing is OK
```

The sync twins — `readFileSync`, `writeFileSync`, `mkdirSync` — are fine in CLI entry points and startup code, where blocking once is cheap; inside request handlers they stall the whole event loop for the duration of the call.

## Directories, errors, and small utilities

For directories, `mkdir` with `recursive: true` is the `mkdir -p` equivalent, `fs.cp` copies whole trees, and `rename` moves files within a volume. Node 22 adds `fs.glob`, which brings pattern matching for file lists into the runtime itself.

```js
import { glob } from "node:fs";

for await (const file of glob("src/**/*.js")) {
  console.log(file);
}
```

Every `fs` failure carries a machine-readable `code`. Check `e.code`, not the human-readable message: messages change between Node versions while codes stay stable.

| Code | Meaning | Typical fix |
| ENOENT | file or directory not found | create it, or guard with access() |
| EACCES | permission denied | check ownership and flags |
| EISDIR | expected a file, got a directory | use readdir() instead |
| ENOTDIR | expected a directory, got a file | use readFile() instead |
| EEXIST | already exists (mkdir without recursive) | use { recursive: true } |

```js
try {
  await fs.readFile("missing.txt", "utf8");
} catch (e) {
  console.log(e.code); // "ENOENT"
}
```

## Streams for large data

`readFile` puts the whole file in memory; a 2 GB log file is usually not what you want. Streams process the file chunk by chunk, and memory stays flat no matter the size. `pipe()` connects a readable to a writable; `pipeline()` is the production version — it propagates errors, handles backpressure, and destroys every stream in the chain on failure.

```js
import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream";
import zlib from "node:zlib";

await pipeline(
  createReadStream("data.csv"),
  zlib.createGzip(),
  createWriteStream("data.csv.gz")
);
```

Every readable stream supports async iteration — `for await` gives you chunks one by one, which is the natural way to process line-oriented data like logs or CSV.

```js
import { createReadStream } from "node:fs";

const read = createReadStream("big.log");
for await (const chunk of read) {
  const lines = chunk.toString("utf8").split("\n");
  // process line by line; memory stays flat
}
```

> **TIP**
> `pipeline()` is `pipe()` with a safety net: on the first error it destroys all streams in the chain and rejects its promise with that error — no orphaned half-written file.

> **WARNING**
> `fs.unlink()` throws `ENOENT` when the file does not exist. When "missing" is an acceptable outcome, use `fs.rm(path, { force: true })` instead.

<!-- RU -->

Модуль `node:fs` — главная рабочая лошадка для файлов и директорий. Одни и те же операции существуют в трёх API-стилях — колбэки, Promise и синхронные функции, — а когда данные перерастут объём, который хочется держать в памяти, на сцену выходят потоки.

## Promise-API

Самый чистый стиль — `fs.promises`: каждый метод возвращает Promise, и код читается сверху вниз через `await`. Это работает в ES-модулях (где допустим top-level `await`) и внутри `async`-функций в любом модуле.

```js
import { promises as fs } from "node:fs";

await fs.mkdir("out", { recursive: true }); // не падает, если уже существует
await fs.writeFile("out/report.json", JSON.stringify({ ok: true }), "utf8");

const raw = await fs.readFile("out/report.json", "utf8");
console.log(JSON.parse(raw));

const stat = await fs.stat("out/report.json");
console.log(stat.size, stat.isFile());

await fs.rm("out", { recursive: true, force: true }); // force: отсутствующего не страшно
```

Синхронные двойники — `readFileSync`, `writeFileSync`, `mkdirSync` — допустимы в CLI-точках входа и startup-коде, где одна блокировка дёшева; внутри request-хендлеров они останавливают весь event loop на время вызова.

## Директории, ошибки и мелкие утилиты

Для директорий `mkdir` с `recursive: true` — это аналог `mkdir -p`, `fs.cp` копирует целые деревья, а `rename` перемещает файлы внутри тома. Node 22 добавляет `fs.glob` — сопоставление по маске для списков файлов прямо в рантайме.

```js
import { glob } from "node:fs";

for await (const file of glob("src/**/*.js")) {
  console.log(file);
}
```

Каждая ошибка `fs` несёт машиночитаемый `code`. Проверяйте `e.code`, а не человекочитаемое сообщение: сообщения меняются между версиями Node, а коды стабильны.

| Код | Значение | Обычное лечение |
| ENOENT | файла или директории нет | создать, либо проверить через access() |
| EACCES | нет прав | проверить владельца и флаги |
| EISDIR | ждали файл, а это директория | использовать readdir() |
| ENOTDIR | ждали директорию, а это файл | использовать readFile() |
| EEXIST | уже существует (mkdir без recursive) | использовать { recursive: true } |

```js
try {
  await fs.readFile("missing.txt", "utf8");
} catch (e) {
  console.log(e.code); // "ENOENT"
}
```

## Потоки для больших данных

`readFile` кладёт весь файл в память; 2 ГБ лога — обычно то, чего вам не надо. Потоки обрабатывают файл по кускам (чанкам), и память остаётся плоской при любом размере. `pipe()` соединяет readable с writable; `pipeline()` — производственная версия: она распространяет ошибки, разбирается с backpressure и уничтожает все потоки в цепочке при первом сбое.

```js
import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream";
import zlib from "node:zlib";

await pipeline(
  createReadStream("data.csv"),
  zlib.createGzip(),
  createWriteStream("data.csv.gz")
);
```

Каждый readable-поток поддерживает асинхронную итерацию — `for await` выдаёт чанки по одному, что естественно для построчных данных вроде логов или CSV.

```js
import { createReadStream } from "node:fs";

const read = createReadStream("big.log");
for await (const chunk of read) {
  const lines = chunk.toString("utf8").split("\n");
  // обработка построчно; память остаётся плоской
}
```

> **TIP**
> `pipeline()` — это `pipe()` с сеткой безопасности: при первой ошибке он уничтожает все потоки в цепочке и reject-ит свой Promise этой ошибкой — не остаётся сиротского полудоханного файла.

> **WARNING**
> `fs.unlink()` роняет `ENOENT`, когда файла нет. Когда «отсутствует» — допустимый исход, используйте `fs.rm(path, { force: true })`.
