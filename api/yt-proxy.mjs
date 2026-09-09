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

// 2026-09: Vercel-IP тоже под YT-гейтом (WEB = LOGIN_REQUIRED) — пробуем
// несколько клиентских контекстов: ANDROID/IOS часто проходят WEB-гейт
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
const manifestCache = new Map(); // id -> { at, until, entry, title, lengthSeconds, client }
const CACHE_TTL_MS = 5 * 60 * 1000; // фолбэк, если в URL нет параметра expire

// Подписанный googlevideo-URL живёт до параметра `expire` (обычно ~6ч) и
// работает с любого IP (гейтится только player API, не CDN) — кэш манифеста
// держим до истечения URL (с запасом 60с), а не 5 минут: повторные просмотры
// не бьют по player API вовсе.
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
    } catch (e) {
      reasons.push(`err@${c.name}`);
    }
  }
  return { ok: false, reason: reasons.join("|") || "no-client-answered" };
}

export default async function handler(req, res) {
  try {
    // Node: req.url — относительный путь, new URL() требует базу (в браузере
    // без базы ок — поэтому локальный unit-тест проходил)
    const url = new URL(req.url, "http://localhost");
    const id = url.searchParams.get("id");
    if (!/^[A-Za-z0-9_-]{6,20}$/.test(id || "")) {
      return res.status(400).json({ ok: false, reason: "bad-id" });
    }
    const m = await playerManifest(id);
    if (!m.ok) return res.status(502).json({ ok: false, reason: m.reason });

    // 1) Манифест: ссылка на файл + метаданные. directUrl — подписанный
    // googlevideo-URL для ПРЯМОГО воспроизведения браузером (CDN без бот-чека;
    // без 60с-лимитов serverless-стрима); expiresAt — момент истечения
    // подписи (миллисекунды). url (прокси-стрим) остаётся фолбэком.
    if (url.searchParams.get("stream") !== "1") {
      return res.status(200).json({
        ok: true,
        url: `/api/yt-proxy?id=${id}&stream=1`,
        directUrl: m.entry.url,
        expiresAt: urlExpiresMs(m.entry.url),
        mimeType: m.entry.mimeType || "video/mp4",
        bitrate: Number(m.entry.bitrate) || 0,
        title: m.title,
        lengthSeconds: m.lengthSeconds,
        client: m.client,
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
