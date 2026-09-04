#!/usr/bin/env node
// lint:tasks — валидация каталога задач (src/content/tasks/*.json).
// Правила: уникальность id, обязательные en/ru, xp по difficulty (50/100/200),
// tests не пустые, order непрерывный с 1 в пределах трека, категория ≤6 на трек.
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dir = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "content",
  "tasks",
);
const XP = { easy: 50, medium: 100, hard: 200 };
const DIFFS = ["easy", "medium", "hard"];
const errors = [];
const err = (f, msg) => errors.push(`${f}: ${msg}`);

const files = readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .sort();
if (files.length !== 9)
  err(".", `ожидалось 9 файлов (9 треков), найдено ${files.length}`);

const seenIds = new Set();
let total = 0;
const trackStats = {};

for (const f of files) {
  let arr;
  try {
    arr = JSON.parse(readFileSync(join(dir, f), "utf8"));
  } catch (e) {
    err(f, `невалидный JSON: ${e.message}`);
    continue;
  }
  const track = f.replace(".json", "");
  const orders = [];
  const cats = new Set();
  let daily = 0;
  for (let i = 0; i < arr.length; i++) {
    const t = arr[i];
    const id = t.id || `#${i + 1}`;
    // id: {краткий-трек}-{3 цифры}, уникальный, неизменяемый
    if (!/^[a-z]+-\d{3}$/.test(t.id || ""))
      err(f, `${id}: id не в формате {track}-{NNN}`);
    if (seenIds.has(t.id)) err(f, `${id}: id уже занят`);
    seenIds.add(t.id);
    // track
    if (t.track !== track)
      err(f, `${id}: track (${t.track}) не совпадает с файлом (${track})`);
    // локализация: en + ru обязательны
    for (const k of ["title", "prompt", "hint"]) {
      if (!t[k] || !t[k].en || !t[k].ru)
        err(f, `${id}: ${k} должен иметь en + ru`);
    }
    // difficulty / xp
    if (!DIFFS.includes(t.difficulty))
      err(f, `${id}: difficulty (${t.difficulty})`);
    else if (t.xp !== XP[t.difficulty])
      err(f, `${id}: xp ${t.xp} ≠ ${XP[t.difficulty]} для ${t.difficulty}`);
    // files
    if (!t.files || Object.keys(t.files).length === 0)
      err(f, `${id}: files пуст`);
    // tests
    if (!Array.isArray(t.tests) || t.tests.length < 2)
      err(f, `${id}: tests — 2..5 штук`);
    else if (t.tests.length > 5) err(f, `${id}: tests — 2..5 штук`);
    else
      t.tests.forEach((x, j) => {
        if (!x.name || !x.code) err(f, `${id}: test #${j + 1} без name/code`);
      });
    // category
    if (!t.category) err(f, `${id}: нет category`);
    else cats.add(t.category);
    // order
    orders.push(t.order);
    // daily
    if (t.dailyChallenge) daily += 1;
    // status
    if (t.status !== "published") err(f, `${id}: status ≠ published`);
    if (t.lessonId && !/^[a-z]+-\d{2,3}$/.test(t.lessonId))
      err(f, `${id}: lessonId не в формате {track}-NN`);
    total += 1;
  }
  // order непрерывный с 1
  const sorted = [...orders].sort((a, b) => a - b);
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] !== i + 1) {
      err(f, `order не непрерывный с 1: ${JSON.stringify(sorted)}`);
      break;
    }
  }
  // 2026-09: потолок поднят до 10 — после переезда «General»-задач в JavaScript
  // у JS-трека 9 категорий (строки/массивы/алгоритмы + 6 исходных); чипы в UI всё
  // равно режутся до 6 (categoriesForTrack.slice(0,6)).
  if (cats.size > 10) err(f, `категорий больше 10: ${[...cats].join(", ")}`);
  trackStats[track] = { n: arr.length, daily, cats: cats.size };
}

// Распределение сложности ~40/40/20 и ≥60% dailyChallenge — мягкий предупреждающий порог
const diffCount = { easy: 0, medium: 0, hard: 0 };
for (const f of files) {
  let arr;
  try {
    arr = JSON.parse(readFileSync(join(dir, f), "utf8"));
  } catch {
    continue; // уже залогировано первым циклом
  }
  for (const t of arr)
    if (DIFFS.includes(t.difficulty)) diffCount[t.difficulty] += 1;
}
const dailyTotal = Object.values(trackStats).reduce((s, x) => s + x.daily, 0);

console.log(`Задач: ${total}`);
console.log(
  `Сложность: easy ${diffCount.easy} / medium ${diffCount.medium} / hard ${diffCount.hard}`,
);
console.log(
  `DailyChallenge: ${dailyTotal} (${Math.round((dailyTotal / Math.max(1, total)) * 100)}%)`,
);
for (const [k, v] of Object.entries(trackStats))
  console.log(`  ${k}: ${v.n} задач, ${v.cats} кат.`);

if (errors.length) {
  console.error("\nОшибки:");
  for (const e of errors) console.error("  ✗ " + e);
  process.exit(1);
}
console.log("✓ lint:tasks — все проверки пройдены");
