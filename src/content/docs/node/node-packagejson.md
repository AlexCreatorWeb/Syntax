---
id: node-packagejson
track: node
type: reference
section: reference
order: 4
title:
  en: "package.json Fields"
  ru: "Поля package.json"
excerpt:
  en: "Every field of the project manifest explained: metadata, entry points, scripts, and the version ranges npm installs."
  ru: "Все поля манифеста проекта: метаданные, точки входа, скрипты и диапазоны версий, которые ставит npm."
version: "node 22"
updated: 2026-09-03
---

`package.json` is the manifest at the root of every Node project: metadata about the package, the entry points, the npm scripts, and the dependency tree that `npm install` resolves.

## The fields

| Field | What it does |
| name | lowercase package name, used in npm install name |
| version | semver string, e.g. 1.2.3 |
| description | one-liner shown in search results |
| type | "module" → .js files are ESM; missing or "commonjs" → CJS |
| main | entry point for CommonJS |
| exports | subpath map; restricts what consumers can import |
| imports | internal aliases, e.g. "#utils" → "./src/utils.js" |
| bin | CLI commands the package installs |
| scripts | commands run via npm run name |
| dependencies | packages needed at runtime |
| devDependencies | packages needed only to build and test |
| peerDependencies | versions the host project must provide |
| optionalDependencies | installed when possible, failure ignored |
| engines | expected node/npm versions (advisory without engine-strict) |
| files | which files npm pack ships |
| license / author / repository / keywords | metadata for the registry |
| sideEffects | false → bundlers may drop unused imports |
| private | true → npm publish is refused |
| workspaces | monorepo layout |
| publishConfig | access, tag, and registry for publishing |

Two of these change behavior the most: `type` and `exports`. Without `type` (or with `"commonjs"`) every `.js` file is CommonJS; with `"type": "module"` they are ES modules and `.cjs` files opt back out. The `exports` map replaces the "everything is importable" model: only the paths you list can be reached from outside the package, and each one can point to different files for Node and for the browser.

## Scripts

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js",
    "test": "node --test",
    "lint": "eslint src"
  }
}
```

`npm run <name>` executes the script in a shell with the project's `node_modules/.bin` on PATH, so local dependencies can be called by bare name. Special forms exist: `npm test` is an alias for `run test`; `pre` and `post` hooks run automatically around any script (`pretest` before `test`); and `prepare` fires both before `npm pack` and after a local `npm install`, which is how prebuilt artifacts get created. The environment is exposed to scripts as variables: `$npm_package_name`, `$npm_config_loglevel`, and so on. And `node --test` runs the built-in test runner over `*.test.js` files — no dependency needed.

## Versions and installs

| Range | Example | Installs |
| caret | ^1.2.3 | any 1.x.x at or above 1.2.3 |
| tilde | ~1.2.3 | any 1.2.x at or above 1.2.3 |
| exact | 1.2.3 | only 1.2.3 |
| interval | >=1.0.0 <2.0.0 | the whole range |
| workspace | workspace:* | the linked monorepo package |

`npm install name` saves the package with a caret range by default, and `package-lock.json` pins the exact tree that was resolved. `npm ci` skips the resolution step entirely and installs exactly what the lockfile says — that is the command for CI, where reproducibility matters more than flexibility. devDependencies are skipped when `NODE_ENV=production`, which is how slim containers end up without their test suites.

> **TIP**
> Commit `package-lock.json` for applications and use `npm ci` in CI: the lockfile is the difference between "works on my machine" and "works on the server".

<!-- RU -->

`package.json` — манифест в корне любого Node-проекта: метаданные о пакете, точки входа, npm-скрипты и дерево зависимостей, которое разрешает `npm install`.

## Поля

| Поле | Что делает |
| name | имя пакета в нижнем регистре, используется в npm install name |
| version | строка semver, например 1.2.3 |
| description | строка для результатов поиска |
| type | "module" → .js-файлы — ESM; отсутствует или "commonjs" → CJS |
| main | точка входа для CommonJS |
| exports | карта подпутей; ограничивает, что импортируют потребители |
| imports | внутренние алиасы, например "#utils" → "./src/utils.js" |
| bin | CLI-команды, которые устанавливает пакет |
| scripts | команды, запускаемые через npm run name |
| dependencies | пакеты, нужные в рантайме |
| devDependencies | пакеты, нужные только для сборки и тестов |
| peerDependencies | версии, которые должен дать хост-проект |
| optionalDependencies | ставятся, если возможно; сбой игнорируется |
| engines | ожидаемые версии node/npm (рекомендательные без engine-strict) |
| files | какие файлы отдаёт npm pack |
| license / author / repository / keywords | метаданные для реестра |
| sideEffects | false → бандлеры могут выкидывать неиспользуемые импорты |
| private | true → npm publish отказывает |
| workspaces | раскладка monorepo |
| publishConfig | access, тег и реестр для публикации |

Больше всего на поведение влияют два: `type` и `exports`. Без `type` (или с `"commonjs"`) каждый `.js`-файл — CommonJS; с `"type": "module"` они — ES-модули, а файлы `.cjs` возвращаются в CJS. Карта `exports` заменяет модель «всё импортируемо»: снаружи пакета доступны только перечисленные пути, и каждый из них может указывать на разные файлы для Node и для браузера.

## Скрипты

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js",
    "test": "node --test",
    "lint": "eslint src"
  }
}
```

`npm run <name>` исполняет скрипт в оболочке с `node_modules/.bin` проекта в PATH, поэтому локальные зависимости вызываются голым именем. Есть особые формы: `npm test` — алиас `run test`; хуки `pre` и `post` исполняются автоматически вокруг любого скрипта (`pretest` перед `test`); а `prepare` срабатывает и перед `npm pack`, и после локального `npm install` — так создаются предсобранные артефакты. Окружение доступно скриптам как переменные: `$npm_package_name`, `$npm_config_loglevel` и так далее. А `node --test` запускает встроенный тест-раннер по файлам `*.test.js` — без зависимостей.

## Версии и установка

| Диапазон | Пример | Ставится |
| caret | ^1.2.3 | любой 1.x.x не ниже 1.2.3 |
| tilde | ~1.2.3 | любой 1.2.x не ниже 1.2.3 |
| точная | 1.2.3 | только 1.2.3 |
| интервал | >=1.0.0 <2.0.0 | весь диапазон |
| workspace | workspace:* | связанный monorepo-пакет |

`npm install name` по умолчанию сохраняет пакет с caret-диапазоном, а `package-lock.json` фиксирует ровно то дерево, которое разрешилось. `npm ci` пропускает шаг разрешения и ставит ровно то, что написано в lockfile — это команда для CI, где воспроизводимость важнее гибкости. devDependencies пропускаются, когда `NODE_ENV=production`, — так тонкие контейнеры остаются без тестовых пакетов.

> **TIP**
> Коммитьте `package-lock.json` для приложений и используйте `npm ci` в CI: lockfile — это разница между «работает у меня» и «работает на сервере».
