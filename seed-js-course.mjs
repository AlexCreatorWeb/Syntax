// Сидер курса JavaScript (42 урока) в Supabase-таблицу `lessons`.
// Контракт: course/js/00-roadmap.md. Запуск из корня репо: node seed-js-course.mjs
// Пересид идемпотентен: удаляет ВСЕ строки tech='javascript' и вставляет 42 с упорядоченными id.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://xaslezkoktydranikqnx.supabase.co",
  "sb_publishable_rQC4uMonBP3dCF1Gz9avMQ_G_81WwQT"
);

const FILES = [
  "01-variables", "02-types", "03-numbers", "04-strings", "05-booleans", "06-conversion", "07-conditions",
  "08-loops", "09-functions", "10-arrow", "11-scope", "12-closures", "13-args", "14-callbacks", "15-pure",
  "16-arrays", "17-array-methods", "18-reduce", "19-search", "20-sort-flat", "21-immutability",
  "22-objects", "23-destructuring", "24-object-methods", "25-this", "26-classes", "27-json",
  "28-errors", "29-debugging",
  "30-dom-select", "31-dom-modify", "32-dom-create", "33-events", "34-delegation", "35-todo-practice",
  "36-localstorage", "37-timers",
  "38-event-loop", "39-promises", "40-async-await", "41-fetch",
  "42-final-project",
];

const TITLES = {
  "01-variables": "Переменные: let, const и var-всплытие",
  "02-types": "Типы данных и typeof",
  "03-numbers": "Числа и Math: NaN, float, округления",
  "04-strings": "Строки и template literals",
  "05-booleans": "Булевы, null/undefined, truthy и falsy",
  "06-conversion": "Преобразование типов",
  "07-conditions": "Условия: if, тернарник, switch",
  "08-loops": "Циклы: for, while, for...of",
  "09-functions": "Функции: параметры и return",
  "10-arrow": "Стрелочные функции",
  "11-scope": "Область видимости и TDZ",
  "12-closures": "Замыкания",
  "13-args": "Default, rest и spread в функциях",
  "14-callbacks": "Колбэки: функция как значение",
  "15-pure": "Чистые функции и побочные эффекты",
  "16-arrays": "Массивы: создание и базовые методы",
  "17-array-methods": "Обход массива: forEach, map, filter",
  "18-reduce": "reduce: свёртка данных",
  "19-search": "find, some, every и includes",
  "20-sort-flat": "sort, slice, flat и порядок",
  "21-immutability": "Иммутабельность и копирование массива",
  "22-objects": "Объекты: свойства и методы",
  "23-destructuring": "Деструктуризация и spread",
  "24-object-methods": "keys, values, entries и assign",
  "25-this": "this и связывание: call, apply, bind",
  "26-classes": "Классы и наследование",
  "27-json": "JSON: сериализация и ловушки",
  "28-errors": "try/catch/finally и throw",
  "29-debugging": "Отладка: console и DevTools",
  "30-dom-select": "DOM-дерево и выборка элементов",
  "31-dom-modify": "Текст, классы, атрибуты и стили",
  "32-dom-create": "Создание и удаление элементов",
  "33-events": "События: addEventListener и bubbling",
  "34-delegation": "Делегирование событий и формы",
  "35-todo-practice": "Практика: todo-компонент",
  "36-localstorage": "localStorage: сохранение данных",
  "37-timers": "Таймеры, debounce и throttle",
  "38-event-loop": "Event loop: синхронное и асинхронное",
  "39-promises": "Promise: then, catch, finally",
  "40-async-await": "async/await и Promise.all",
  "41-fetch": "fetch: запросы к API",
  "42-final-project": "Финальный проект: мини-приложение «Задачи + Поиск»",
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
for (let n = 1; n <= 42; n++) {
  const name = FILES[n - 1];
  const raw = readFileSync(`course/js/${name}.md`, "utf8");
  const code = readFileSync(`course/js/code/${String(n).padStart(2, "0")}.js`, "utf8");
  const content = mdToLite(raw);
  validate(n, TITLES[name], content, Boolean(process.env.DRY));
  inserts.push({
    id: `30000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
    tech: "javascript",
    title: TITLES[name],
    content,
    code,
  });
  if (process.env.DRY) console.log(`${String(n).padStart(2, "0")}. ${TITLES[name]} | ${content.length} зн | OK`);
}

// --- пересид: удалить все javascript-строки и вставить 42 ---
if (process.env.DRY) process.exit(0);
const { error: delErr } = await sb.from("lessons").delete().eq("tech", "javascript");
if (delErr) throw new Error("delete: " + delErr.message);
const { error: insErr } = await sb.from("lessons").insert(inserts);
if (insErr) throw new Error("insert: " + insErr.message);

// --- проверка ---
const { data, error } = await sb
  .from("lessons")
  .select("id, title, tech, content, code")
  .eq("tech", "javascript")
  .order("id");
if (error) throw new Error("select: " + error.message);
console.log(`lessons(tech=javascript): ${data.length}`);
data.forEach((r, i) =>
  console.log(
    `${String(i + 1).padStart(2, "0")}. ${r.title} | content: ${r.content.length} зн | code: ${r.code ? r.code.length + " зн" : "—"}`
  )
);
