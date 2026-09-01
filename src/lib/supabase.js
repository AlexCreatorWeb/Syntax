// Подключение к Supabase (PostgREST через supabase-js).
// Ключи — из VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (.env, на Vercel — env-переменные).
// publishable (anon) ключ безопасен для фронтенда; service_role — только бэкенд.
import { createClient } from "@supabase/supabase-js";

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(URL && KEY);

export const supabase = supabaseConfigured ? createClient(URL, KEY) : null;

// Кэш на модуль: lessons тянем один раз за сессию, дальше — из памяти.
// null = «ещё не тянули», [] = «БД отвечает, но таблица пуста» (fallback на i18n).
let lessonsCache = null;

/**
 * Читает таблицу `lessons` (id, title, content, tech).
 * tech — привязка к треку ('html', 'javascript', …); строки без tech — общие.
 * Возвращает массив строк или null (нет БД / нет сети / таймаут) —
 * вызывающий код при null откатывается на статичный i18n-контент.
 */
export async function fetchDbLessons(timeoutMs = 4000) {
  if (lessonsCache) return lessonsCache;
  if (!supabase) return null;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const { data, error } = await supabase
      .from("lessons")
      .select("id, title, content, tech")
      .order("id", { ascending: true })
      .abortSignal(ctrl.signal);
    clearTimeout(timer);
    if (error) throw error;
    lessonsCache = Array.isArray(data) ? data : [];
    return lessonsCache;
  } catch {
    return null;
  }
}
