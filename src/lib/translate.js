// Перевод англоязычного контента Medium в UI-язык. Цепочка провайдеров:
// MyMemory (де= ~50K зн./день) → Google gtx → MyMemory через Jina Reader
// (Jina ходит на API со своего IP — живёт, даже когда наша IP-квота «лежит»)
// → null = «оригинал». Запросы короткие — ПО БЛОКАМ (не весь текст одной строкой:
// MT ломает markdown-синтаксис картинок/ссылок внутри чанков). Кэш на сессию;
// тихий фолбэк на оригинал, перевод никогда не ломает UI.

const cache = new Map(); // текст+язык → перевод (на сессию)
// In-flight дедупликация: повторный запрос на тот же текст (StrictMode дублирует
// эффекты, повторяющиеся блоки) ждёт тот же промис, а не шлёт второй fetch.
const pending = new Map(); // текст+язык → Promise
// Анонимная квота MyMemory исчерпана → дальше не шлём запросы (сервер отвечает
// WARNING на каждый; флаг сбрасывается новой сессией/перегрузкой страницы).
let quotaExhausted = false;
// Google (фолбэк-провайдер) отвечает 429 на datacenter-IP и бёрсты — 429 приходит
// БЕЗ CORS-заголовков, то есть как fetch-rejection; после 3 провалов не пробуем.
let googleFails = 0;
const GOOGLE_MAX_FAILS = 3;
let googleBlocked = false;

/**
 * Переводит текст с английского в targetLang ("ru" | "uk" | "es" | "de" | …).
 * Для "en" или пустого текста — сразу оригинал. null — «покажите оригинал».
 */
export async function translateText(text, targetLang, timeoutMs = 9000) {
  if (!text) return null;
  const lang = String(targetLang || "en").toLowerCase();
  if (lang === "en") return text;
  const key = `${lang}::${text}`;
  if (cache.has(key)) return cache.get(key);
  if (pending.has(key)) return pending.get(key);
  const job = (async () => {
// Цепочка: MyMemory (de= ~50K зн./день) → Google gtx → MyMemory через Jina Reader
// (Jina ходит на API со своего IP — локальная квота не исчерпана даже когда наша
// «лежит» на сутки) → null (оригинал).
    let value = null;
    if (!quotaExhausted) value = await myMemory(text, lang, timeoutMs);
    if (value === null && !googleBlocked) value = await googleGtx(text, lang, timeoutMs);
    if (value === null) value = await myMemoryViaJina(text, lang, timeoutMs);
    return value;
  })();
  pending.set(key, job);
  try {
    const value = await job;
    cache.set(key, value);
    return value;
  } finally {
    pending.delete(key);
  }
}

async function myMemory(text, lang, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      text.slice(0, 480)
    )}&langpair=en|${lang}&de=frontend@syntax.dev`;
    const res = await fetch(url, { signal: ctrl.signal });
    // Тело парсим ДО проверки status: при 429 (квота) ответ JSON с WARNING.
    const json = await res.json().catch(() => null);
    // Квота/ошибка: WARNING приходит в responseDetails или translatedText
    // (при responseStatus 429, а не 200!) — флаг ставим в обоих случаях.
    const blob = [json && json.responseDetails, json && json.responseData && json.responseData.translatedText]
      .filter(Boolean).join(" ");
    if (/MYMEMORY WARNING/i.test(blob)) quotaExhausted = true;
    if (!res.ok) throw new Error(`http ${res.status}`);
    const raw =
      json && json.responseStatus === 200 && json.responseData
        ? json.responseData.translatedText
        : null;
    return raw && !/INVALID|MYMEMORY WARNING/i.test(raw) ? raw.trim() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Google Translate (gtx-эндпоинт веб-версии): JSON [[seg...], ...], перевод =
// конкатенация seg[0]. 429 на datacenter-IP приходит без CORS → reject; после
// GOOGLE_MAX_FAILS провалов provider считается мёртвым на сессию.
async function googleGtx(text, lang, timeoutMs) {
  if (googleBlocked) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), Math.min(timeoutMs, 6000));
  try {
    const url = `https://translate.google.com/translate_a/single?client=gtx&sl=en&tl=${lang}&dt=t&q=${encodeURIComponent(
      text.slice(0, 480)
    )}`;
    const res = await fetch(url, { signal: ctrl.signal });
    if (res.status === 429) googleFails += 1;
    if (!res.ok) throw new Error(`http ${res.status}`);
    const data = await res.json();
    const segs =
      Array.isArray(data) && Array.isArray(data[0])
        ? data[0].map((s) => (s && s[0]) || "").join("")
        : null;
    if (segs) googleFails = 0;
    return segs ? segs.trim() : null;
  } catch {
    googleFails += 1;
    if (googleFails >= GOOGLE_MAX_FAILS) googleBlocked = true;
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// MyMemory через Jina Reader: Jina ходит на API со СВОЕГО IP, поэтому переводит,
// даже когда наша IP-квота исчерпана (MyMemory считает квоты по IP вызывающего).
// Jina оборачивает тело: «Markdown Content:\n{json…}» — парсим JSON от первой «{».
const JINA_READER = "https://r.jina.ai/";
async function myMemoryViaJina(text, lang, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), Math.min(timeoutMs, 15000));
  const attempt = async () => {
    const api = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      text.slice(0, 480)
    )}&langpair=en|${lang}&de=frontend@syntax.dev`;
    const res = await fetch(`${JINA_READER}${api}`, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`http ${res.status}`);
    const md = await res.text();
    const start = md.indexOf("{");
    if (start === -1) throw new Error("no json in jina body");
    const json = JSON.parse(md.slice(start));
    const raw =
      json && json.responseStatus === 200 && json.responseData
        ? json.responseData.translatedText
        : null;
    return raw && !/INVALID|MYMEMORY WARNING/i.test(raw) ? raw.trim() : null;
  };
  try {
    // один повтор: Jina без ключа иногда отдаёт 429 под нагрузкой (20 RPM)
    let value = await attempt();
    if (value === null) {
      await new Promise((r) => setTimeout(r, 1500));
      value = await attempt();
    }
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

