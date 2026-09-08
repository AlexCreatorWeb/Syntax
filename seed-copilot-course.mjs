// Сидер курса GitHub Copilot (18 уроков) в Supabase-таблицу `lessons`.
// Контракт: course/copilot/00-roadmap.md. Запуск из корня репо: node seed-copilot-course.mjs
// Пересид идемпотентен: удаляет ВСЕ строки tech='copilot' и вставляет 18 с упорядоченными id.
// DRY=1 node seed-copilot-course.mjs — только QC (без записи).
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://xaslezkoktydranikqnx.supabase.co",
  "sb_publishable_rQC4uMonBP3dCF1Gz9avMQ_G_81WwQT",
);

const FILES = [
  "01-what-is-copilot",
  "02-vscode-setup",
  "03-jetbrains-russia",
  "04-chat-mentions",
  "05-autocomplete",
  "06-custom-instructions",
  "07-coding-agent",
  "08-agent-vs-coding-agent",
  "09-copilot-cli",
  "10-mcp",
  "11-testing-tdd",
  "12-copilot-workspace",
  "13-code-review",
  "14-automation-skills",
  "15-daily-workflow",
  "16-pricing",
  "17-critical-look",
  "18-alternatives",
];

const TITLES = {
  "01-what-is-copilot": "Что такое GitHub Copilot: возможности и для кого",
  "02-vscode-setup": "Установка и настройка: VS Code",
  "03-jetbrains-russia":
    "Установка в JetBrains (PyCharm / IntelliJ) и доступ из России",
  "04-chat-mentions": "Чат: как спрашивать, @workspace, @terminal",
  "05-autocomplete": "Автодополнение кода: модель GPT-4o",
  "06-custom-instructions":
    "Кастомные инструкции (.github/copilot-instructions.md)",
  "07-coding-agent": "Coding Agent: задачи, issues, PR",
  "08-agent-vs-coding-agent":
    "Agent mode vs coding agent: когда что использовать",
  "09-copilot-cli": "GitHub Copilot CLI: GitHub в терминале",
  "10-mcp": "MCP: внешние инструменты в Copilot",
  "11-testing-tdd": "Тестирование: TDD и генерация тестов",
  "12-copilot-workspace": "Copilot Workspace: от issue до кода",
  "13-code-review": "Code review: ревью PR с Copilot",
  "14-automation-skills": "Автоматизация: Copilot + Actions, Custom Skills",
  "15-daily-workflow": "Практика: Copilot в ежедневном рабочем процессе",
  "16-pricing": "Тарифы, бесплатные планы, оплата из России",
  "17-critical-look": "Критический взгляд: нужен ли Copilot, статистика багов",
  "18-alternatives": "Бесплатные альтернативы и выбор инструмента",
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
  const raw = readFileSync(`course/copilot/${name}.md`, "utf8");
  const code = readFileSync(
    `course/copilot/code/${String(n).padStart(2, "0")}.md`,
    "utf8",
  );
  const content = mdToLite(raw);
  validate(n, TITLES[name], content, code, Boolean(process.env.DRY));
  inserts.push({
    id: `80000000-0000-4000-c000-${String(n).padStart(12, "0")}`,
    tech: "copilot",
    title: TITLES[name],
    content,
    code,
  });
}

// --- пересид: удалить все copilot-строки и вставить 18 ---
if (process.env.DRY) process.exit(0);
const { error: delErr } = await sb
  .from("lessons")
  .delete()
  .eq("tech", "copilot");
if (delErr) throw new Error("delete: " + delErr.message);
const { error: insErr } = await sb.from("lessons").insert(inserts);
if (insErr) throw new Error("insert: " + insErr.message);

// --- проверка ---
const { data, error } = await sb
  .from("lessons")
  .select("id, title, tech, content, code")
  .eq("tech", "copilot")
  .order("id");
if (error) throw new Error("select: " + error.message);
console.log(`lessons(tech=copilot): ${data.length}`);
data.forEach((r, i) =>
  console.log(
    `${String(i + 1).padStart(2, "0")}. ${r.title} | content: ${r.content.length} зн | code: ${r.code ? r.code.length + " зн" : "—"}`,
  ),
);
