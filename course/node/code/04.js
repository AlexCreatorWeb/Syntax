// Урок 4: async/await — try/catch, Promise.all, allSettled
import fs from "fs";
import { promises as fsp } from "fs";

fs.writeFileSync("/app/notes/1.json", JSON.stringify({ id: 1, text: "Первая" }));
fs.writeFileSync("/app/notes/2.json", JSON.stringify({ id: 2, text: "Вторая" }));

// TODO: async-функция loadNote(id) — readFile + JSON.parse (через await)
// TODO: в main: try/catch — loadNote(1) ок, loadNote(99) → вывести e.code (ENOENT)
// TODO: Promise.all([loadNote(1), loadNote(2)]) → console.log("Параллельно: …")
// TODO: loadSettled(ids) — через Promise.allSettled, выведите статусы (fulfilled/rejected)

async function main() {
  // TODO: ваш код
}
main().catch((e) => console.error("Необработанная ошибка:", e.message));
