// Сидер курса MongoDB (18 уроков) в Supabase-таблицу `lessons`.
// Контракт: course/mongo/00-roadmap.md. Запуск из корня репо: node seed-mongo-course.mjs
// Пересид идемпотентен: удаляет ВСЕ строки tech='vue' и вставляет 22 с упорядоченными id.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://xaslezkoktydranikqnx.supabase.co",
  "sb_publishable_rQC4uMonBP3dCF1Gz9avMQ_G_81WwQT"
);

const FILES = [
  "01-intro", "02-documents-bson", "03-db-collections",
  "04-insert", "05-find", "06-update", "07-delete-crud",
  "08-query-operators", "09-arrays-nested",
  "10-embed-reference", "11-modeling-practice",
  "12-indexes", "13-performance",
  "14-aggregation-basics", "15-aggregation-advanced",
  "16-mongoose-basics", "17-mongoose-validation", "18-final-project",
];

const TITLES = {
  "01-intro": "NoSQL и MongoDB: отличие от SQL, mongosh и Compass",
  "02-documents-bson": "Документы, BSON и ObjectId: единицы данных",
  "03-db-collections": "Базы данных и коллекции: структура, создание, списки",
  "04-insert": "insertOne / insertMany: запись данных",
  "05-find": "find: фильтры, проекция, sort, limit/skip",
  "06-update": "updateOne / updateMany: $set vs замена, upsert, replaceOne",
  "07-delete-crud": "deleteOne / deleteMany: завершаем CRUD",
  "08-query-operators": "Операторы выборки: $gt/$in/$and/$or/$exists/$regex",
  "09-arrays-nested": "Массивы и вложенность: $push/$addToSet/$pull, $elemMatch",
  "10-embed-reference": "Связи: Embed vs Reference — ядро моделирования",
  "11-modeling-practice": "Практика моделирования: блог и магазин",
  "12-indexes": "Индексы: создание, составные, unique, explain",
  "13-performance": "Производительность: выбор индекса, FULL SCAN, count/distinct",
  "14-aggregation-basics": "Aggregation: конвейер, $match, $project, $group",
  "15-aggregation-advanced": "Сложные агрегации: $unwind, $lookup, $addFields",
  "16-mongoose-basics": "Mongoose: connect, Schema, Model, CRUD",
  "17-mongoose-validation": "Mongoose: валидация, defaults, timestamps, virtuals",
  "18-final-project": "Финальный проект: API «Блог» (Mongoose + Express)",
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
for (let n = 1; n <= 18; n++) {
  const name = FILES[n - 1];
  const raw = readFileSync(`course/mongo/${name}.md`, "utf8");
  const code = readFileSync(`course/mongo/code/${String(n).padStart(2, "0")}.js`, "utf8");
  const content = mdToLite(raw);
  validate(n, TITLES[name], content, Boolean(process.env.DRY));
  inserts.push({
    id: `70000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
    tech: "mongo",
    title: TITLES[name],
    content,
    code,
  });
  if (process.env.DRY) console.log(`${String(n).padStart(2, "0")}. ${TITLES[name]} | ${content.length} зн | OK`);
}

// --- пересид: удалить все mongo-строки и вставить 18 ---
if (process.env.DRY) process.exit(0);
const { error: delErr } = await sb.from("lessons").delete().eq("tech", "mongo");
if (delErr) throw new Error("delete: " + delErr.message);
const { error: insErr } = await sb.from("lessons").insert(inserts);
if (insErr) throw new Error("insert: " + insErr.message);

// --- проверка ---
const { data, error } = await sb
  .from("lessons")
  .select("id, title, tech, content, code")
  .eq("tech", "mongo")
  .order("id");
if (error) throw new Error("select: " + error.message);
console.log(`lessons(tech=mongo): ${data.length}`);
data.forEach((r, i) =>
  console.log(
    `${String(i + 1).padStart(2, "0")}. ${r.title} | content: ${r.content.length} зн | code: ${r.code ? r.code.length + " зн" : "—"}`
  )
);
