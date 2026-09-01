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
// RSS → JSON шлюзы-цепочка: rss2json (free — ДНЕВНОЙ лимит ~200, горит под
// тестами) → allorigins (XML) → corsproxy.io (XML). Сессийный dead-флаг на
// шлюз (2 фейла подряд) — не дёргаем мёртвый 9 раз.
const gwFail = { rss2json: 0, allorigins: 0, corsproxy: 0 };
const GW_DEAD = 2;
const TOP_N = 8; // сколько новостей показать в дропдауне (round-robin по техам)
const FEED_GAP_MS = 1050; // ~1 req/с — последовательно, иначе 429
let newsPending = null; // in-flight дедупликация (StrictMode дублирует mount-эффект)

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
  const s = String(pubDate).trim();
  // RFC2822 ("Tue, 01 Sep 2026 12:36:26 GMT" — Jina/XML) парсится нативно;
  // ISO без Z ("2026-09-01 12:36:26" — rss2json) — хак T+Z.
  let d = new Date(s);
  if (isNaN(d)) d = new Date(s.replace(" ", "T") + "Z");
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
// Кэш в localStorage: поллинг раз в 10 мин НЕ перечитывает ленты чаще TTL,
// иначе дневные квоты free-шлюзов (rss2json ~200/день) сгорают за часы.
// Смена дня в App → refresh: true → мимо кэша.
const LS_CACHE_KEY = "syntax-medium-cache";
const CACHE_TTL_MS = 2 * 3600 * 1000;
function readLsCache() {
  try {
    const raw = localStorage.getItem(LS_CACHE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw);
    return Array.isArray(c.items) && c.ts && Date.now() - c.ts < CACHE_TTL_MS ? c.items : null;
  } catch {
    return null;
  }
}
function writeLsCache(items) {
  try { localStorage.setItem(LS_CACHE_KEY, JSON.stringify({ ts: Date.now(), items })); } catch { /* ignore */ }
}

/**
 * Возвращает свежие публикации Medium по технологиям платформы
 * **только за сегодня** (локальная дата), сортировка по дате desc,
 * дедупликация по ссылке.
 * refresh: true — перечитать ленты (поллинг раз в 10 минут в App;
 * App сам форсирует refresh при переходе через 00:00).
 * Сбой/пусто → [] (хедер просто не покажет новости).
 */
// RSS-лента одной технологии через цепочку шлюзов: rss2json (JSON) →
// allorigins (XML) → corsproxy.io (XML). Возвращает normalized items.
async function fetchFeedItems(feed) {
  const xmlUrl = `https://medium.com/feed/tag/${feed.tag}`;
  const gateways = [
    {
      id: "rss2json",
      url: `${RSS2JSON}?rss_url=${encodeURIComponent(xmlUrl)}`,
      toItems: async (res) => {
        const json = await res.json();
        if (json.status !== "ok" || !Array.isArray(json.items)) throw new Error("bad feed");
        return json.items;
      },
    },
    { id: "allorigins", url: `https://api.allorigins.win/raw?url=${encodeURIComponent(xmlUrl)}`, toItems: rssXmlToItems },
    { id: "corsproxy", url: `https://corsproxy.io/?url=${encodeURIComponent(xmlUrl)}`, toItems: rssXmlToItems },
    // Jina читает RSS с CORS и отдаёт markdown: "### [](url)" + дата RFC2822.
    // Титулы пустые — slug → заголовок. Самая живучая нога (RPM-лимит, не дневной).
    { id: "jina", url: `https://r.jina.ai/${xmlUrl}`, toItems: (res) => res.text().then(jinaRssToItems) },
  ];
  for (const gw of gateways) {
    if (gwFail[gw.id] >= GW_DEAD) continue; // сессийно мёртвый — дальше
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 9000);
    let items = null;
    try {
      const res = await fetch(gw.url, { signal: ctrl.signal });
      if (!res.ok) throw new Error(`http ${res.status}`);
      items = await gw.toItems(res);
      if (!items.length) throw new Error("empty");
    } catch {
      gwFail[gw.id] += 1;
    } finally {
      clearTimeout(timer);
    }
    if (items) {
      return items
        .map((it) => normalizeItem(it, feed))
        .filter((it) => it && isTechRelated(it, feed));
    }
  }
  return [];
}

// Jina markdown-дамп RSS → items: блоки "### [](url)" + строка даты RFC2822
function jinaRssToItems(src) {
  const body = src.includes("Markdown Content:")
    ? src.slice(src.indexOf("Markdown Content:") + "Markdown Content:".length)
    : src;
  const items = [];
  for (const blk of body.split(/^### \[/m).slice(1)) {
    const urlM = blk.match(/\]\((https?:[^)\s]+)\)/);
    const dateM = blk.match(/([A-Z][a-z]{2}, \d{1,2} [A-Z][a-z]{2} \d{4} [\d:]+ GMT)/);
    if (!urlM) continue;
    items.push({
      link: urlM[1],
      title: slugToTitle(urlM[1]),
      pubDate: dateM ? dateM[1] : "",
      description: "",
    });
  }
  if (!items.length) throw new Error("no items");
  return items;
}

// Slug Medium-ссылки → читаемый заголовок (Jina-фолбэк отдаёт пустые title)
function slugToTitle(link) {
  try {
    const seg = new URL(link).pathname.split("/").filter(Boolean).pop() || "";
    const clean = seg.replace(/\?[^]*$/, "").replace(/-[a-f0-9]{8,}$/i, "");
    return clean
      .replace(/[-_]+/g, " ")
      .trim()
      .split(" ")
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
      .join(" ");
  } catch {
    return link;
  }
}

// RSS XML (Medium) → items в формате rss2json-объекта (title/link/pubDate/description)
function rssXmlToItems(res) {
  return res.text().then((xml) => {
    const doc = new DOMParser().parseFromString(xml, "text/xml");
    const items = [...doc.querySelectorAll("item")].map((el) => ({
      title: (el.querySelector("title")?.textContent || "").trim(),
      link: (el.querySelector("link")?.textContent || "").trim(),
      pubDate: (el.querySelector("pubDate")?.textContent || "").trim(),
      description: (el.querySelector("description")?.textContent || "").trim(),
    }));
    if (!items.length) throw new Error("no items");
    return items;
  });
}

export async function fetchMediumNews({ refresh = false } = {}) {
  if (newsCache && !refresh) return newsCache;
  if (!refresh) {
    const ls = readLsCache();
    if (ls) {
      newsCache = ls;
      return ls;
    }
  }
  if (newsPending) return newsPending;
  newsPending = (async () => {
    try {
      // Ленты ПООЧЕРЁДНО (шлюзы free: ~1 req/с). Сбой ленты = [] (остальные живут).
      const all = [];
      const feeds = activeFeeds();
      for (let fi = 0; fi < feeds.length; fi++) {
        const feed = feeds[fi];
        all.push(...(await fetchFeedItems(feed)));
        if (fi < feeds.length - 1) await new Promise((r) => setTimeout(r, FEED_GAP_MS));
      }
    const seen = new Set();
    const today = all.filter((it) => {
      if (seen.has(it.link)) return false;
      seen.add(it.link);
      return isPublishedToday(it.pubDate);
    });
    // Разнообразие: «топ-8 самых свежих» захватывает одна активная технология
    // (фидбэк: «все новости Python»). ROUND-ROBIN: сначала по ОДНОЙ СЛУЧАЙНОЙ
    // статье с каждой технологии, потом второй круг — до N. Рандом внутри
    // технологии: при каждом refresh (10 мин) сет меняется.
    const byTech = new Map();
    for (const it of today) {
      const arr = byTech.get(it.techId) || [];
      arr.push(it);
      byTech.set(it.techId, arr);
    }
    for (const arr of byTech.values()) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    }
    const picked = [];
    const techs = [...byTech.keys()];
    for (let round = 0; picked.length < TOP_N && techs.length; round++) {
      let added = false;
      for (const tid of techs) {
        const arr = byTech.get(tid);
        if (arr.length > round) {
          picked.push(arr[round]);
          added = true;
          if (picked.length >= TOP_N) break;
        }
      }
      if (!added) break;
    }
    newsCache = picked;
    writeLsCache(picked);
    return newsCache;
    } finally {
      newsPending = null;
    }
  })();
  return newsPending;
}

// Прочитанность — localStorage (паттерн syntax-theme/syntax-tech):
// ссылка есть в списке → метка-«красная точка» гаснет.
// После 00:00 App очищает список (clearSeenLinks) — новости снова «активные».
const SEEN_KEY = "syntax-medium-seen";
const SEEN_LIMIT = 60;

// Полный текст статьи. Medium не отдаёт CORS ни на фиды, ни на статьи, поэтому
// читаем через Jina Reader (r.jina.ai, CORS: *, бесплатно ~20 req/min):
// отдаёт статью чистым markdown. target_selector режет навигационный мусор.
const JINA = "https://r.jina.ai/";
const JUNK_LINES = [
  /^press enter or click to view image in full size$/i,
  /^\d+\s*min read$/i,
  /^\d+\s*(second|minute|hour|day|week|month)s?\s+(ago|later)$/i,
  /^(follow|help|respond|share)$/i,
  /^just now$/i,
  /^-{2,}$/i,
  // карточка sign-in / пейволл в теле статьи (Jina их подхватывает)
  /^join medium for free/i,
  /^remember me for faster sign in$/i,
  /^\[?\*{0,2}not a medium member/i,
  /^\[?\*{0,2}read this article here\*{0,2}\]?\(?[^)]*\)?$/i,
];

// Markdown Jina → чистый markdown-lite: без служебных строк, списки → «• »
// (контракт lessons без списков), парный контроль ```-фенсов (Jina иногда
// ломает кодовые блоки — нечётное число фенсов съело бы остаток статьи).
function cleanArticleMarkdown(md) {
  const src = String(md || "");
  const marker = "Markdown Content:";
  const body = src.includes(marker) ? src.slice(src.indexOf(marker) + marker.length) : src;
  const out = [];
  let avatar = null;
  let first = true; // первый НЕПУСТОЙ ряд (body начинается с \n)
  body.split("\n").forEach((raw) => {
    let line = raw.trim();
    // blockquote-маркер Jina — просто убираем
    line = line.replace(/^>\s?/, "");
    if (!line) {
      if (out[out.length - 1] !== "") out.push("");
      return;
    }
    // первый непустой ряд — аватар автора: [![alt](img)](profile)
    if (first) {
      first = false;
      const av = line.match(/^\[!\[[^\]]*\]\(([^)\s]+)\)\]\(([^)\s]+)\)$/);
      if (av) avatar = av[1];
      return;
    }
    if (JUNK_LINES.some((re) => re.test(line))) return;
    const bullet = line.match(/^[*-]\s+(.*)$/);
    if (bullet) {
      if (out[out.length - 1] !== "") out.push("");
      out.push(`• ${bullet[1]}`);
      out.push("");
      return;
    }
    out.push(line);
  });
  const fences = (out.join("\n").match(/```/g) || []).length;
  if (fences % 2 === 1) out.push("```");
  return {
    md: wrapCodeLines(out).join("\n").replace(/\n{3,}/g, "\n\n").trim(),
    avatar,
  };
}

// Jina Reader часто «ломает» кодовые блоки: статья получает сырые строки кода
// (<img, src=…, />), которые «плывут» в тексте. Хэвистик: последовательные
// «кодовые» строки сворачиваем в ```-блок → рендерится фреймом .code-block.
const CODE_START = /^(<[a-zA-Z/!?]|function\b|return\b|import\b|export\b|const\b|let\b|var\b|\S+\(.*\)\s*\{\s*$)/;
const CODE_CONT = /^(\s+\S|\s*[{}();,]|\/>|<>|<\/?[a-zA-Z])|\s*=\s*\S.*$/;
function wrapCodeLines(lines) {
  const res = [];
  let buf = [];
  const hadCode = () => buf.some((l) => l !== "");
  const flush = () => {
    if (!buf.length) return;
    if (hadCode()) res.push("```", ...buf, "```");
    else res.push(...buf);
    buf = [];
  };
  for (const line of lines) {
    if (buf.length) {
      // пустые строки допустимы ВНУТРИ группы (Jina разводит кодовые строки пустотами)
      if (line === "" || CODE_CONT.test(line)) { buf.push(line); continue; }
      flush();
    }
    if (CODE_START.test(line)) { buf.push(line); continue; }
    res.push(line);
  }
  flush();
  return res;
}

const articleCache = new Map(); // link → { md, avatar } (на сессию)

/** Полный текст статьи Medium как markdown (+ аватар автора). Сбой → null (модалка покажет анонс). */
export async function fetchMediumArticle(link, timeoutMs = 25000) {
  if (articleCache.has(link)) return articleCache.get(link);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${JINA}${link}?target_selector=.postArticle-content`, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`http ${res.status}`);
    const value = cleanArticleMarkdown(await res.text());
    if (!value.md) throw new Error("empty article");
    articleCache.set(link, value);
    return value;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

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
