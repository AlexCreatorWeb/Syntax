// Парсер Markdown-страниц документации (src/content/docs/{track}/{page-id}.md).
//
// Формат файла:
//   ---
//   id: html-structure          # = имя файла без .md; уникален в репо
//   track: html                 # id трека из TECHS
//   type: guide                 # guide | reference
//   section: structure          # группа в каталоге (slug)
//   order: 1                    # непрерывный порядок внутри (track + type)
//   title:
//     en: "Document Structure"
//     ru: "Структура документа"
//   excerpt:
//     en: "1–2 предложения для карточки и поиска"
//     ru: "1–2 предложения"
//   version: "html5"            # бейдж: html5 / css3 / es2023 / react 19 / vue 3.5 / node 22 / mongo 8 / postgres 17 / python 3.9+
//   updated: 2026-09-01
//   relatedTask: html-001       # опционально — id задачи из src/content/tasks
//   ---
//   {lead-абзац}
//
//   ## Секция h2
//   текст
//
//   ### Подсекция h3
//
//   ```js
//   код
//   ```
//
//   > **TIP**
//   > текст выноски (может занимать несколько `>`-строк)
//
//   | col1 | col2 |
//   |------|------|
//   | a    | b    |
//
//   <!-- RU -->
//   {то же самое — перевод: title/heading/текст; код можно не переводить,
//    но структура блоков 1:1 не обязательна — только семантика}
//
// Чистая ESM-модуль без JSX и extension-less импортов — импортится и из Vite,
// и из node-скриптов (scripts/lint-docs.mjs).

export const DOC_VERSIONS = [
  "html5",
  "css3",
  "es2023",
  "react 19",
  "vue 3.5",
  "node 22",
  "mongo 8",
  "postgres 17",
  "python 3.9+",
];

const stripQuotes = (v) => {
  const s = String(v).trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
};

// Минимальный YAML-сабсет: скаляры + вложенные map'ы на 2 пробела (title/excerpt).
export function parseFrontmatter(text) {
  const fm = {};
  const lines = text.split(/\r?\n/);
  let topKey = null;
  for (const raw of lines) {
    if (!raw.trim() || raw.trim().startsWith("#")) continue;
    const nested = raw.match(/^ {2}([A-Za-z_][\w-]*):\s*(.*)$/);
    if (nested && topKey) {
      fm[topKey] = fm[topKey] || {};
      if (typeof fm[topKey] !== "object") fm[topKey] = {};
      fm[topKey][nested[1]] = stripQuotes(nested[2]);
      continue;
    }
    const m = raw.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!m) continue;
    topKey = m[1];
    const v = m[2].trim();
    fm[topKey] = v === "" ? {} : stripQuotes(v);
  }
  return fm;
}

// Тело (одна «языковая» часть) → блоки рендера:
// {type: p|h2|h3|code|callout|table, text?, lang?, kind?, rows?}
export function parseDocBody(raw) {
  const lines = raw.split(/\r?\n/);
  const blocks = [];
  let i = 0;
  let para = [];
  const flush = () => {
    if (para.length) {
      blocks.push({ type: "p", text: para.join(" ").trim() });
      para = [];
    }
  };
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") {
      flush();
      i += 1;
      continue;
    }

    if (trimmed.startsWith("### ")) {
      flush();
      blocks.push({ type: "h3", text: trimmed.slice(4).trim() });
      i += 1;
      continue;
    }
    if (trimmed.startsWith("## ")) {
      flush();
      blocks.push({ type: "h2", text: trimmed.slice(3).trim() });
      i += 1;
      continue;
    }

    // Код-блок: ```lang … ```
    const fence = trimmed.match(/^```(\S*)\s*$/);
    if (fence) {
      flush();
      const lang = fence[1];
      const code = [];
      i += 1;
      while (i < lines.length && lines[i].trim() !== "```") {
        code.push(lines[i]);
        i += 1;
      }
      i += 1; // пропустить закрывающий ```
      blocks.push({ type: "code", lang, text: code.join("\n") });
      continue;
    }

    // Выноска: > **TIP** / > **WARNING** (+ строки с текстом)
    const calloutHead = trimmed.match(/^>\s*\*\*(TIP|WARNING)\*\*\s*(.*)$/i);
    if (calloutHead) {
      flush();
      const kind = calloutHead[1].toLowerCase();
      const parts = calloutHead[2] ? [calloutHead[2]] : [];
      i += 1;
      while (i < lines.length) {
        const t = lines[i].trim();
        if (t.startsWith(">")) {
          const body = t.replace(/^>\s?/, "").trim();
          if (body) parts.push(body);
          i += 1;
          continue;
        }
        if (t === "") {
          i += 1;
          break;
        }
        break;
      }
      blocks.push({ type: "callout", kind, text: parts.join(" ").trim() });
      continue;
    }

    // Таблица: строка `| … |`, следующая — разделитель |---|
    if (
      trimmed.startsWith("|") &&
      i + 1 < lines.length &&
      /^\|[\s:\-|]+\|$/.test(lines[i + 1].trim())
    ) {
      flush();
      const parseRow = (r) =>
        r
          .trim()
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map((c) => c.trim());
      const rows = [parseRow(lines[i])];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(parseRow(lines[i]));
        i += 1;
      }
      blocks.push({ type: "table", rows });
      continue;
    }

    para.push(trimmed);
    i += 1;
  }
  flush();
  return blocks;
}

// Полный файл → страница. Возвращает { page, errors } (errors — пустой массив при валидном файле).
export function parseDocFile(raw, expectedFileId) {
  const errors = [];
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) {
    return { page: null, errors: ["missing or malformed frontmatter (--- block at top)"] };
  }
  const fm = parseFrontmatter(m[1]);
  const body = m[2];

  // Разделение EN/RU: маркер-строка `<!-- RU -->`
  const ruMarker = "\n<!-- RU -->";
  const ruPos = body.indexOf(ruMarker);
  const enBody = ruPos >= 0 ? body.slice(0, ruPos) : body;
  const ruBody = ruPos >= 0 ? body.slice(ruPos + ruMarker.length) : "";

  for (const f of ["id", "track", "type", "section", "order", "title", "excerpt", "version", "updated"]) {
    if (fm[f] === undefined || fm[f] === "") errors.push(`frontmatter: missing "${f}"`);
  }
  if (fm.id && expectedFileId && fm.id !== expectedFileId) {
    errors.push(`id "${fm.id}" != file name "${expectedFileId}.md"`);
  }
  if (fm.type && !["guide", "reference"].includes(fm.type)) {
    errors.push(`type must be guide|reference, got "${fm.type}"`);
  }
  for (const loc of ["en", "ru"]) {
    const t = fm.title && typeof fm.title === "object" ? fm.title[loc] : undefined;
    const e = fm.excerpt && typeof fm.excerpt === "object" ? fm.excerpt[loc] : undefined;
    if (!t) errors.push(`title.${loc} missing`);
    if (!e) errors.push(`excerpt.${loc} missing`);
  }
  if (fm.version && !DOC_VERSIONS.includes(fm.version)) {
    errors.push(`version "${fm.version}" not in allowed list: ${DOC_VERSIONS.join(", ")}`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(fm.updated || ""))) {
    errors.push(`updated must be YYYY-MM-DD, got "${fm.updated}"`);
  }

  const bodyEn = parseDocBody(enBody);
  const bodyRu = ruPos >= 0 ? parseDocBody(ruBody) : [];
  if (ruPos < 0) errors.push('missing RU section: add "<!-- RU -->" line with the Russian body');
  if (ruPos >= 0 && bodyRu.filter((b) => b.type !== "code").length < 3) {
    errors.push("RU section looks empty (fewer than 3 non-code blocks)");
  }

  // Reading time: вручную (minutes) или оценка по объёму EN-текста
  const words = bodyEn
    .filter((b) => b.type === "p" || b.type === "h2" || b.type === "h3")
    .reduce((n, b) => n + String(b.text || "").split(/\s+/).length, 0);
  const minutes = fm.minutes ? Number(fm.minutes) : Math.max(3, Math.round(words / 180));

  const page = {
    id: fm.id || expectedFileId || "unknown",
    slug: fm.id || expectedFileId || "unknown",
    track: fm.track,
    type: fm.type,
    section: fm.section,
    order: fm.order !== undefined ? Number(fm.order) : undefined,
    title: fm.title && typeof fm.title === "object" ? fm.title : {},
    excerpt: fm.excerpt && typeof fm.excerpt === "object" ? fm.excerpt : {},
    version: fm.version,
    updated: fm.updated,
    relatedTask: fm.relatedTask || null,
    minutes,
    words,
    body: { en: bodyEn, ru: bodyRu },
  };
  return { page, errors };
}
