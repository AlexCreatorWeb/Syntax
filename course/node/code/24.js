// Урок 24: Auth — bcrypt + JWT + auth-middleware
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const SECRET = process.env.JWT_SECRET;
const app = express();
app.use(express.json());
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Таблица users (id, email, name, password_hash) в песочнице есть
// TODO: POST /api/register — валидация (password ≥ 8), дубликат email → 409, bcrypt.hash(…, 10), INSERT RETURNING (без hash!)
// TODO: POST /api/login — SELECT, bcrypt.compare → 401 "bad credentials"; jwt.sign({ sub, email }, SECRET, { expiresIn: "1d" })
// TODO: function auth(req, res, next) — Bearer-токен → jwt.verify (try/catch) → req.user; 401
// TODO: GET /api/me (auth) → res.json(req.user)
// TODO: GET /api/private (auth) → SELECT id, email WHERE id = $1 (req.user.sub)
// TODO: 404 + error-middleware

app.listen(3000, () => console.log("Auth API (bcrypt + JWT) на :3000"));
