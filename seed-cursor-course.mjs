// Сидер курса Cursor (18 уроков) в Supabase-таблицу `lessons`.
// Контракт: course/cursor/00-roadmap.md. Запуск из корня репо: node seed-cursor-course.mjs
// Пересид идемпотентен: удаляет ВСЕ строки tech='cursor' и вставляет 18 с упорядоченными id.
// DRY=1 node seed-cursor-course.mjs — только QC (без записи).
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://xaslezkoktydranikqnx.supabase.co",
  "sb_publishable_rQC4uMonBP3dCF1Gz9avMQ_G_81WwQT",
);

const FILES = [
  "01-what-is-cursor",
  "02-install-first-run",
  "03-chat-cmdk-tab-composer",
  "04-cursor-2-0",
  "05-workflow-tips",
  "06-cursor-rules",
  "07-at-mentions-indexing",
  "08-agent-mode",
  "09-background-agents",
  "10-mcp",
  "11-git-commits",
  "12-testing",
  "13-debugging",
  "14-vibecoding",
  "15-beautiful-sites",
  "16-critique-alternatives",
  "17-pricing-optimization",
  "18-final-project",
];

const TITLES = {
  "01-what-is-cursor": "Что такое Cursor: ИИ-редактор вместо VS Code",
  "02-install-first-run":
    "Установка Cursor и первый запуск: импорт расширений из VS Code",
  "03-chat-cmdk-tab-composer":
    "Chat, Cmd+K, Tab, Composer: четыре инструмента редактора",
  "04-cursor-2-0": "Cursor 2.0: что изменилось (агент, Tab 2, background)",
  "05-workflow-tips": "Рабочий процесс: 12 лайфхаков, которые делают быстрее",
  "06-cursor-rules": "Cursor Rules (.cursor/rules): правила проекта",
  "07-at-mentions-indexing":
    "@Файлы, @директории, @docs и индексация кодовой базы",
  "08-agent-mode": "Режим Agent: передача задач агенту",
  "09-background-agents": "Background Agents: облачные агенты и PR",
  "10-mcp": "MCP: подключение внешних инструментов",
  "11-git-commits": "Git и коммиты с Cursor",
  "12-testing": "Тестирование с Cursor",
  "13-debugging": "Отладка: поиск и исправление багов",
  "14-vibecoding": "Вайбкодинг: что это и как начать",
  "15-beautiful-sites": "Практика: три подхода к красивым сайтам",
  "16-critique-alternatives":
    "Критический разбор: это развод? Альтернативы (TRAE, Windsurf)",
  "17-pricing-optimization":
    "Тарифы и оптимизация: unlimited, бесплатно, экономия токенов",
  "18-final-project":
    "Финальный проект: сайт с нуля на Cursor (без ручного кода)",
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
    if (line.trim().startsWith("# ")) {
      i++;
      continue;
    }
    out.push(linkify(line));
    i++;
  }
  return (
    out
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim() + "\n"
  );
}

// --- контроль качества перед вставкой ---
function validate(n, title, content, code, dry) {
  const errs = [];
  for (const sec of [
    "## Цель",
    "## Теория",
    "## Пример",
    "## Частые ошибки",
    "## Практическое задание",
  ]) {
    if (!content.includes(sec)) errs.push(`нет раздела ${sec}`);
  }
  if (!/^(TIP|NOTE)\s*:/m.test(content)) errs.push("нет TIP:/NOTE:-callout'а");
  if (!/^WARN\s*:/m.test(content)) errs.push("нет WARN:-callout'а");
  if (/\[.+?\]\(.+?\)/.test(content)) errs.push("есть markdown-ссылка [t](u)");
  if (!/```bash\n/.test(content))
    errs.push("нет bash-кодоблока (```bash) в Примере");
  const chars = content.length;
  if (chars < 4000 || chars > 7000)
    errs.push(`объём ${chars} (нужно 4000–7000)`);
  if (!code || !code.trim()) errs.push("code пустой");
  if (!/TODO/.test(code))
    errs.push("code без TODO (должен быть скелет задания)");
  if (errs.length) {
    if (dry) {
      console.log(
        `${String(n).padStart(2, "0")}. ${title} | ${chars} зн | ERR: ` +
          errs.join("; "),
      );
      return;
    }
    throw new Error(`урок ${n} «${title}»: ` + errs.join("; "));
  }
  if (dry)
    console.log(`${String(n).padStart(2, "0")}. ${title} | ${chars} зн | OK`);
}

// --- сбор строк ---
const inserts = [];
for (let n = 1; n <= 18; n++) {
  const name = FILES[n - 1];
  const raw = readFileSync(`course/cursor/${name}.md`, "utf8");
  const code = readFileSync(
    `course/cursor/code/${String(n).padStart(2, "0")}.md`,
    "utf8",
  );
  const content = mdToLite(raw);
  validate(n, TITLES[name], content, code, Boolean(process.env.DRY));
  inserts.push({
    id: `c0000000-0000-4000-c000-${String(n).padStart(12, "0")}`,
    tech: "cursor",
    title: TITLES[name],
    content,
    code,
  });
}

// --- пересид: удалить все cursor-строки и вставить 18 ---
if (process.env.DRY) process.exit(0);
const { error: delErr } = await sb
  .from("lessons")
  .delete()
  .eq("tech", "cursor");
if (delErr) throw new Error("delete: " + delErr.message);
const { error: insErr } = await sb.from("lessons").insert(inserts);
if (insErr) throw new Error("insert: " + insErr.message);

// --- проверка ---
const { data, error } = await sb
  .from("lessons")
  .select("id, title, tech, content, code")
  .eq("tech", "cursor")
  .order("id");
if (error) throw new Error("select: " + error.message);
console.log(`lessons(tech=cursor): ${data.length}`);
data.forEach((r, i) =>
  console.log(
    `${String(i + 1).padStart(2, "0")}. ${r.title} | content: ${r.content.length} зн | code: ${r.code ? r.code.length + " зн" : "—"}`,
  ),
);
