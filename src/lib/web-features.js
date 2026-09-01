// Свежие фичи веб-платформы: год появления/шиппинга.
// NEW-лейбл на уроке: в заголовке/материале упоминается фича последних 3 лет.
// Список расширяем, когда агенты пишут уроки про обновления (новое — сюда первой строкой).
export const WEB_FEATURES = [
  // HTML
  { re: /popover/i, year: 2023 }, // <button popover> — новое в HTML
  { re: /<dialog|dialog[\s—-]+элем|элем[\s—-]*ент?[\s—-]*<dialog|modern[\s-]?dialog/i, year: 2023 }, // современный <dialog> (полный шиппинг с 2022)
  { re: /:popover/i, year: 2023 },
  // CSS
  { re: /:has\s*\(/i, year: 2023 },
  { re: /light-dark\s*\(/i, year: 2024 },
  { re: /@scope/i, year: 2024 },
  { re: /:user-valid|:user-invalid/i, year: 2025 },
  { re: /animation-timeline|scroll-driven/i, year: 2025 },
  { re: /view-transition/i, year: 2023 },
  { re: /color-mix\s*\(/i, year: 2023 },
  { re: /oklch/i, year: 2023 },
  // JavaScript
  { re: /promise\.withresolvers/i, year: 2024 },
  { re: /array\.fromasync/i, year: 2024 },
  { re: /findlast/i, year: 2023 },
  { re: /hasindices|RegExp.*["']v["']|v-флаг/i, year: 2023 },
  // React
  { re: /react 19|server components|react\.use\(|use\(promise\)/i, year: 2024 },
];

// Материал «новый» = упоминает фичу не старше 3 лет
export const hasRecentFeature = (text = "") => {
  const cutoff = new Date().getFullYear() - 3;
  return WEB_FEATURES.some((f) => f.year >= cutoff && f.re.test(text));
};
