# Урок 24. Auth: bcrypt, JWT (sign/verify), auth-middleware

## Цель

После урока студент сможет: хешировать пароли через **bcrypt** (hash/compare, salt, rounds), issuing и проверять **JWT** (`jwt.sign`/`jwt.verify`, payload, `expiresIn`, secret), писать **auth-middleware** (извлечь токен из `Authorization: Bearer …`, верифицировать, положить `req.user`), и собрать endpoints `register`/`login` + защищённый маршрут.

## Теория

### Пароли: bcrypt (не «просто так»)

Пароль **не хранят** в открытом виде (и не «шифруют» — **хешируют**). **bcrypt** — медленный хеш с **солью** (каждый пароль — уникальный, соль внутри хеша):

```js
import bcrypt from "bcryptjs"; // чистый JS (в терминале: bcrypt или bcryptjs)
const hash = await bcrypt.hash(password, 10);        // rounds = 10 (10–12)
const ok = await bcrypt.compare(input, hash);         // true/false
```

`hash` — строка вида `$2b$10$…` (в себя включает salt + cost). В БД храним **только hash**. `compare` — «входной пароль == хеш?».

### JWT: токен «с подписью»

**JWT** (JSON Web Token) — компактный токен `header.payload.signature` (base64url). Подпись (HMAC-SHA256, **HS256**) — от **секрета** (`JWT_SECRET`): изменили payload — подпись не совпадёт. Структура payload: `sub` (id пользователя), кастомные поля, `iat`/`exp` (время).

```js
import jwt from "jsonwebtoken";
const token = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1d" });
const payload = jwt.verify(token, process.env.JWT_SECRET); // бросит при exp/подписи
```

`verify` **бросает** (`TokenExpiredError`, `JsonWebTokenError`) — оборачивайте в try/catch. **Секрет** — в env (никогда не в коде/git).

**Stateless**: сервер не хранит сессию — «состояние» в токене (клиент присылает его на каждый запрос). Цена: «отозвать» токен до `exp` сложно (без blacklist).

### Auth-middleware

```js
function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "no token" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // { sub, email }
    next();
  } catch {
    res.status(401).json({ error: "bad token" });
  }
}
app.use("/api/me", auth, (req, res) => res.json(req.user));
```

Клиент: `Authorization: Bearer <token>` (заголовок). 401 — «не аутентифицирован» (нет/плох токен); 403 — «авторизован, но нет прав».

TIP: `expiresIn` для «логин-токенов» — 1 день (не «100 лет»). Для «refresh» — отдельный механизм (уровень выше курса). Секрет — **длинный** случайный (≥32 байта), **разный** в dev/prod.

NOTE: в песочнице `jsonwebtoken` (HS256 sign/verify) и `bcryptjs` (hash/compare) — **настоящие реализации** (чистый JS). БД пользователей — in-memory (как в уроке 21, `users`-таблица pg-mock или массив).

## Пример

`server.js`:

```js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const SECRET = process.env.JWT_SECRET;
const app = express();
app.use(express.json());
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ===== register =====
app.post("/api/register", ah(async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: "email и password обязательны" });
  if (String(password).length < 8) return res.status(400).json({ error: "password >= 8 символов" });
  const exists = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  if (exists.rowCount) return res.status(409).json({ error: "email занят" });
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    "INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id, email, name",
    [email, name || email.split("@")[0], hash]);
  res.status(201).json(rows[0]);
}));

// ===== login =====
app.post("/api/login", ah(async (req, res) => {
  const { email, password } = req.body;
  const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  const user = rows[0];
  const ok = user && await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "bad credentials" });
  const token = jwt.sign({ sub: user.id, email: user.email }, SECRET, { expiresIn: "1d" });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
}));

// ===== auth middleware =====
function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "no token" });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (e) {
    res.status(401).json({ error: e.name === "TokenExpiredError" ? "token expired" : "bad token" });
  }
}

// ===== защищённый маршрут =====
app.get("/api/me", auth, (req, res) => res.json(req.user));
app.get("/api/private", auth, ah(async (req, res) => {
  const { rows } = await pool.query("SELECT id, email FROM users WHERE id = $1", [req.user.sub]);
  res.json({ profile: rows[0], loggedByEmail: req.user.email });
}));

app.use((req, res) => res.status(404).json({ error: "not found" }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: err.message }); });
app.listen(3000, () => console.log("Auth API (bcrypt + JWT) на :3000"));
```

Проверка: `POST /api/register {email, password}` → 201; `POST /api/login` → 200 `{token}`; `GET /api/me` с `headers: { authorization: "Bearer <token>" }` → 200 `{sub, email}`; без заголовка → 401; плохой токен → 401.

## Частые ошибки

WARN: храните пароль **в открытом виде** (или MD5/SHA «без соли»). Только bcrypt (salt + cost внутри хеша).

WARN: `jwt.verify` без try/catch — expired/битый токен **роняет** запрос (500 вместо 401). Verify — в try/catch.

WARN: секрет JWT **в коде/git** (или «changeme» в проде). `JWT_SECRET` — в env, длинный, разный на окружение.

WARN: кладёте в payload **чувствительное** (пароль, роли «наверняка»). Payload — **читают клиент** (base64, не шифр): только то, что «можно показать» (sub, email, роль).

## Практическое задание

1. Добавьте `GET /api/users` (защитить `auth`): список `{id, email, name}` (без `password_hash`!).
2. Добавьте «своё» поле в payload при login (`role: "user"`) и выведите его в `/api/me`.
3. Реализуйте `POST /api/logout` (имитация: принять токен, «принять к сведению» — в комментарии объясните, почему stateless logout сложный).
4. Проверьте: register → login → me (200); me без токена (401); me с `Bearer not-a-jwt` (401); login с плохим паролем (401).
5. В комментарии: почему `expiresIn: "1d"`, а не "100y"; что такое refresh-токен (одна фраза).
