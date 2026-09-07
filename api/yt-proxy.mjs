// Vercel serverless: YouTube-стрим-прокси (2026-09-14).
// Почему: YouTube бот-гате embed-контекст (Error 153) по IP зрителя — на
// datacenter-IP (наш VPS) встроенный плеер не играет. Решение: серверная
// функция берёт у player API прямые URL сегментов/файлов С IP Vercel (там нет
// гейта), а браузер стримит MP4 напрямую из googlevideo (CDN без бот-чека)
// в нативный <video> с нашими контролами.
//
// GET /api/yt-proxy?id=<videoId>            → { ok, url, mimeType, title, lengthSeconds }
// GET /api/yt-proxy?id=<id>&stream=1&range=bytes=0-99 → стрим файла (Range passthrough)
//
// Прогрессивные itag'и (22 = 720p, 18 = 360p, video+audio в одном файле).
// Если у видео только adaptive (DASH) — ок:false (frontend покажет карточку
// «Смотреть на YouTube»). Кэш манифеста 5 мин (Range-перемотки не бьют по API).
//
// ИТОГОВАЯ ФУНКЦИЯ САМОДОСТАТОЧНА (кросс-папный import из ../src ломает
// Vercel-функцию — ловушка из api/ai.mjs).

const WEB_KEY = "AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w"; // публичный web-API key
const manifestCache = new Map(); // id -> { at, entry, title, lengthSeconds }
const CACHE_TTL_MS = 5 * 60 * 1000;

async function playerManifest(videoId) {
  const hit = manifestCache.get(videoId);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit;
  const r = await fetch(
    `https://www.youtube.com/youtubei/v1/player?key=${WEB_KEY}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        context: {
          client: { clientName: "WEB", clientVersion: "2.20240701.00.00" },
        },
        videoId,
        playerParams: "CgIIABAB",
      }),
    },
  );
  if (!r.ok) return { ok: false, reason: `player-api-${r.status}` };
  const j = await r.json();
  const status = j?.playabilityStatus?.status;
  if (status !== "OK") {
    // LOGIN_REQUIRED = Vercel-IP тоже под гейтом (тогда весь прокси бесполезен)
    return { ok: false, reason: `playability-${status}` };
  }
  const formats = j?.streamingData?.formats || [];
  // Предпочитаем 22 (720p), фолбэк 18 (360p)
  const entry =
    formats.find((f) => Number(f.itag) === 22) ||
    formats.find((f) => Number(f.itag) === 18);
  if (!entry) return { ok: false, reason: "no-progressive" };
  const rec = {
    at: Date.now(),
    entry,
    title: j?.videoDetails?.title || "",
    lengthSeconds: Number(j?.videoDetails?.lengthSeconds) || 0,
  };
  manifestCache.set(videoId, rec);
  return { ok: true, ...rec };
}

export default async function handler(req, res) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!/^[A-Za-z0-9_-]{6,20}$/.test(id || "")) {
      return res.status(400).json({ ok: false, reason: "bad-id" });
    }
    const m = await playerManifest(id);
    if (!m.ok) return res.status(502).json({ ok: false, reason: m.reason });

    // 1) Манифест: ссылка на файл + метаданные
    if (url.searchParams.get("stream") !== "1") {
      return res.status(200).json({
        ok: true,
        url: `/api/yt-proxy?id=${id}&stream=1`,
        mimeType: m.entry.mimeType || "video/mp4",
        bitrate: Number(m.entry.bitrate) || 0,
        title: m.title,
        lengthSeconds: m.lengthSeconds,
      });
    }

    // 2) Стрим с Range passthrough (перемотка = новые Range-запросы)
    const range = req.headers.range || "";
    const up = await fetch(m.entry.url, {
      headers: range ? { Range: range } : {},
    });
    if (!up.ok && up.status !== 206) {
      return res.status(502).json({ ok: false, reason: `stream-${up.status}` });
    }
    const headers = {
      "content-type": m.entry.mimeType || "video/mp4",
      "accept-ranges": "bytes",
      "cache-control": "no-store",
    };
    if (up.headers.get("content-length"))
      headers["content-length"] = up.headers.get("content-length");
    if (up.headers.get("content-range"))
      headers["content-range"] = up.headers.get("content-range");
    res.status(up.status === 206 ? 206 : 200);
    for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
    res.end();
    if (up.body) {
      const { Readable } = await import("stream");
      Readable.fromWeb(up.body).pipe(res);
    }
    return res;
  } catch (e) {
    // Сеть/googlevideo/API упали — чистая ошибка прокси (frontend → карточка)
    if (!res.headersSent)
      res.status(502).json({ ok: false, reason: String(e?.message || e) });
    return res;
  }
}
