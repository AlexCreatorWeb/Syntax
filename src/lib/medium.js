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
// тестами) → allorigins (XML). Сессийный dead-флаг на
// шлюз (2 фейла подряд) — не дёргаем мёртвый 9 раз.
const gwFail = { rss2json: 0, allorigins: 0 };
const GW_DEAD = 2;
const TOP_N = 8; // сколько новостей показать в дропдауне (round-robin по техам)
const FEED_GAP_MS = 1050; // ~1 req/с — последовательно, иначе 429
// Прокси-база (Vercel): в prod — same-origin (/api/medium); в dev — prod-деплой
// (тот же VITE_AI_PROXY_URL, что и для AI — один и тот же Vercel-проект).
const PROXY_BASE = (import.meta.env.VITE_AI_PROXY_URL || "").replace(
  /\/+$/,
  "",
);
let newsPending = null; // in-flight дедупликация (StrictMode дублирует mount-эффект)

// Технология платформы → тег Medium + фильтр релевантности.
// Ключевые слова нужны: теги Medium неточные (например, «node» подмешивает
// Kubernetes-«nodes», а «postgres» — соседние СУБД).
const TECH_MEDIUM = {
  html: { tag: "html", keywords: /\bhtml\b/i },
  css: { tag: "css", keywords: /\bcss\b/i },
  javascript: {
    tag: "javascript",
    keywords: /javascript|ecmascript|\bjs\b|\bes6\b|\bes20\d\d\b/i,
  },
  react: { tag: "react", keywords: /\breact\b/i },
  vue: { tag: "vue", keywords: /\bvue\b/i },
  node: { tag: "node", keywords: /node\.js|\bnode\b(?!s)/i },
  mongo: { tag: "mongodb", keywords: /\bmongo(db)?\b|\bbson\b/i },
  python: { tag: "python", keywords: /\bpython\b/i },
  postgres: { tag: "postgres", keywords: /postgres|psql|\bpg\b/i },
  // AI-инструменты платформы (фидбек 2026-09-08: добавить в выдачу новостей)
  claude: {
    tag: "claude-ai",
    keywords: /\bclaude\b|anthropic/i,
  },
  cursor: {
    // тег Medium «cursor» широкий (текстовый курсор) — фильтруем по AI-контексту
    tag: "cursor",
    keywords:
      /cursor\s*(ide|ai|editor|coding|composer|agent)?[\s.,:;]|\bcursor\b\s+(ai|ide)|cursor\.com/i,
  },
  copilot: {
    tag: "copilot",
    keywords: /\bgithub copilot\b|\bcopilot\b/i,
  },
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

function safeChr(n) {
  try {
    return Number.isFinite(n) && n > 0 ? String.fromCodePoint(n) : "";
  } catch {
    return "";
  }
}

function htmlToText(html) {
  if (!html) return "";
  // summary-сниппет RSS-описания: regex-чистки достаточно (DOM/innerHTML не нужны)
  return String(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#0?39;|&quot;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => safeChr(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => safeChr(parseInt(d, 10)))
    .replace(/\s+/g, " ")
    .trim();
}

// Ссылка без ?source=… хвоста Medium — устойчивый id статьи.
function cleanLink(link) {
  return (link || "").split("?")[0];
}

// Обложка из RSS-описания (hero-картинка статьи): <img src="https://cdn-images-1.medium.com/…">.
// Фолбэк на клиенте — старый прод-прокси не возвращал image, а description у него есть.
function firstImgFromDescription(html) {
  if (!html) return null;
  const m = String(html).match(/<img[^>]*\b(?:src|data-src)="(https?:[^"]+)"/i);
  return m ? m[1] : null;
}

function normalizeItem(raw, feed) {
  const link = cleanLink(raw.link);
  if (!link || !raw.title) return null;
  // Языковой гейт ДО всех остальных проверок: CJK/нерасширенная латиница
  // не доходит до UI ни по какому из шлюзов (vercel/rss2json/allorigins/jina).
  if (!isTranslatableItem({ title: raw.title, summary: raw.description || "" }))
    return null;
  const summary = htmlToText(raw.description)
    .replace(/\s*Continue reading on Medium\s*»?\s*$/i, "")
    .slice(0, 240);
  return {
    link,
    title: raw.title.trim(),
    summary,
    // Обложка из RSS-описания (hero-картинка статьи) — показывается в шапке
    // модалки: страница Medium под CF-челленджем, inline-картинки недоступны.
    image: raw.image || firstImgFromDescription(raw.description),
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

// Языковой гейт (фидбэк 2026-09: «в новостях китайские символы — не
// переводим, не пропускать»). Цепочка перевода жёстко EN→{ru,uk,es,de}
// (MyMemory langpair=en|…, Google sl=en), а теги Medium ГЛОБАЛЬНЫЕ — в
// фиды попадают корейские баннер-рекламы (тег «css» — статья про банковский
// кредитный скоринг, прошла по «CSS» в названии), китайские (vue), русские
// (node) и т.п. В EN-интерфейсе такие новости отображаются сырыми CJK-символами
// и не транслируются. Отсекаем: (а) CJK (хань/кана/хангыль) ≥15% букв — даже
// смешанный заголовок типа «使用 AbortController 取消重複 API 請求» это CJK-статья;
// (б) прочие нерасширенные-латиницей письма (кириллица, арабская, греческая…)
// ≥40% букв. Латиница с диакритикой (турецкий İ/ğ, французский é, немецкий ß)
// проходит — такие статьи хотя бы читаемы и частично транслируемы.
export function scriptStats(text) {
  let letters = 0;
  let latin = 0;
  let cjk = 0;
  for (const ch of String(text || "")) {
    const o = ch.codePointAt(0);
    const isLatin =
      (o >= 0x41 && o <= 0x5a) ||
      (o >= 0x61 && o <= 0x7a) ||
      (o >= 0xc0 && o <= 0x24f) || // Latin-1 Supplement/Ext-A/B: é, ß, İ, ğ…
      (o >= 0x1e00 && o <= 0x1eff);
    const isCjk =
      (o >= 0x3040 && o <= 0x30ff) || // kana
      (o >= 0x3400 && o <= 0x9fff) || // CJK unified (han)
      (o >= 0xac00 && o <= 0xd7af) || // hangul syllables
      (o >= 0xf900 && o <= 0xfaff); // CJK compatibility
    if (isLatin) {
      letters += 1;
      latin += 1;
    } else if (isCjk) {
      letters += 1;
      cjk += 1;
    } else if (
      (o >= 0x370 && o <= 0x3ff) || // греческая
      (o >= 0x400 && o <= 0x4ff) || // кириллица
      (o >= 0x590 && o <= 0x5ff) || // иврит
      (o >= 0x600 && o <= 0x6ff) || // арабская
      (o >= 0x900 && o <= 0x97f) // деванагари
    ) {
      letters += 1; // не-латиница, не-CJK
    }
    // цифры/эмодзи/знаки — не буквы, в статистике не участвуют
  }
  return { letters, latin, cjk };
}

// false = статья, которую наша EN-цепочка не переведёт (см. комментарий выше).
// Короткие строки (<8 букв) не отсекаем — нет уверенности в языке.
export function isTranslatableItem(item) {
  const { letters, latin, cjk } = scriptStats(
    `${item.title || ""} ${item.summary || ""}`,
  );
  if (letters < 8) return true;
  if (cjk / letters >= 0.15) return false;
  if ((letters - latin) / letters >= 0.4) return false;
  return true;
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
    if (!Array.isArray(c.items) || !c.ts || Date.now() - c.ts >= CACHE_TTL_MS)
      return null;
    // Гейт и при ЧТЕНИИ кэша: кэш, записанный старой версией приложения, может
    // держать CJK-статьи до TTL (2ч) — не даём им показаться ещё раз.
    const items = c.items.filter(isTranslatableItem);
    return items.length ? items : null;
  } catch {
    return null;
  }
}
function writeLsCache(items) {
  try {
    localStorage.setItem(
      LS_CACHE_KEY,
      JSON.stringify({ ts: Date.now(), items }),
    );
  } catch {
    /* ignore */
  }
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
// allorigins (XML). Возвращает normalized items.
// (corsproxy.io убран: с 2025 требует API-ключ — стабильный 401 в консоли гостя)
async function fetchFeedItems(feed) {
  const xmlUrl = `https://medium.com/feed/tag/${feed.tag}`;
  const gateways = [
    // Vercel-прокси: читает Medium RSS напрямую с IP Vercel (без CORS/дневных квот
    // публичных шлюзов) — самая надёжная нога, ставим первой.
    {
      id: "vercel",
      url: `${PROXY_BASE ? PROXY_BASE + "/api/medium?tag=" : "/api/medium?tag="}${feed.tag}`,
      toItems: async (res) => {
        const json = await res.json();
        if (!Array.isArray(json.items)) throw new Error("bad proxy response");
        return json.items;
      },
    },
    {
      id: "rss2json",
      url: `${RSS2JSON}?rss_url=${encodeURIComponent(xmlUrl)}`,
      toItems: async (res) => {
        const json = await res.json();
        if (json.status !== "ok" || !Array.isArray(json.items))
          throw new Error("bad feed");
        return json.items;
      },
    },
    {
      id: "allorigins",
      url: `https://api.allorigins.win/raw?url=${encodeURIComponent(xmlUrl)}`,
      toItems: rssXmlToItems,
    },
    // Jina читает RSS с CORS и отдаёт markdown: "### [](url)" + дата RFC2822.
    // Титулы пустые — slug → заголовок. Самая живучая нога (RPM-лимит, не дневной).
    {
      id: "jina",
      url: `https://r.jina.ai/${xmlUrl}`,
      toItems: (res) => res.text().then(jinaRssToItems),
    },
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
    const dateM = blk.match(
      /([A-Z][a-z]{2}, \d{1,2} [A-Z][a-z]{2} \d{4} [\d:]+ GMT)/,
    );
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
    if (ls && ls.length) {
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
        if (fi < feeds.length - 1)
          await new Promise((r) => setTimeout(r, FEED_GAP_MS));
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
      // Пустой результат НЕ кэшируем: иначе сбой всех шлюзов «залипает» до TTL кэша
      // (2ч) и фид пустует дольше, чем надо. Следующий поллинг (10 мин) перечитает ленты.
      if (picked.length) {
        newsCache = picked;
        writeLsCache(picked);
      }
      return picked;
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
  const body = src.includes(marker)
    ? src.slice(src.indexOf(marker) + marker.length)
    : src;
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
    // M1-аудит: SEO-абзацы Jina (описание картинки «…thumbnail showing…» не контент статьи
    if (/thumbnail showing/i.test(line)) return;
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
  let finalMd = wrapCodeLines(out)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  // M1-аудит: Jina оборачивает ссылки в жирный — **<link>** рендерится звёздами;
  // оставляем ссылку, жирный вокруг неё теряем
  finalMd = finalMd.replace(/\*\*\[([^\]\n]+)\]\(([^)\s]+)\)\*\*/g, "[$1]($2)");
  // Jina-курсив _…_ — markdown-lite понимает только *…*, просто снимаем underscores
  finalMd = finalMd.replace(/(^|\s)_([^_\n]+?)_(?=\s|$)/gm, "$1$2");
  // UX-аудит K1: Jina-fallback выдаёт HTML-теги в тексте ссылок (publication-nav)
  // и осиротевший *автор* ряд — markdown-lite их не понимает. Правки — только
  // вне ```-фенсов (в коде <img …> и т.п. должны жить честно).
  finalMd = finalMd
    .split(/```[\s\S]*?```/g)
    .map((part, i) => {
      if (i % 2 === 1) return part; // внутри кодового блока
      let s = part;
      // [<h2>Topic</h2>](medium.com/…publication_nav…) — целым рядом = навигация, выкинуть;
      // встроена в текст = заголовок раздела
      s = s.replace(/^\[<h[1-6]>[\s\S]*?<\/h[1-6]>\]\([^)\n]*\)$/gm, "");
      s = s.replace(
        /\[<h([1-6])>([\s\S]*?)<\/h\1>\]\([^)\n]*\)/g,
        (_, n, text) =>
          `${n <= 2 ? "##" : "###"} ${String(text).replace(/\s+/g, " ").trim()}`,
      );
      // любые прочие теги в ссылке → оставляем только текст ссылки
      s = s.replace(/\[(<[^>\n]+>)[^\n]*?\]\(([^)\n]*)\)/g, (m, _tag, url) => {
        const inner = m.slice(m.indexOf("[") + 1, m.indexOf("]("));
        const clean = inner.replace(/<[^>\n]+>/g, "").trim();
        return clean ? `[${clean}](${url})` : "";
      });
      // осиротевший *автор*. (byline-ряд Jina) — снимаем звёзды, текст оставляем
      s = s
        .split("\n")
        .map((line) =>
          /^\*[^*\n]+(\*[^*\n]+)*\*\.?$/.test(line)
            ? line.replace(/\*/g, "").replace(/\.\s*$/, ".")
            : line,
        )
        .join("\n");
      // оставшиеся одиночные HTML-теги в тексте (known-список, чтобы не тронуть
      // «a < b» и т.п. в прозе)
      s = s.replace(
        /<(?:\/?(?:h[1-6]|b|strong|em|i|span|a|p|div|button|br|svg|path|ul|li|img)\b[^>]*?)>/gi,
        "",
      );
      return s;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return {
    md: finalMd,
    avatar,
  };
}

// Jina Reader часто «ломает» кодовые блоки: статья получает сырые строки кода
// (<img, src=…, />), которые «плывут» в тексте. Хэвистик: последовательные
// «кодовые» строки сворачиваем в ```-блок → рендерится фреймом .code-block.
const CODE_START =
  /^(<[a-zA-Z/!?]|function\b|return\b|import\b|export\b|const\b|let\b|var\b|\S+\(.*\)\s*\{\s*$)/;
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
      if (line === "" || CODE_CONT.test(line)) {
        buf.push(line);
        continue;
      }
      flush();
    }
    if (CODE_START.test(line)) {
      buf.push(line);
      continue;
    }
    res.push(line);
  }
  flush();
  return res;
}

const articleCache = new Map(); // link → { md, avatar } (на сессию)

// Цепочка загрузки статьи. БРАУЗЕРНЫЕ пути мертвы: Medium без CORS, а
// r.jina.ai с 2026 закрыт Cloudflare-челленджем (403) — поэтому ПЕРВЫЙ путь
// = Vercel-прокси api/medium?article= (серверно: Medium напрямую +
// markdown.new-fallback, отдаёт готовый markdown-lite). Jina напрямую —
// вторая нога (если CF-челлендж уйдёт).
async function fetchArticleViaProxy(link, signal) {
  const res = await fetch(
    `${PROXY_BASE ? PROXY_BASE + "/api/medium?article=" : "/api/medium?article="}${encodeURIComponent(link)}`,
    { signal },
  );
  if (!res.ok) throw new Error(`http ${res.status}`);
  const j = await res.json();
  if (!j || !j.ok || typeof j.md !== "string" || !j.md.trim())
    throw new Error("empty article");
  return { md: j.md, avatar: j.avatar || null, author: j.author || null };
}

async function fetchArticleViaJina(link, signal) {
  const res = await fetch(
    `${JINA}${link}?target_selector=.postArticle-content`,
    { signal },
  );
  if (!res.ok) throw new Error(`http ${res.status}`);
  const value = cleanArticleMarkdown(await res.text());
  if (!value.md) throw new Error("empty article");
  return value;
}

// Фидбек 2026-09: «тянет много мусора в виде ссылок внизу основного текста».
// markdown.new/Jina-дампы подхватывают хвост Medium: «Written by …», «0
// followers», футерные ссылки ([Help][Status][Careers][Privacy]…), био-плашка
// автора. Чистим на клиенте (работает и с прокси, и с Jina-fallback).
const JUNK_TAIL_LINE = /^\[?<?h[1-6]>?written by /i; // «Written by John Elia» (и Jina-вариант с <h2>)
const JUNK_FOOTER_LINK =
  /^\[(?:Help|Status|About|Careers|Press|Blog|Store|Privacy|Rules|Terms|Text to speech|Share|Respond)\]\(https?:\/\/[^)]*(medium\.com|policy\.medium\.com|speechify\.com)[^)]*\)$/i;
const JUNK_FOLLOWERS =
  /^(?:·\s*)?(?:\d+\s+followers?|\[\d+\s+following\]\([^)]*\))\s*$/i;
// publication-навигация Medium («Skill Stuff» и т.п.): ссылкой с HTML-тегом в строке
const JUNK_PUB_NAV = /^\[<h[1-6]>[\s\S]*<\/h[1-6]>\]\(/;
// строки-плашки в начале/конце статьи
const JUNK_PLAQUE =
  /^(?:member-only story|top stories|related stories|more on medium|subscribe to)$/i;
const JUNK_PUB_PROMO = /is your go-to hub for/i;

function stripArticleJunk(md, title) {
  let lines = String(md || "").split("\n");
  // 1) хвост: всё с «Written by …» — вырезаем (после этого строки только чистим)
  const cut = lines.findIndex((l) => JUNK_TAIL_LINE.test(l.trim()));
  if (cut !== -1) lines = lines.slice(0, cut);
  // 2) био-плашка в НАЧАЛЕ: «## Имя» + строка-био (✍️ / «Writing about») +
  //    дубль заголовка статьи (заголовок уже в шапке модалки)
  const first = lines.findIndex((l) => l.trim());
  if (first !== -1) {
    let j = first + 1;
    while (j < lines.length && !lines[j].trim()) j += 1;
    const heading = lines[first].trim();
    const next = lines[j] ? lines[j].trim() : "";
    const isBio =
      /^#{1,2}\s/.test(heading) &&
      (/^✍/.test(next) || /writing about/i.test(next));
    if (isBio) {
      lines[first] = "";
      if (j < lines.length) lines[j] = "";
      // после био может идти сам заголовок статьи — дубль шапки, выкинуть
      let k = j + 1;
      while (k < lines.length && !lines[k].trim()) k += 1;
      if (
        k < lines.length &&
        title &&
        lines[k]
          .trim()
          .replace(/^#+\s*/, "")
          .toLowerCase() === String(title).trim().toLowerCase()
      ) {
        lines[k] = "";
      }
    }
  }
  // 3) одиночные мусорные строки (футер-ссылки Medium, «followers», ✍️-строки,
  //    publication-nav/плашки — «Skill Stuff is your go-to hub…», «Member-only story»)
  lines = lines.map((l) => {
    const s = l.trim();
    if (!s) return l;
    if (JUNK_TAIL_LINE.test(s) || JUNK_FOOTER_LINK.test(s)) return "";
    if (JUNK_FOLLOWERS.test(s)) return "";
    if (JUNK_PUB_NAV.test(s)) return "";
    if (JUNK_PLAQUE.test(s)) return "";
    if (JUNK_PUB_PROMO.test(s)) return "";
    if (/^✍/.test(s)) return "";
    return l;
  });
  return lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Полный текст статьи Medium как markdown-lite (+ аватар/автор). Сбой → null (модалка покажет анонс). */
export async function fetchMediumArticle(
  link,
  title = null,
  timeoutMs = 45000,
) {
  if (articleCache.has(link)) return articleCache.get(link);
  for (const fetcher of [fetchArticleViaProxy, fetchArticleViaJina]) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const value = await fetcher(link, ctrl.signal);
      if (value && value.md) {
        value.md = stripArticleJunk(value.md, title);
        if (value.md) {
          articleCache.set(link, value);
          return value;
        }
      }
    } catch {
      /* дальше по цепочке */
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
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

// M7-аудит: «Прочитать все» — помечаем все ссылки текущего фида прочитанными.
export function markAllLinksSeen(links) {
  try {
    const arr = JSON.parse(localStorage.getItem(SEEN_KEY)) || [];
    let changed = false;
    for (const l of links) {
      if (l && !arr.includes(l)) {
        arr.push(l);
        changed = true;
      }
    }
    if (changed) {
      if (arr.length > SEEN_LIMIT) arr.splice(0, arr.length - SEEN_LIMIT);
      localStorage.setItem(SEEN_KEY, JSON.stringify(arr));
    }
  } catch {
    /* некритично */
  }
}
