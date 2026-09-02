// Урок 13: events — EventEmitter, on/once/off, конвенция "error"
import { EventEmitter } from "events";

// TODO: класс TaskQueue extends EventEmitter:
//   add(task) → emit("added", task)
//   process() → через setTimeout emit("done", { task, result })
// TODO: подписчики: on("added") → лог; once("done") → первый результат; on("error") → лог
// TODO: добавьте 3 задачи, обработайте первую — убедитесь, что once сработал 1 раз
// TODO: функция onDoneOnce(queue, cb) → возвращает функцию-отписку
// TODO: класс FlakySource: read() с 50% emit("error") — подключите on("error") (иначе crash!)
console.log("EventEmitter готов");
