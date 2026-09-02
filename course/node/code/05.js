// Урок 5: ESM — import/export, __dirname через import.meta.url
import fs from "fs";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

// TODO: именованный экспорт — функция sum(a, b)
// TODO: именованный экспорт — константа MAX = 100
// TODO: default-экспорт — функция createConfig() → { name, version }
// TODO: считайте __dirname через fileURLToPath(import.meta.url) + dirname и выведите
console.log("Модуль:", import.meta.url);
// TODO: создайте /app/greeting.txt с текстом "Привет, ESM" (writeFileSync)
// TODO: прочитайте его readFileSync и выведите
