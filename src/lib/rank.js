// Лидерборд: ЕДИНЫЙ источник данных для подиума, таблицы и rail-карты
// (UX-аудит 2026-09: раньше это были три независимые demo-картины,
// противоречащие друг другу при смене фильтров).
// До бэкенда: соперники — демо-когорта (бейдж SAMPLE), а «вы» — РЕАЛЬНЫЕ
// данные: XP = totalXp() (тот же источник, что ProfileView).
import { totalXp } from "./xp";

// Демо-когорта до подключения реальных пользователей (порядок не важен —
// ранги считаются из XP).
export const DEMO_LEADERS = [
  { name: "SyntaxError", xp: 15890, hue: 158 },
  { name: "ByteSniper", xp: 12450, hue: 210 },
  { name: "NullPointer", xp: 11200, hue: 20 },
  { name: "DevJedi", xp: 10850, hue: 200 },
  { name: "CodeNinja", xp: 10120, hue: 260 },
  { name: "PixelWitch", xp: 8975, hue: 300 },
];

// Отсортированные строки (ранг 1 = максимум XP) + позиция «вы»
// (реальный totalXp) и следующая над вами позиция.
export function leaderboard() {
  const youXp = totalXp();
  const rows = [
    ...DEMO_LEADERS,
    { name: "you", xp: youXp, hue: 158, you: true },
  ].sort((a, b) => b.xp - a.xp);
  rows.forEach((r, i) => {
    r.rank = i + 1;
  });
  const you = rows.find((r) => r.you);
  const next = you.rank > 1 ? rows[you.rank - 2] : null;
  return {
    rows,
    youXp,
    youRank: you.rank,
    next,
    gap: next ? next.xp - youXp : 0,
    progress: next ? Math.min(100, Math.round((youXp / next.xp) * 100)) : 100,
  };
}
