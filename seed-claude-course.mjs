// Сидер курса Claude Code (18 уроков) в Supabase-таблицу `lessons`.
// Контракт: course/claude/00-roadmap.md. Запуск из корня репо: node seed-claude-course.mjs
// Пересид идемпотентен: удаляет ВСЕ строки tech='claude' и вставляет 18 с упорядоченными id.
// DRY=1 node seed-claude-course.mjs — только QC (без записи).
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://xaslezkoktydranikqnx.supabase.co",
  "sb_publishable_rQC4uMonBP3dCF1Gz9avMQ_G_81WwQT",
);

const FILES = [
  "01-intro-models",
  "02-what-is-claude-code",
  "03-registration-ru",
  "04-install-first-run",
  "05-agent-loop",
  "06-claude-md",
  "07-commands-modes",
  "08-context-compaction",
  "09-best-practices",
  "10-git-worktrees",
  "11-testing",
  "12-debugging",
  "13-mcp",
  "14-hooks",
  "15-subagents",
  "16-skills",
  "17-tokens-cost",
  "18-final-project",
];

const TITLES = {
  "01-intro-models": "Anthropic и Claude: модели, стоящие за Claude Code",
  "02-what-is-claude-code":
    "Что такое Claude Code: терминальный ИИ-агент (vs Cursor / Copilot)",
  "03-registration-ru": "Регистрация из России: как пользоваться без банов",
  "04-install-first-run":
    "Установка Claude Code (Mac / Windows) и первый запуск",
  "05-agent-loop": "Как работает агент: базовый цикл, первые задачи",
  "06-claude-md": "CLAUDE.md: память проекта и правила",
  "07-commands-modes": "Команды и режимы: plan mode, разрешения, auto-accept",
  "08-context-compaction": "Контекст: компакция, /compact, длинные задачи",
  "09-best-practices": "Лучшие практики: что реально работает (опыт 500 часов)",
  "10-git-worktrees": "Git и параллельная работа с Claude Code",
  "11-testing": "Тестирование с Claude Code (включая браузерную автоматизацию)",
  "12-debugging": "Отладка: поиск и исправление багов",
  "13-mcp": "MCP: подключение внешних инструментов",
  "14-hooks": "Хуки: автоматизация действий агента",
  "15-subagents": "Субагенты и мультиагентные workflows",
  "16-skills": "Skills: переиспользуемые инструкции",
  "17-tokens-cost": "Токены, стоимость, оплата из России",
  "18-final-project":
    "Финальный проект: приложение с нуля (Next.js + PostgreSQL)",
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
  const raw = readFileSync(`course/claude/${name}.md`, "utf8");
  const code = readFileSync(
    `course/claude/code/${String(n).padStart(2, "0")}.md`,
    "utf8",
  );
  const content = mdToLite(raw);
  validate(n, TITLES[name], content, code, Boolean(process.env.DRY));
  inserts.push({
    id: `a0000000-0000-4000-a000-${String(n).padStart(12, "0")}`,
    tech: "claude",
    title: TITLES[name],
    content,
    code,
  });
}

// --- пересид: удалить все claude-строки и вставить 18 ---
if (process.env.DRY) process.exit(0);
const { error: delErr } = await sb
  .from("lessons")
  .delete()
  .eq("tech", "claude");
if (delErr) throw new Error("delete: " + delErr.message);
const { error: insErr } = await sb.from("lessons").insert(inserts);
if (insErr) throw new Error("insert: " + insErr.message);

// --- проверка ---
const { data, error } = await sb
  .from("lessons")
  .select("id, title, tech, content, code")
  .eq("tech", "claude")
  .order("id");
if (error) throw new Error("select: " + error.message);
console.log(`lessons(tech=claude): ${data.length}`);
data.forEach((r, i) =>
  console.log(
    `${String(i + 1).padStart(2, "0")}. ${r.title} | content: ${r.content.length} зн | code: ${r.code ? r.code.length + " зн" : "—"}`,
  ),
);
