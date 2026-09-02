// Урок 10: fs — read/write, mkdir, коды ошибок (ENOENT)
import { promises as fsp } from "fs";

async function main() {
  // TODO: mkdir "/app/store/items" (recursive) + записать 3 JSON-файла (1.json..3.json) с { id, title }
  // TODO: функция listItems(dir) → readdir, отфильтровать .json, прочитать ПАРАЛЛЕЛЬНО (Promise.all)
  // TODO: функция readJsonOr(file, fallback) → при ENOENT вернуть fallback (проверка e.code!)
  // TODO: функция appendLog(file, msg) → добавить строку (создать, если нет)
  console.log("items:", await listItems("/app/store/items"));
  console.log("log:", await readJsonOr("/app/missing.json", { empty: true }));
}
main().catch((e) => console.error("Ошибка:", e.code, e.message));
