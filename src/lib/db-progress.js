// Прогресс в Supabase (таблицы lesson_progress / task_progress, schema:
// scripts/progress-schema.sql). Стратегия:
//   · localStorage остаётся оперативным кэшем (мгновенные чипы Done, offline);
//   · при входе (session появился) — syncProgressFromDb(): БД → кэш (merge по
//     user-бакетам), затем pushProgressToDb(): кэш (вкл. наследованный
//     гостевой — getCompleted/getDoneTasks сами фолбэкат на гостевой бакет)
//     → БД (upsert, идемпотентно);
//   · каждое выполнение (Submit урока / Complete задачи) сразу upsert-ит свою
//     строку (fire-and-forget) — прогресс не теряется при закрытии вкладки.
// Гость (uid=null) — только localStorage; при первом входе всё уходит в БД.
import { supabase, supabaseConfigured } from "./supabase";
import { currentUid } from "./auth";
import {
  getCompleted,
  getDoneTasks,
  addCompleted,
  addDoneTasks,
  replaceCompleted,
} from "./progress";
import { mergeXpFromDb } from "./xp";
import { TASKS } from "./tasks";
import TECHS from "./techs";

const withTimeout = (p, ms = 4000) =>
  Promise.race([
    p,
    new Promise((res) =>
      setTimeout(() => res({ data: null, error: { message: "timeout" } }), ms),
    ),
  ]);

// lessons-строки (uuid → tech) — для маппинга lesson_id → бакет трека
const techMap = (lessonsRows) => {
  const m = {};
  (lessonsRows || []).forEach((l) => {
    if (l && l.id && l.tech) m[l.id] = l.tech;
  });
  return m;
};

const syncLoaded = new Set(); // uid на сессию (БД → кэш один раз)
let inflight = null;

// БД → localStorage: merge выполненных уроков/задач в user-бакеты.
// lessonsRows = строки таблицы lessons (id → tech).
export function syncProgressFromDb(lessonsRows) {
  const uid = currentUid();
  if (!uid || !supabaseConfigured || !supabase) return Promise.resolve(false);
  if (syncLoaded.has(uid)) return Promise.resolve(false);
  if (inflight) return inflight;
  inflight = Promise.all([
    withTimeout(
      supabase
        .from("lesson_progress")
        .select("lesson_id, completed_at")
        .eq("user_id", uid),
    ),
    withTimeout(
      supabase
        .from("task_progress")
        .select("task_id, xp, completed_at")
        .eq("user_id", uid),
    ),
  ])
    .then(([lessonRes, taskRes]) => {
      const tm = techMap(lessonsRows);
      const byTech = {};
      (lessonRes.data || []).forEach((r) => {
        const tech = tm[r.lesson_id];
        if (tech) (byTech[tech] ||= []).push(r.lesson_id);
      });
      // БД = источник правды: для треков, у которых есть строки в `lessons`,
      // кэш ЗАМЕНЯЕМ данными БД (обнуление строки в БД = обнуление в кэше).
      // Ошибка/таймаут запроса → data не массив → замещение не происходит.
      const okLessons = Array.isArray(lessonRes.data);
      const knownTechs = new Set(
        (lessonsRows || []).map((l) => l.tech).filter(Boolean),
      );
      knownTechs.forEach((tech) => {
        if (okLessons) replaceCompleted(tech, byTech[tech] || [], uid);
        else if (byTech[tech]) addCompleted(tech, byTech[tech], uid);
      });
      const taskKeys = (taskRes.data || [])
        .map((r) => {
          const task = TASKS.find((x) => x.id === r.task_id);
          return task ? `${task.track}:${task.id}` : null;
        })
        .filter(Boolean);
      if (taskKeys.length) addDoneTasks(taskKeys, uid);
      // XP-восстановление (новый браузер/устройство): рейтинг/weekly-график не
      // теряются — merge по granted-ключам, что уже начислено — не дублируется
      mergeXpFromDb(uid, lessonRes.data, taskRes.data);
      syncLoaded.add(uid);
      return Boolean(
        (lessonRes.data || []).length || (taskRes.data || []).length,
      );
    })
    .catch((e) => {
      console.warn("db-progress: sync from db failed", e);
      return false;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

// localStorage → БД: выгрузка ВСЕХ выполненных (user-бакеты; getCompleted/
// getDoneTasks фолбэкат на гостевой бакет при пустом своём — гостевой прогресс
// так наследуется в БД при первом входе). Upsert — идемпотентно.
export function pushProgressToDb() {
  const uid = currentUid();
  if (!uid || !supabaseConfigured || !supabase) return;
  const lessonRows = [];
  TECHS.forEach(({ id }) => {
    getCompleted(id, uid).forEach((lessonId) =>
      lessonRows.push({ user_id: uid, lesson_id: lessonId }),
    );
  });
  if (lessonRows.length) {
    withTimeout(
      supabase
        .from("lesson_progress")
        .upsert(lessonRows, { onConflict: "user_id,lesson_id" }),
    )
      .then(
        (r) =>
          r.error &&
          console.warn("db-progress: lesson upsert", r.error.message),
      )
      .catch(() => {});
  }
  const taskRows = [];
  getDoneTasks(uid).forEach((key) => {
    const [track, taskId] = String(key).split(":");
    const task = TASKS.find((x) => x.track === track && x.id === taskId);
    if (task) taskRows.push({ user_id: uid, task_id: taskId, xp: task.xp });
  });
  if (taskRows.length) {
    withTimeout(
      supabase
        .from("task_progress")
        .upsert(taskRows, { onConflict: "user_id,task_id" }),
    )
      .then(
        (r) =>
          r.error && console.warn("db-progress: task upsert", r.error.message),
      )
      .catch(() => {});
  }
}

// Поштучная выгрузка в момент выполнения (fire-and-forget, 1 строка).
export function pushLessonComplete(lessonId) {
  const uid = currentUid();
  if (!uid || !supabaseConfigured || !supabase || !lessonId) return;
  withTimeout(
    supabase
      .from("lesson_progress")
      .upsert([{ user_id: uid, lesson_id: lessonId }], {
        onConflict: "user_id,lesson_id",
      }),
  )
    .then(
      (r) =>
        r.error && console.warn("db-progress: lesson row", r.error.message),
    )
    .catch(() => {});
}

export function pushTaskComplete(track, taskId, xp = 0) {
  const uid = currentUid();
  if (!uid || !supabaseConfigured || !supabase || !taskId) return;
  withTimeout(
    supabase
      .from("task_progress")
      .upsert([{ user_id: uid, task_id: taskId, xp }], {
        onConflict: "user_id,task_id",
      }),
  )
    .then(
      (r) => r.error && console.warn("db-progress: task row", r.error.message),
    )
    .catch(() => {});
}
