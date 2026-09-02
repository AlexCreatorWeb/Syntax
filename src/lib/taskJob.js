// Job-контекст «задачи из каталога» для редактора (2026-09).
// Общий конструктор: MainContent («Solve» в Tasks) и DailyChallenge («Accept Challenge»).
import { locField, pickDailyTask } from "./tasks";
import { getDoneTasks, markTaskDone, markComplete } from "./progress";
import { grantTaskXp } from "./xp";

/**
 * @param {object} task задача из src/content/tasks/*.json
 * @param {object} opts
 * @param {Array}  opts.dbLessons строки `lessons` (для lessonId → uuid)
 * @param {string} opts.langCode язык интерфейса (локализация title/prompt)
 * @param {string} [opts.backTab] куда «Назад» (дефолт "tasks")
 * @param {Function} [opts.onCompleted] колбэк после Complete (re-render)
 * @returns job для CodeEditor (kind: "task")
 */
export function taskJobFor(task, { dbLessons = [], langCode = "en", backTab = "tasks", onCompleted } = {}) {
  if (!task || !task.id) return null;
  // lessonId: "html-03" → третий урок трека html в БД (порядок id = порядок курса)
  const lessonUuid = (() => {
    if (!task.lessonId) return null;
    const [tech, num] = String(task.lessonId).split("-");
    const n = parseInt(num, 10);
    const rows = (dbLessons || []).filter((l) => l.tech === tech).sort((a, b) => (a.id < b.id ? -1 : 1));
    return rows[n - 1] ? rows[n - 1].id : null;
  })();
  const daily = pickDailyTask();
  return {
    kind: "task",
    taskId: task.id,
    track: task.track,
    title: locField(task.title, langCode),
    desc: locField(task.prompt, langCode),
    backTab,
    techId: task.track,
    files: task.files,
    tests: task.tests,
    setup: task.setup,
    xp: task.xp,
    taskDone: getDoneTasks().includes(`${task.track}:${task.id}`),
    onTaskComplete: () => {
      markTaskDone(task.track, task.id);
      // XP: за задачу — один раз; daily-бонус +500 — если задача дня и ещё не начислен
      const res = grantTaskXp(task.id, task.xp, Boolean(daily && daily.id === task.id));
      // Связь с уроком: решение задачи = выполнение урока (прогресс Roadmap)
      if (lessonUuid) markComplete(task.track, lessonUuid);
      if (onCompleted) onCompleted();
      return res;
    },
  };
}
