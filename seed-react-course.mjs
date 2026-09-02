// Сидер курса React (18 уроков) в Supabase-таблицу `lessons`.
// Контракт: course/react/00-roadmap.md. Запуск из корня репо: node seed-react-course.mjs
// Пересид идемпотентен: удаляет ВСЕ строки tech='react' и вставляет 18 с упорядоченными id.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://xaslezkoktydranikqnx.supabase.co",
  "sb_publishable_rQC4uMonBP3dCF1Gz9avMQ_G_81WwQT"
);

const FILES = [
  "01-intro", "02-jsx", "03-components", "04-props",
  "05-conditional", "06-usestate", "07-events", "08-lists-keys",
  "09-useeffect", "10-effect-data", "11-effect-pitfalls", "12-memo",
  "13-hooks-rules", "14-usefetch", "15-useref", "16-context",
  "17-async-patterns", "18-final-project",
];

const TITLES = {
  "01-intro": "React: компонентный подход и первое приложение",
  "02-jsx": "JSX: HTML внутри JavaScript",
  "03-components": "Компоненты: композиция и разбивка",
  "04-props": "Пропсы (Props): передача данных вниз",
  "05-conditional": "Условный рендеринг: &&, тернарник, early return",
  "06-usestate": "Состояние: useState",
  "07-events": "События и контролируемые формы",
  "08-lists-keys": "Списки и ключи (key)",
  "09-useeffect": "useEffect: побочные эффекты и cleanup",
  "10-effect-data": "useEffect и данные: loading / error / data",
  "11-effect-pitfalls": "Подводные камни: бесконечные циклы, deps, stale closure",
  "12-memo": "Производное состояние: useMemo и useCallback",
  "13-hooks-rules": "Правила хуков и кастомные хуки",
  "14-usefetch": "Кастомный хук useFetch: работа с API",
  "15-useref": "useRef: DOM и неразмечные значения",
  "16-context": "Context: глобальное состояние без prop drilling",
  "17-async-patterns": "Асинхронные данные: поиск, abort, паттерны",
  "18-final-project": "Финальный проект: приложение «Заметки» (CRUD + API)",
};

function linkify(s) {
  return s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)");
}

// markdown → markdown-lite (контракт src/lib/markdown.js) — копия из seed-js-course.mjs
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
  if (!/```jsx\n/.test(content)) errs.push("нет jsx-кодоблока (```jsx) в Примере");
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
  const raw = readFileSync(`course/react/${name}.md`, "utf8");
  const code = readFileSync(`course/react/code/${String(n).padStart(2, "0")}.jsx`, "utf8");
  const content = mdToLite(raw);
  validate(n, TITLES[name], content, Boolean(process.env.DRY));
  inserts.push({
    id: `40000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
    tech: "react",
    title: TITLES[name],
    content,
    code,
  });
  if (process.env.DRY) console.log(`${String(n).padStart(2, "0")}. ${TITLES[name]} | ${content.length} зн | OK`);
}

// --- пересид: удалить все react-строки и вставить 18 ---
if (process.env.DRY) process.exit(0);
const { error: delErr } = await sb.from("lessons").delete().eq("tech", "react");
if (delErr) throw new Error("delete: " + delErr.message);
const { error: insErr } = await sb.from("lessons").insert(inserts);
if (insErr) throw new Error("insert: " + insErr.message);

// --- проверка ---
const { data, error } = await sb
  .from("lessons")
  .select("id, title, tech, content, code")
  .eq("tech", "react")
  .order("id");
if (error) throw new Error("select: " + error.message);
console.log(`lessons(tech=react): ${data.length}`);
data.forEach((r, i) =>
  console.log(
    `${String(i + 1).padStart(2, "0")}. ${r.title} | content: ${r.content.length} зн | code: ${r.code ? r.code.length + " зн" : "—"}`
  )
);
