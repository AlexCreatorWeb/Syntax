// YouTube-видео на странице урока (вкладка «Материал», над контентом).
// Этап 1 (2026-09): один фиксированный ролик (NP2NJVfgWm8) на ПЕРВОМ уроке
// курса — оттачиваем на HTML. Размножить на все технологии = дописать id
// трека в TECHS_WITH_VIDEO (+ логотип в COVER_LOGOS).
// Этап 2 (план): поиск видео по каждому уроку (по названию/треку) —
// здесь появится мапа lessonId → videoId вместо общего LESSON_VIDEO_ID.
export const LESSON_VIDEO_ID = "NP2NJVfgWm8";
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
  if (!logo) return `https://i.ytimg.com/vi/${LESSON_VIDEO_ID}/hqdefault.jpg`;
  return `data:image/svg+xml,${encodeURIComponent(coverSvg(name, logo, num))}`;
}

/**
 * @param {object} job job-контекст урока (lessonJobFor)
 * @returns {null | { id: string, src: string, thumb: string }} — видео для встраивания
 */
export function getLessonVideo(job) {
  if (!job || job.kind !== "lesson" || !job.fromDb || !job.techId) return null;
  if (!TECHS_WITH_VIDEO.includes(job.techId)) return null;
  // Пока — только первый урок курса (n=1). У demo-урока без номера — не показываем.
  if (job.lessonNumber !== 1) return null;
  return {
    id: LESSON_VIDEO_ID,
    // autoplay — только после клика по постеру; controls=0 — НУЛЕВОЙ
    // YouTube-HUD (контроллы/субтитры/«Другие видео»/карточка канала не
    // рендерятся) — управление своим HUD через IFrame API (enablejsapi=1);
    // cc_load_policy=0 — без субтитров; rel=0 — без related на end-screen.
    // Ловушка: &playlist=<id> включает playlist-режим и ВЫЗЫВАЕТ «Up next».
    src: `https://www.youtube.com/embed/${LESSON_VIDEO_ID}?autoplay=1&rel=0&modestbranding=1&color=white&playsinline=1&cc_load_policy=0&controls=0&enablejsapi=1`,
    thumb: makeThumb(job.techId, job.techId.toUpperCase(), job.lessonNumber),
  };
}
