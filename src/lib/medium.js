// Подключение Medium: RSS-теги по технологиям платформы → JSON.
// Medium не отдаёт CORS-заголовки, поэтому ленты читаем через публичный
// шлюз rss2json.com (CORS: *, без ключа). Формат: /v1/api.json?rss_url=…
// При сбое сети/шлюза возвращаем [] — фича не ломает UI (паттерн fetchDbLessons).
//
// Источник правды — TECHS (src/lib/techs.js): тот же список технологий,
// что показывается на вкладке «Дорожная карта». Активные фиды вычисляются
// из TECHS в рантайме: убрали технологию из TECHS → её лента перестала
// тянуться в уведомления, маппинг-таблицу трогать не нужно.
import TECHS from "./techs";

const RSS2JSON = "https://api.rss2json.com/v1/api.json";

// Технология платформы → тег Medium + фильтр релевантности.
// Ключевые слова нужны: теги Medium неточные (например, «node» подмешивает
// Kubernetes-«nodes», а «postgres» — соседние СУБД).
const TECH_MEDIUM = {
  html: { tag: "html", keywords: /\bhtml\b/i },
  css: { tag: "css", keywords: /\bcss\b/i },
  javascript: { tag: "javascript", keywords: /javascript|ecmascript|\bjs\b|\bes6\b|\bes20\d\d\b/i },
  react: { tag: "react", keywords: /\breact\b/i },
  vue: { tag: "vue", keywords: /\bvue\b/i },
  node: { tag: "node", keywords: /node\.js|\bnode\b(?!s)/i },
  mongo: { tag: "mongodb", keywords: /\bmongo(db)?\b|\bbson\b/i },
  python: { tag: "python", keywords: /\bpython\b/i },
  postgres: { tag: "postgres", keywords: /postgres|psql|\bpg\b/i },
};

// Активные фиды = только те, чья технология есть на платформе (TECHS).
const activeFeeds = () =>
  TECHS.filter((tech) => TECH_MEDIUM[tech.id]).map((tech) => ({
    techId: tech.id,
    tag: TECH_MEDIUM[tech.id].tag,
    keywords: TECH_MEDIUM[tech.id].keywords,
  }));

// Дневная ротация: ключ «YYYY-M-D» по местному времени.
export function mediumDayKey(date = new Date()) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

// Показываем только свежие за сегодня (локальная дата).
// pubDate из rss2json — «YYYY-MM-DD HH:MM:SS» без таймзоны (GMT у Medium),
// поэтому парсим как UTC и сравниваем локальные календарные дни.
function isPublishedToday(pubDate) {
  const d = new Date(String(pubDate).replace(" ", "T") + "Z");
  if (isNaN(d)) return false;
  const n = new Date();
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  );
}

function htmlToText(html) {
  if (!html) return "";
  const el = document.createElement("div");
  el.innerHTML = html;
  return (el.textContent || "").replace(/\s+/g, " ").trim();
}

// Ссылка без ?source=… хвоста Medium — устойчивый id статьи.
function cleanLink(link) {
  return (link || "").split("?")[0];
}

function normalizeItem(raw, feed) {
  const link = cleanLink(raw.link);
  if (!link || !raw.title) return null;
  const summary = htmlToText(raw.description).slice(0, 240);
  return {
    link,
    title: raw.title.trim(),
    summary,
    author: raw.author || "Medium",
    pubDate: raw.pubDate || "",
    techId: feed.techId,
  };
}

// Статья относится к технологии, только если в заголовке/анонсе есть
// её ключевые слова (теги Medium широкие — см. TECH_MEDIUM).
function isTechRelated(item, feed) {
  return feed.keywords.test(`${item.title} ${item.summary}`);
}

// Кэш на сессию: первый fetch записывает, дальше — из памяти (как lessons).
let newsCache = null;

/**
 * Возвращает свежие публикации Medium по технологиям платформы
 * **только за сегодня** (локальная дата), сортировка по дате desc,
 * дедупликация по ссылке.
 * refresh: true — перечитать ленты (поллинг раз в 10 минут в App;
 * App сам форсирует refresh при переходе через 00:00).
 * Сбой/пусто → [] (хедер просто не покажет новости).
 */
export async function fetchMediumNews({ timeoutMs = 12000, refresh = false } = {}) {
  if (newsCache && !refresh) return newsCache;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const results = await Promise.allSettled(
      activeFeeds().map(async (feed) => {
        const url = `${RSS2JSON}?rss_url=${encodeURIComponent(
          `https://medium.com/feed/tag/${feed.tag}`
        )}`;
        const res = await fetch(url, { signal: ctrl.signal });
        if (!res.ok) throw new Error(`http ${res.status}`);
        const json = await res.json();
        if (json.status !== "ok" || !Array.isArray(json.items)) throw new Error("bad feed");
        return json.items
          .map((it) => normalizeItem(it, feed))
          .filter((it) => it && isTechRelated(it, feed));      })
    );
    const all = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
    const seen = new Set();
    const items = all.filter((it) => {
      if (seen.has(it.link)) return false;
      seen.add(it.link);
      return isPublishedToday(it.pubDate);
    });
    items.sort((a, b) => String(b.pubDate).localeCompare(String(a.pubDate)));
    newsCache = items.slice(0, 8);
    return newsCache;
  } catch {
    return newsCache || [];
  } finally {
    clearTimeout(timer);
  }
}

// Прочитанность — localStorage (паттерн syntax-theme/syntax-tech):
// ссылка есть в списке → метка-«красная точка» гаснет.
// После 00:00 App очищает список (clearSeenLinks) — новости снова «активные».
const SEEN_KEY = "syntax-medium-seen";
const SEEN_LIMIT = 60;

export function getSeenLinks() {
  try {
    const arr = JSON.parse(localStorage.getItem(SEEN_KEY)) || [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

// Новая календарная дата → все сегодняшние новости снова непрочитанные.
export function clearSeenLinks() {
  try {
    localStorage.removeItem(SEEN_KEY);
  } catch {
    /* некритично */
  }
}

export function markLinkSeen(link) {
  if (!link) return;
  try {
    const arr = JSON.parse(localStorage.getItem(SEEN_KEY)) || [];
    if (!arr.includes(link)) {
      arr.push(link);
      if (arr.length > SEEN_LIMIT) arr.splice(0, arr.length - SEEN_LIMIT);
      localStorage.setItem(SEEN_KEY, JSON.stringify(arr));
    }
  } catch {
    /* localStorage может быть недоступен — некритично */
  }
}
