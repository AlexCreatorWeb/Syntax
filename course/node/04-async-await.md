# Урок 4. async/await: try/catch и параллельность

## Цель

После урока студент сможет: писать асинхронный код в «синхронном» стиле через `async/await`, обрабатывать ошибки через обычный `try/catch`, запускать независимые запросы параллельно (`Promise.all` внутри async-функции), понимать, что `await` останавливает только текущую функцию, и применять async/await в обработчиках HTTP (урок 17+).

## Теория

### Синтаксис

`async function` — функция, которая **всегда** возвращает Promise. Внутри неё `await выражение` «ждёт» промис и возвращает его значение (или бросает ошибку). По ощущениям — как обычный синхронный код:

```js
async function loadConfig() {
  const raw = await fsp.readFile("/app/config.json", "utf8");
  const config = JSON.parse(raw);
  return config;
}
```

Важные свойства:

- `await` останавливает **только текущую async-функцию**, а не весь процесс (Event Loop свободен).
- `await` работает и с **не-промисами**: `await 5` → 5 (обёртывается в `Promise.resolve`).
- `try/catch` ловит ошибки из `await` **обычным** способом — главная победа async/await над цепочками `.catch`.

### try/catch вокруг await

```js
async function main() {
  try {
    const data = await fsp.readFile("/app/nope.json", "utf8");
    console.log(data);
  } catch (e) {
    console.log("Код ошибки:", e.code); // ENOENT
    console.log("Сообщение:", e.message);
  }
}
main();
```

Вся обработка ошибок — в одном месте, как в синхронном коде.

### Параллельность

Частая ошибка новичков — `await` **в цикле** для независимых задач:

```js
// ПЛОХО: последовательно (в 3 раза медленнее)
for (const url of urls) {
  const r = await fetchJson(url);
}

// ХОРОШО: параллельно
const results = await Promise.all(urls.map((u) => fetchJson(u)));
```

Правило: **зависимые** шаги — по одному `await` друг за другом; **независимые** — `Promise.all` (или `allSettled`, если допустимы частичные сбои).

### Где `await` «не работает»

`await` допустим только в `async`-функции или в **верхнем уровне ESM-модуля** (top-level await, Node 14+). В обычном (non-async) обработчике — `await` вне функции → SyntaxError.

TIP: назовите async-функции глаголами («loadUsers», «saveNote») — читается как план действий. `try/catch` держите в **одном** слое (например, в контроллере), а внутренние функции пусть ошибки **бросают** (не глотают).

NOTE: в песочнице платформы top-level await работает (скрипт — ESM-модуль); в терминале — тоже (Node 14+, `"type": "module"` в package.json).

## Пример

`server.js`:

```js
import fs from "fs";
import { promises as fsp } from "fs";

// Готовим данные (в песочнице — в памяти)
fs.writeFileSync("/app/notes/1.json", JSON.stringify({ id: 1, text: "Первая" }));
fs.writeFileSync("/app/notes/2.json", JSON.stringify({ id: 2, text: "Вторая" }));
fs.writeFileSync("/app/notes/3.json", JSON.stringify({ id: 3, text: "Третья" }));

async function loadNote(id) {
  const raw = await fsp.readFile(`/app/notes/${id}.json`, "utf8");
  return JSON.parse(raw);
}

async function main() {
  // 1) try/catch вокруг await
  try {
    const n1 = await loadNote(1);
    console.log("Заметка 1:", n1.text);
  } catch (e) {
    console.log("Ошибка:", e.code);
  }

  // 2) Независимые загрузки — параллельно
  const [a, b, c] = await Promise.all([loadNote(1), loadNote(2), loadNote(3)]);
  console.log("Параллельно:", [a.text, b.text, c.text].join(", "));

  // 3) Последовательность с ранним выходом
  for (const id of [3, 2, 1]) {
    const n = await loadNote(id);
    if (n.id === 2) {
      console.log("Остановились на", n.id);
      break;
    }
  }
}

main().catch((e) => console.error("Необработанная ошибка:", e.message));
```

## Частые ошибки

WARN: `await` в цикле для **независимых** задач — последовательные запросы там, где можно параллельно (`Promise.all`). Проверка: «этот шаг зависит от результата предыдущего?» Нет — `Promise.all`.

WARN: `await` вне `async`-функции (и вне top-level ESM) — SyntaxError. Лечится: обернуть в `async function main() { … } main()`.

WARN: `async`-функция «глотает» ошибки: `try { await … } catch (e) { }` — пустой catch. Ошибка должна куда-то идти (console.error, throw, res.status(500)).

WARN: думаете, что `await` «блокирует сервер». Он блокирует **только текущую функцию**; остальные запросы обслуживаются в это время.

## Практическое задание

1. Напишите `async`-функцию `loadAll(ids)`: параллельно загружает заметки через `Promise.all` и возвращает массив.
2. Добавьте `async`-функцию `loadOrLog(id)`: пытается загрузить, при ошибке — выводит `e.code` и возвращает `null`.
3. В `main`: загрузите `[1, 2, 99]` через `loadAll` (упадёт из-за 99) — оберните в `try/catch`; затем через свой `Promise.allSettled`-вариант (`loadSettled`) — выведите статусы.
4. Запустите в платформе (**Run**): убедитесь, что порядок вывода совпадает с вашим предсказанием.
5. Мини-комментарий в коде: почему в п.3 `Promise.allSettled` «спасает» результат первых двух.
