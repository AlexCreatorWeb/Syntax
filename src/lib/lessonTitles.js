// Локализация названий уроков из БД (2026-09): строки `lessons` хранят RU-заголовок,
// в EN/UK/ES/DE-интерфейсе показываем EN-название из content-карты (fallback на оригинал).
// Ключ: `${trackFolder}-${NN}` (NN = номер урока в курсе, с 1). Карта: titles-en.json.
import enTitles from "../content/lessons/titles-en.json";

// techId → папка курса. Карта titles-en.json использует id трека как есть
// (javascript-01, html-01, …); старый ремап javascript→js ломал EN-названия JS-курса
// (ключ js-01 не существует → фолбэк на RU) — аудит навигации 2026-09.
const FOLDER = {};

/**
 * @param {string} techId id трека (html, css, javascript, …)
 * @param {number} n номер урока в курсе (с 1)
 * @param {string} title оригинальный (RU) заголовок из БД
 * @param {string} lang язык интерфейса (ru → оригинал; остальное → EN-карта)
 */
export function localizedLessonTitle(techId, n, title, lang) {
 if (!techId || !n || lang === "ru") return title;
 const key = `${FOLDER[techId] || techId}-${String(n).padStart(2, "0")}`;
 return enTitles[key] || title;
}
