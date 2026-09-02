# Урок 7. npx, npm-скрипты и переменные окружения (.env, dotenv)

## Цель

После урока студент сможет: запускать CLI-утилиты через `npx` (локальные и глобальные), описывать повторяемые команды в `scripts` (`start`, `dev`, `test`, `lint`), хранить конфигурацию в переменных окружения (`process.env`), использовать `.env`-файл + `dotenv` для разработки и понимать, почему секреты не должны жить в коде.

## Теория

### npx — запуск пакетных CLI

`npx <команда>` находит и запускает CLI-утилиту: **сначала** в локальном `node_modules/.bin` (проектные: eslint, jest), затем глобально, затем скачивает из реестра. Примеры:

- `npx create-react-app my-app` — разовый скелет;
- `npx eslint .` — локальный eslint проекта;
- `npx nodemon` — если nodemon в devDependencies.

Правило: инструменты, которые используются **проектно**, ставятся в `devDependencies` и вызываются `npx` (или `npm run`), а не глобально.

### scripts — повторяемые команды

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "node --test",
    "lint": "eslint ."
  }
}
```

Запуск: `npm run dev` (для `start`/`test` — просто `npm start`/`npm test`). Передавать аргументы: `npm run dev -- --port=4000`. Скрипты — **единый источник команд** для команды: «как запустить/проверить проект» — один ответ в package.json.

TIP: `dev`-скрипт с `nodemon` (перезапуск при изменении файлов) экономит десятки ручных перезапусов. `start` — чистый `node` (для прода).

### Переменные окружения

`process.env` — объект со строками окружения. Всё, что **может отличаться** между окружениями (dev/staging/prod) или **секретное**, — в env, а не в коде:

- `PORT`, `NODE_ENV`;
- `DATABASE_URL` (postgres), `MONGO_URL`;
- `JWT_SECRET`, `API_KEY_…`.

Приводите типы сами: `Number(process.env.PORT)`, `process.env.NODE_ENV === "production"`.

### .env + dotenv

В терминале держать env руками неудобно. Идиом: файл `.env` в корне (в **gitignore**) + пакет **dotenv**, который читает его в `process.env` **в самом начале** приложения:

```js
import "dotenv/config"; // читает .env → process.env (до всех import'ов, которые его читают)
```

`.env`:

```
PORT=3000
NODE_ENV=development
DATABASE_URL=postgres://user:pass@localhost:5432/mydb
JWT_SECRET=change-me-in-prod
```

В **прода** `.env` обычно не используется — env задаёт хостинг/Docker/K8s. В песочнице платформы `process.env` **предзаполнен** (`PORT`, `JWT_SECRET`, `DATABASE_URL`, `NODE_ENV`) — имитация этого механизма.

NOTE: в песочнице `import "dotenv/config"` не обязателен (env уже есть), но в заданиях его можно не писать — код «как в терминале» с реальным .env будет отличаться только этой строкой.

## Пример

`server.js`:

```js
// import "dotenv/config"; // ← в терминале (песочница: env уже заполнен)

const port = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === "production";

console.log("Запуск API");
console.log("Порт:", port, "(тип:", typeof port + ")");
console.log("Среда:", process.env.NODE_ENV, "→ production:", isProd);
console.log("БД:", process.env.DATABASE_URL ? "задана" : "не задана");
console.log("JWT_SECRET задан:", Boolean(process.env.JWT_SECRET));

// «Скрипт» из package.json, выполненный вручную
function runScript(name, scripts) {
  if (!scripts[name]) throw new Error("Нет скрипта: " + name);
  console.log("$ npm run " + name);
  console.log(scripts[name]);
  return scripts[name];
}
const scripts = { start: "node server.js", dev: "nodemon server.js", test: "node --test" };
runScript("start", scripts);

// Секреты не в коде:
const config = {
  port,
  db: process.env.DATABASE_URL,
  jwt: { secret: process.env.JWT_SECRET, expiresIn: "1d" },
};
console.log("Конфиг собран из env:", JSON.stringify({ ...config, jwt: { …config.jwt, secret: "***" } }));
```

## Частые ошибки

WARN: хардкодите секреты (`const JWT_SECRET = "abc123"` в коде → в git). Ротация секрета = переписывание кода + деплой. Секреты — **только** в env.

WARN: `.env` в git (коммитите `.env` с прод-паролями). `.env` — в `.gitignore`; в репо — `.env.example` (шаблон без значений).

WARN: сравниваете `process.env.PORT` строкой с числом (`if (port === 3000)` — всегда false, потому что env — строка). Приводите: `Number(process.env.PORT)`.

WARN: используете `dotenv` **после** модулей, которые читают env: `import { db } from "./db.js"` (db прочитал `DATABASE_URL` на import) → потом `import "dotenv/config"` — поздно. `dotenv/config` — **первой** строкой.

## Практическое задание

1. Соберите объект `config` из `process.env`: port (Number), env (NODE_ENV), db (DATABASE_URL), secret задан (boolean). Выведите его (secret — как `***`).
2. Напишите `validateEnv(env)`: возвращает массив проблем («PORT не число», «JWT_SECRET не задан», «DATABASE_URL не начинается с postgres://»). Проверьте на `process.env` песочницы.
3. Реализуйте `runScripts(list, scripts)`: выполняет (выводит) список имён скриптов, на незнакомый — бросает ошибку. Вызовите с `["start", "test", "deploy"]` (deploy нет — обработайте).
4. Напишите `buildEnvFile(entries)` → строку `.env` (`KEY=value` по строкам). Вызовите с `[{k:"PORT",v:"3000"},{k:"JWT_SECRET",v:"secret"}]`.
5. В терминале (дополнительно): создайте `.env`, подключите `dotenv`, выведите `process.env.PORT`; добавьте `.gitignore` и проверьте `git status`.
