// Каталог задач: контент = JSON в репо (src/content/tasks/*.json, один файл на трек).
// Фронтенд читает статику напрямую (надёжно, без сети); зеркало в Supabase —
// `npm run sync:tasks` (таблица `tasks`, для будущих API/админки).
import generalTasks from "../content/tasks/general.json";
import htmlTasks from "../content/tasks/html.json";
import cssTasks from "../content/tasks/css.json";
import jsTasks from "../content/tasks/javascript.json";
import reactTasks from "../content/tasks/react.json";
import vueTasks from "../content/tasks/vue.json";
import nodeTasks from "../content/tasks/node.json";
import mongoTasks from "../content/tasks/mongo.json";
import pythonTasks from "../content/tasks/python.json";
import postgresTasks from "../content/tasks/postgres.json";
import { dailyKey, hashStr, mulberry32 } from "./daily";

const XP_BY_DIFFICULTY = { easy: 50, medium: 100, hard: 200 };

// Все опубликованные задачи, отсортированные по order внутри трека
export const TASKS = [
  ...generalTasks,
  ...htmlTasks,
  ...cssTasks,
  ...jsTasks,
  ...reactTasks,
  ...vueTasks,
  ...nodeTasks,
  ...mongoTasks,
  ...pythonTasks,
  ...postgresTasks,
]
  .filter((t) => t.status === "published")
  .sort((a, b) => a.order - b.order);

export const XP_FOR_DIFFICULTY = XP_BY_DIFFICULTY;

// Задачи трека (в порядке order). track "general" — кросс-трековый каталог.
export function tasksForTrack(track) {
  return TASKS.filter((t) => t.track === track);
}

export function getTaskById(id) {
  return TASKS.find((t) => t.id === id) || null;
}

// Категории трека (уникальные, в порядке появления; ≤6)
export function categoriesForTrack(track) {
  const cats = [];
  for (const t of tasksForTrack(track)) {
    if (t.category && !cats.includes(t.category)) cats.push(t.category);
  }
  return cats.slice(0, 6);
}

// Локализованное поле: en + ru обязательны, остальные языки → fallback en
export function locField(obj, lang) {
  if (!obj) return "";
  return obj[lang] || obj.en || "";
}

// Локализация категории: свойство categoryI18n {en, ru} (если есть), иначе slug
export function locCategory(task, lang) {
  return task.categoryI18n ? locField(task.categoryI18n, lang) : task.category;
}

// Сложность для daily-подбора по дню недели: пн–чт easy, пт–сб medium, вс hard
export function dailyDifficulty(date = new Date()) {
  const day = date.getDay(); // 0 = вс
  if (day === 0) return "hard";
  if (day === 5 || day === 6) return "medium";
  return "easy";
}

// Детерминированный выбор задачи дня: пул = dailyChallenge=true, сложность дня;
// если под сложность нет задач — весь пул. Seed от (день + сложность) → у всех
// пользователей в один день одна и та же задача.
export function pickDailyTask(date = new Date()) {
  const pool = TASKS.filter((t) => t.dailyChallenge);
  if (!pool.length) return null;
  const diff = dailyDifficulty(date);
  const sub = pool.filter((t) => t.difficulty === diff);
  const use = sub.length ? sub : pool;
  const rand = mulberry32(hashStr(`syntax-daily-task-${dailyKey(date)}-${diff}`));
  return use[Math.floor(rand() * use.length) % use.length];
}
