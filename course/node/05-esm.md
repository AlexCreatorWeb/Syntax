# Урок 5. ESM: import/export, «type": "module", __dirname

## Цель

После урока студент сможет: разделять код на модули через `import`/`export` (default и именованные), настраивать проект как ESM (`"type": "module"` в package.json), использовать `import.meta.url` и `fileURLToPath` вместо `__dirname`, понимать, чем ESM отличается от CommonJS, и строить многофайловое Node-приложение.

## Теория

### Почему модули

Один большой `server.js` на 2000 строк — недолго. Модули дают: разделение ответственности, переиспользование, изолированные импорты. В Node есть два формата: **CommonJS** (`require`/`module.exports`, исторический) и **ESM** (`import`/`export`, стандарт ECMAScript — тот же, что в браузере). Курс использует **только ESM**.

### Как Node понимает, что файл — ESM

По расширению: `.mjs` — всегда ESM; `.cjs` — всегда CommonJS. Для `.js` — решает **ближайший** `package.json`: поле `"type": "module"` → ESM, иначе CommonJS (по умолчанию).

### Синтаксис ESM

```js
// utils.js — экспорты
export const VERSION = "1.0.0";                 // именованный
export function clamp(x, a, b) { … }            // именованный
export default function createApp() { … }       // default (один на модуль)
```

```js
// server.js — импорты
import createApp, { VERSION, clamp } from "./utils.js";
import fs from "fs";            // default-импорт встроенного модуля
import { readFileSync } from "fs"; // именованный (большинство built-ins дают оба)
import * as path from "path";   // весь модуль объектом
```

Правила:

- **Пути к своим файлам — относительные** (`./utils.js`, `../config.js`) и **с расширением** (`.js` обязательно — браузерные bundler'ы и Node ESM этого требуют).
- **Импорты «верхом»**: `import` только в начале модуля (не внутри `if` — кроме динамического `import()`).
- Именованные импорты — «по имени»; default — можно назвать как угодно: `import appFactory from "./app.js"`.

### `__dirname` в ESM: исчез

В CommonJS были `__dirname`/`__filename` — глобальные переменные. В ESM их **нет** (вместо них — `import.meta`):

```js
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
```

Это **идиом** (шаблон) — запомните. Он нужен, чтобы найти `config.json` рядом с модулем: `path.join(__dirname, "config.json")`.

### ESM vs CommonJS (кратко)

ESM: `import`/`export`, статический анализ (бандлер/Node видят граф импортов), `"type": "module"`, async (top-level await). CommonJS: `require` (синхронно, в любой строке), `module.exports`, исторический, синхронный. **Новые проекты — ESM.**

TIP: именованные экспорты — для «утилит» (функции, константы), default — для «главного объекта» модуля (фабрика приложения, класс). Не смешивайте в одном файле, если не обязаны.

NOTE: в песочнице платформы всё, что вы пишете в `server.js`, уже исполняется как ESM-модуль (top-level `import` и `await` работают). Импорт своих файлов (по `./utils.js`) в песочнице не нужен — задания однофайловые; в терминале — полноценный мультифайл.

## Пример

`server.js`:

```js
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
console.log("Каталог модуля:", __dirname);

// Именованные функции «из другого файла» (в песочнице — прямо здесь)
export function clamp(x, a, b) {
  return Math.min(Math.max(x, a), b);
}
export const APP_NAME = "node-course";

// Использование
console.log("Приложение:", APP_NAME);
console.log("clamp(15, 0, 10) =", clamp(15, 0, 10));

// Динамический import (в терминале): import("./utils-extra.js").then(m => …)
// В песочнице: свои файлы не нужны — имитируем
const fakeModule = { hello: () => "привет из «модуля»" };
console.log(fakeModule.hello());

// Идентификатор модуля
console.log("Этот модуль:", import.meta.url);
```

В терминале структура та же, но `clamp`/`APP_NAME` живут в `utils.js`, а `server.js` их импортирует:

```js
// utils.js
export const APP_NAME = "node-course";
export function clamp(x, a, b) { return Math.min(Math.max(x, a), b); }

// server.js
import { APP_NAME, clamp } from "./utils.js";
console.log(APP_NAME, clamp(15, 0, 10));
```

## Частые ошибки

WARN: забываете расширение в относительном импорте: `import x from "./utils"` → ERR_MODULE_NOT_FOUND. Всегда `./utils.js`.

WARN: пишете `require`/`module.exports` в ESM-проекте (или наоборот — `import` в `.cjs`). Смешение форматов ломает проект; в новом проекте — только ESM.

WARN: используете `__dirname` в ESM — `ReferenceError: __dirname is not defined`. Идиом: `fileURLToPath(import.meta.url)` + `dirname`.

WARN: импортируете свой файл без `./`: `import utils from "utils"` — Node ищет это в `node_modules` (bare specifier), а не в соседних файлах.

## Практическое задание

1. В `server.js` объявите и **экспортируйте**: именованную функцию `sum(a, b)`, константу `MAX`, и default-функцию `createConfig()` (возвращает объект `{ name, version }`).
2. Считайте `__dirname` через идиом `import.meta.url` и выведите его.
3. Создайте файл `/app/greeting.txt` (через `fs.writeFileSync`) с текстом «Привет, ESM» — и прочитайте его `readFileSync` (именнованный импорт из `fs`).
4. Вызовите `createConfig()` и выведите результат; затем измените `version` на «2.0» и объясните (комментарием), почему default-экспорт «один на модуль».
5. В терминале (додополнительно): разнесите код на `server.js` + `utils.js` и проверьте, что `node server.js` работает.
