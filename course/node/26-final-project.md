# Урок 26. Финальный проект: REST API «Заметки»

## Цель

После урока студент сможет: собрать **целиком** REST API «Заметки» — Express + PostgreSQL + JWT-auth + Helmet/CORS + валидация + error-handling — по всем паттернам курса, разобрать архитектуру (слои: routes/controllers/services) и проверить API end-to-end через `__request` (register → login → CRUD заметок → защита → безопасность).

## Теория

### Собираем всё вместе

Финальный проект — **композиция** курса: архитектура (01-04), ESM/npm/env (05-08), built-ins (09-13), HTTP (14-16), Express (17-20), PostgreSQL (21), Auth (24), Безопасность (25). Stack:

- **Express 4** — фреймворк (Router, middleware).
- **pg** (PostgreSQL) — БД (таблицы `users`, `notes`).
- **bcryptjs + jsonwebtoken** — auth (пароли-хеши, JWT).
- **helmet + cors** — безопасность (заголовки, CORS).
- **Слои**: routes → controllers → services → model (pg).

### Схемы БД

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE notes (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notes_user ON notes(user_id);
```

`ON DELETE CASCADE` — «удалили пользователя → удалились его заметки». Индекс по `user_id` — «список заметок юзера» быстро.

### Контракт API

```
POST   /api/register        { email, password, name }  → 201 { id, email, name }
POST   /api/login           { email, password }         → 200 { token, user }
GET    /api/me              (Bearer)                    → 200 { sub, email }
GET    /api/notes           (Bearer)                    → 200 [ {id, text, done, created_at} ]
POST   /api/notes           (Bearer) { text }           → 201 { id, text, done }
PATCH  /api/notes/:id       (Bearer) { done? }          → 200 { … }  (только свои!)
DELETE /api/notes/:id       (Bearer)                    → 204         (только свои!)
GET    /health                                     → 204
```

«Только свои» — **авторизация + владение**: заметка принадлежит `user_id`; чужую — 404 (не «403», чтобы не «светить» существование).

### Проверка (E2E)

Сценарий (через `__request` в платформе / `curl` в терминале):
1. `register` → 201.
2. `login` → 200, сохраняем `token`.
3. `GET /api/notes` с `Bearer` → 200, `[]`.
4. `POST /api/notes {text:"Первая"}` → 201.
5. `PATCH /api/notes/1 {done:true}` → 200 (done: true).
6. `GET /api/notes` → 200, 1 заметка (done: true).
7. `DELETE /api/notes/1` → 204.
8. `GET /api/notes` → 200, `[]`.
9. `GET /api/notes` **без** токена → 401.
10. `GET /health` → 204 (health без auth).

TIP: в терминале — тот же код, но `pg` на **настоящей** PostgreSQL (миграции из SQL выше), `DATABASE_URL`/`JWT_SECRET` в `.env`, `npm i express pg bcryptjs jsonwebtoken helmet cors`. Структура — по файлам (урок 20).

NOTE: в песочнице таблицы `users`/`notes` **созданы заранее** (pg-mock, in-memory); `helmet`/`cors` — имитации (заголовки те же). Проверка — `__request` (с `headers: { authorization: "Bearer …" }`).

## Пример

`server.js` (скелет — **решите** TODO; «референс»-фрагменты в комментариях):

```js
import express from "express";
import helmet from "helmet";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pg from "pg";

// ===== config (fail-fast) =====
const SECRET = process.env.JWT_SECRET;
if (!SECRET) { console.error("Нет JWT_SECRET"); process.exit(1); }
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const app = express();
// TODO: helmet, cors, express.json (лимит 1mb)
// TODO: health (GET /health → 204)

// ===== service (notes; владение: WHERE user_id = $) =====
// TODO: notesService.list(userId), create(userId, text), toggle(userId, id), remove(userId, id)
//   - «чужая/нет» → бросить NOTE_NOT_FOUND
//   - create: text обязателен (TEXT_REQUIRED)

// ===== auth =====
// TODO: register (409 на дубликат email, bcrypt.hash), login (compare → 401; jwt.sign 1d)
// TODO: auth middleware (Bearer → jwt.verify → req.user; 401)

// ===== routes =====
// TODO: /api/register, /api/login, /api/me (auth), /api/notes (auth: GET/POST),
//   /api/notes/:id (auth: PATCH/DELETE)
// TODO: 404-хвост + error-middleware (NOTE_NOT_FOUND→404, TEXT_REQUIRED→400, прочее→500)

app.listen(3000, () => console.log("REST API «Заметки» на :3000"));
```

## Частые ошибки

WARN: «чужая» заметка → **403** (светим существование). Для «не твоя» — **404** (как «нет»). 403 — «авторизован, но роль не та».

WARN: CRUD **без** `WHERE user_id = $` (любой залогиненный дёргает чужие). Фильтр по владельцу — в **каждом** запросе заметок.

WARN: `password_hash` «уходит» в клиент (`GET /api/me` с `SELECT *`). Выбирайте **явные** колонки (без hash).

WARN: забыли `ON DELETE CASCADE` (или «очистку» заметок при удалении юзера) — «сироты» в БД.

## Практическое задание

1. Реализуйте **весь** скелет: config, helmet/cors/json, health, notesService, register/login, auth, routes, 404, error-middleware.
2. Проверьте E2E-сценарий из «Теории» (10 шагов) через `__request`; выведите статусы.
3. Добавьте `GET /api/notes/search?q=…` (по подстроке, только свои).
4. Добавьте `PATCH /api/notes/:id` с валидацией: `done` — только boolean (иначе 400).
5. «Чужая заметка»: зарегистрируйте **второго** юзера, попробуйте `DELETE` чужой id → 404.
6. (Бонус) `GET /api/stats` (auth): `{ notes: N, done: M }` для текущего юзера.
