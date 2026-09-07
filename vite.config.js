import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 2026-09: YouTube-стрим-прокси в DEV. VPS-IP гейтнут YouTube-ом (player API
// = LOGIN_REQUIRED по всем клиентам, embed = Error 153) — manifest/стрим
// должны идти с ЧУСТОГО IP. Источники по очереди (первый ответивший выигрывает):
//   1) SUPABASE Edge Function «yt-proxy» (Fastly-край, чистые IP) —
//      supabase/yt-proxy-edge-function.ts, создается в дашборде (1 вставка).
//   2) PROD Vercel (api/yt-proxy.mjs) — после Redeploy.
// Пока ни одно не развернуто — 404 → фронт показывает карточку
// «Смотреть на YouTube» (штатная деградация).
const PROXIES = [
  "https://xaslezkoktydranikqnx.supabase.co/functions/v1/yt-proxy",
  "https://syntax-sooty.vercel.app/api/yt-proxy",
];
async function ytProxyDev(req, res) {
  const headers = req.headers.range ? { Range: req.headers.range } : {};
  for (const base of PROXIES) {
    try {
      const r = await fetch(`${base}${req.url}`, {
        headers,
        redirect: "follow",
      });
      // 404/410 = функция еще не создана — пробуем следующий
      if (r.status === 404 || r.status === 410) continue;
      res.statusCode = r.status;
      for (const h of [
        "content-type",
        "content-length",
        "content-range",
        "accept-ranges",
      ]) {
        const v = r.headers.get(h);
        if (v) res.setHeader(h, v);
      }
      if (r.body) {
        const { Readable } = await import("node:stream");
        Readable.fromWeb(r.body).pipe(res);
      } else {
        res.end();
      }
      return;
    } catch {
      /* сеть/таймаут — следующий источник */
    }
  }
  // Ни одного источника нет — честный 404 (фронт → карточка со ссылкой)
  res.statusCode = 404;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify({ ok: false, reason: "no-proxy-deployed" }));
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: "yt-proxy-dev",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url && req.url.startsWith("/api/yt-proxy")) {
            try {
              await ytProxyDev(req, res);
              return;
            } catch {
              if (!res.headersSent) res.statusCode = 502;
              res.end();
              return;
            }
          }
          next();
        });
      },
    },
  ],
  server: {
    watch: {
      // Поллинг вместо inotify: watcher не зависит от inode/событий файловой
      // системы и корректно ловит перезаписи файла с заменой (иначе HMR-модуль
      // может «застрять» в пустом состоянии после серии правок)
      usePolling: true,
      interval: 300,
    },
  },
});
