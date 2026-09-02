// Урок 25: безопасность — helmet, cors, rate-limit, env
import express from "express";
import helmet from "helmet";
import cors from "cors";

if (!process.env.JWT_SECRET) { console.error("Нет JWT_SECRET"); process.exit(1); }
const app = express();

// TODO: app.use(helmet())
// TODO: app.use(cors({ origin: … })) — из env CORS_ORIGIN (список через запятую) или true
// TODO: app.use(express.json({ limit: "1mb" }))
// TODO: rateLimit(windowMs, max) — Map ip → { count, resetAt }; 429 "too many requests"
// TODO: app.use("/api/login", rateLimit(60000, 3))
// TODO: POST /api/login → 200 { ok: true } (для проверки лимита)
// TODO: GET /api/headers → 200 (посмотрите заголовки ответа: nosniff, access-control-allow-origin)
// TODO: 404 + error-middleware (prod: без err.stack)

app.listen(3000, () => console.log("Безопасный каркас на :3000"));
