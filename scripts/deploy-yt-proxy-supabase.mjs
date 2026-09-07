// Деплой Supabase Edge Function «yt-proxy» через Management API.
// Запуск: SUPABASE_PAT=*** node scripts/deploy-yt-proxy-supabase.mjs
// (PAT: supabase.com → Account → Access Tokens → New token, scope любой
//  c правами на проекты; одноразовый — можно удалить после деплоя)
import { readFileSync } from "node:fs";

const REF = "xaslezkoktydranikqnx";
const PAT = process.env.SUPABASE_PAT;
if (!PAT) {
  console.error("SUPABASE_PAT не задан");
  process.exit(1);
}
const body = readFileSync(
  new URL("../supabase/yt-proxy-edge-function.ts", import.meta.url),
  "utf8",
);
const base = `https://api.supabase.com/v1/projects/${REF}`;
const h = {
  authorization: `Bearer ${PAT}`,
  "content-type": "application/json",
};

const show = async (label, r) => {
  const t = await r.text();
  console.log(`${label}: ${r.status}`, t.slice(0, 220).replace(/\n/g, " "));
  return r;
};

// 1) Создание (создание = и деплой)
let r = await show(
  "create",
  await fetch(base + "/functions", {
    method: "POST",
    headers: h,
    body: JSON.stringify({
      name: "yt-proxy",
      body,
      entrypoint_path: "index.ts",
      import_map: false,
      verify_jwt: false, // «Protected = OFF» — браузер берёт стрим без JWT
    }),
  }),
);
// 2) Если уже существовала — обновление + redeploy
if (r.status === 409 || r.status === 400) {
  await show(
    "patch",
    await fetch(base + "/functions/yt-proxy", {
      method: "PATCH",
      headers: h,
      body: JSON.stringify({ body, verify_jwt: false }),
    }),
  );
  await show(
    "deploy",
    await fetch(base + "/functions/yt-proxy/deploy", {
      method: "PUT",
      headers: h,
    }),
  );
}
// 3) Проверка
await new Promise((res) => setTimeout(res, 3000));
const check = await fetch(
  `https://${REF}.supabase.co/functions/v1/yt-proxy?id=NP2NJVfgWm8`,
);
console.log(
  "check:",
  check.status,
  (await check.text()).slice(0, 220).replace(/\n/g, " "),
);
