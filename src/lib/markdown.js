// Markdown-lite для материала уроков. Поддерживает: ## / ### заголовки, **жирный**, *курсив*, `код`,
// блоки ```lang ... ``` (с кнопкой Copy), строки TIP: / NOTE: / WARN: → callout'ы.
// Формат фиксируется как контракт для агента, наполняющего таблицу lessons.
// Чистый парсер (без JSX): токены + блоки; рендер — в markdown-view.jsx.

// Инлайн: `код`, **жирный**, *курсив* → токены [{t: text|code|b|i, v}] (чистый парсер, без JSX)
export function inlineMdTokens(s) {
  const out = [];
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*\s][^*]*\*)/g;
  let last = 0;
  let m;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push({ t: "text", v: s.slice(last, m.index) });
    if (m[1]) out.push({ t: "code", v: m[1].slice(1, -1) });
    else if (m[2]) out.push({ t: "b", v: m[2].slice(2, -2) });
    else out.push({ t: "i", v: m[3].slice(1, -1) });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ t: "text", v: s.slice(last) });
  return out;
}

// Первый абзац раздела «## Цель» — для описания урока в шапке
export function goalFrom(src) {
  const m = String(src || "").match(/##\s*Цель\s*\n+([\s\S]*?)(?=\n## |\nTIP\s*:|\nNOTE\s*:|\nWARN\s*:$|$)/im);
  if (!m) return "";
  return m[1].split("\n").map((l) => l.trim()).find(Boolean) || "";
}

// Парсинг в блоки: {type:'p'|'h2'|'h3'|'code'|'callout', ...}
export function parseMdBlocks(src) {
  const blocks = [];
  const parts = String(src || "").split(/```(\w*)\n?([\s\S]*?)```/g);
  let para = [];
  const flush = () => {
    if (para.length) {
      blocks.push({ type: "p", text: para.join("\n") });
      para = [];
    }
  };
  const pushLine = (line) => {
    if (!line.trim()) { flush(); return; }
    const callout = line.match(/^(TIP|NOTE|WARN)\s*:\s*(.+)$/i);
    if (callout) {
      flush();
      const kind = callout[1].toUpperCase() === "TIP" ? "tip" : callout[1].toUpperCase() === "NOTE" ? "note" : "warning";
      blocks.push({ type: "callout", kind, text: callout[2] });
      return;
    }
    const h3 = line.match(/^###\s+(.+)$/);
    const h2 = line.match(/^##\s+(.+)$/);
    if (h3) { flush(); blocks.push({ type: "h3", text: h3[1] }); return; }
    if (h2) { flush(); blocks.push({ type: "h2", text: h2[1] }); return; }
    para.push(line);
  };
  for (let i = 0; i < parts.length; i += 3) {
    if (parts[i]) {
      for (const line of parts[i].split("\n")) pushLine(line);
    }
    if (parts[i + 1] !== undefined) {
      flush();
      blocks.push({ type: "code", lang: parts[i + 1] || "", code: (parts[i + 2] || "").replace(/\n$/, "") });
    }
  }
  flush();
  return blocks;
}

