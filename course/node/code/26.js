// Урок 26: финальный проект — REST API «Заметки» (Express + pg + JWT + helmet/cors)
import express from "express";
import helmet from "helmet";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pg from "pg";

const SECRET = process.env.JWT_SECRET;
if (!SECRET) { console.error("Нет JWT_SECRET"); process.exit(1); }
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const app = express();

// Таблицы (users, notes) в песочнице есть; связи: notes.user_id → users.id
// TODO: helmet + cors + express.json({ limit: "1mb" })
// TODO: GET /health → 204
// TODO: notesService (WHERE user_id = $!): list, create (TEXT_REQUIRED), toggle, remove (NOTE_NOT_FOUND)
// TODO: POST /api/register (409 на дубликат, bcrypt.hash) / POST /api/login (compare, jwt.sign 1d)
// TODO: auth middleware (Bearer → jwt.verify → req.user; 401)
// TODO: GET /api/me (auth)
// TODO: /api/notes (auth): GET (свои), POST (201), PATCH /:id (done boolean, только свои → 404), DELETE /:id (204)
// TODO: GET /api/notes/search?q=… (только свои)
// TODO: 404-хвост + error-middleware (NOTE_NOT_FOUND → 404, TEXT_REQUIRED → 400, остальное → 500)

app.listen(3000, () => console.log("REST API «Заметки» на :3000"));
