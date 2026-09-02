// Сидер курса Python (28 уроков) в Supabase-таблицу `lessons`.
// Контракт: course/python/00-roadmap.md. Запуск из корня репо: node seed-python-course.mjs
// Пересид идемпотентен: удаляет ВСЕ строки tech='python' и вставляет 28 с упорядоченными id.
// DRY=1 node seed-python-course.mjs — только QC (без записи).
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://xaslezkoktydranikqnx.supabase.co",
  "sb_publishable_rQC4uMonBP3dCF1Gz9avMQ_G_81WwQT"
);

const FILES = [
  "01-intro", "02-types", "03-strings", "04-list-tuple", "05-dict-set",
  "06-conditions", "07-loops", "08-functions", "09-args", "10-type-hints-pep8",
  "11-modules", "12-venv-pip", "13-files", "14-context-managers",
  "15-classes", "16-inheritance", "17-dunder", "18-property-staticmethod", "19-dataclass-abc",
  "20-exceptions", "21-stdlib", "22-generators",
  "23-asyncio", "24-asyncio-practice", "25-requests", "26-httpx",
  "27-project-logging-tests", "28-final-project",
];

const TITLES = {
  "01-intro": "Python и интерпретатор: как запускать код",
  "02-types": "Переменные и базовые типы: int, float, str, bool",
  "03-strings": "Строки и f-строки: срезы, методы, форматирование",
  "04-list-tuple": "list и tuple: comprehensions, распаковка",
  "05-dict-set": "dict и set: хешируемые структуры",
  "06-conditions": "Условные конструкции: if/elif/else, truthiness",
  "07-loops": "Циклы: for/while, range, break/continue, enumerate/zip",
  "08-functions": "Функции: def, return, область видимости (LEGB)",
  "09-args": "Аргументы функций: *args, **kwargs, мутабельные дефолты",
  "10-type-hints-pep8": "Type hints и PEP 8: современный стиль",
  "11-modules": "Модули и импорты: import, пакеты, __name__",
  "12-venv-pip": "Виртуальные окружения: venv, pip, requirements.txt",
  "13-files": "Файлы: open, read/write, режимы, with",
  "14-context-managers": "Контекстные менеджеры вглубь: __enter__/__exit__, contextlib",
  "15-classes": "Классы: class, __init__, self, атрибуты",
  "16-inheritance": "Наследование и полиморфизм: super(), MRO",
  "17-dunder": "Dunder-методы: __str__, __repr__, __len__, __eq__, __add__",
  "18-property-staticmethod": "property, classmethod, staticmethod, «приватность»",
  "19-dataclass-abc": "dataclass и продвинутое ООП: slots, ABC, Protocol",
  "20-exceptions": "Исключения: try/except/else/finally, свои Exception",
  "21-stdlib": "stdlib: collections, itertools, functools, datetime",
  "22-generators": "Генераторы, yield, ленивость; map/filter/sorted",
  "23-asyncio": "asyncio: event loop, coroutine, await, gather",
  "24-asyncio-practice": "asyncio на практике: create_task, when to async",
  "25-requests": "REST-клиент: requests (GET/POST, JSON, статусы, timeout)",
  "26-httpx": "httpx и продвинутый REST: async-клиент, retries",
  "27-project-logging-tests": "Структура проекта, logging, тесты (pytest)",
  "28-final-project": "Финальный проект: REST-клиент «Трекер задач»",
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
  if (!/```python\n/.test(content)) errs.push("нет python-кодоблока (```python) в Примере");
  const chars = content.length;
  if (chars < 4000 || chars > 7000) errs.push(`объём ${chars} (нужно 4000–7000)`);
  if (!code || !code.trim()) errs.push("code пустой");
  if (errs.length) {
    if (dry) { console.log(`${String(n).padStart(2, "0")}. ${title} | ${chars} зн | ERR: ` + errs.join("; ")); return; }
    throw new Error(`урок ${n} «${title}»: ` + errs.join("; "));
  }
}

// --- сбор строк ---
const inserts = [];
for (let n = 1; n <= 28; n++) {
  const name = FILES[n - 1];
  const raw = readFileSync(`course/python/${name}.md`, "utf8");
  const code = readFileSync(`course/python/code/${String(n).padStart(2, "0")}.py`, "utf8");
  const content = mdToLite(raw);
  validate(n, TITLES[name], content, code, Boolean(process.env.DRY));
  inserts.push({
    id: `80000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
    tech: "python",
    title: TITLES[name],
    content,
    code,
  });
  if (process.env.DRY) console.log(`${String(n).padStart(2, "0")}. ${TITLES[name]} | ${content.length} зн | OK`);
}

// --- пересид: удалить все python-строки и вставить 28 ---
if (process.env.DRY) process.exit(0);
const { error: delErr } = await sb.from("lessons").delete().eq("tech", "python");
if (delErr) throw new Error("delete: " + delErr.message);
const { error: insErr } = await sb.from("lessons").insert(inserts);
if (insErr) throw new Error("insert: " + insErr.message);

// --- проверка ---
const { data, error } = await sb
  .from("lessons")
  .select("id, title, tech, content, code")
  .eq("tech", "python")
  .order("id");
if (error) throw new Error("select: " + error.message);
console.log(`lessons(tech=python): ${data.length}`);
data.forEach((r, i) =>
  console.log(
    `${String(i + 1).padStart(2, "0")}. ${r.title} | content: ${r.content.length} зн | code: ${r.code ? r.code.length + " зн" : "—"}`
  )
);
