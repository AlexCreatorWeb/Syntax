# Урок 6. npm: install, dependencies, package.json, lock

## Цель

После урока студент сможет: инициализировать проект (`npm init`), устанавливать и удалять пакеты (`npm install`, `--save-dev`), читать и писать `package.json` (name, version, type, scripts, dependencies), понимать разницу `dependencies` и `devDependencies`, объяснять роль `package-lock.json` и знать, что ставить в `node_modules`/`.gitignore`.

## Теория

### npm и реестр

**npm** — пакетный менеджер Node (идёт в комплекте). Пакеты (библиотеки) лежат в **публичном реестре** registry.npmjs.org — это миллионы готовых модулей: Express, pg, Mongoose, Jest и т.д. `npm install <пакет>` скачивает пакет в каталог **`node_modules`** вашего проекта и прописывает его в `package.json`.

### package.json — паспорт проекта

```json
{
  "name": "my-api",
  "version": "1.0.0",
  "type": "module",
  "scripts": { "start": "node server.js" },
  "dependencies": { "express": "^4.19.2" },
  "devDependencies": { "nodemon": "^3.1.0" }
}
```

- `name`/`version` — идентификатор (важно, если публикуете пакет).
- **`"type": "module"`** — проект ESM (из урока 5).
- `scripts` — ярлыки: `npm run start` → `node server.js` (спец-якоря: `npm start`/`npm test` без `run`).
- `dependencies` — пакеты, **нужные в рантайме** (express, pg).
- `devDependencies` — пакеты **только для разработки** (nodemon, eslint, jest). В продакшен-сборке (Docker, `npm install --omit=dev`) они не ставятся.

### Версии и semver

`4.19.2` = major.minor.patch. Спецификаторы: `^4.19.2` — «совместимый с 4.x (≥4.19.2, <5.0.0)», `~4.19.2` — только патчи, `4.19.2` — ровно. На практике: `npm install express` пишет `^…` — разумный дефолт.

### package-lock.json

**Обязательный** файл (коммитим в git!). Записывает **точную** версию каждого пакета и его зависимостей (вплоть до транзитивных). `npm ci` (в CI/Docker) ставит **ровно** то, что в lock — воспроизводимость. Без lock разные окружения могут получить разные минор-версии.

### Команды

```bash
npm init -y                  # package.json с дефолтами
npm install express          # + в dependencies
npm install -D nodemon       # + в devDependencies
npm uninstall express        # удалить
npm run start                # скрипт из package.json
npm outdated / npm update    # состояние версий
```

TIP: `npm install -g <пакет>` — глобальная установка (CLI-инструменты: nodemon, http-server). В `package.json` глобальные пакеты **не** попадают — они не зависимости проекта.

NOTE: в песочнице платформы `npm` не нужен (зависимости предзаполнены в import map — `express`, `pg`, `jsonwebtoken` и т.д. импортируются как обычные модули). Урок о том, как это работает в **терминале**; в заданиях импорты те же.

## Пример

`server.js` (песочница — импорты как в терминале):

```js
import express from "express";

// «Если бы мы были в терминале», package.json выглядел бы так:
// {
//   "name": "my-api",
//   "version": "1.0.0",
//   "type": "module",
//   "scripts": { "start": "node server.js" },
//   "dependencies": { "express": "^4.19.2" }
// }
// Команды: npm init -y → npm install express → npm start

const app = express();

app.get("/health", (req, res) => {
  res.json({ ok: true, pkg: "my-api", version: "1.0.0" });
});

app.listen(3000, () => console.log("API на :3000 (package.json = паспорт проекта)"));
```

Проверка в платформе: `__request("GET", "/health")` → `{ ok: true, … }`.

## Частые ошибки

WARN: коммитите `node_modules` в git. Ставьте `.gitignore` (`node_modules/`); в git — только `package.json` + `package-lock.json`.

WARN: «забыли» `package-lock.json` (удалили/не коммитили). Команда на другом компьютере ставит другие версии → «у меня работает». Lock — коммитим всегда.

WARN: ставите runtime-зависимости в `devDependencies` (или наоборот): `express` в devDeps → в проде (`--omit=dev`) его нет → ERR_MODULE_NOT_FOUND в рантайме.

WARN: пишете точные версии руками в `package.json` (вместо `^`). Дайте npm управлять: `npm install <пакет>` — он сам запишет правильный спецификатор.

## Практическое задание

1. Откройте `package.json` песочницы (`console.log(JSON.stringify(process.env, null, 2))` — и сравните с «реальным» package.json из примера). В комментарии к коду запишите, какие поля вы бы добавили в свой проект.
2. Создайте `package.json`-объект в коде (константа `pkg`): name, version 1.0.0, `"type": "module"`, scripts `{ start, dev }` и зависимости express. Выведите `pkg.scripts.start`.
3. Напишите функцию `installPlan(packages, { dev = false } = {})`: возвращает массив команд npm (`npm install x` / `npm install -D x`) для списка пакетов.
4. Реализуйте `resolveVersion(spec)`: берёт строку `^4.19.2`/`~4.19.2`/`4.19.2` и возвращает объект `{ mode: "caret|tilde|exact", base: "4.19.2" }`.
5. В терминале (дополнительно): `npm init -y`, `npm install express`, `npm install -D nodemon` — сравните, как изменился package.json и lock.
