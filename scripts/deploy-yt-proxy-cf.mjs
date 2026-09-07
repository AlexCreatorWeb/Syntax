// Деплой Cloudflare Worker «yt-proxy».
// Запуск: CF_API_TOKEN=*** CF_ACCOUNT_ID=... node scripts/deploy-yt-proxy-cf.mjs
// Токен: cloudflare.com → аватар → My Profile → API Tokens → Create Token
//        → шаблон «Edit Cloudflare Workers» (Workers: Edit) → Copy.
// Account ID: cloudflare.com → Overview (справа сверху, 32 hex).
// Результат: https://yt-proxy.<subdomain>.workers.dev — вписать в
// vite.config.js (PROXIES[0]) после деплоя.
import { readFileSync } from "node:fs";

const TOKEN = process.env.CF_API_TOKEN;
const ACCT = process.env.CF_ACCOUNT_ID;
if (!TOKEN || !ACCT) {
  console.error("Нужны CF_API_TOKEN и CF_ACCOUNT_ID");
  process.exit(1);
}
const script = readFileSync(
  new URL("../workers/yt-proxy.js", import.meta.url),
  "utf8",
);
const base = `https://api.cloudflare.com/client/v4/accounts/${ACCT}`;
const h = { authorization: `Bearer ${TOKEN}` };
const name = "yt-proxy";

// 1) Загрузка скрипта (новый CF API: /upload)
const form1 = new URLSearchParams();
form1.set("script", script);
form1.set("metadata", JSON.stringify({ placements: [] }));
let r = await fetch(`${base}/workers/scripts/${name}/upload`, {
  method: "POST",
  headers: { ...h, "content-type": "application/x-www-form-urlencoded" },
  body: form1,
});
console.log("upload:", r.status, (await r.text()).slice(0, 200));

// 2) Публикация (placements: [] = глобально)
const form2 = new URLSearchParams();
form2.set("metadata", JSON.stringify({ placements: [] }));
r = await fetch(`${base}/workers/scripts/${name}/deployments`, {
  method: "POST",
  headers: { ...h, "content-type": "application/x-www-form-urlencoded" },
  body: form2,
});
console.log("deploy:", r.status, (await r.text()).slice(0, 200));

// 3) workers.dev-сабдомен: если нет — закрепляем (PUT)
r = await fetch(`${base}/workers/subdomain`, { method: "GET", headers: h });
let sub = await r.json();
let sd = sub?.result;
if (!sd) {
  const wanted = `syntax-learn-${Math.random().toString(36).slice(2, 7)}`;
  r = await fetch(`${base}/workers/subdomain`, {
    method: "PUT",
    headers: { ...h, "content-type": "application/json" },
    body: JSON.stringify({ subdomain: wanted }),
  });
  sub = await r.json();
  sd = sub?.result;
  console.log(
    "claim:",
    r.status,
    JSON.stringify(sd ?? sub?.errors).slice(0, 150),
  );
}
if (sd) {
  const url = `https://${name}.${sd}.workers.dev`;
  console.log("WORKER_URL:", url);
  // 4) Смоук-чек
  await new Promise((res) => setTimeout(res, 4000));
  const c = await fetch(`${url}?id=NP2NJVfgWm8`);
  console.log("check:", c.status, (await c.text()).slice(0, 240));
}
