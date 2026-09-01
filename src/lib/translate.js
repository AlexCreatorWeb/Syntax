// Перевод англоязычного контента Medium в UI-язык через MyMemory:
// бесплатно, без ключа, CORS: *. Лимит запроса ~5000 знаков — заголовки
// и анонсы влезают с запасом. Сбой/лимит/неподдерживаемый язык → null
// (вызывающий показывает оригинал), поэтому перевод никогда не ломает UI.

const cache = new Map(); // текст+язык → перевод (на сессию)

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
