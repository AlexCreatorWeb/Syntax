// Подключение Medium: RSS-ленты фронтенд-тегов → JSON.
// Medium не отдаёт CORS-заголовки, поэтому ленты читаем через публичный
// шлюз rss2json.com (CORS: *, без ключа). Формат: /v1/api.json?rss_url=…
// При сбое сети/шлюза возвращаем [] — фича не ломает UI (паттерн fetchDbLessons).

const RSS2JSON = "https://api.rss2json.com/v1/api.json";

// Избранные фронтенд-теги Medium, которые считаем «нашими» новостями.
export const MEDIUM_FEEDS = [
  { id: "frontend", name: "Frontend", url: "https://medium.com/feed/tag/frontend" },
  { id: "javascript", name: "JavaScript", url: "https://medium.com/feed/tag/javascript" },
  { id: "react", name: "React", url: "https://medium.com/feed/tag/react" },
];

// Лёгкий фильтр релевантности: теги JavaScript/React шире чистого фронтенда,
// поэтому отбрасываем явно бэкенд/не-веб-статьи.
const OFF_TOPIC = /\b(python|django|flask|kubernetes|k8s|devops|terraform|rust|golang|\bgo\b|php|ruby|rails|android|flutter|ios\b)\b/i;
const FRONTEND_HINTS =
  /\b(html|css|javascript|typescript|js|react|vue|angular|svelte|next\.?js|nuxt|astro|vite|webpack|frontend|front-?end|web\s?dev|dom|browser|node(\.js)?|es6|es20\d\d|ui|component|hook|state|api|http|fetch|async|promise|webpack|tailwind)\b/i;

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
    feedId: feed.id,
    feedName: feed.name,
  };
}

function isFrontendRelated(item) {
  const text = `${item.title} ${item.summary}`;
  if (OFF_TOPIC.test(text) && !FRONTEND_HINTS.test(text)) return false;
  return true;
}

// Кэш на сессию: первый fetch записывает, дальше — из памяти (как lessons).
let newsCache = null;

/**
 * Возвращает свежие фронтенд-публикации Medium (сортировка по дате desc).
 * refresh: true — перечитать ленты (поллинг раз в 10 минут в App).
 * Сбой/пусто → [] (хедер просто не покажет новости).
 */
export async function fetchMediumNews({ timeoutMs = 12000, refresh = false } = {}) {
  if (newsCache && !refresh) return newsCache;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const results = await Promise.allSettled(
      MEDIUM_FEEDS.map(async (feed) => {
        const res = await fetch(`${RSS2JSON}?rss_url=${encodeURIComponent(feed.url)}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error(`http ${res.status}`);
        const json = await res.json();
        if (json.status !== "ok" || !Array.isArray(json.items)) throw new Error("bad feed");
        return json.items.map((it) => normalizeItem(it, feed)).filter(Boolean);
      })
    );
    const all = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
    const seen = new Set();
    const items = all.filter((it) => {
      if (seen.has(it.link)) return false;
      seen.add(it.link);
      return isFrontendRelated(it);
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
