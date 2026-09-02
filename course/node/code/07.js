// Урок 7: npx, scripts, env — конфигурация из process.env
// import "dotenv/config"; // ← в терминале (песочница: env уже заполнен)

const port = Number(process.env.PORT) || 3000;
// TODO: соберите объект config: { port, env: NODE_ENV, db: DATABASE_URL, hasSecret: Boolean(JWT_SECRET) }
// TODO: функция validateEnv(env) → массив проблем (PORT не число / JWT_SECRET не задан / DATABASE_URL не postgres://)
// TODO: функция runScript(name, scripts) → console.log("$ npm run …") или throw "Нет скрипта"
// TODO: функция buildEnvFile(entries) → строка ".env" (KEY=value по строкам)
console.log("Порт:", port, "| Среда:", process.env.NODE_ENV);
