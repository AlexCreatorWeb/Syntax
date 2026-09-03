// Vercel serverless — Medium RSS → JSON.
//
// Почему прокси: Medium не отдаёт CORS-заголовки, а публичные rss-шлюзы на
// free-тире (rss2json / allorigins / jina) капризны — дневные лимиты (429),
// 522/таймауты, Cloudflare-челленджи (403). Лента читается ПРЯМО с IP Vercel
// (Medium RSS публичный, без ключа, без дневной квоты) и возвращается parsed JSON.
// Паттерн тот же, что и api/ai.mjs (SSE-прокси) — CORS * + OPTIONS-preflight,
// чтобы DEV-окружение (localhost) ходило сюда кросс-ориджин.
//
// GET /api/medium?tag=<tag>  →  { items: [{title, link, pubDate, description, author}] }
// (формат items совпадает с rss2json — normalizeItem в src/lib/medium.js без изменений)
export const maxDuration = 30;

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");
}

// CDATA + XML-сущности → текст
function decode(s) {
  return String(s || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}

function parseRss(xml) {
  const items = [];
  for (const m of xml.matchAll(/<item>[\s\S]*?<\/item>/g)) {
    const block = m[0];
    const tag = (re) => {
      const x = block.match(re);
      return x ? decode(x[1]) : "";
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
