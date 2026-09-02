# Урок 21. PostgreSQL: pg Pool, CRUD, параметризованные запросы

## Цель

После урока студент сможет: подключиться к PostgreSQL через `pg.Pool`, выполнять запросы (`pool.query`), делать **CRUD** (INSERT … RETURNING, SELECT, UPDATE, DELETE), использовать **параметризованные запросы** (`$1, $2`) против SQL-инъекций, обрабатывать `rowCount` и `data` и закрывать пул при выходе.

## Теория

### pg и Pool

**`pg`** — клиент PostgreSQL для Node. **Pool** — пул соединений (создаёт/использует/возвращает соединения само; не создавайте `new Client()` на каждый запрос):

```js
import pg from "pg";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const { rows } = await pool.query("SELECT …"); // rows — массив строк
```

`pool.query(text, values)` → `{ rows: [...], rowCount: n }`. Закрытие: `await pool.end()` (при выходе/тесте).

### Параметризованные запросы (главное!)

**Никогда** не собирайте SQL строкой с данными: `"… WHERE id = " + req.params.id` → **SQL-инъекция** (`id = "1; DROP TABLE …"`). Вместо этого — **плейсхолдеры** `$1, $2, …` + массив значений (драйвер экранирует сам):

```js
const { rows } = await pool.query("SELECT * FROM notes WHERE owner = $1 AND done = $2", [owner, false]);
```

Правило: **данные — только через `$N`**; в текст запроса — только **имена** таблиц/колонн (из кода, не из запроса).

### CRUD

```js
// INSERT + вернуть созданную строку
const { rows } = await pool.query(
  "INSERT INTO notes (text, owner) VALUES ($1, $2) RETURNING *", [text, owner]);
const created = rows[0];

// SELECT
const { rows } = await pool.query("SELECT * FROM notes WHERE owner = $1 ORDER BY id", [owner]);

// UPDATE ( rowCount — сколько обновилось )
const { rowCount } = await pool.query("UPDATE notes SET done = $1 WHERE id = $2", [true, id]);
if (rowCount === 0) throw new Error("NOTE_NOT_FOUND");

// DELETE
const { rowCount } = await pool.query("DELETE FROM notes WHERE id = $1", [id]);
```

`RETURNING *` — «отдать» строку после INSERT/UPDATE (не делать второй SELECT).

### Типы и null

Postgres-типы приходят «как есть»: `INTEGER` → number, `TEXT` → string, `BOOLEAN` → boolean, `TIMESTAMPTZ` → Date, `NULL` → `null`. Целые **больше 2^53** приходят как **строки** (BigInt-поведение) — не ломайте `Number()`.

TIP: `pool.query` с **одинаковым** текстом — кэшируется (prepare). Для «одного и того же запроса в цикле» — вынесите текст в константу.

NOTE: в песочнице `pg` — in-memory mock: **тот же API** (`new pg.Pool()`, `pool.query(text, values)` с `$1..$N`, `rows`/`rowCount`, `RETURNING *`), данные живут до перезагрузки страницы. В терминале — настоящая PostgreSQL (`DATABASE_URL` в env). Таблица `notes` в песочнице **создана заранее** (столбцы `id SERIAL, text TEXT, owner TEXT, done BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT now()`).

## Пример

`server.js`:

```js
import express from "express";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const app = express();
app.use(express.json());

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

app.get("/api/notes", asyncHandler(async (req, res) => {
  const owner = req.query.owner; // опциональный фильтр
  const q = owner
    ? "SELECT * FROM notes WHERE owner = $1 ORDER BY id"
    : "SELECT * FROM notes ORDER BY id";
  const { rows } = await pool.query(q, owner ? [owner] : []);
  res.json(rows);
}));

app.post("/api/notes", asyncHandler(async (req, res) => {
  const { text, owner } = req.body;
  if (!text || !String(text).trim()) return res.status(400).json({ error: "text обязателен" });
  const { rows } = await pool.query(
    "INSERT INTO notes (text, owner) VALUES ($1, $2) RETURNING *",
    [String(text).trim(), owner || "anon"]);
  res.status(201).json(rows[0]);
}));

app.patch("/api/notes/:id", asyncHandler(async (req, res) => {
  const { rowCount, rows } = await pool.query(
    "UPDATE notes SET done = $1 WHERE id = $2 RETURNING *",
    [Boolean(req.body.done), Number(req.params.id)]);
  if (rowCount === 0) return res.status(404).json({ error: "not found" });
  res.json(rows[0]);
}));

app.delete("/api/notes/:id", asyncHandler(async (req, res) => {
  const { rowCount } = await pool.query("DELETE FROM notes WHERE id = $1", [Number(req.params.id)]);
  if (rowCount === 0) return res.status(404).json({ error: "not found" });
  res.status(204).end();
}));

app.use((req, res) => res.status(404).json({ error: "not found" }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: err.message }); });

app.listen(3000, () => console.log("PostgreSQL API на :3000"));
```

Проверка: `POST /api/notes {text:"С БД", owner:"u1"}` → 201 (id из RETURNING); `GET /api/notes?owner=u1` → фильтрует; `PATCH /api/notes/1 {done:true}` → 200; `DELETE /api/notes/1` → 204; повторный `DELETE` → 404.

## Частые ошибки

WARN: **SQL-инъекция**: `"… WHERE id = " + id` (или шаблонная строка с данными). Только `$1/$2` + массив значений.

WARN: `new pg.Client()` на каждый запрос (создание соединения — дорого). **Pool** (создаётся один раз).

WARN: `UPDATE`/`DELETE` без проверки `rowCount` — «успешно», хотя строк не было (404 теряется). `rowCount === 0` → 404.

WARN: ожидаете `rows` при `UPDATE`/`DELETE` без `RETURNING *` — там только `rowCount`. Чтобы получить строку — `RETURNING *`.

## Практическое задание

1. Сделайте API «проектов» (таблица `projects` в песочнице: `id, name, owner, budget, created_at`): `GET /api/projects` (фильтр `?owner=`), `POST` (валидация `name`, `budget` — число), `GET /api/projects/:id`.
2. Добавьте `PATCH /api/projects/:id/budget` (установить `budget`; 404 если нет).
3. Добавьте `GET /api/projects/summary` → `{ count, totalBudget }` (через `SELECT COUNT(*)::int AS count, COALESCE(SUM(budget),0) AS totalBudget`).
4. Проверьте SQL-безопасность: `GET /api/projects?owner=alice' OR '1'='1` — должна вернуть **пусто** (параметризованный запрос экранирует), а не всю таблицу.
5. В комментарии: почему `RETURNING *` лучше «INSERT, потом SELECT по id».
