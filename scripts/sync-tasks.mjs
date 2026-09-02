#!/usr/bin/env node
// sync:tasks — зеркало каталога задач (src/content/tasks/*.json) в Supabase-таблицу `tasks`.
// Запуск: npm run sync:tasks (или DRY=1 — только проверка без записи).
// Идемпотентно: DELETE всего → INSERT (паттерн сидеров курсов: RLS без UPDATE).
// Таблицу создают один раз: `scripts/tasks-schema.sql` в Supabase SQL Editor
// (аналогично lessons: RLS-политики для anon SELECT/INSERT/DELETE).
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://xaslezkoktydranikqnx.supabase.co",
  "sb_publishable_rQC4uMonBP3dCF1Gz9avMQ_G_81WwQT"
);

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "content", "tasks");
const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();

// Локальная QC (дубль lint:tasks — синк не должен писать кривое в БД)
const XP = { easy: 50, medium: 100, hard: 200 };
const rows = [];
const seen = new Set();
for (const f of files) {
  for (const t of JSON.parse(readFileSync(join(dir, f), "utf8"))) {
    if (!/^[a-z]+-\d{3}$/.test(t.id)) throw new Error(`QC: плохой id ${t.id}`);
    if (seen.has(t.id)) throw new Error(`QC: дубль id ${t.id}`);
    seen.add(t.id);
    for (const k of ["title", "prompt", "hint"]) {
      if (!t[k] || !t[k].en || !t[k].ru) throw new Error(`QC: ${t.id} без en/ru в ${k}`);
    }
    if (t.xp !== XP[t.difficulty]) throw new Error(`QC: ${t.id} xp≠difficulty`);
    if (!Array.isArray(t.tests) || t.tests.length < 2) throw new Error(`QC: ${t.id} tests < 2`);
    rows.push({
      id: t.id,
      track: t.track,
      category: t.category,
      category_i18n: t.categoryI18n || null,
      "order": t.order,
      title: t.title,
      prompt: t.prompt,
      difficulty: t.difficulty,
      minutes: t.minutes,
      xp: t.xp,
      files: t.files,
      tests: t.tests,
      setup: t.setup || null,
      hint: t.hint,
      solution: t.solution || "",
      daily_challenge: Boolean(t.dailyChallenge),
      lesson_id: t.lessonId || null,
      status: t.status,
    });
  }
}

console.log(`Каталог: ${rows.length} задач из ${files.length} файлов`);
if (process.env.DRY === "1") {
  console.log("DRY: запись в БД пропущена");
  process.exit(0);
}

try {
  // Удаляем всё (нет UPDATE-политики — паттерн DELETE + INSERT)
  const del = await sb.from("tasks").delete().neq("id", "");
  if (del.error) throw del.error;
  console.log(`Удалено существующих: ${del.count ?? "?"}`);

  // Вставляем частями (PostgREST-лимит ~1000 строк/запрос; у нас ~110 — одной пачкой)
  const ins = await sb.from("tasks").insert(rows);
  if (ins.error) throw ins.error;

  // Проверка
  const { data, error } = await sb.from("tasks").select("id");
  if (error) throw error;
  if (data.length !== rows.length) {
    throw new Error(`QC: в БД ${data.length}, ожидалось ${rows.length}`);
  }
  const byTrack = {};
  for (const r of rows) byTrack[r.track] = (byTrack[r.track] || 0) + 1;
  console.log("По трекам:", JSON.stringify(byTrack));
  console.log(`✓ sync:tasks — ${rows.length} задач в таблице tasks`);
} catch (e) {
  if (/relation|does not exist|42P01/i.test(String(e.message || e))) {
    console.error("Таблица `tasks` не найдена. Создайте её по scripts/tasks-schema.sql в Supabase SQL Editor.");
  } else {
    console.error("Ошибка синка:", e.message || e);
  }
  process.exit(1);
}
