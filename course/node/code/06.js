// Урок 6: npm — package.json как «паспорт проекта»
import express from "express";

// TODO: объявите константу pkg — объект package.json вашего API:
//   { name, version: "1.0.0", type: "module", scripts: { start, dev }, dependencies: { express } }
// TODO: выведите pkg.scripts.start
// TODO: функция installPlan(packages, { dev } = {}) → массив команд npm install (с -D если dev)

const app = express();
app.get("/health", (req, res) => res.json({ ok: true }));
app.listen(3000, () => console.log("package.json = паспорт проекта"));
// TODO: объясните комментарием: dependencies vs devDependencies; зачем package-lock.json
