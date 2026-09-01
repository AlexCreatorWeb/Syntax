// Сидер курса HTML (16 уроков) в Supabase-таблицу `lessons`.
// Контракт: course/html/00-roadmap.md. Запуск из корня репо: node seed-html-course.mjs
// Пересид идемпотентен: удаляет ВСЕ строки tech='html' и вставляет 16 с упорядоченными id.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://xaslezkoktydranikqnx.supabase.co",
  "sb_publishable_rQC4uMonBP3dCF1Gz9avMQ_G_81WwQT"
);

const FILES = [
  "01-structure", "02-encoding", "03-text", "04-links", "05-navigation", "06-images",
  "07-lists", "08-tables", "09-forms-1", "10-forms-2", "11-semantics", "12-media",
  "13-a11y", "14-seo", "15-modern", "16-final-project",
];

const TITLES = {
  "01-structure": "Структура HTML-документа",
  "02-encoding": "Кодировки и символы",
  "03-text": "Текст и заголовки",
  "04-links": "Ссылки: от якорей до rel",
  "05-navigation": "Навигация сайта и вкладки",
  "06-images": "Изображения: img, srcset, picture",
  "07-lists": "Списки: ul, ol, dl",
  "08-tables": "Таблицы и их доступность",
  "09-forms-1": "Формы I: каркас и типы input",
  "10-forms-2": "Формы II: валидация и спецэлементы",
  "11-semantics": "Семантическая структура страницы",
  "12-media": "Медиа: video, audio, iframe",
  "13-a11y": "a11y: ARIA, клавиатура, чек-лист",
  "14-seo": "Мета и SEO-базис",
  "15-modern": "Современные элементы: dialog, details, time",
  "16-final-project": "Финальный проект: семантическая страница",
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
      // страховка: таблицы в курс больше не должны встречаться
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
  if (!/```html\n/.test(content)) errs.push("нет html-кодоблока в Примере");
  const chars = content.length;
  if (chars < 4000 || chars > 7000) errs.push(`объём ${chars} (нужно 4000–7000)`);
  if (errs.length) {
    if (dry) { console.log(`${String(n).padStart(2, "0")}. ${title} | ${content.length} зн | ERR: ` + errs.join("; ")); return; }
    throw new Error(`урок ${n} «${title}»: ` + errs.join("; "));
  }
}

// --- сбор строк ---
const inserts = [];
for (let n = 1; n <= 16; n++) {
  const name = FILES[n - 1];
  const raw = readFileSync(`course/html/${name}.md`, "utf8");
  const code = readFileSync(`course/html/code/${String(n).padStart(2, "0")}.html`, "utf8");
  const content = mdToLite(raw);
  validate(n, TITLES[name], content, Boolean(process.env.DRY));
  inserts.push({
    id: `10000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
    tech: "html",
    title: TITLES[name],
    content,
    code,
  });
  if (process.env.DRY) console.log(`${String(n).padStart(2, "0")}. ${TITLES[name]} | ${content.length} зн | OK`);
}

// --- пересид: удалить все html-строки и вставить 16 ---
if (process.env.DRY) process.exit(0);
const { error: delErr } = await sb.from("lessons").delete().eq("tech", "html");
if (delErr) throw new Error("delete: " + delErr.message);
const { error: insErr } = await sb.from("lessons").insert(inserts);
if (insErr) throw new Error("insert: " + insErr.message);

// --- проверка ---
const { data, error } = await sb
  .from("lessons")
  .select("id, title, tech, content, code")
  .eq("tech", "html")
  .order("id");
if (error) throw new Error("select: " + error.message);
console.log(`lessons(tech=html): ${data.length}`);
data.forEach((r, i) =>
  console.log(
    `${String(i + 1).padStart(2, "0")}. ${r.title} | content: ${r.content.length} зн | code: ${r.code ? r.code.length + " зн" : "—"}`
  )
);
