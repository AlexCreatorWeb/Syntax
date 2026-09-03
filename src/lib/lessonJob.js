// Job-контекст «урока из БД» для вкладки #/lesson (LessonView + CodeEditor).
// Общий конструктор: MainContent (кнопки Continue/Lessons) и DailyChallenge
// (сайдбар) собирают одинаковый формат — один источник правды.
import { markComplete } from "./progress";
import { pushLessonComplete } from "./db-progress";
import { grantLessonXp } from "./xp";
import { localizedLessonTitle } from "./lessonTitles";

// Файл редактора по треку (имя/расширение соответствуют технологии)
export const TASK_FILE = {
  javascript: "index.js",
  python: "main.py",
  postgres: "queries.sql",
  html: "index.html",
  css: "styles.css",
  node: "server.js",
  react: "App.jsx",
  vue: "App.vue",
  mongo: "models.js",
};

/**
 * @param {object} lesson строка `lessons` из Supabase
 * @param {string} techId id технологии (у демо-урока без трека — "")
 * @param {string} backTab куда вести «Назад»
 * @param {string} desc опциональное описание (i18n-статика трека)
 * @param {number} [n] номер урока в курсе (с 1) — для EN-локализации заголовка
 * @param {string} [langCode] язык интерфейса (ru → оригинал, остальное → EN-карта)
 */
export function lessonJobFor(
  lesson,
  techId,
  backTab = "technology",
  desc = "",
  n = null,
  langCode = "en",
) {
  return {
    kind: "lesson",
    title: localizedLessonTitle(techId, n, lesson.title, langCode),
    desc: desc || "",
    content: typeof lesson.content === "string" ? lesson.content : "",
    backTab,
    techId: techId || undefined,
    file: (techId && TASK_FILE[techId]) || "index.js",
    code: typeof lesson.code === "string" ? lesson.code : undefined,
    lessonId: lesson.id,
    lessonNumber: n,
    onComplete: techId
      ? () => {
          markComplete(techId, lesson.id);
          pushLessonComplete(lesson.id); // Supabase: строка lesson_progress
          grantLessonXp(lesson.id); // UX-аудит M4: +XP за урок (один раз)
        }
      : undefined,
    fromDb: true,
  };
}
