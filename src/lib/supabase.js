// Подключение к Supabase (PostgREST через supabase-js).
// Ключи — из VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (.env, на Vercel — env-переменные).
// publishable (anon) ключ безопасен для фронтенда; service_role — только бэкенд.
import { createClient } from "@supabase/supabase-js";

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(URL && KEY);

export const supabase = supabaseConfigured ? createClient(URL, KEY) : null;

// Кэш уроков с TTL: правка контента в БД = DELETE + INSERT (нет UPDATE-политики),
// поэтому старая/пустая копия не должна жить вечно (баг 2026-09: «слетели уроки,
// помогает только перелогин» — таблица в момент первого запроса была в середине DELETE
// и пустой результат закэшировался навсегда).
// TTL: строки есть → 5 мин; пусто → 60 с (самовосстановление).
const LESSONS_TTL_MS = 5 * 60 * 1000;
const LESSONS_EMPTY_TTL_MS = 60 * 1000;
let lessonsCache = null;
let lessonsCacheAt = 0;
let lessonsInFlight = null;

/**
 * Читает таблицу `lessons` (id, title, content, code, tech).
 * content — материал урока (markdown-lite), code — стартовый код задания,
 * tech — привязка к треку ('html', 'javascript', …); строки без tech — общие.
 * Возвращает массив строк или null (нет БД / нет сети / таймаут) —
 * вызывающий код при null откатывается на статичный i18n-контент.
 * opts.force — игнорировать кэш (например, возврат на вкладку).
 */
export async function fetchDbLessons(timeoutMs = 4000, { force = false } = {}) {
  const age = Date.now() - lessonsCacheAt;
  const ttl = lessonsCache && lessonsCache.length ? LESSONS_TTL_MS : LESSONS_EMPTY_TTL_MS;
  if (!force && lessonsCache && age < ttl) return lessonsCache;
  if (lessonsInFlight && !force) return lessonsInFlight;
  if (!supabase) return null;
  const req = (async () => {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      const { data, error } = await supabase
        .from("lessons")
        .select("id, title, content, code, tech")
        .order("id", { ascending: true })
        .abortSignal(ctrl.signal);
      clearTimeout(timer);
      if (error) throw error;
      const rows = Array.isArray(data) ? data : [];
      // сбой (null) НЕ перезаписывает живой кэш — старые строки лучше новых «пусто»
      lessonsCache = rows;
      lessonsCacheAt = Date.now();
      return lessonsCache;
    } catch {
      return lessonsCache; // сеть упала — отдаём то, что было (может быть null)
    } finally {
      lessonsInFlight = null;
    }
  })();
  lessonsInFlight = req;
  return req;
}
