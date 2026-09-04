// Прогресс прохождения курсов: localStorage на трек — массив id уроков из `lessons`.
// Именспейс: гость = `syntax-progress-<tech>`, юзер = `syntax-progress-<uid>:<tech>`.
// Первый маркер юзера сидируется гостевым бакетом — прогресс, накопленный без
// аккаунта, наследуется при первом Submit после входа (а не теряется).
import { currentUid } from "./auth";

const key = (tech, uid) => `syntax-progress-${uid ? `${uid}:` : ""}${tech}`;

const read = (k) => {
  try {
    const v = JSON.parse(localStorage.getItem(k) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};

export function getCompleted(tech, uid = currentUid()) {
  if (!tech) return [];
  if (uid) {
    const own = read(key(tech, uid));
    if (own.length) return own;
  }
  return read(key(tech, null));
}

export function markComplete(tech, lessonId, uid = currentUid()) {
  if (!tech || !lessonId) return;
  const cur = getCompleted(tech, uid).filter((x) => x !== lessonId);
  cur.push(lessonId);
  localStorage.setItem(key(tech, uid), JSON.stringify(cur));
}

// Замещение списка (БД = источник правды, db-progress.js): обнуление строки в БД
// = обнуление в кэше при следующем синке
export function replaceCompleted(tech, lessonIds, uid = currentUid()) {
  if (!tech || !Array.isArray(lessonIds)) return;
  localStorage.setItem(key(tech, uid), JSON.stringify(lessonIds));
}

// Merge-добавление списка id (синк БД → кэш, db-progress.js): без записи, если ничего нового
export function addCompleted(tech, lessonIds, uid = currentUid()) {
  if (!tech || !Array.isArray(lessonIds) || !lessonIds.length) return;
  const k = key(tech, uid);
  const cur = read(k);
  const next = [...cur, ...lessonIds.filter((x) => x && !cur.includes(x))];
  if (next.length !== cur.length) localStorage.setItem(k, JSON.stringify(next));
}

// Задания (Tasks): ключ `tech:taskId` — отдельный бакет от уроков (уроки = id из БД).
// Статистика: профиль («Tasks completed»), чип Done на карточке задачи.
const tasksKey = (uid) => `syntax-tasks${uid ? `-${uid}` : ""}`;

export function getDoneTasks(uid = currentUid()) {
  const read = (k) => {
    try {
      const v = JSON.parse(localStorage.getItem(k) || "[]");
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  };
  if (uid) {
    const own = read(tasksKey(uid));
    if (own.length) return own;
  }
  return read(tasksKey(null));
}

export function markTaskDone(tech, taskId, uid = currentUid()) {
  if (!tech || taskId === undefined) return;
  const k = `${tech}:${taskId}`;
  const cur = getDoneTasks(uid).filter((x) => x !== k);
  cur.push(k);
  localStorage.setItem(tasksKey(uid), JSON.stringify(cur));
}

// Merge-добавление списка ключей `tech:taskId` (синк БД → кэш, db-progress.js)
export function addDoneTasks(taskKeys, uid = currentUid()) {
  if (!Array.isArray(taskKeys) || !taskKeys.length) return;
  const k = tasksKey(uid);
  let list;
  try {
    const v = JSON.parse(localStorage.getItem(k) || "[]");
    list = Array.isArray(v) ? v : [];
  } catch {
    list = [];
  }
  const next = [...list, ...taskKeys.filter((x) => x && !list.includes(x))];
  if (next.length !== list.length) localStorage.setItem(k, JSON.stringify(next));
}
