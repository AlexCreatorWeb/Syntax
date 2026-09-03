// YouTube-видео на странице урока (вкладка «Материал», над контентом).
// Этап 1 (2026-09): один фиксированный ролик на первом уроке HTML —
// оттачиваем плеер. Этап 2 (2026-09): мапа lessonNumber → videoId для HTML
// (подбор: не старше 5 лет, ≤ 10 мин, максимум просмотров, точное
// совпадение с темой; авторы — WebAkademia / Friendly Frontend / Listen IT).
// Уроки без видео (2, 7, 14, 16) — задезейбленная заглушка «Video coming
// soon»; агент подбирает актуальных авторов, id впишем в мапу позже.
// Размножить на все технологии = дописать id трека в TECHS_WITH_VIDEO
// (+ логотип в COVER_LOGOS).
export const LESSON_VIDEO_IDS = {
  1: "NP2NJVfgWm8", // WebAkademia — структура страницы, html/head/meta/body
  3: "ny-ouhU-cCc", // Friendly Frontend — h1-h6, p, ol, ul, li
  4: "scB2C0uNV1s", // Friendly Frontend — a/button, якоря, mailto/tel, target
  5: "wKHiuEeV1gU", // WebAkademia — ссылки в шапке (портфолио, контакты)
  6: "uCXwmupsoMY", // Friendly Frontend — img, относительные/абсолютные пути
  8: "jWXGLAD2BUU", // Friendly Frontend — table/tr/td/th, thead/tbody/tfoot
  9: "_in4LAdxAUA", // Friendly Frontend — form/fieldset/legend/label/input
  10: "ScPhhvz1z5Q", // Friendly Frontend — input type: tel/email/password/…
  11: "7ZZK9Iprw5c", // Friendly Frontend — header/main/footer/section/aside/nav
  12: "6PL2TqBdz0I", // Friendly Frontend — video/audio/iframe/source
  13: "3wsvVLOrI3g", // Friendly Frontend — Frontend Accessibility 2024 (11:39)
  15: "pznMUqqotpk", // Friendly Frontend — модальное окно, тег dialog
};
export const TECHS_WITH_VIDEO = ["html"];

// Обложка постера генерируется как SVG (data-URI): современная «сочная»
// вёрстка на токенах палитры + НОМЕР УРОКА (крупный номер-водяной знак и
// чип LESSON NN). Логотип — тот же path, что в TechLogos.
const COVER_LOGOS = {
  html: {
    color: "#e44d26",
    path: "M1.5 0h21l-1.91 21.563L11.977 24l-8.564-2.438L1.5 0zm7.031 9.75l-.232-2.718 10.059.003.23-2.622L5.412 4.41l.698 8.01h9.126l-.326 3.426-2.91.804-2.955-.81-.188-2.11H6.248l.33 4.171L12 19.351l5.379-1.443.744-8.157H8.531z",
  },
};

const FONT = "'Space Grotesk','Inter',system-ui,sans-serif";

function coverSvg(name, logo, num) {
  const n = String(num).padStart(2, "0");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" role="img" aria-label="Syntax ${name} video lesson ${n}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#03101f"/>
      <stop offset="0.55" stop-color="#062033"/>
      <stop offset="1" stop-color="#0a3040"/>
    </linearGradient>
    <radialGradient id="g1" cx="0.85" cy="0.15" r="0.75">
      <stop offset="0" stop-color="#22d3ee" stop-opacity="0.30"/>
      <stop offset="1" stop-color="#22d3ee" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="g2" cx="0.1" cy="0.9" r="0.7">
      <stop offset="0" stop-color="#30e0a1" stop-opacity="0.32"/>
      <stop offset="1" stop-color="#30e0a1" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="num" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#30e0a1"/>
      <stop offset="1" stop-color="#22d3ee"/>
    </linearGradient>
    <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#30e0a1"/>
      <stop offset="1" stop-color="#22d3ee"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <rect width="1280" height="720" fill="url(#g1)"/>
  <rect width="1280" height="720" fill="url(#g2)"/>
  <g stroke="#7dd3fc" stroke-opacity="0.07">
    <path d="M0 180h1280M0 360h1280M0 540h1280"/>
    <path d="M320 0v720M640 0v720M960 0v720"/>
  </g>
  <text x="1252" y="668" text-anchor="end" font-family="${FONT}" font-size="460" font-weight="800" fill="url(#num)" opacity="0.16">${n}</text>
  <rect x="64" y="56" width="196" height="46" rx="23" fill="#30e0a1" fill-opacity="0.14" stroke="#30e0a1" stroke-opacity="0.5"/>
  <text x="162" y="86" text-anchor="middle" font-family="${FONT}" font-size="20" font-weight="700" letter-spacing="3" fill="#6adbb1">LESSON ${n}</text>
  <circle cx="1188" cy="79" r="23" fill="none" stroke="#22d3ee" stroke-opacity="0.5" stroke-width="3"/>
  <path d="M1181 69l20 10-20 10z" fill="#22d3ee" fill-opacity="0.85"/>
  <g transform="translate(64 196) scale(8.6)" fill="${logo.color}">
    <path fill-rule="evenodd" d="${logo.path}"/>
  </g>
  <text x="60" y="530" font-family="${FONT}" font-size="150" font-weight="800" fill="#eaf6ff" letter-spacing="1">${name}</text>
  <rect x="68" y="556" width="160" height="8" rx="4" fill="url(#bar)"/>
  <text x="66" y="620" font-family="${FONT}" font-size="28" font-weight="600" letter-spacing="6" fill="#8aa0b8">VIDEO LESSON &#183; SYNTAX</text>
</svg>`;
}

// Обложка по треку (нет логотипа → фолбэк на hqdefault YouTube)
function makeThumb(techId, name, num) {
  const logo = COVER_LOGOS[techId];
  if (!logo) return `https://i.ytimg.com/vi/NP2NJVfgWm8/hqdefault.jpg`;
  return `data:image/svg+xml,${encodeURIComponent(coverSvg(name, logo, num))}`;
}

/**
 * @param {object} job job-контекст урока (lessonJobFor)
 * @returns {null | { id?: string, src?: string, num: number, thumb: string, placeholder?: boolean }}
 *   — видео для встраивания; для уроков без ролика — placeholder (заглушка)
 */
export function getLessonVideo(job) {
  if (!job || job.kind !== "lesson" || !job.fromDb || !job.techId) return null;
  if (!TECHS_WITH_VIDEO.includes(job.techId)) return null;
  const num = job.lessonNumber;
  if (!num) return null; // demo-урок без номера — без видео
  const id = LESSON_VIDEO_IDS[num];
  if (!id) {
    return {
      num,
      placeholder: true,
      thumb: makeThumb(job.techId, job.techId.toUpperCase(), num),
    };
  }
  return {
    id,
    num,
    // Кастомный плеер: controls=0 через IFrame API, свои контролы. src —
    // для прямой вставки (без API): только rel=0. Ловушка: &playlist=<id>
    // включает playlist-режим и ВЫЗЫВАЕТ «Up next»-карточку — не добавлять.
    src: `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&playsinline=1`,
    thumb: makeThumb(job.techId, job.techId.toUpperCase(), num),
  };
}
