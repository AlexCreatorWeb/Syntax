// Бандл-загрузчик документации: src/content/docs/{track}/{page-id}.md (import.meta.glob).
// Все потребители (каталог, поиск, prev/next, «in development»-счётчик) читают
// только эти файлы — бэкенд не нужен.
import { parseDocFile } from "./docs-md";

const rawFiles = import.meta.glob("../content/docs/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

// Разбор один раз на загрузку модуля (контент статичен на сессии).
const PAGES = [];
const parseErrors = [];
for (const [path, raw] of Object.entries(rawFiles)) {
  const fileId = path.split("/").pop().replace(/\.md$/, "");
  const { page, errors } = parseDocFile(raw, fileId);
  if (errors.length) {
    parseErrors.push({ file: path, errors });
  }
  if (page) PAGES.push(page);
}

if (import.meta.env.DEV && parseErrors.length) {
  // Контент-ошибки — видимые в консоли (прод: `npm run lint:docs` на воркфлоу)
  for (const e of parseErrors) console.warn(`[docs] ${e.file}: ${e.errors.join("; ")}`);
}

const byId = new Map(PAGES.map((p) => [p.id, p]));

/** Страницы трека (все типы), отсортированы по order внутри каждого типа. */
export function docsPagesForTrack(track) {
  const list = PAGES.filter((p) => p.track === track);
  const order = (p) => (p.order === undefined ? 999 : p.order);
  return list.sort((a, b) => (a.type === b.type ? order(a) - order(b) : a.type === "guide" ? -1 : 1));
}

/** Треки, у которых есть хоть одна страница (без них — «in development»). */
export function docsTracks() {
  return new Set(PAGES.map((p) => p.track));
}

/** Страница по id (для relatedTask/поиска/валидации deep-link). */
export function findDocPage(id) {
  return byId.get(id) || null;
}

/** Все страницы всех треков — для глобального поиска. */
export const ALL_DOC_PAGES = PAGES;

/** Сколько страниц у трека (для честного счётчика «a of b» в empty-state). */
export function docsCountForTrack(track) {
  return PAGES.filter((p) => p.track === track).length;
}
