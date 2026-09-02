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
    return d && typeof d === "object" ? { total: 0, granted: {}, daily: {}, ...d } : { total: 0, granted: {}, daily: {} };
  } catch {
    return { total: 0, granted: {}, daily: {} };
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
    write(uid, { total, granted: { ...guest.granted }, daily: { ...guest.daily } });
  }
}

export function getXpState() {
  const uid = currentUid();
  inheritGuest(uid);
  return read(uid);
}

// Начислить XP за задачу (один раз) + daily-бонус (+500, раз в день, если задача дня).
// Возвращает { taskXp, dailyXp, total }.
export function grantTaskXp(taskId, taskXp, isDaily = false, date = new Date()) {
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
  write(uid, data);
  return { taskXp: taskXpGained, dailyXp: dailyXpGained, total: data.total };
}

export function hasGrantedTask(taskId) {
  return Boolean(getXpState().granted[taskId]);
}

// Суммарный XP (для профиля/рейтинга)
export function totalXp() {
  return getXpState().total;
}

export function getDailyDone(date = new Date()) {
  const rec = getXpState().daily[dailyKey(date)];
  return rec ? { taskId: rec.taskId, xp: rec.xp } : null;
}
