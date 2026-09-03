#!/usr/bin/env node
// lint:docs — валидация src/content/docs/**.md (контракт формата — в src/lib/docs-md.js).
//
// node scripts/lint-docs.mjs [--track <id>] [--strict]
//
// Проверяет: уникальные id, id = имя файла, обязательные frontmatter-поля (en+ru),
// order непрерывный (1..N внутри track+type), ≥3 h2 в гайдах (оба языка), код-блоки
// с языком, version из разрешённого списка, relatedTask ссылается на существующую
// задачу, RU-секция не пустая, таблицы — равное число колонок, минуты ±20% от объёма.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { parseDocFile, DOC_VERSIONS } from "../src/lib/docs-md.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const root = join(__dirname, "..");
const docsRoot = join(root, "src", "content", "docs");

const args = process.argv.slice(2);
const trackIdx = args.indexOf("--track");
const onlyTrack = trackIdx >= 0 ? args[trackIdx + 1] : null;
const strict = args.includes("--strict");

const ALLOWED_LANGS = new Set([
  "js", "javascript", "jsx", "ts", "py", "python", "html", "css", "bash", "sh",
  "sql", "json", "vue", "sfc", "mongodb", "json5", "text", "diff", "http", "plaintext",
]);

const TRACK_PREFIX = { javascript: "js", python: "py", postgres: "pg" };

// Справочник задач — relatedTask обязан ссылаться на существующий id
const tasksDir = join(root, "src", "content", "tasks");
const taskIds = new Set();
if (existsSync(tasksDir)) {
  for (const f of readdirSync(tasksDir).filter((f) => f.endsWith(".json"))) {
    let arr;
    try {
      arr = JSON.parse(readFileSync(join(tasksDir, f), "utf8"));
    } catch (e) {
      err(tasksDir + "/" + f, `invalid JSON: ${e.message}`);
      continue;
    }
    for (const t of arr) taskIds.add(t.id);
  }
}

const errors = [];
const warnings = [];
const err = (f, msg) => (strict ? warnings : errors).push(`${f}: ${msg}`);

let pages = [];
if (existsSync(docsRoot)) {
  const dirs = onlyTrack ? [onlyTrack] : readdirSync(docsRoot);
  for (const dir of dirs.sort()) {
    const dirPath = join(docsRoot, dir);
    if (!existsSync(dirPath)) { err(`<missing dir>`, `src/content/docs/${dir} not found`); continue; }
    for (const f of readdirSync(dirPath).filter((f) => f.endsWith(".md")).sort()) {
      const rel = relative(root, join(dirPath, f));
      const { page, errors: pErrs } = parseDocFile(readFileSync(join(dirPath, f), "utf8"), f.replace(/\.md$/, ""));
      for (const e of pErrs) err(rel, e);
      if (!page) continue;

      const bodyEn = page.body.en;
      const bodyRu = page.body.ru;

      // Код-блоки с языком
      for (const b of [...bodyEn, ...bodyRu]) {
        if (b.type === "code" && !b.lang) err(rel, "code block without a language: ```js … ```");
        if (b.type === "code" && b.lang && !ALLOWED_LANGS.has(b.lang)) {
          warnings.push(`${rel}: unknown code language "${b.lang}"`);
        }
        if (b.type === "table") {
          const cols = b.rows[0]?.length;
          if (b.rows.some((r) => r.length !== cols)) err(rel, `table in "${b.rows?.[0]?.join(" ")}": uneven column counts`);
        }
      }

      // Гайды: ≥3 h2 на каждом языке
      if (page.type === "guide") {
        if (bodyEn.filter((b) => b.type === "h2").length < 3) err(rel, "guide: fewer than 3 h2 sections (EN)");
        if (bodyRu.filter((b) => b.type === "h2").length < 3) err(rel, "guide: fewer than 3 h2 sections (RU)");
      }

      // Глубина: гайд — 8–15 мин чтения (±20% от ~180 wpm → слов ~580..2160); warning в strict
      if (page.type === "guide" && page.words < 580) {
        (strict ? errors : warnings).push(`${rel}: guide is thin — ${page.words} EN words (expected 580–2100)`);
      }
      // Минуты vs объём (±20%)
      const est = Math.max(3, Math.round(page.words / 180));
      if (Math.abs(page.minutes - est) > Math.max(1, Math.round(est * 0.2))) {
        warnings.push(`${rel}: minutes=${page.minutes} vs estimated ${est} (±20%)`);
      }

      // relatedTask
      if (page.relatedTask && !taskIds.has(page.relatedTask)) {
        err(rel, `relatedTask "${page.relatedTask}" does not match any task id in src/content/tasks`);
      }
      if (page.relatedTask && !page.relatedTask.startsWith(`${TRACK_PREFIX[dir] || dir}-`)) {
        warnings.push(`${rel}: relatedTask "${page.relatedTask}" is from another track`);
      }

      pages.push(page);
    }
  }
} else {
  err("<root>", "src/content/docs/ not found");
}

// Уникальные id
const seen = new Map();
for (const p of pages) {
  if (seen.has(p.id)) err(p.id, `duplicate id (also ${seen.get(p.id)})`);
  seen.set(p.id, p);
}

// order непрерывный 1..N внутри (track, type)
const groups = new Map();
for (const p of pages) {
  const k = `${p.track}/${p.type}`;
  groups.set(k, [...(groups.get(k) || []), p]);
}
for (const [k, list] of groups) {
  const orders = list.map((p) => p.order).sort((a, b) => a - b);
  for (let i = 0; i < orders.length; i += 1) {
    if (orders[i] !== i + 1) {
      err(`<${k}>`, `order not contiguous: [${orders.join(", ")}] (must be 1..${orders.length})`);
      break;
    }
  }
}

// Контракт трека: ровно 10 страниц (6 guides + 4 reference)
const EXPECTED = { guide: 6, reference: 4 };
for (const dir of onlyTrack ? [onlyTrack] : (existsSync(docsRoot) ? readdirSync(docsRoot) : [])) {
  const inTrack = pages.filter((p) => p.track === dir);
  for (const [type, n] of Object.entries(EXPECTED)) {
    const have = inTrack.filter((p) => p.type === type).length;
    if (have !== n) warnings.push(`${dir}: ${have}/${n} ${type} pages (contract is 6 guides + 4 reference)`);
  }
}

// Version-бейдж — подсказка
void DOC_VERSIONS;

console.log(`docs: ${pages.length} pages parsed`);
if (warnings.length) {
  console.log(`\n⚠ ${warnings.length} warning(s):`);
  for (const w of warnings) console.log(`  ⚠ ${w}`);
}
if (errors.length) {
  console.log(`\n✗ ${errors.length} error(s):`);
  for (const e of errors) console.log(`  ✗ ${e}`);
  process.exit(1);
}
console.log(errors.length ? "" : "✓ lint:docs clean");
