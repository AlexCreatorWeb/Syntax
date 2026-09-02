// Урок 11: fs-стримы — pipe, for await, события
import fs from "fs";
import { createReadStream, createWriteStream, promises as fsp } from "fs";

async function main() {
  // TODO: создайте /app/logs/app.log с 500 строками (appendFile в цикле)
  // TODO: функция copyViaPipe(src, dest) → Promise (pipe, resolve на "finish", reject на "error")
  // TODO: функция countLines(file) → for await по createReadStream, посчитать строки
  // TODO: функция extractLines(file, from, to) → стримом прочитать, записать отобранные в новый файл
  await fsp.mkdir("/app/logs", { recursive: true });
  // TODO: вызовы + console.log (размеры через stat)
}
main().catch((e) => console.error("Ошибка:", e.message));
