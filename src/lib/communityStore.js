// Состояние Community (посты/ответы/голоса/подписки/прочитанные/принятые) —
// персист в localStorage. Гость и юзер — разные бакеты:
//   гость: syntax-community-guest  (перезаживает перезагрузку в этом браузере)
//   юзер:  syntax-community-<uid>  (свой прогресс на аккаунт)
// (решение по багу «посты гостя не переживают перезагрузку» — вариант (а)
//  без таблицы Supabase: community — i18n демо-данные, таблицы постов нет)
import { currentUid } from "./auth";

function key() {
  return `syntax-community-${currentUid() || "guest"}`;
}

const EMPTY = {
  posts: [], // опубликованные локально (post + meta)
  replies: {}, // { postKey: [reply] }
  voted: {}, // { postKey: true }
  votes: {}, // { postKey: count }
  viewed: {}, // { postKey: true } — «N new replies» сброслен
  accepted: {}, // { postKey: replyIndex } — принятый ответ
  deleted: {}, // { postKey: true } — удалённые вопросы (включая сид-посты)
};

export function loadCommunityStore() {
  try {
    const raw = localStorage.getItem(key());
    if (!raw) return { ...EMPTY };
    const data = JSON.parse(raw);
    return { ...EMPTY, ...data };
  } catch {
    return { ...EMPTY };
  }
}

export function saveCommunityStore(store) {
  try {
    localStorage.setItem(key(), JSON.stringify(store));
  } catch {
    /* quota — не критично для demo-данных */
  }
}

// Подписки хранятся отдельно (CommunityAside пишет их независимо от вьюхи,
// чтобы не затирать общий стор при параллельных записях)
function followsKey() {
  return `syntax-community-follows-${currentUid() || "guest"}`;
}

export function loadFollows() {
  try {
    return JSON.parse(localStorage.getItem(followsKey())) || {};
  } catch {
    return {};
  }
}

export function saveFollows(map) {
  try {
    localStorage.setItem(followsKey(), JSON.stringify(map));
  } catch {
    /* noop */
  }
}

// Единый формат чисел: ≥1000 → «14.2k», иначе — как есть.
// Принимает и строки: «8,420» / «8 420» / «14.2k» / 1200
export function fmtNum(v) {
  if (v === null || v === undefined || v === "") return "";
  if (typeof v === "number") return fmt(v);
  const s = String(v).trim().toLowerCase();
  const m = s.match(/^([\d.,\s]+)k$/);
  const n = m
    ? parseFloat(s.slice(0, -1).replace(",", ".")) * 1000
    : parseFloat(s.replace(/[, ]/g, ""));
  return isFinite(n) ? fmt(n) : String(v);
}

function fmt(n) {
  if (n >= 1000) {
    const k = (n / 1000).toFixed(1).replace(/\.0$/, "");
    return `${k}k`;
  }
  return String(Math.round(n));
}
