---
id: node-modules
track: node
type: guide
section: basics
order: 2
title:
  en: "Modules: CJS vs ESM"
  ru: "Модули: CJS против ESM"
excerpt:
  en: "CommonJS and ES modules side by side: exports and imports in both systems, how they differ, and how to mix them in one project."
  ru: "CommonJS и ES-модули рядом: экспорт и импорт в обеих системах, в чём они отличаются и как смешивать их в одном проекте."
version: "node 22"
updated: 2026-09-03
relatedTask: node-001
---

Node has two module systems that coexist in the same project: CommonJS (CJS) — the original `require`/`module.exports` — and ECMAScript modules (ESM) — the standard `import`/`export` syntax of the language. Choosing the right one, and knowing how they mix, is one of the first real decisions in any Node project.

## Two systems side by side

CommonJS appeared before ESM was standardized and was designed for servers: synchronous `require()`, dynamic resolution at runtime, and a cache keyed by file path. ESM is the language standard: static, hoisted `import` statements that are resolved before any code runs, and the same syntax the browser uses.

| Feature | CommonJS | ESM |
| Syntax | require(), module.exports | import / export |
| Resolution | at runtime, can be dynamic | static, before execution |
| Current directory | __dirname,__filename | import.meta.url, import.meta.dirname |
| Top-level await | no | yes |
| Bindings | copied values | live bindings |
| File hint | .cjs or no "type" field | .mjs or "type": "module" |

```js
// CommonJS (server.cjs)
const fs = require("node:fs");

module.exports = function readConfig(name) {
  return JSON.parse(fs.readFileSync(name, "utf8"));
};
```

```js
// ESM (server.mjs)
import fs from "node:fs";

export default function readConfig(name) {
  return JSON.parse(fs.readFileSync(name, "utf8"));
}
```

## ESM syntax in practice

An ES module can export one default value plus any number of named ones. Named exports can be grouped with `export { … }` — the barrel pattern that keeps a single public entry point — and imported wholesale with `import * as ns`. Crucially, named bindings are live: the importer sees the current value of a binding, not a copy taken at import time.

```js
// counter.mjs
export let count = 0;

export function bump() {
  count += 1;
}
```

```js
// app.mjs
import { count, bump } from "./counter.mjs";

bump();
console.log(count); // 1 — the binding is live, reassigned in the module
```

The directory of the current file is not a global in ESM; it comes from `import.meta`. For years the recipe was `fileURLToPath(import.meta.url)`; recent Node versions add `import.meta.dirname` directly.

```js
import { fileURLToPath } from "node:url";

const dir = import.meta.dirname; // Node 20.11+
const fallback = fileURLToPath(new URL(".", import.meta.url)); // older Node
```

## CJS in practice

In CommonJS everything hangs on `module.exports` — the object the importer receives. Two idioms produce it, and confusing them is the classic beginner bug: mutating `exports` (a reference to the same object) works, but reassigning it with `exports = …` only changes a local variable and silently ships the old object to the importer.

```js
// works: adds a property to module.exports
exports.hello = () => "world";

// works: replaces the whole export
module.exports = { hello: () => "world" };

// BUG: module.exports still points at the old object
exports = { hello: () => "world" };
```

`require()` also caches: the module body runs once, and every later `require` of the same file returns the cached exports. That makes circular `require` pairs return partially-built objects — a known CJS wart that ESM avoids with its static graph, which the engine can analyze before running anything.

## Mixing CJS and ESM

Which system a `.js` file belongs to is decided by the nearest `package.json`: `"type": "module"` means ESM, the default (or `"commonjs"`) means CJS. The extensions `.mjs` and `.cjs` override the package and force the system per file, which is how mixed legacy projects keep working.

The two systems interoperate in both directions. `import` can load CJS: the default export is `module.exports`, and named imports work when the exports are statically detectable. Since recent Node 22 releases, `require()` can load synchronous ESM without a flag — modules with top-level `await` still need dynamic `import()`, which works from both systems and returns a Promise.

> **TIP**
> Start a new project with ESM and `"type": "module"` in package.json: you get `import.meta`, top-level `await`, and the same module syntax as the browser.

> **WARNING**
> `exports.foo = …` adds a property to `module.exports`; `exports = …` rebinds a local variable and silently breaks the module. When unsure, write `module.exports` explicitly.

<!-- RU -->

В Node две системы модулей, которые сосуществуют в одном проекте: CommonJS (CJS) — изначальные `require`/`module.exports` — и ECMAScript modules (ESM) — стандартный синтаксис `import`/`export` языка. Выбор системы и понимание того, как они смешиваются, — одно из первых реальных решений в любом Node-проекте.

## Две системы рядом

CommonJS появился до стандартизации ESM и был задуман для серверов: синхронный `require()`, динамическое разрешение в рантайме и кэш, индексированный по пути файла. ESM — это языковой стандарт: статические, поднятые наверх `import`-операторы, которые разрешаются до любого кода, и тот же синтаксис, что и в браузере.

| Фича | CommonJS | ESM |
| Синтаксис | require(), module.exports | import / export |
| Разрешение | в рантайме, может быть динамическим | статическое, до исполнения |
| Текущая директория | __dirname,__filename | import.meta.url, import.meta.dirname |
| Top-level await | нет | да |
| Связи | копии значений | живые связи (live bindings) |
| Подсказка файла | .cjs или нет поля "type" | .mjs или "type": "module" |

```js
// CommonJS (server.cjs)
const fs = require("node:fs");

module.exports = function readConfig(name) {
  return JSON.parse(fs.readFileSync(name, "utf8"));
};
```

```js
// ESM (server.mjs)
import fs from "node:fs";

export default function readConfig(name) {
  return JSON.parse(fs.readFileSync(name, "utf8"));
}
```

## Синтаксис ESM на практике

ES-модуль может экспортировать один default-экспорт и сколько угодно именованных. Именованные можно сгруппировать через `export { … }` — это barrel-паттерн, который держит одну публичную точку входа, — и импортировать целиком через `import * as ns`. Важно: именованные связи «живые» — импортер видит текущее значение связи, а не копию, снятую в момент импорта.

```js
// counter.mjs
export let count = 0;

export function bump() {
  count += 1;
}
```

```js
// app.mjs
import { count, bump } from "./counter.mjs";

bump();
console.log(count); // 1 — связь живая, переприсваивается в модуле
```

Директория текущего файла в ESM не является глобальной; она берётся из `import.meta`. Много лет рецепт был `fileURLToPath(import.meta.url)`; новые версии Node добавляют `import.meta.dirname` напрямую.

```js
import { fileURLToPath } from "node:url";

const dir = import.meta.dirname; // Node 20.11+
const fallback = fileURLToPath(new URL(".", import.meta.url)); // старый Node
```

## CJS на практике

В CommonJS всё держится на `module.exports` — это объект, который получает импортер. Есть два идиоматических способа его задать, и путаница между ними — классическая ошибка новичка: мутация `exports` (это ссылка на тот же объект) работает, а переприсваивание `exports = …` меняет только локальную переменную и тихо отдаёт импортеру старый объект.

```js
// работает: добавляет свойство в module.exports
exports.hello = () => "world";

// работает: заменяет весь экспорт
module.exports = { hello: () => "world" };

// БАГ: module.exports по-прежнему указывает на старый объект
exports = { hello: () => "world" };
```

`require()` ещё и кэширует: тело модуля выполняется один раз, а каждый последующий `require` того же файла возвращает закэшированные экспорты. Из-за этого циклическая пара `require` отдаёт полу собранный объект — известный порок CJS, которого ESM лишен благодаря статическому графу, который движок анализирует до запуска.

## Смешивание CJS и ESM

К какой системе относится `.js`-файл, решает ближайший `package.json`: `"type": "module"` означает ESM, умолчание (или `"commonjs"`) — CJS. Расширения `.mjs` и `.cjs` переопределяют пакет и насильно задают систему для файла — так переживают смешанные legacy-проекты.

Системы работают друг с друга в обе стороны. `import` может загрузить CJS: default-экспорт — это `module.exports`, а именованные импорты работают, когда экспорты статически определяются. С недавних версий Node 22 `require()` может грузить синхронные ESM без флага — модули с top-level `await` по-прежнему требуют динамического `import()`, который работает из обеих систем и возвращает Promise.

> **TIP**
> Начинайте новый проект на ESM и с `"type": "module"` в package.json: получаете `import.meta`, top-level `await` и тот же модульный синтаксис, что и браузер.

> **WARNING**
> `exports.foo = …` добавляет свойство в `module.exports`; `exports = …` переприсваивает локальную переменную и тихо ломает модуль. Если сомневаетесь — пишите `module.exports` явно.
