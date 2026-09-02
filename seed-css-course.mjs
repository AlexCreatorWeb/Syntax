// Сидер курса CSS (22 урока) в Supabase-таблицу `lessons`.
// Контракт: course/css/00-roadmap.md. Запуск из корня репо: node seed-css-course.mjs
// Пересид идемпотентен: удаляет ВСЕ строки tech='css' и вставляет 22 с упорядоченными id.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://xaslezkoktydranikqnx.supabase.co",
  "sb_publishable_rQC4uMonBP3dCF1Gz9avMQ_G_81WwQT"
);

const FILES = [
  "01-intro", "02-selectors-1", "03-selectors-2", "04-cascade", "05-specificity", "06-units",
  "07-box-model", "08-display", "09-typography", "10-color", "11-position", "12-flexbox-1",
  "13-flexbox-2", "14-grid-1", "15-grid-2", "16-subgrid", "17-media-queries", "18-container-queries",
  "19-fluid", "20-custom-properties", "21-animations", "22-final-project",
];

const TITLES = {
  "01-intro": "CSS: как присоединить стили к HTML",
  "02-selectors-1": "Селекторы I: элементы, классы, id, комбинаторы",
  "03-selectors-2": "Селекторы II: псевдоклассы, псевдоэлементы, :has()",
  "04-cascade": "Каскад: порядок, слои @layer, !important",
  "05-specificity": "Специфичность: «баллы» и :where()",
  "06-units": "Единицы: px, rem, em, %, vw/vh",
  "07-box-model": "Box Model и box-sizing: border-box",
  "08-display": "display: потоки и схлопывание маржинов",
  "09-typography": "Типографика: шрифты, line-height, шкалы",
  "10-color": "Цвет и прозрачность: hex, rgb, hsl",
  "11-position": "position и z-index: от relative до sticky",
  "12-flexbox-1": "Flexbox I: оси, выравнивание, gap",
  "13-flexbox-2": "Flexbox II: grow, shrink, wrap, паттерны",
  "14-grid-1": "Grid I: треки, fr, minmax, gap",
  "15-grid-2": "Grid II: области, auto-fill, имплицитная сетка",
  "16-subgrid": "Subgrid: раскладка внутри раскладки",
  "17-media-queries": "Media Queries: mobile-first",
  "18-container-queries": "Container Queries: адаптивность компонента",
  "19-fluid": "Fluid-дизайн: min, max, clamp",
  "20-custom-properties": "Кастомные свойства: переменные и темы",
  "21-animations": "Transitions и анимации: transform и keyframes",
  "22-final-project": "Финальный проект: адаптивная страница-каталог",
};

function linkify(s) {
  return s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)");
}

// markdown → markdown-lite (контракт src/lib/markdown.js) — копия из seed-html-course.mjs
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
  if (!/```html\n/.test(content)) errs.push("нет HTML-каркаса (```html) в Примере");
  if (!/```css\n/.test(content)) errs.push("нет css-кодоблока (```css) в Примере");
  const chars = content.length;
  if (chars < 4000 || chars > 7000) errs.push(`объём ${chars} (нужно 4000–7000)`);
  if (errs.length) {
    if (dry) { console.log(`${String(n).padStart(2, "0")}. ${title} | ${content.length} зн | ERR: ` + errs.join("; ")); return; }
    throw new Error(`урок ${n} «${title}»: ` + errs.join("; "));
  }
}

// --- сбор строк ---
const inserts = [];
for (let n = 1; n <= 22; n++) {
  const name = FILES[n - 1];
  const raw = readFileSync(`course/css/${name}.md`, "utf8");
  const code = readFileSync(`course/css/code/${String(n).padStart(2, "0")}.css`, "utf8");
  const content = mdToLite(raw);
  validate(n, TITLES[name], content, Boolean(process.env.DRY));
  inserts.push({
    id: `20000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
    tech: "css",
    title: TITLES[name],
    content,
    code,
  });
  if (process.env.DRY) console.log(`${String(n).padStart(2, "0")}. ${TITLES[name]} | ${content.length} зн | OK`);
}

// --- пересид: удалить все css-строки и вставить 22 ---
if (process.env.DRY) process.exit(0);
const { error: delErr } = await sb.from("lessons").delete().eq("tech", "css");
if (delErr) throw new Error("delete: " + delErr.message);
const { error: insErr } = await sb.from("lessons").insert(inserts);
if (insErr) throw new Error("insert: " + insErr.message);

// --- проверка ---
const { data, error } = await sb
  .from("lessons")
  .select("id, title, tech, content, code")
  .eq("tech", "css")
  .order("id");
if (error) throw new Error("select: " + error.message);
console.log(`lessons(tech=css): ${data.length}`);
data.forEach((r, i) =>
  console.log(
    `${String(i + 1).padStart(2, "0")}. ${r.title} | content: ${r.content.length} зн | code: ${r.code ? r.code.length + " зн" : "—"}`
  )
);
