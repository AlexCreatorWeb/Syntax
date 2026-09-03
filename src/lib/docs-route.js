import { getTech } from "./techs";

// Глубокие ссылки Documentation: реальные пути /docs, /docs/{track}, /docs/{track}/{pageId}.
// Vercel: catch-all rewrite → index.html (vercel.json). Внутри приложения hash = #/documentation,
// путь — источник правды для трека/страницы (переживает refresh, работает «share»).
export const DEFAULT_DOCS_TRACK = "python";

// /docs | /docs/<track> | /docs/<track>/<page> → { track, page } | null (не docs-путь)
export const parseDocsPath = (pathname = window.location.pathname) => {
  const m = String(pathname).match(/^\/docs(?:\/([a-z0-9-]+)(?:\/([a-z0-9-]+))?)?\/?$/);
  if (!m) return null;
  const track = m[1] && getTech(m[1]) ? m[1] : DEFAULT_DOCS_TRACK;
  return { track, page: m[2] || null };
};

export const docsPathFor = (route) => {
  const track = (route && route.track) || DEFAULT_DOCS_TRACK;
  return route && route.page ? `/docs/${track}/${route.page}` : `/docs/${track}`;
};

// Локализованный формат даты для «Updated …» (ISO → «12 мая 2026» / «May 12, 2026»)
const DATE_LOCALES = { en: "en-US", ru: "ru-RU", uk: "uk-UA", es: "es-ES", de: "de-DE" };
export function formatDocsDate(iso, langCode) {
  try {
    return new Intl.DateTimeFormat(DATE_LOCALES[langCode] || "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(`${iso}T00:00:00`));
  } catch {
    return iso;
  }
}

// Подсказка шортката в поле поиска: macOS → ⌘K, остальное → Ctrl K
export const isMacOS = () =>
  /Mac|iPhone|iPad|iPod/.test(navigator.platform || "") || /Mac OS|Macintosh/.test(navigator.userAgent || "");
