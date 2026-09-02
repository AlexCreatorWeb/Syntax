# Урок 25. Безопасность: Helmet, CORS, rate-limit, env в проде

## Цель

После урока студент сможет: объяснить, что такое **заголовки безопасности** и подключить **Helmet**, настроить **CORS** (origins, methods, credentials), ограничить частоту запросов (паттерн **rate-limit**), держать **секреты в env** и собрать «безопасный каркас» Express (что и в каком порядке).

## Теория

### Helmet: защитные заголовки

Браузер «верит» заголовкам. **Helmet** ставит набор **защитных** заголовков (X-Content-Type-Options, HSTS, CSP, …) — защита от MIME-sniffing, старых атак:

```js
import helmet from "helmet";
app.use(helmet()); // «всё сразу» (разумные дефолты)
```

Проверка: в заголовках ответа — `x-content-type-options: nosniff`, `strict-transport-security`, …

### CORS: «кто может дёргать API»

По умолчанию браузер пускает запросы на API **с того же origin**. Для «фронтенд на `:5173`, API на `:3000`» — **CORS**: сервер отвечает заголовками `Access-Control-Allow-Origin` и т.д. **`cors`** — middleware:

```js
import cors from "cors";
app.use(cors()); // «всем» (dev)
app.use(cors({ origin: ["https://app.example.com"], credentials: true })); // прод: список
```

`origin` — **список** доверенных (не `*` с `credentials`). Preflight (`OPTIONS`) — браузер шлёт «разрешено?» перед «не-простым» запросом (POST с JSON) — `cors` отвечает автоматически.

### Rate-limit: «не чаще N на окно»

Защита от брутфорса/«забили» API. Паттерн (в проде — `express-rate-limit`):

```js
const hits = new Map(); // ip → { count, resetAt }
function rateLimit(windowMs, max) {
  return (req, res, next) => {
    const ip = req.ip || "anon";
    const now = Date.now();
    let rec = hits.get(ip);
    if (!rec || now > rec.resetAt) rec = { count: 0, resetAt: now + windowMs };
    rec.count++;
    hits.set(ip, rec);
    if (rec.count > max) return res.status(429).json({ error: "too many requests" });
    next();
  };
}
app.use("/api/login", rateLimit(60_000, 5)); // 5 логин-попыток/мин
```

**429** — Too Many Requests. Для login — строже (брутфорс), для read — слабее.

### Секреты и env (повтор, но «по-боевому»)

- `JWT_SECRET`, `DATABASE_URL`, `MONGO_URL` — **только** в env (не в коде/git).
- Dev: `.env` (в `.gitignore`) + `dotenv`. Prod: env хостинга.
- Валидация **на старте**: «нет `JWT_SECRET` — не подниматься» (fail-fast):

```js
if (!process.env.JWT_SECRET) { console.error("Нет JWT_SECRET"); process.exit(1); }
```

### «Безопасный каркас» (порядок)

```js
app.use(helmet());            // 1) заголовки
app.use(cors(…));             // 2) CORS
app.use(express.json({ limit: "1mb" })); // 3) body (+лимит)
app.use("/api/login", rateLimit(…));     // 4) лимиты (до auth)
app.use("/api", auth);        // 5) auth (где нужно)
app.use("/api", apiRouter);   // 6) маршруты
app.use(notFound);            // 7) 404
app.use(errorHandler);        // 8) ошибки (В КОНЦЕ; не «светить» stack в прод)
```

TIP: `express.json({ limit: "1mb" })` — защита от «огромного» body (по умолчанию 100kb). В error-handler (prod) — `res.status(500).json({error:"internal"})` **без** `err.stack` (stack — в лог).

NOTE: в песочнице `helmet` и `cors` — имитации (ставят те же заголовки: `x-content-type-options`, `access-control-allow-origin`). `__request` может передавать `headers: { origin: "…" }` для проверки CORS.

## Пример

`server.js`:

```js
import express from "express";
import helmet from "helmet";
import cors from "cors";

// fail-fast: секреты обязательны
if (!process.env.JWT_SECRET) { console.error("Нет JWT_SECRET"); process.exit(1); }

const app = express();

// 1) Helmet
app.use(helmet());
// 2) CORS: только наш фронт (в песочнице — * для наглядности)
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : true }));
// 3) body + лимит
app.use(express.json({ limit: "1mb" }));

// 4) rate-limit для /api/login
const hits = new Map();
function rateLimit(windowMs, max) {
  return (req, res, next) => {
    const ip = req.ip || "anon";
    const now = Date.now();
    let rec = hits.get(ip);
    if (!rec || now > rec.resetAt) rec = { count: 0, resetAt: now + windowMs };
    rec.count++;
    hits.set(ip, rec);
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, max - rec.count)));
    if (rec.count > max) return res.status(429).json({ error: "too many requests" });
    next();
  };
}
app.use("/api/login", rateLimit(60_000, 3)); // 3/мин (для демо)

// 5–6) «API» (login без валидации — для проверки лимита)
app.post("/api/login", (req, res) => res.json({ ok: true, attemptLogged: true }));
app.get("/api/headers", (req, res) => res.json({ note: "посмотрите заголовки ответа" }));

// 7) 404
app.use((req, res) => res.status(404).json({ error: "not found" }));
// 8) error-handler (prod: без stack)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.status ? err.message : "internal error" });
});

app.listen(3000, () => console.log("Безопасный каркас на :3000"));
```

Проверка: `__request("GET", "/api/headers")` → в `headers` ответа: `x-content-type-options: nosniff`, `access-control-allow-origin: *`; `__request("POST", "/api/login")` 3 раза → 200; 4-й раз → **429** + `x-ratelimit-remaining: 0`.

## Частые ошибки

WARN: `cors({ origin: "*", credentials: true })` — невалидная комбинация (браузер отвергает). С credentials — **конкретный** origin.

WARN: rate-limit **после** auth (брутфорс «до» лимита). Лимиты — **до** дорогой логики.

WARN: в prod error-handler «светит» `err.stack`/внутреннее (разведка атакера). Prod — «internal error»; детали — в **лог**.

WARN: забыли `helmet`/CORS «потому что локально работает». Локально — один origin (CORS не нужен), в проде — фронт на другом домене (CORS **нужен**).

## Практическое задание

1. Добавьте `express.json({ limit: "2kb" })` на отдельный маршрут `/api/tiny` (middleware с лимитом) и проверьте: body > 2kb → 413.
2. Реализуйте `rateLimit` с **разными** окнами: `/api/login` — 3/60с, `/api/search` — 20/60с. Проверьте 429.
3. Настройте CORS: `origin: ["http://localhost:5173"]`; проверьте `__request("GET", "/api/headers", { headers: { origin: "http://localhost:5173" } })` → `access-control-allow-origin` совпадает; с `origin: "https://evil.com"` → нет заголовка (или `null`).
4. Добавьте fail-fast: если нет `CORS_ORIGIN` в env — warning в лог (не exit).
5. Соберите «чеклист безопасности» (комментарий): helmet, cors, json-limit, rate-limit, env-secrets, error-handler — и «что проверяю» для каждого.
