// Сидер курса Node.js (26 уроков) в Supabase-таблицу `lessons`.
// Контракт: course/node/00-roadmap.md. Запуск из корня репо: node seed-node-course.mjs
// Пересид идемпотентен: удаляет ВСЕ строки tech='vue' и вставляет 22 с упорядоченными id.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://xaslezkoktydranikqnx.supabase.co",
  "sb_publishable_rQC4uMonBP3dCF1Gz9avMQ_G_81WwQT"
);

const FILES = [
  "01-intro", "02-event-loop", "03-callbacks-promises", "04-async-await",
  "05-esm", "06-npm", "07-npx-env", "08-project-structure",
  "09-path", "10-fs", "11-streams", "12-buffer", "13-events",
  "14-http", "15-url-json", "16-mini-framework",
  "17-express-first", "18-router", "19-middleware", "20-express-structure",
  "21-postgres", "22-mongodb", "23-orm-odm",
  "24-auth", "25-security", "26-final-project",
];

const TITLES = {
  "01-intro": "Node.js и V8: как работает рантайм",
  "02-event-loop": "Event Loop: фазы, макротаски и микротаски",
  "03-callbacks-promises": "Колбэки, «пирамида ужаса» и Promise",
  "04-async-await": "async/await: try/catch и параллельность",
  "05-esm": "ESM: import/export, «type»: «module», __dirname",
  "06-npm": "npm: install, dependencies, package.json, lock",
  "07-npx-env": "npx, npm-скрипты и переменные окружения (.env, dotenv)",
  "08-project-structure": "Структура Node-проекта: папки по слоям",
  "09-path": "path: join, resolve, relative, parse",
  "10-fs": "fs: sync vs async, readFile/writeFile, коды ошибок",
  "11-streams": "fs-стримы: createReadStream, createWriteStream, pipe",
  "12-buffer": "Buffer и кодировки (utf8, base64, hex)",
  "13-events": "events: EventEmitter, on/once/off, конвенция «error»",
  "14-http": "http с нуля: createServer, req/res, статус-коды",
  "15-url-json": "URL, query, JSON API: GET/POST, body",
  "16-mini-framework": "Мини-фреймворк: свой роутинг и middleware",
  "17-express-first": "Express: первый сервер, res.json, 404",
  "18-router": "Router: params, query, вложенные маршруты",
  "19-middleware": "Middleware: порядок, next(), error-middleware, async-ловушки",
  "20-express-structure": "Структура приложения: routes / controllers",
  "21-postgres": "PostgreSQL: pg Pool, CRUD, параметризованные запросы",
  "22-mongodb": "MongoDB: драйвер, CRUD, ObjectId",
  "23-orm-odm": "ORM/ODM: Prisma и Mongoose (паттерны)",
  "24-auth": "Auth: bcrypt, JWT (sign/verify), auth-middleware",
  "25-security": "Безопасность: Helmet, CORS, rate-limit, env в проде",
  "26-final-project": "Финальный проект: REST API «Заметки»",
};

function linkify(s) {
  return s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)");
}

// markdown → markdown-lite (контракт src/lib/markdown.js)
function mdToLite(src) {
  const lines = src.split("\n");
  const out = [];
  let i = 0;
  while (i < lines.length && !lines[i].startsWith("# ")) i++;
  i++; // пропускаем «# Заголовок» (он в колонке title)
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim().startsWith("|")) {
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) { rows.push(lines[i].trim()); i++; }
      const cells = (r) => r.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
      const data = rows.slice(1).filter((r) => !/^[\s|:-]+$/.test(r)).map(cells);
      for (const c of data) {
        const [first, ...rest] = c;
        out.push(linkify("• **" + first + "** — " + rest.join(" · ")));
        out.push("");
      }
      continue;
    }
    if (/^[-*] /.test(line)) {
      out.push(linkify(line.replace(/^[-*] /, "• ").replace(/\[ \]/g, "☐ ")));
      out.push("");
      i++;
      continue;
    }
    if (/^\d+\. /.test(line)) {
      out.push(linkify(line));
      out.push("");
      i++;
      continue;
    }
    if (line.trim().startsWith("# ")) { i++; continue; }
    out.push(linkify(line));
    i++;
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

// --- контроль качества перед вставкой ---
function validate(n, title, content, dry) {
  const errs = [];
  for (const sec of ["## Цель", "## Теория", "## Пример", "## Частые ошибки", "## Практическое задание"]) {
    if (!content.includes(sec)) errs.push(`нет раздела ${sec}`);
  }
  if (!/^(TIP|NOTE)\s*:/m.test(content)) errs.push("нет TIP:/NOTE:-callout'а");
  if (!/^WARN\s*:/m.test(content)) errs.push("нет WARN:-callout'а");
  if (/\[.+?\]\(.+?\)/.test(content)) errs.push("есть markdown-ссылка [t](u)");
  if (!/```js\n/.test(content)) errs.push("нет js-кодоблока (```js) в Примере");
  const chars = content.length;
  if (chars < 4000 || chars > 7000) errs.push(`объём ${chars} (нужно 4000–7000)`);
  if (errs.length) {
    if (dry) { console.log(`${String(n).padStart(2, "0")}. ${title} | ${content.length} зн | ERR: ` + errs.join("; ")); return; }
    throw new Error(`урок ${n} «${title}»: ` + errs.join("; "));
  }
}

// --- сбор строк ---
const inserts = [];
for (let n = 1; n <= 26; n++) {
  const name = FILES[n - 1];
  const raw = readFileSync(`course/node/${name}.md`, "utf8");
  const code = readFileSync(`course/node/code/${String(n).padStart(2, "0")}.js`, "utf8");
  const content = mdToLite(raw);
  validate(n, TITLES[name], content, Boolean(process.env.DRY));
  inserts.push({
    id: `60000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
    tech: "node",
    title: TITLES[name],
    content,
    code,
  });
  if (process.env.DRY) console.log(`${String(n).padStart(2, "0")}. ${TITLES[name]} | ${content.length} зн | OK`);
}

// --- пересид: удалить все node-строки и вставить 26 ---
if (process.env.DRY) process.exit(0);
const { error: delErr } = await sb.from("lessons").delete().eq("tech", "node");
if (delErr) throw new Error("delete: " + delErr.message);
const { error: insErr } = await sb.from("lessons").insert(inserts);
if (insErr) throw new Error("insert: " + insErr.message);

// --- проверка ---
const { data, error } = await sb
  .from("lessons")
  .select("id, title, tech, content, code")
  .eq("tech", "node")
  .order("id");
if (error) throw new Error("select: " + error.message);
console.log(`lessons(tech=node): ${data.length}`);
data.forEach((r, i) =>
  console.log(
    `${String(i + 1).padStart(2, "0")}. ${r.title} | content: ${r.content.length} зн | code: ${r.code ? r.code.length + " зн" : "—"}`
  )
);
