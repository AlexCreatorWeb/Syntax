// Vercel serverless — Medium RSS → JSON + ПОЛНАЯ СТАТЬЯ Medium → markdown-lite.
//
// Почему прокси: Medium не отдаёт CORS-заголовки, а публичные rss-шлюзы на
// free-тире (rss2json / allorigins / jina) капризны — дневные лимиты (429),
// 522/таймауты, Cloudflare-челленджи (403). Лента читается ПРЯМО с IP Vercel
// (Medium RSS публичный, без ключа, без дневной квоты) и возвращается parsed JSON.
// Паттерн тот же, что и api/ai.mjs (SSE-прокси) — CORS * + OPTIONS-preflight,
// чтобы DEV-окружение (localhost) ходило сюда кросс-ориджин.
//
// GET /api/medium?tag=<tag>     → { items: [{title, link, pubDate, description, author}] }
// (формат items совпадает с rss2json — normalizeItem в src/lib/medium.js без изменений)
//
// GET /api/medium?article=<medium-url> → { ok: true, md, author, avatar, pubDate }
// ПОЛНАЯ статья как markdown-lite (контракт уроков платформы: ##/###, **жирный**,
// *курсив*, `код`, ```-фенсы, ![img](src), [ссылка](url), списки — строки «• »).
// Цепочка: (1) страница Medium напрямую с IP Vercel → парсим #post-content-container;
// (2) markdown.new (Jina-рендер, серверно — из браузера недоступен: нет CORS,
// а прямой r.jina.ai закрыт CF-челленджем на 403). Сбой → { ok: false } → клиент
// пробует Jina напрямую и падает на анонс (NewsModal).
export const maxDuration = 45;

const BROWSER_UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");
}

// ------------------- общие утилиты -------------------

// CDATA + HTML/XML-сущности → текст (включая численные &#NNN; / &#xNNN;)
function decodeEntities(s) {
  return String(s || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => safeChr(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => safeChr(parseInt(d, 10)));
}
function safeChr(n) {
  try {
    return Number.isFinite(n) && n > 0 ? String.fromCodePoint(n) : "";
  } catch {
    return "";
  }
}
// decodeEntities без численных (для attr-значений — &#39; = ' и хватит)
function decodeAttr(s) {
  return decodeEntities(s).trim();
}
function stripTags(s) {
  return String(s || "").replace(/<[^>]+>/g, "");
}

// ------------------- RSS (без изменений) -------------------

function parseRss(xml) {
  const items = [];
  for (const m of xml.matchAll(/<item>[\s\S]*?<\/item>/g)) {
    const block = m[0];
    const tag = (re) => {
      const x = block.match(re);
      return x ? decodeEntities(x[1]) : "";
    };
    const title = tag(/<title>([\s\S]*?)<\/title>/);
    const link = tag(/<link>([\s\S]*?)<\/link>/);
    if (!link || !title) continue;
    items.push({
      title,
      link,
      pubDate: tag(/<pubDate>([\s\S]*?)<\/pubDate>/),
      description: tag(/<description>([\s\S]*?)<\/description>/),
      author:
        tag(/<dc:creator>([\s\S]*?)<\/dc:creator>/) ||
        tag(/<author>([\s\S]*?)<\/author>/),
    });
  }
  return items;
}

// ------------------- Статья → markdown-lite -------------------

// Инлайн-HTML → markdown-lite: ссылки, жирный/курсив, инлайн-код, остальное — текст
function inlineToMd(html) {
  let s = String(html);
  s = s.replace(/<br\s*\/?>/gi, " ");
  s = s.replace(
    /<a[^>]*\bhref="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,
    (m, href, text) => {
      const t = decodeEntities(stripTags(text)).trim();
      if (!t) return "";
      return `[${t.replace(/\]\(/g, ")(")}](${href})`;
    },
  );
  s = s.replace(
    /<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi,
    (m, tag, x) => `**${decodeEntities(stripTags(x)).trim()}**`,
  );
  s = s.replace(
    /<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi,
    (m, tag, x) => `*${decodeEntities(stripTags(x)).trim()}*`,
  );
  s = s.replace(
    /<code[^>]*>([\s\S]*?)<\/code>/gi,
    (m, x) => `\`${decodeEntities(stripTags(x))}\``,
  );
  s = stripTags(s);
  s = decodeEntities(s);
  return s.replace(/\s+/g, " ").trim();
}

// <img> в figure → канонический URL картинки (Medium: src / data-src / data-photo-hash)
function imgSrc(figureHtml) {
  const img = figureHtml.match(/<img[^>]*>/i);
  if (!img) return null;
  const tag = img[0];
  const attr = (re) => {
    const m = tag.match(re);
    return m ? m[1] : null;
  };
  let src = attr(/\bdata-src="([^"]+)"/) || attr(/\bsrc="([^"]+)"/);
  if (src && /^https?:/i.test(src)) return src;
  const hash = attr(/\bdata-photo-hash="([^"]+)"/);
  if (hash) return `https://cdn-images-1.medium.com/max/2000/1${hash}`;
  return src || null;
}

// Одна section-content секция Medium → markdown-lite блок (или null)
function sectionToMd(sec) {
  sec = sec.trim();
  if (!sec) return null;
  const head = sec.slice(0, 80);

  if (/^<pre[\s>]/.test(head)) {
    const langM = sec.match(/data-lang="([a-z0-9+#-]+)"/i);
    const codeM =
      sec.match(/<code[^>]*>([\s\S]*?)<\/code>/) ||
      sec.match(/<pre[^>]*>([\s\S]*?)<\/pre>/);
    const code = decodeEntities(stripTags(codeM ? codeM[1] : sec))
      .replace(/\u00a0/g, " ")
      .replace(/\n+$/, "")
      .trim();
    if (!code) return null;
    return "```" + (langM ? langM[1] : "") + "\n" + code + "\n```";
  }

  if (/^<figure[\s>]/.test(head)) {
    const src = imgSrc(sec);
    if (!src) return null;
    const altM = sec.match(/<img[^>]*\balt="([^"]*)"/);
    const alt = altM && altM[1] ? decodeAttr(altM[1]).replace(/"/g, "'") : "";
    return `![${alt}](${src})`;
  }

  const hM = head.match(/^<(h[1-4])[\s>]/i);
  if (hM) {
    const txt = inlineToMd(sec.replace(/<\/?h[1-4][^>]*>/gi, ""));
    if (!txt) return null;
    // Medium: подзаголовок статьи = <h2>; h3 — реже. h1/h4 сворачиваем в ##
    const level = hM[1].toLowerCase() === "h3" ? 3 : 2;
    return `${"#".repeat(level)} ${txt}`;
  }

  if (/^<blockquote[\s>]/.test(head)) {
    const txt = inlineToMd(sec);
    return txt || null;
  }

  if (/^<(ul|ol)[\s>]/.test(head)) {
    const isOl = /^<ol/.test(head);
    const items = [];
    const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    let li;
    let n = 1;
    while ((li = liRe.exec(sec))) {
      const txt = inlineToMd(li[1]);
      if (!txt) continue;
      items.push(isOl ? `${n}. ${txt}` : `• ${txt}`);
      n += 1;
    }
    return items.length ? items.join("\n\n") : null;
  }

  // Текстовая секция: один или несколько <p> (контракт: абзацы через пустую строку)
  const paras = [];
  const pRe = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let pm;
  while ((pm = pRe.exec(sec))) {
    const txt = inlineToMd(pm[1]);
    if (txt) paras.push(txt);
  }
  if (!paras.length) {
    const txt = inlineToMd(sec);
    if (txt) paras.push(txt);
  }
  return paras.length ? paras.join("\n\n") : null;
}

// #post-content-container → извлечение (balanced-div scan: HTML Medium сформирован)
function extractPostContent(html) {
  const startRe = /<div[^>]*id="post-content-container"[^>]*>/i;
  const m = startRe.exec(html);
  if (!m) return null;
  const i = m.index + m[0].length;
  let depth = 1;
  const divRe = /<div\b|<\/div>/gi;
  divRe.lastIndex = i;
  let dm;
  let end = -1;
  while ((dm = divRe.exec(html))) {
    if (dm[0].startsWith("</")) depth -= 1;
    else depth += 1;
    if (depth === 0) {
      end = dm.index;
      break;
    }
  }
  if (end <= 0) return null;
  return html.slice(i, end).replace(/<!--[\s\S]*?-->/g, "");
}

// Секции section-content (систерны, не вложены) → массив тел
function splitSections(content) {
  const re = /<div[^>]*class="[^"]*section-content[^"]*"[^>]*>/gi;
  const opens = [];
  let m;
  while ((m = re.exec(content))) opens.push(m.index + m[0].length);
  if (!opens.length) return [content];
  const out = [];
  for (let i = 0; i < opens.length; i++) {
    const end =
      i + 1 < opens.length
        ? re_exec_next(content, re, opens[i])
        : content.length;
    let body = content.slice(opens[i], end);
    // Хвост = свой </div> + мусор до следующей секции: режем после ПОСЛЕДНЕГО </div>
    const lastClose = body.lastIndexOf("</div>");
    if (lastClose > 0) body = body.slice(0, lastClose);
    out.push(body);
  }
  return out;
}
function re_exec_next(content, re, after) {
  re.lastIndex = after;
  const m = re.exec(content);
  return m ? m.index : content.length;
}

function parseMediumArticle(html) {
  const content = extractPostContent(html);
  if (!content) return null;
  const blocks = splitSections(content)
    .map((sec) => sectionToMd(sec.replace(/<\/div>[\s\S]*$/, "")))
    .filter(Boolean);
  const md = blocks
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!md) return null;
  const meta = (re) => {
    const m = html.match(re);
    return m ? decodeAttr(m[1]) : null;
  };
  return {
    md,
    author:
      meta(/<meta[^>]*\bname="author"[^>]*\bcontent="([^"]*)"/) ||
      meta(/<meta[^>]*\bcontent="([^"]*)"[^>]*\bname="author"/),
    pubDate: meta(
      /<meta[^>]*\bproperty="article:published_time"[^>]*\bcontent="([^"]*)"/,
    ),
    avatar: extractAvatar(html),
  };
}

function extractAvatar(html) {
  const patterns = [
    /<img[^>]*class="[^"]*[Aa]vatar[^"]*"[^>]*\b(?:data-src|src)="([^"]+)"/,
    /<div[^>]*class="[^"]*[Aa]vatar[^"]*"[^>]*>[\s\S]{0,600}?<(?:img|a)[^>]*\b(?:data-src|src)="(https?:[^"]+)"/,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m && /^https?:/i.test(m[1])) return m[1];
  }
  return null;
}

// ------------------- markdown.new (fallback, серверно) -------------------
// r.jina.ai-формат: «Title: … / URL Source: … / Markdown Content: …». Страница ЦЕЛИКОМ
// (без target_selector) → вырезаем фронтматтер, Medium-навигацию и TOC-список.
const MNEW_JUNK = [
  /^\[?(Sitemap|Open in app|Sign up|Sign in|Medium Logo Homepage|Get app|Write|Search)\b/i,
  /^just now$/i,
  /^\d+\s*min read$/i,
  /^press enter or click to view image in full size$/i,
  /^-{2,}$/i,
  // тег-чипы Medium-шапки: [React](medium.com/tag/react?source=post_page…)
  /^\[[^\]]+\]\(https?:\/\/[^)]*medium\.com\/tag\//i,
];
function markdownNewToMd(src) {
  const marker = "Markdown Content:";
  let body = src.includes(marker)
    ? src.slice(src.indexOf(marker) + marker.length)
    : src;
  // YAML-фронтматтер сразу после маркера
  body = body.replace(/^\s*---[\s\S]*?\n---\s*\n?/, "");
  const out = [];
  let first = true; // первый заголовок уровня 1 = дубль тайтла статьи (у модалки свой заголовок)
  for (const raw of body.split("\n")) {
    let line = raw.trim();
    if (!line) {
      if (out[out.length - 1] !== "") out.push("");
      continue;
    }
    if (MNEW_JUNK.some((re) => re.test(line))) continue;
    // TOC Medium: нумерованный список ссылок на якоря post_page (до первого заголовка)
    if (/^\d+\.\s+\[[^\]]*\]\([^)]*post_page[^)]*\)/.test(line)) continue;
    if (/^\??\[[^\]]*\]\([^)]*post_page[^)]*#[^)]*\)$/.test(line)) continue;
    // Byline-мусор: аватар (пустая ссылка), автор (byline-линк), «·», Listen
    if (/^\[\]\(/.test(line)) continue;
    if (/^·$/.test(line)) continue;
    if (/^\[[^\]]*\]\([^)]*post_page---byline--/.test(line)) continue;
    if (/^\[Listen\]\(/.test(line)) continue;
    if (first && /^#(?!#)\s/.test(line)) {
      first = false;
      continue;
    }
    out.push(line);
  }
  return out
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ------------------- handler -------------------

async function handleArticle(res, article) {
  // 1) Страница Medium напрямую (IP Vercel проходит CF; UA — браузер)
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    const up = await fetch(article, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": BROWSER_UA,
        accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timer);
    const html = up.ok ? await up.text() : "";
    const parsed = html ? parseMediumArticle(html) : null;
    if (parsed) {
      res.setHeader(
        "Cache-Control",
        "s-maxage=3600, stale-while-revalidate=86400",
      );
      res.status(200).json({ ok: true, ...parsed });
      return;
    }
  } catch {
    /* дальше по цепочке */
  }
  // 2) markdown.new (Jina-рендер; из браузера недоступен — нет CORS)
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 40000);
    const up = await fetch(`https://markdown.new/${article}`, {
      signal: ctrl.signal,
      headers: { "User-Agent": BROWSER_UA },
    });
    clearTimeout(timer);
    const md = up.ok ? markdownNewToMd(await up.text()) : "";
    if (md) {
      res.setHeader(
        "Cache-Control",
        "s-maxage=3600, stale-while-revalidate=86400",
      );
      res
        .status(200)
        .json({ ok: true, md, author: null, avatar: null, pubDate: null });
      return;
    }
  } catch {
    /* клиенту — фолбэк на анонс */
  }
  res.status(502).json({ ok: false });
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "GET") {
    res.status(405).json({ error: "GET only" });
    return;
  }

  // --- article ---
  const article = String((req.query && req.query.article) || "");
  if (article) {
    if (!/^https:\/\/([a-z0-9-]+\.)*medium\.com\//i.test(article)) {
      res.status(400).json({ ok: false, error: "medium url is required" });
      return;
    }
    await handleArticle(res, article);
    return;
  }

  // --- RSS feed ---
  const tag = String((req.query && req.query.tag) || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
  if (!tag) {
    res.status(400).json({ error: "tag is required" });
    return;
  }
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    const up = await fetch(`https://medium.com/feed/tag/${tag}`, {
      signal: ctrl.signal,
      headers: { "User-Agent": "Syntax-News/1.0" },
    });
    clearTimeout(timer);
    if (!up.ok) {
      res.status(up.status).json({ error: `upstream ${up.status}`, items: [] });
      return;
    }
    const items = parseRss(await up.text());
    // Короткий edge-кэш: один запрос к Medium на ~10 мин на тег (лента живая, а не кэш на 2ч)
    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=1800");
    res.status(200).json({ items });
  } catch (e) {
    res.status(502).json({ error: `fetch failed: ${e.message}`, items: [] });
  }
}
