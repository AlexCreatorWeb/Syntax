// XP студента: localStorage-баки по юзеру (гость → общий бакет, юзер — свой).
// Задача даёт XP один раз (повтор — «practice», 0 XP); daily-бонус +500 — раз в день.
// Бакет: syntax-xp[-<uid>] = { total, granted: {taskId: xp}, daily: {"2026-09-12": {taskId, xp}} }
import { currentUid } from "./auth";
import { dailyKey } from "./daily";

const KEY = (uid) => (uid ? `syntax-xp-${uid}` : "syntax-xp");

function read(uid) {
  try {
    const s = localStorage.getItem(KEY(uid));
    const d = s ? JSON.parse(s) : null;
    return d && typeof d === "object"
      ? { total: 0, granted: {}, daily: {}, earnings: {}, ...d }
      : { total: 0, granted: {}, daily: {}, earnings: {} };
  } catch {
    return { total: 0, granted: {}, daily: {}, earnings: {} };
  }
}

function write(uid, data) {
  try {
    localStorage.setItem(KEY(uid), JSON.stringify(data));
  } catch {
    /* приватный режим */
  }
}

// Гостевой XP наследуется на аккаунт при первом начислении (паттерн progress.js)
function inheritGuest(uid) {
  if (!uid) return;
  const user = read(uid);
  const guest = read(null);
  if (!Object.keys(user.granted).length && Object.keys(guest.granted).length) {
    const total = user.total + guest.total;
    write(uid, {
      total,
      granted: { ...guest.granted },
      daily: { ...guest.daily },
      earnings: { ...guest.earnings },
    });
  }
}

export function getXpState() {
  const uid = currentUid();
  inheritGuest(uid);
  return read(uid);
}

// Начислить XP за задачу (один раз) + daily-бонус (+500, раз в день, если задача дня).
// Возвращает { taskXp, dailyXp, total }.
export function grantTaskXp(
  taskId,
  taskXp,
  isDaily = false,
  date = new Date(),
) {
  const uid = currentUid();
  inheritGuest(uid);
  const data = read(uid);
  let taskXpGained = 0;
  if (!data.granted[taskId]) {
    data.granted[taskId] = taskXp;
    data.total += taskXp;
    taskXpGained = taskXp;
  }
  let dailyXpGained = 0;
  const dayKey = dailyKey(date);
  if (isDaily && !data.daily[dayKey]) {
    data.daily[dayKey] = { taskId, xp: 500 };
    data.total += 500;
    dailyXpGained = 500;
  }
  // Журнал XP по дням (weekly-график рейтинга; старые бакеты без него — 0)
  const gained = taskXpGained + dailyXpGained;
  if (gained) data.earnings[dayKey] = (data.earnings[dayKey] || 0) + gained;
  const before = data.total - gained;
  write(uid, data);
  maybeFireLevelUp(before, data.total);
  return { taskXp: taskXpGained, dailyXp: dailyXpGained, total: data.total };
}

export function hasGrantedTask(taskId) {
  return Boolean(getXpState().granted[taskId]);
}

// XP за урок (UX-аудит M4): один раз на урок, guest-наследование то же.
// Ключ с префиксом lesson:, чтобы не конфликтовать с taskId в granted.
export const LESSON_XP = 20;
export function grantLessonXp(lessonId) {
  const uid = currentUid();
  inheritGuest(uid);
  const data = read(uid);
  const key = `lesson:${lessonId}`;
  let gained = 0;
  if (!data.granted[key]) {
    const before = data.total;
    data.granted[key] = LESSON_XP;
    data.total += LESSON_XP;
    gained = LESSON_XP;
    const dayKey = dailyKey(new Date());
    data.earnings[dayKey] = (data.earnings[dayKey] || 0) + LESSON_XP;
    write(uid, data);
    maybeFireLevelUp(before, data.total);
  } else {
    write(uid, data);
  }
  return gained;
}

export function hasGrantedLesson(lessonId) {
  return Boolean(getXpState().granted[`lesson:${lessonId}`]);
}

// Реальный XP по дням за последние 7 дней (окно заканчивается сегодня) —
// weekly-график рейтинга (аудит: раньше demo-столбики противоречили таблице).
// Неделя Пн–Вс с XP по дням — для rail-графика (начало недели =
// понедельник, будущие дни — нули, isToday — флагом).
export function weeklyEarnings() {
  const earn = getXpState().earnings || {};
  const today = new Date();
  const todayKey = dailyKey(today);
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = dailyKey(d);
    days.push({ key, xp: earn[key] || 0, isToday: key === todayKey });
  }
  return days;
}

// Суммарный XP (для профиля/рейтинга)
export function totalXp() {
  return getXpState().total;
}

// Восстановление XP из БД (новый браузер/устройство): merge строк
// lesson_progress/task_progress в user-бакет. Идемпотентно по granted-ключам
// (taskId / lesson:<id>): что уже начислено локально — не дублируется, что
// потеряно из кэша — доначисляется (total + журнал earnings по completed_at).
// Без uid (гость) — no-op: у гостя БД-строк нет.
export function mergeXpFromDb(uid, lessonRows, taskRows) {
  if (!uid) return;
  const data = read(uid);
  let changed = false;
  const add = (key, xp, at) => {
    if (data.granted[key]) return;
    data.granted[key] = xp;
    data.total += xp;
    if (at) {
      const k = dailyKey(new Date(at));
      data.earnings[k] = (data.earnings[k] || 0) + xp;
    }
    changed = true;
  };
  (taskRows || []).forEach((r) => {
    if (r && r.task_id) add(r.task_id, r.xp || 0, r.completed_at);
  });
  (lessonRows || []).forEach((r) => {
    if (r && r.lesson_id)
      add(`lesson:${r.lesson_id}`, LESSON_XP, r.completed_at);
  });
  if (changed) write(uid, data);
}

export function getDailyDone(date = new Date()) {
  const rec = getXpState().daily[dailyKey(date)];
  return rec ? { taskId: rec.taskId, xp: rec.xp } : null;
}

// Уровни (UX-аудит Q3): пороги кумулятивного XP. Level 1 = 0 XP.
// levelInfo(xp) → { level, into, need, pct, maxed }: into = XP внутри уровня,
// need = до следующего порога, pct = 0..100 (полоса «до уровня» в сайдбаре).
export const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 900, 1500, 2500, 4000, 6000, 9000, 13000, 18000, 25000,
  35000, 50000,
];

export function levelInfo(xp = 0) {
  let level = 0;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i;
    else break;
  }
  const base = LEVEL_THRESHOLDS[level];
  const next = LEVEL_THRESHOLDS[level + 1];
  if (!next) {
    return {
      level: level + 1,
      into: xp - base,
      need: 0,
      pct: 100,
      maxed: true,
    };
  }
  return {
    level: level + 1,
    into: xp - base,
    need: next - base,
    pct: Math.max(
      0,
      Math.min(100, Math.round(((xp - base) / (next - base)) * 100)),
    ),
  };
}

// Fire «level-up» событие (App показывает момент «Level {n}») при пересечении порога.
function maybeFireLevelUp(before, after) {
  if (typeof window === "undefined") return;
  const b = levelInfo(before);
  const a = levelInfo(after);
  if (a.level > b.level) {
    window.dispatchEvent(
      new CustomEvent("syntax-level-up", { detail: { level: a.level } }),
    );
  }
}

// Streak: последовательные дни с XP (журнал earnings). Сегодня без XP не рвёт
// серию — цепочка начинается с вчера (паттерн «серия ещё жива до полуночи»).
export function currentStreak(date = new Date()) {
  const earn = getXpState().earnings || {};
  const d = new Date(date);
  if (!earn[dailyKey(d)]) d.setDate(d.getDate() - 1);
  let streak = 0;
  while (earn[dailyKey(d)]) {
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
