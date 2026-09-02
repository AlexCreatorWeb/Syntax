# Урок 13. events: EventEmitter, on/once/off, конвенция «error»

## Цель

После урока студент сможет: создавать свои классы на базе `EventEmitter`, подписывать/отписывать обработчики (`on`/`once`/`off`), вызывать события (`emit`), понимать конвенцию **`error`** (необработанный `error` = crash) и паттерны «подписка на события» в архитектуре (http-сервер, стримы, БД — всё на EventEmitter).

## Теория

### EventEmitter — «издаватель событий»

**EventEmitter** — базовый класс Node-архитектуры: объект «издаёт» именованные события, а другие части кода «слушают». Вы — в HTTP-сервере (`server.on("listening")`), стриме (`stream.on("data")`), в БД-соединении (`pool.on("error")`). Модуль **`events`** даёт класс `EventEmitter` для **ваших** объектов.

```js
import { EventEmitter } from "events";

class Order extends EventEmitter {
  constructor() {
    super();
  }
  pay(amount) {
    this.emit("paid", { amount });          // «издать» событие с данными
    setTimeout(() => this.emit("shipped"), 100);
  }
}

const order = new Order();
order.on("paid", (info) => console.log("Оплачено:", info.amount));
order.once("shipped", () => console.log("Отгружено (one-time)"));
order.pay(1990);
```

### on / once / off

- **`on(name, fn)`** — подписаться (многократно: `emit` вызовет **всех** подписчиков по порядку).
- **`once(name, fn)`** — подписаться **на один** вызов (авто-отписка).
- **`off(name, fn)`** — отписаться (нужна **та же** функция).
- **`emit(name, …args)`** — вызвать; args передаются подписчикам.
- **`listenerCount(name)`** — сколько подписчиков.

Максимум подписчиков по умолчанию — 10 (далее — warning о «утечке»). Для «много событий одного типа» (например, по одному на каждое подключение) — `emitter.setMaxListeners(0)` (или разумное число).

### Конвенция «error»

Если `emit("error", err)` вызван, **а подписчика на `error` нет** — EventEmitter **бросает** `err` (crash процесса). Правило: **каждый** «может ошибиться» эмиттер обязан иметь `on("error")` (хотя бы `console.error`). Это то, почему HTTP-сервер/стрим/БД-пул «грозят» необработанным `error`.

```js
source.on("error", (e) => console.error("Событие error:", e.message)); // обязательно
```

TIP: для «одноразовых» событий (`ready`, `connected`) — `once`. Для «периодических» (`tick`, `data`) — `on` + `off` при уходе. Храните ссылку на функцию, чтобы `off` работал (стрелка-анонимка «отписаться» не даст).

NOTE: в песочнице `events` — **настоящий** модуль (подгружается с esm.sh), API идентичен Node.

## Пример

`server.js`:

```js
import { EventEmitter } from "events";

// «Служба уведомлений»: события → подписчики (mail, push, log)
class Notifier extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(20);
  }
  notify(type, payload) {
    this.emit(type, payload);
    this.emit("any", { type, payload }); // «метасобытие»
  }
}

const notifier = new Notifier();

// Подписчики
const logHandler = (type, payload) => console.log("[log]", type, payload.msg);
notifier.on("any", logHandler);

notifier.once("welcome", (p) => console.log("[mail] приветствие:", p.user));
notifier.on("order", (p) => console.log("[push] заказ:", p.id));

// Ошибка: подписчик на error ОБЯЗАН быть
notifier.on("error", (e) => console.error("[error]", e.message));

// Использование
notifier.notify("welcome", { user: "Аня", msg: "Добро пожаловать" });
notifier.notify("order", { id: 42, msg: "Заказ создан" });
notifier.notify("welcome", { user: "Боря", msg: "Ещё одно" }); // once — уже не сработает
notifier.notify("order", { id: 43, msg: "Ещё заказ" });

// off: отписка
notifier.off("any", logHandler);
notifier.notify("order", { id: 44, msg: "Без лога" });

// «Может ошибиться» эмиттер: без on("error") — crash
class Flaky extends EventEmitter {}
const flaky = new Flaky();
flaky.on("error", (e) => console.error("Поймали:", e.message));
flaky.emit("error", new Error("сбой"));
console.log("listenerCount('order'):", notifier.listenerCount("order"));
```

## Частые ошибки

WARN: `emit("error")` без подписчика — **crash** (не «тихо проигнорировано»). Любой «ненадёжный» эмиттер (сеть, БД, стрим) — с `on("error")`.

WARN: `off(name, otherFn)` «не отписывает»: `off` принимает **ту же** ссылку на функцию. Анонимные стрелки в `on` — «потеряли» (утечка подписчиков).

WARN: `once` для «повторяющегося» события — сработает один раз и молча отпишется. `once` — для одноразовых (`ready`), `on` — для периодических (`data`).

WARN: не ставите `setMaxListeners` при «много подписчиков одного типа» (по одному на каждый запрос/соединение) — warning «possible memory leak» маскирует реальные утечки.

## Практическое задание

1. Создайте класс `TaskQueue extends EventEmitter`: методы `add(task)` (emit «added»), `process()` (через `setTimeout` emit «done» с результатом). Подпишитесь: `on("added")` → лог, `once("done")` → первый результат, `on("error")` → лог.
2. Запустите: добавьте 3 задачи, обработайте первую — убедитесь, что `once` сработал один раз.
3. Реализуйте `onDoneOnce(queue, cb)`: вернуть функцию-отписку (комбинация `once` + `off`).
4. Создайте «ненадёжный» эмиттер `FlakySource`: метод `read()` с 50% вероятностью `emit("error")`. Подключите `on("error")` и 5 запусков — не должно быть crash.
5. Выведите `listenerCount` до/после `off` — убедитесь, что отписка работает.
