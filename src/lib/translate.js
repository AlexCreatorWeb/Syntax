// Перевод англоязычного контента Medium в UI-язык через MyMemory:
// бесплатно, без ключа, CORS: *. ВАЖНО: анонимный лимит ~5000 зн./день и 429
// на бёрсты запросов — поэтому короткие запросы ПО БЛОКАМ (не весь текст
// одной строкой: MT ломает markdown-синтаксис картинок/ссылок внутри чанков),
// кэш на сессию, тихий фолбэк на оригинал. Сбой/лимит/неподдерживаемый язык →
// null (вызывающий показывает оригинал), поэтому перевод никогда не ломает UI.

const cache = new Map(); // текст+язык → перевод (на сессию)
// Анонимная квота MyMemory исчерпана → дальше не шлём запросы (сервер отвечает
// WARNING на каждый; флаг сбрасывается новой сессией/перегрузкой страницы).
let quotaExhausted = false;

/**
 * Переводит текст с английского в targetLang ("ru" | "uk" | "es" | "de" | …).
 * Для "en" или пустого текста — сразу оригинал. null — «покажите оригинал».
 */
export async function translateText(text, targetLang, timeoutMs = 9000) {
  if (!text) return null;
  const lang = String(targetLang || "en").toLowerCase();
  if (lang === "en") return text;
  if (quotaExhausted) return null;
  const key = `${lang}::${text}`;
  if (cache.has(key)) return cache.get(key);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      text.slice(0, 480)
    )}&langpair=en|${lang}`;
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`http ${res.status}`);
    const json = await res.json();
    const details = json && json.responseDetails ? String(json.responseDetails) : "";
    const raw =
      json && json.responseStatus === 200 && json.responseData
        ? json.responseData.translatedText
        : null;
    // MyMemory отвечает 200, но с «INVALID»/«MYMEMORY WARNING» при ошибке/квоте.
    if (raw && /MYMEMORY WARNING/i.test(raw)) quotaExhausted = true;
    else if (/MYMEMORY WARNING/i.test(details)) quotaExhausted = true;
    const value = raw && !/INVALID|MYMEMORY WARNING/i.test(raw) ? raw.trim() : null;
    cache.set(key, value);
    return value;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Перевод статьи (markdown-lite) ПО БЛОКАМ: переводятся только текстовые
 * блоки (p/h2/h3/callout), код и картинки проходят как есть — иначе
 * MT-сервис «ломает» ![...](url) и [t](url) внутри длинных чанков.
 * Партиями по 6 — MyMemory отвечает 429 на бёрсты. Сбой отдельного блока →
 * в нём остаётся оригинал. Принимает и возвращает блоки parseMdBlocks —
 * структура статьи никогда не собирается из переведённого текста.
 */
export async function translateArticleBlocks(blocks, targetLang) {
  const lang = String(targetLang || "en").toLowerCase();
  if (lang === "en" || !blocks.length) return blocks;
  const out = blocks.slice();
  const textIdx = blocks
    .map((b, i) => (b.type === "p" || b.type === "h2" || b.type === "h3" || b.type === "callout" ? i : -1))
    .filter((i) => i >= 0);
  const BATCH = 6;
  for (let i = 0; i < textIdx.length; i += BATCH) {
    const part = textIdx.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      part.map((bi) => translateText(blocks[bi].text, lang))
    );
    results.forEach((r, k) => {
      const bi = part[k];
      if (r.status === "fulfilled" && r.value) out[bi] = { ...blocks[bi], text: r.value };
    });
  }
  return out;
}

