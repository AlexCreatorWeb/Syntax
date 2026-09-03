// Сидер курса PostgreSQL (20 уроков) в Supabase-таблицу `lessons`.
// Контракт: course/postgres/00-roadmap.md. Запуск из корня репо: node seed-postgres-course.mjs
// Пересид идемпотентен: удаляет ВСЕ строки tech='postgres' и вставляет 20 с упорядоченными id.
// DRY=1 node seed-postgres-course.mjs — только QC (без записи).
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://xaslezkoktydranikqnx.supabase.co",
  "sb_publishable_rQC4uMonBP3dCF1Gz9avMQ_G_81WwQT"
);

const FILES = [
  "01-intro", "02-types", "03-ddl", "04-alter-schemas", "05-insert",
  "06-where", "07-sort-page", "08-aggregate", "09-relations", "10-joins",
  "11-subqueries", "12-window", "13-transactions", "14-concurrency",
  "15-indexes", "16-explain", "17-jsonb", "18-views", "19-triggers", "20-final-project",
];

const TITLES = {
  "01-intro": "PostgreSQL: что это и с чего начать (psql)",
  "02-types": "Типы данных: числа, строки, даты, UUID, JSONB",
  "03-ddl": "CREATE TABLE: ограничения и identity-колонки",
  "04-alter-schemas": "ALTER, DROP, ENUM и структура базы",
  "05-insert": "Вставка данных: INSERT, multi-row, ON CONFLICT (upsert)",
  "06-where": "WHERE и операторы: фильтрация и NULL",
  "07-sort-page": "Сортировка и пагинация: ORDER BY, LIMIT, keyset",
  "08-aggregate": "Агрегация: GROUP BY, HAVING, FILTER",
  "09-relations": "Связи: первичные и внешние ключи, 1:1 / 1:N / N:M",
  "10-joins": "JOIN: INNER, LEFT, RIGHT, FULL и ловушки",
  "11-subqueries": "Подзапросы, CTE и LATERAL",
  "12-window": "Оконные функции: ROW_NUMBER, RANK, OVER (PARTITION BY)",
  "13-transactions": "Транзакции и уровни изоляции",
  "14-concurrency": "Конкурентность и блокировки: deadlock, SKIP LOCKED",
  "15-indexes": "Индексы: B-Tree, GIN, GiST и спец-формы",
  "16-explain": "EXPLAIN (ANALYZE, BUFFERS): чтение планов",
  "17-jsonb": "JSONB: операторы, индексы, когда уместен",
  "18-views": "Views, материализованные views, generated-колонки",
  "19-triggers": "Функции и триггеры (PL/pgSQL)",
  "20-final-project": "Финальный проект: e-commerce «с нуля до отчётов»",
};

function linkify(s) {
  return s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)");
}

// markdown → markdown-lite (контракт src/lib/markdown.js: списков нет — «• » + пустая строка)
function mdToLite(src) {
  const lines = src.split("\n");
  const out = [];
  let i = 0;
  while (i < lines.length && !lines[i].startsWith("# ")) i++;
  i++; // пропускаем «# Заголовок» (он в колонке title)
  while (i < lines.length) {
    const line = lines[i];
    if (/^[-*] /.test(line)) {
      out.push(linkify(line.replace(/^[-*] /, "• ")));
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
function validate(n, title, content, code, dry) {
  const errs = [];
  for (const sec of ["## Цель", "## Теория", "## Пример", "## Частые ошибки", "## Практическое задание"]) {
    if (!content.includes(sec)) errs.push(`нет раздела ${sec}`);
  }
  if (!/^(TIP|NOTE)\s*:/m.test(content)) errs.push("нет TIP:/NOTE:-callout'а");
  if (!/^WARN\s*:/m.test(content)) errs.push("нет WARN:-callout'а");
  if (/\[.+?\]\(.+?\)/.test(content)) errs.push("есть markdown-ссылка [t](u)");
  if (!/```sql\n/.test(content)) errs.push("нет sql-кодоблока (```sql) в Примере");
  const chars = content.length;
  if (chars < 4000 || chars > 7000) errs.push(`объём ${chars} (нужно 4000–7000)`);
  if (!code || !code.trim()) errs.push("code пустой");
  if (!/TODO/.test(code)) errs.push("code без TODO (должен быть скелет задания)");
  if (errs.length) {
    if (dry) { console.log(`${String(n).padStart(2, "0")}. ${title} | ${chars} зн | ERR: ` + errs.join("; ")); return; }
    throw new Error(`урок ${n} «${title}»: ` + errs.join("; "));
  }
  if (dry) console.log(`${String(n).padStart(2, "0")}. ${title} | ${chars} зн | OK`);
}

// --- сбор строк ---
const inserts = [];
for (let n = 1; n <= 20; n++) {
  const name = FILES[n - 1];
  const raw = readFileSync(`course/postgres/${name}.md`, "utf8");
  const code = readFileSync(`course/postgres/code/${String(n).padStart(2, "0")}.sql`, "utf8");
  const content = mdToLite(raw);
  validate(n, TITLES[name], content, code, Boolean(process.env.DRY));
  inserts.push({
    id: `90000000-0000-4000-9000-${String(n).padStart(12, "0")}`,
    tech: "postgres",
    title: TITLES[name],
    content,
    code,
  });
}

// --- пересид: удалить все postgres-строки и вставить 20 ---
if (process.env.DRY) process.exit(0);
const { error: delErr } = await sb.from("lessons").delete().eq("tech", "postgres");
if (delErr) throw new Error("delete: " + delErr.message);
const { error: insErr } = await sb.from("lessons").insert(inserts);
if (insErr) throw new Error("insert: " + insErr.message);

// --- проверка ---
const { data, error } = await sb
  .from("lessons")
  .select("id, title, tech, content, code")
  .eq("tech", "postgres")
  .order("id");
if (error) throw new Error("select: " + error.message);
console.log(`lessons(tech=postgres): ${data.length}`);
data.forEach((r, i) =>
  console.log(
    `${String(i + 1).padStart(2, "0")}. ${r.title} | content: ${r.content.length} зн | code: ${r.code ? r.code.length + " зн" : "—"}`
  )
);
