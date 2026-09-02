// Урок 19: middleware — порядок, next(), error-middleware, async-ловушки
import express from "express";

const app = express();
app.use(express.json());

// TODO: middleware requestId: req.id = crypto.randomUUID() + заголовок X-Request-Id
// TODO: middleware timing: res.on("finish") → лог "method path status duration"
// TODO: const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
// TODO: "БД" { async find(id) { if (id === "fail") throw { status: 503, message: "БД недоступна" }; … } }
// TODO: GET /api/data/:id через asyncHandler (ошибка → error-middleware)
// TODO: 404-хвост + error-middleware (4 аргумента! res.status(err.status || 500).json(…))

app.listen(3000, () => console.log("Middleware-каркас на :3000"));
