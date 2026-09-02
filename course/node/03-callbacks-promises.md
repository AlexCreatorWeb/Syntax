# Урок 3. Колбэки, «пирамида ужаса» и Promise

## Цель

После урока студент сможет: объяснять колбэк-стиль асинхронного кода и его проблемы (вложенность, размазанная обработка ошибок), обёртывать колбэк-API в Promise через `new Promise`, использовать `.then/.catch/.finally` и `Promise.all`, и мотивировать переход к async/await (следующий урок).

## Теория

### Колбэки

Колбэк — функция, которую вы **передаёте** в другую функцию, а та вызывает её, когда работа готова. Классический пример — `setTimeout`:

```js
setTimeout(() => console.log("готово"), 1000);
```

В Node колбэки — **исторический** стиль API (старые модули: `fs`, `http`). Конвенция — **error-first**: первый аргумент колбэка — `null` (ошибки нет) или объект ошибки:

```js
fs.readFile("file.txt", "utf8", (err, data) => {
  if (err) { console.error("Ошибка:", err.message); return; }
  console.log(data);
});
```

Проблемы колбэк-стиля:

1. **Вложенность** («пирамида ужаса»): три последовательных асинхронных шага → три уровня вложенности; ошибки обрабатываются на каждом уровне.
2. **Ошибки размазаны**: `try/catch` не ловит ошибки из колбэков (они вызваны потом, когда `try` уже закончился).
3. **Нет контроля параллельности**: запустить 5 запросов «одновременно и ждать всех» в колбэках — больно.

### Promise

Promise — обещание результата. Состояния: **pending** → (успех: **fulfilled** / сбой: **rejected**). Управление:

- `.then(onFulfilled)` — что делать при успехе (возвращает новый promise);
- `.catch(onRejected)` — обработка **любой** ошибки в цепочке;
- `.finally(cb)` — что-то сделать в любом случае (уход с ресурсов, скрытие спиннера).

**Обёртка колбэка** (adapter) — один из самых полезных навыков:

```js
function readJson(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, "utf8", (err, data) => {
      if (err) return reject(err);
      try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
    });
  });
}
```

После этого можно строить **цепочки**:

```js
readJson("a.json")
  .then((a) => readJson("b.json"))
  .then((b) => merge(a, b))
  .catch((e) => console.error("Сбой:", e.message))
  .finally(() => console.log("Закончили"));
```

### Promise.all

`Promise.all([p1, p2, p3])` — ждёт **все** промисы (результат — массив в том же порядке) и **падает целиком**, если упал хотя бы один. Для «все или ничего» — `Promise.allSettled` (массив из `{status, value/reason}`).

TIP: если в уроках вы видите `fs.promises.readFile` — это официальный promise-вариант колбэк-API (в песочнице платформы обёрнуты обе формы; в терминале — реальный Node 14+).

NOTE: в песочнице платформы `fs` — in-memory; колбэк- и promise-формы API ведут себя одинаково с точки зрения логики кода.

## Пример

`server.js`:

```js
import fs from "fs";
import { promises as fsp } from "fs";

// Обёртка колбэк-API в Promise (паттерн!)
function readJson(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, "utf8", (err, data) => {
      if (err) return reject(err);
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
  });
}

// Готовим «файлы» (в песочнице — в памяти, в терминале — на диске)
fs.writeFileSync("/app/data/a.json", JSON.stringify({ course: "Node" }));
fs.writeFileSync("/app/data/b.json", JSON.stringify({ lessons: 26 }));

// Цепочка: a.json → b.json → результат
readJson("/app/data/a.json")
  .then((a) => readJson("/app/data/b.json"))
  .then((b) => {
    const merged = { ...a, ...b };
    console.log("Объединено:", merged);
    return merged;
  })
  .catch((e) => console.error("Сбой цепочки:", e.message))
  .finally(() => console.log("Цепочка завершена"));

// Параллельность: два readFile одновременно
const [x, y] = await Promise.all([fsp.readFile("/app/data/a.json", "utf8"), fsp.readFile("/app/data/b.json", "utf8")]);
console.log("Параллельно:", x.length + " и " + y.length, "байт");
```

Обратите внимание: `await` в верхнем уровне модуля (top-level await) допустим в ESM (Node 14+).

## Частые ошибки

WARN: пишите «пирамиду»: колбэк в колбэке в колбэке. Три уровня вложенности — уже пора выносить шаги в функции или использовать Promise/async.

WARN: забываете проверять `err` в колбэке: `fs.readFile(f, (err, data) => { console.log(data); })` — при ошибке `data` не определён, и код падает **позже** и **где-то рядом**.

WARN: `Promise.all` — «все или ничего». Один упавший запрос отменяет результат остальных. Если нужно «что дожило — то и используем» — `Promise.allSettled`.

WARN: цепочка `.then` без `.catch` — rejected promise «уплывает» (unhandledRejection; в новых Node — warning/exit). Конечный `.catch` обязателен.

## Практическое задание

1. Напишите обёртку `writeJson(file, obj)` (promise) поверх колбэк-`fs.writeFile`.
2. Сцепите: создать `/app/log.json` с `{ startedAt: Date.now() }`, затем дописать (через `fs.appendFile` + свою обёртку) строку «запись 2».
3. Запустите `Promise.all` из трёх `readJson` по разным файлам — один из них не создавайте и убедитесь, что падает **вся** партия (`.catch`).
4. Повторите п.3 через `Promise.allSettled` и выведите статусы (`fulfilled`/`rejected`).
5. Перепишите цепочку из примера урока через `Promise.all` (чтение a и b **параллельно**).
