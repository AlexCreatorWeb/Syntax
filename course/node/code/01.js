// Урок 1: Node.js и V8 — process, env, argv, nextTick
console.log("Привет из Node!");
// TODO: выведите процесс.version (версия Node)
// TODO: выведите процесс.platform (платформа)
// TODO: выведите процесс.cwd() (рабочий каталог)
// TODO: выведите process.env (все переменные окружения)
// TODO: выведите process.argv (аргументы запуска) — какие два первых элемента?
process.nextTick(() => console.log("nextTick: до setTimeout"));
setTimeout(() => console.log("setTimeout: позже"), 10);
// TODO: объясните комментарием, почему nextTick напечатался раньше
