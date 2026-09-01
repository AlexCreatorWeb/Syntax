// Перевод англоязычного контента Medium в UI-язык через MyMemory:
// бесплатно, без ключа, CORS: *. Лимит запроса ~5000 знаков — заголовки
// и анонсы влезают с запасом. Сбой/лимит/неподдерживаемый язык → null
// (вызывающий показывает оригинал), поэтому перевод никогда не ломает UI.

const cache = new Map(); // текст+язык → перевод (на сессию)

function splitBig(text, max) {
  const out = [];
  for (let i = 0; i < text.length; i += max) out.push(text.slice(i, i + max));
  return out;
}

// Разбиваем на чанки по границам абзацев (лимит MyMemory ~5000 зн., берём 1200
// с запасом под URL-энкодинг); слишком большой абзац — кусками по строчкам.
function chunkForTranslation(text, max = 1200) {
  const chunks = [];
  let cur = "";
  const flush = () => { if (cur) { chunks.push(cur); cur = ""; } };
  for (const p of text.split(/\n\n+/)) {
    if (p.length > max) {
      flush();
      chunks.push(...splitBig(p, max));
    } else if (cur && cur.length + p.length + 2 > max) {
      flush();
      cur = p;
    } else {
      cur = cur ? `${cur}\n\n${p}` : p;
    }
  }
  flush();
  return chunks.length ? chunks : [text];
}

/**
 * Переводит текст с английского в targetLang ("ru" | "uk" | "es" | "de" | …).
 * Для "en" или пустого текста — сразу оригинал. null — «покажите оригинал».
 */
export async function translateText(text, targetLang, timeoutMs = 7000) {
  if (!text) return null;
  const lang = String(targetLang || "en").toLowerCase();
  if (lang === "en") return text;
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
    const raw =
      json && json.responseStatus === 200 && json.responseData
        ? json.responseData.translatedText
        : null;
    // MyMemory отвечает 200, но с «INVALID»/«MYMEMORY WARNING» при ошибке.
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
 * Перевод длинного текста (полная статья): чанки по абзацам, параллельно,
 * сборка в исходном порядке. Сбой отдельного чанка → в нём остаётся оригинал,
 * поэтому результат всегда строка (null только для пустого входа).
 */
export async function translateLong(text, targetLang) {
  if (!text) return null;
  const lang = String(targetLang || "en").toLowerCase();
  if (lang === "en") return text;
  const chunks = chunkForTranslation(text);
  const results = await Promise.allSettled(chunks.map((c) => translateText(c, targetLang)));
  return results
    .map((r, i) => (r.status === "fulfilled" && r.value ? r.value : chunks[i]))
    .join("\n\n");
}
