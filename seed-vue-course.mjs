// Сидер курса Vue (22 урока) в Supabase-таблицу `lessons`.
// Контракт: course/vue/00-roadmap.md. Запуск из корня репо: node seed-vue-course.mjs
// Пересид идемпотентен: удаляет ВСЕ строки tech='vue' и вставляет 22 с упорядоченными id.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://xaslezkoktydranikqnx.supabase.co",
  "sb_publishable_rQC4uMonBP3dCF1Gz9avMQ_G_81WwQT"
);

const FILES = [
  "01-intro", "02-template", "03-v-bind", "04-v-on",
  "05-ref", "06-reactive-computed", "07-watch", "08-form-practice",
  "09-v-if", "10-v-for", "11-v-model", "12-v-model-components",
  "13-components", "14-props", "15-emits", "16-slots",
  "17-lifecycle", "18-composables", "19-router", "20-router-dynamic",
  "21-pinia", "22-final-project",
];

const TITLES = {
  "01-intro": "Vue: первое приложение и структура SFC",
  "02-template": "Шаблон: мустачи, выражения, v-text",
  "03-v-bind": "v-bind: атрибуты, class и style",
  "04-v-on": "v-on: события, $event, модификаторы",
  "05-ref": "ref: реактивные переменные",
  "06-reactive-computed": "reactive и computed: объекты и производные данные",
  "07-watch": "watch и watchEffect: реакция на изменения",
  "08-form-practice": "Практика: форма с валидацией",
  "09-v-if": "v-if / v-else-if / v-show: условный рендер",
  "10-v-for": "v-for: списки и ключи",
  "11-v-model": "v-model: input, checkbox, select",
  "12-v-model-components": "v-model с компонентами: modelValue и emits",
  "13-components": "Создание и регистрация компонентов",
  "14-props": "props: однонаправленный поток данных",
  "15-emits": "emits: события от child к parent",
  "16-slots": "slots: default, named, scoped",
  "17-lifecycle": "Lifecycle hooks: onMounted, onUpdated, onUnmounted",
  "18-composables": "Композабли: переиспользование логики, provide/inject",
  "19-router": "Vue Router: маршруты, router-link, router-view",
  "20-router-dynamic": "Динамические маршруты, параметры, навигация",
  "21-pinia": "Pinia: стейт, геттеры, экшены",
  "22-final-project": "Финальный проект: SPA с Router + Pinia",
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
  if (!/```vue\n/.test(content)) errs.push("нет vue-кодоблока (```vue) в Примере");
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
  const raw = readFileSync(`course/vue/${name}.md`, "utf8");
  const code = readFileSync(`course/vue/code/${String(n).padStart(2, "0")}.vue`, "utf8");
  const content = mdToLite(raw);
  validate(n, TITLES[name], content, Boolean(process.env.DRY));
  inserts.push({
    id: `50000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
    tech: "vue",
    title: TITLES[name],
    content,
    code,
  });
  if (process.env.DRY) console.log(`${String(n).padStart(2, "0")}. ${TITLES[name]} | ${content.length} зн | OK`);
}

// --- пересид: удалить все vue-строки и вставить 22 ---
if (process.env.DRY) process.exit(0);
const { error: delErr } = await sb.from("lessons").delete().eq("tech", "vue");
if (delErr) throw new Error("delete: " + delErr.message);
const { error: insErr } = await sb.from("lessons").insert(inserts);
if (insErr) throw new Error("insert: " + insErr.message);

// --- проверка ---
const { data, error } = await sb
  .from("lessons")
  .select("id, title, tech, content, code")
  .eq("tech", "vue")
  .order("id");
if (error) throw new Error("select: " + error.message);
console.log(`lessons(tech=vue): ${data.length}`);
data.forEach((r, i) =>
  console.log(
    `${String(i + 1).padStart(2, "0")}. ${r.title} | content: ${r.content.length} зн | code: ${r.code ? r.code.length + " зн" : "—"}`
  )
);
