// ============================================================
// Supabase Edge Function: yt-proxy
// Зеркало api/yt-proxy.mjs (Vercel) для случаев, когда Vercel
// не задеплоен: Fastly-край Supabase — чистые IP, YouTube-гейта нет.
//
// РАЗВЁРТЫВАНИЕ (2 минуты):
// 1. supabase.com → ваш проект (xaslezkoktydranikqnx) →
//    Functions → New Function
// 2. Name: yt-proxy  (тип: Edge Function, runtime Deno — по умолчанию)
// 3. Вставить ВСЁ это содержимое в редактор → Deploy
// 4. Settings функции: «Protected» = OFF (иначе браузер не достанет стрим
//    без JWT)
//
// После этого dev-локалка (vite-мидлвар) сама подхватит её (первый в
// списке источников) — реальные видео уроков без Vercel.
// Чек: curl "https://xaslezkoktydranikqnx.supabase.co/functions/v1/yt-proxy?id=NP2NJVfgWm8"
// → {"ok":true,...}
// ============================================================

// (paste-файл для Supabase-дашборда; Deno-тайпинг тут не нужен)
// @ts-nocheck
const WEB_KEY = "AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w"; // публичный web-API key
const manifestCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;
// Allowlist исходящих стрим-URL (SSRF-гвард: только YouTube-CDN)
const STREAM_HOSTS = ["googlevideo.com", "youtube.com", "ytimg.com"];

async function playerManifest(videoId: string) {
  const hit = manifestCache.get(videoId);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit;
  const r = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${WEB_KEY}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      context: { client: { clientName: "WEB", clientVersion: "2.20240701.00.00" } },
      videoId,
      playerParams: "CgIIABAB",
    }),
  });
  if (!r.ok) return { ok: false, reason: `player-api-${r.status}` };
  const j = await r.json();
  const status = j?.playabilityStatus?.status;
  if (status !== "OK") return { ok: false, reason: `playability-${status}` };
  const formats: any[] = j?.streamingData?.formats || [];
  // Прогрессивные itag'и: 22 = 720p, 18 = 360p (video+audio в одном mp4)
  const entry =
    formats.find((f) => Number(f.itag) === 22) || formats.find((f) => Number(f.itag) === 18);
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

Deno.serve(async (req: Request) => {
  const cors = {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "*",
  };
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id") || "";
    if (!/^[A-Za-z0-9_-]{6,20}$/.test(id)) {
      return Response.json({ ok: false, reason: "bad-id" }, { status: 400, headers: cors });
    }
    const m = await playerManifest(id);
    if (!m.ok) {
      return Response.json({ ok: false, reason: m.reason }, { status: 502, headers: cors });
    }
    // Манифест: абсолютный стрим-URL (работает и напрямую, и через vite-мидлвар)
    if (url.searchParams.get("stream") !== "1") {
      const streamUrl = `${url.origin}${url.pathname}?id=${id}&stream=1`;
      return Response.json(
        {
          ok: true,
          url: streamUrl,
          mimeType: m.entry.mimeType || "video/mp4",
          title: m.title,
          lengthSeconds: m.lengthSeconds,
        },
        { headers: cors },
      );
    }
    // Стрим с Range passthrough (перемотка = новые Range-запросы).
    // SSRF-гвард: URL приходит из streamingData YouTube — только их хосты
    const streamUrl = new URL(m.entry.url);
    if (!STREAM_HOSTS.some((h) => streamUrl.hostname === h || streamUrl.hostname.endsWith(`.${h}`))) {
      return Response.json({ ok: false, reason: "stream-host-not-allowed" }, { status: 502, headers: cors });
    }
    const range = req.headers.get("range") || "";
    const up = await fetch(streamUrl, { headers: range ? { Range: range } : {} });
    if (!up.ok && up.status !== 206) {
      return Response.json({ ok: false, reason: `stream-${up.status}` }, { status: 502, headers: cors });
    }
    return new Response(up.body, {
      status: up.status === 206 ? 206 : 200,
      headers: {
        ...cors,
        "content-type": m.entry.mimeType || "video/mp4",
        "accept-ranges": "bytes",
        "cache-control": "no-store",
        "content-length": up.headers.get("content-length") || "",
        "content-range": up.headers.get("content-range") || "",
      },
    });
  } catch (e) {
    return Response.json({ ok: false, reason: String((e && e.message) || e) }, { status: 502, headers: cors });
  }
});
