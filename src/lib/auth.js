// Регистрация/авторизация — Supabase Auth (email + password).
// Сессия персистируется supabase-js в localStorage (refresh = остаемся в системе).
// После SIGNED_IN — fire-and-forget синк строки в `profiles` (id, email, full_name, avatarurl).
import { supabase, supabaseConfigured } from "./supabase";

export const authConfigured = supabaseConfigured;

// Считываем сессию синхронно из localStorage (формат sb-<ref>-auth-token → {current_session})
// — чтобы не мигать «гость» при загрузке; асинхронный getSession() в App это подтверждает.
export function readStoredSession() {
  try {
    const key = Object.keys(localStorage).find((k) => /^sb-.*-auth-token$/.test(k));
    if (!key) return null;
    const parsed = JSON.parse(localStorage.getItem(key) || "null");
    return (parsed && parsed.current_session) || null;
  } catch {
    return null;
  }
}

export function getSession() {
  return supabase ? supabase.auth.getSession() : Promise.resolve({ data: { session: null } });
}

export function onAuthChange(cb) {
  if (!supabase) return () => {};
  // supabase-js v2: возвращает { data: { subscription } } — unsub через subscription.unsubscribe()
  const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(session));
  return () => data.subscription.unsubscribe();
}

export async function signUp({ name, email, password }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name || email.split("@")[0] } },
  });
  if (error) throw mapAuthError(error);
  return { session: data.session, user: data.user };
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw mapAuthError(error);
  return { session: data.session, user: data.user };
}

export async function signOut() {
  if (supabase) await supabase.auth.signOut();
}

// «Забыли пароль»: письмо со ссылкой на сброс. Успех — даже если email не зарегистрирован
// (Supabase так делает, чтобы не раскрывать список юзеров) — модалка показывает «ссылку отправили».
export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}${window.location.pathname}`,
  });
  if (error) throw mapAuthError(error);
}

// uid текущего юзера (синхронно из сохранённой сессии) — для имёнспейса прогресса.
// Гость = null.
export function currentUid() {
  const s = readStoredSession();
  return s && s.user ? s.user.id : null;
}

// Строка профилей = «кто это» в данных платформы (аватар-монограмма, будущее: прогресс).
// Сбой некритичен — имя отображается из user_metadata сессии.
export function syncProfile(user) {
  if (!supabase || !user) return;
  const fullName = (user.user_metadata && user.user_metadata.full_name) || user.email.split("@")[0];
  supabase
    .from("profiles")
    .upsert({ id: user.id, email: user.email, full_name: fullName })
    .then(() => {})
    .catch(() => {});
}

// Ошибка Supabase → машиночитаемый code (i18n auth.err*)
function mapAuthError(e) {
  const message = e.message || "";
  const err = new Error(message);
  err.raw = e;
  if (/invalid (login )?credentials/i.test(message)) err.code = "invalid";
  else if (/not confirmed/i.test(message)) err.code = "unconfirmed";
  else if (/already (been )?registered/i.test(message)) err.code = "exists";
  else if (/password.*(at least|short|weak)|weak password/i.test(message)) err.code = "weak";
  else if (/rate limit|over_email_send/i.test(message)) err.code = "rateLimit";
  else if (e.status === 0 || /failed to fetch|network/i.test(message)) err.code = "network";
  else err.code = "generic";
  return err;
}

// Имя для UI: full_name из metadata → префикс email → «Syntax User»
export function displayName(session) {
  const user = session && session.user;
  if (!user) return null;
  const name = user.user_metadata && user.user_metadata.full_name;
  return (name && String(name).trim()) || (user.email || "user").split("@")[0];
}
