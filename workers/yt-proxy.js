// Cloudflare Worker: yt-proxy
// Третья (CF-вариант) копия стрим-прокси: VPS-IP, Vercel-IP и Fastly-IP
// (Supabase) все под YouTube-гейтом (LOGIN_REQUIRED «подтвердите, что не
// бот»). CF egress-IP статистически чище (yt-dlp-сообщество).
// Web API (fetch/Response) — без Node/Deno-специфики.
// Деплой: scripts/deploy-yt-proxy-cf.mjs (CF_API_TOKEN + CF_ACCOUNT_ID).

const CLIENTS = [
  {
    name: "web",
    key: "AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w",
    body: {
      context: {
        client: { clientName: "WEB", clientVersion: "2.20240701.00.00" },
      },
      playerParams: "CgIIABAB",
    },
  },
  {
    name: "mweb",
    key: "AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w",
    body: {
      context: {
        client: { clientName: "MWEB", clientVersion: "2.20240101.00.00" },
      },
      playerParams: "CgIIABAB",
    },
  },
  {
    name: "android",
    key: "AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w",
    body: {
      context: {
        client: {
          clientName: "ANDROID",
          clientVersion: "20.10.38",
          androidSdkVersion: 33,
          deviceBrand: "google",
          deviceModel: "Pixel 7",
        },
        thirdParty: { integrationId: "web" },
      },
      playerParams: "CgIIABAB",
    },
  },
];

const manifestCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // фолбэк, если в URL нет параметра expire
const STREAM_HOSTS = ["googlevideo.com", "youtube.com", "ytimg.com"];

// Подписанный googlevideo-URL живёт до `expire` (~6ч) и работает с любого IP
// (гейтится только player API, не CDN) — кэш до истечения URL, не 5 минут.
function urlExpiresMs(u) {
  try {
    const p = new URL(u).searchParams.get("expire");
    const t = p ? Number(p) * 1000 : 0;
    return t > Date.now()
      ? Math.min(t - 60_000, Date.now() + 6 * 3600 * 1000)
      : 0;
  } catch {
    return 0;
  }
}

async function playerManifest(videoId) {
  const hit = manifestCache.get(videoId);
  if (hit && Date.now() < (hit.until || 0)) return hit;
  const reasons = [];
  for (const c of CLIENTS) {
    try {
      const r = await fetch(
        `https://www.youtube.com/youtubei/v1/player?key=${c.key}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...c.body, videoId }),
        },
      );
      if (!r.ok) {
        reasons.push(`api${r.status}@${c.name}`);
        continue;
      }
      const j = await r.json();
      const status = j?.playabilityStatus?.status;
      if (status !== "OK") {
        reasons.push(`${status}@${c.name}`);
        continue;
      }
      const formats = j?.streamingData?.formats || [];
      const entry =
        formats.find((f) => Number(f.itag) === 22) ||
        formats.find((f) => Number(f.itag) === 18);
      if (!entry) {
        reasons.push(`no-prog@${c.name}`);
        continue;
      }
      const rec = {
        at: Date.now(),
        until: urlExpiresMs(entry.url) || Date.now() + CACHE_TTL_MS,
        entry,
        client: c.name,
        title: j?.videoDetails?.title || "",
        lengthSeconds: Number(j?.videoDetails?.lengthSeconds) || 0,
      };
      manifestCache.set(videoId, rec);
      return { ok: true, ...rec };
    } catch {
      reasons.push(`err@${c.name}`);
    }
  }
  return { ok: false, reason: reasons.join("|") || "no-client-answered" };
}

export default {
  async fetch(req) {
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
      if (url.searchParams.get("stream") !== "1") {
        return Response.json(
          {
            ok: true,
            url: `${url.origin}${url.pathname}?id=${id}&stream=1`,
            directUrl: m.entry.url,
            expiresAt: urlExpiresMs(m.entry.url),
            mimeType: m.entry.mimeType || "video/mp4",
            title: m.title,
            client: m.client,
            lengthSeconds: m.lengthSeconds,
          },
          { headers: cors },
        );
      }
      // Стрим с Range passthrough; SSRF-гвард — только YouTube-CDN
      const streamUrl = new URL(m.entry.url);
      if (
        !STREAM_HOSTS.some(
          (h) =>
            streamUrl.hostname === h || streamUrl.hostname.endsWith(`.${h}`),
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
    } catch (err) {
      return Response.json(
        { ok: false, reason: String((err && err.message) || err) },
        { status: 502, headers: cors },
      );
    }
  },
};
