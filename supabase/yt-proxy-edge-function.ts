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
// Мульти-клиентский fallback: WEB-гейт (LOGIN_REQUIRED по datacenter-IP)
// часто обходят ANDROID/IOS-контексты. Первичный клиент в логе — client.
const CLIENTS = [
  {
    name: "web",
    key: "AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w",
    body: {
      context: { client: { clientName: "WEB", clientVersion: "2.20240701.00.00" } },
      playerParams: "CgIIABAB",
    },
  },
  {
    name: "mweb",
    key: "AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w",
    body: {
      context: { client: { clientName: "MWEB", clientVersion: "2.20240101.00.00" } },
      playerParams: "CgIIABAB",
    },
  },
  {
    name: "android",
    key: "AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w",
    body: {
      context: {
        client: { clientName: "ANDROID", clientVersion: "19.09.37", androidSdkVersion: 30 },
        thirdParty: { integrationId: "web" },
      },
      playerParams: "CgIIABAB",
    },
  },
  {
    name: "ios",
    key: "AIzaSyB-63vPrdThhKuerbB2Nl7NKczjhdaCy2c",
    body: {
      context: {
        client: {
          clientName: "IOS",
          clientVersion: "19.09.1",
          deviceMake: "Apple",
          deviceModel: "iPhone14,5",
          osName: "iPhone",
          osVersion: "17.5.1.21F90",
        },
        thirdParty: { integrationId: "web" },
      },
    },
  },
];
const manifestCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;
// Allowlist исходящих стрим-URL (SSRF-гвард: только YouTube-CDN)
const STREAM_HOSTS = ["googlevideo.com", "youtube.com", "ytimg.com"];

async function playerManifest(videoId: string) {
  const hit = manifestCache.get(videoId);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit;
  let lastReason = "no-client-answered";
  for (const c of CLIENTS) {
    try {
      const r = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${c.key}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...c.body, videoId }),
      });
      if (!r.ok) {
        lastReason = `player-api-${r.status}@${c.name}`;
        continue;
      }
      const j = await r.json();
      const status = j?.playabilityStatus?.status;
      if (status !== "OK") {
        lastReason = `playability-${status}@${c.name}`;
        continue;
      }
      const formats: any[] = j?.streamingData?.formats || [];
      const entry =
        formats.find((f) => Number(f.itag) === 22) ||
        formats.find((f) => Number(f.itag) === 18);
      if (!entry) {
        lastReason = `no-progressive@${c.name}`;
        continue;
      }
      const rec = {
        at: Date.now(),
        entry,
        client: c.name,
        title: j?.videoDetails?.title || "",
        lengthSeconds: Number(j?.videoDetails?.lengthSeconds) || 0,
      };
      manifestCache.set(videoId, rec);
      return { ok: true, ...rec };
    } catch (e) {
      lastReason = `fetch-${String((e && e.message) || e).slice(0, 30)}@${c.name}`;
    }
  }
  return { ok: false, reason: lastReason };
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
      return Response.json(
        { ok: false, reason: "bad-id" },
        { status: 400, headers: cors },
      );
    }
    const m = await playerManifest(id);
    if (!m.ok) {
      return Response.json(
        { ok: false, reason: m.reason },
        { status: 502, headers: cors },
      );
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
          client: m.client,
          lengthSeconds: m.lengthSeconds,
        },
        { headers: cors },
      );
    }
    // Стрим с Range passthrough (перемотка = новые Range-запросы).
    // SSRF-гвард: URL приходит из streamingData YouTube — только их хосты
    const streamUrl = new URL(m.entry.url);
    if (
      !STREAM_HOSTS.some(
        (h) => streamUrl.hostname === h || streamUrl.hostname.endsWith(`.${h}`),
      )
    ) {
      return Response.json(
        { ok: false, reason: "stream-host-not-allowed" },
        { status: 502, headers: cors },
      );
    }
    const range = req.headers.get("range") || "";
    const up = await fetch(streamUrl, {
      headers: range ? { Range: range } : {},
    });
    if (!up.ok && up.status !== 206) {
      return Response.json(
        { ok: false, reason: `stream-${up.status}` },
        { status: 502, headers: cors },
      );
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
    return Response.json(
      { ok: false, reason: String((e && e.message) || e) },
      { status: 502, headers: cors },
    );
  }
});
