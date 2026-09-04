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
  write(uid, data);
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
    data.granted[key] = LESSON_XP;
    data.total += LESSON_XP;
    gained = LESSON_XP;
    const dayKey = dailyKey(new Date());
    data.earnings[dayKey] = (data.earnings[dayKey] || 0) + LESSON_XP;
  }
  write(uid, data);
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

export function getDailyDone(date = new Date()) {
  const rec = getXpState().daily[dailyKey(date)];
  return rec ? { taskId: rec.taskId, xp: rec.xp } : null;
}
