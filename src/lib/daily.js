// Ежедневное испытание: случайный урок из пула технологий, у которых реально
// есть опубликованные уроки в `lessons`. Детерминировано на день (seeded RNG от
// локальной даты) — у всех пользователей «сегодняшнее» испытание одно и то же,
// при каждом визите в тот же день — стабильно, в новый день — другое.

// Локальный день (не UTC — «сегодня» для пользователя = его календарь)
export function dailyKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Сумма строки → 32-bit seed (FNV-1a)
function hashStr(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// mulberry32: быстрый deterministic PRNG, возвращает () => [0, 1)
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Выбирает ежедневное испытание.
 * @param {Array} dbLessons строки таблицы `lessons` ({id, title, tech, ...})
 * @returns {{ tech: string, lesson: object } | null} null — пул пуст (уроков нет)
 */
export function pickDailyChallenge(dbLessons) {
  const byTech = {};
  for (const l of dbLessons || []) {
    if (l && l.tech && l.id) (byTech[l.tech] = byTech[l.tech] || []).push(l);
  }
  const techs = Object.keys(byTech);
  if (!techs.length) return null;

  const rand = mulberry32(hashStr(`syntax-daily-${dailyKey()}`));
  const tech = techs[Math.floor(rand() * techs.length) % techs.length];
  const pool = byTech[tech];
  const lesson = pool[Math.floor(rand() * pool.length) % pool.length];
  return { tech, lesson };
}

// Секунды до полуночи местного времени (таймер «сбросится в 00:00»)
export function secondsToMidnight(date = new Date()) {
  const mid = new Date(date);
  mid.setHours(24, 0, 0, 0);
  return Math.max(0, Math.round((mid - date) / 1000));
}
