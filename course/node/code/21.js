// Урок 21: PostgreSQL — pg Pool, CRUD, параметризованные запросы
import express from "express";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const app = express();
app.use(express.json());
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Таблица в песочнице уже есть: notes (id, text, owner, done, created_at)
// TODO: GET /api/notes → SELECT (фильтр ?owner= через $1!)
// TODO: POST /api/notes → INSERT … RETURNING * (201); валидация text → 400
// TODO: PATCH /api/notes/:id → UPDATE … RETURNING *; rowCount === 0 → 404
// TODO: DELETE /api/notes/:id → rowCount === 0 → 404, иначе 204
// TODO: 404-хвост + error-middleware
// TODO: проверьте: ?owner=alice' OR '1'='1 → пусто (параметризованный запрос спасает)

app.listen(3000, () => console.log("PostgreSQL API на :3000"));
