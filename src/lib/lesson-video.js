// YouTube-видео на странице урока (вкладка «Материал», над контентом).
// Кастомный плеер (controls=0 + свои контролы); обложка постера —
// брендовый SVG (дизайн как у HTML) с логотипом трека и номером урока.
//
// Мапа PER-TECH: LESSON_VIDEO_IDS[techId][lessonNumber] = videoId.
// Уроки без видео — задезейбленная заглушка «Video coming soon»;
// id вписываем в мапу, заглушки исчезают сами.
// Новый трек = записать его мапу сюда + дописать id в TECHS_WITH_VIDEO
// (+ логотип в COVER_LOGOS).
export const LESSON_VIDEO_IDS = {
  html: {
    1: "NP2NJVfgWm8", // WebAkademia — структура страницы, html/head/meta/body
    2: "8yaY3utfRCE", // Какие-то уроки [Frontend] — HTML для начинающих (favicon, charset), UTF-8 и кракозябры (8:06; звук проверен: mean -28dB)
    3: "ny-ouhU-cCc", // Friendly Frontend — h1-h6, p, ol, ul, li
    4: "scB2C0uNV1s", // Friendly Frontend — a/button, якоря, mailto/tel, target
    5: "wKHiuEeVgU", // WebAkademia — ссылки в шапке (портфолио, контакты)
    6: "uCXwmupsoMY", // Friendly Frontend — img, относительные/абсолютные пути
    7: "g8Dw9auTr_g", // ART PROGRAMS — списки: маркированный, нумерованный, определений
    8: "jWXGLAD2BUU", // Friendly Frontend — table/tr/td/th, thead/tbody/tfoot
    9: "_in4LAdxAUA", // Friendly Frontend — form/fieldset/legend/label/input
    10: "ScPhhvz1z5Q", // Friendly Frontend — input type: tel/email/password/…
    11: "7ZZK9Iprw5c", // Friendly Frontend — header/main/footer/section/aside/nav
    12: "6PL2TqBdz0I", // Friendly Frontend — video/audio/iframe/source
    13: "3wsvVLOrI3g", // Friendly Frontend — Frontend Accessibility 2024 (11:39)
    14: "BwRqadwnBA4", // Вебмастер спит — мета-теги title и description для SEO
    15: "UfyrjnCFJBY", // Pro Web — современные HTML-теги DIALOG и DETAILS, семантика для новичков (5:19; звук проверен: mean -24dB)
    // Финальный проект: лимит 10 мин снят по решению (2026-09) — лайт-проект
    // чистый HTML + CSS (без JS/SCSS), ~1,5 ч; при необходимости заменим на
    // PoJaRi7Ug7Q (WebAkademia, 2:00:35, 139,8 тыс. просм.)
    16: "eCYWUhaIvsA", // WebAkademia — верстка сайта на HTML/CSS + размещение в интернете (1:19:24)
  },
  // Курс CSS (22 урока). Альтернативы «(б)» из подборок — в комментариях:
  // если ролик не подойдёт по звуку/качеству — подменить одной строкой.
  css: {
    1: "ndXZ-H0Jzmk", // StudioProWeb — HTML & CSS, урок 9: подключение стилей (11:07); (б) Q0zq_JYy-JI — EduCatter, 6:36
    2: "Q0zq_JYy-JI", // EduCatter — #3 Подключение CSS, основные селекторы (6:36); (б) 6HhSH58thJY — StudioProWeb, селекторы Class/ID, 6:49
    3: "9FoDgEMkqaI", // Ламков — 13. Псевдоэлементы before/after (7:42); (б) cZa0aWzAj8E — Ламков, псевдоклассы, 12:06
    4: "PEQ3i9q3ez8", // Ламков — 1. Каскад, специфичность, наследование (10:33); (б) Mt0st24hTpI — Ламков, CSS Layers, 7:46
    5: "PEQ3i9q3ez8", // Совместно с уроком 4 (специфичность — внутри «каскад»)
    6: "HcuVlzsW9S8", // Ламков — 11. Единицы измерения px/%/em/rem/vw/vh (10:21)
    7: "oQDNPNZ72Ig", // Ламков — 3. Блочная модель: display, padding, margin, box-sizing (9:16)
    8: "G-U-XU2KjD8", // Ламков — 4. Отступы padding/margin, схлопывание (7:07)
    9: "qeq4uHbRh_U", // ITDoctor — работа с шрифтом и текстом, урок 5 (10:42); (б) W-8bS5ka9sc — Александр Молодов, курс 2025, 5:58
    10: "TJQi4H4ix0s", // Ламков — 7. Цвета в CSS: RGB/HEX/HSL (9:27)
    11: "MCCjghRlbhA", // Фронтенд 18+ — позиционирование за 5 минут (5:07); (б) hoLPGFkEzs0 — Максим Васильев, z-index, 8:37
    12: "eVZEwEQg4pg", // Ulbi TV — Flexbox за 6 минут, все свойства (6:29)
    13: "zvkE0MY1cxE", // webDev — Flexbox #3: перенос и отступы (flex-wrap, gap) (6:40)
    14: "MEOR2b69Pl4", // Ulbi TV — Grid за 13 минут, все свойства (13:07); (б) JrKOHNRnRMg — Ламков, 14:16
    15: "JrKOHNRnRMg", // Ламков — 15. CSS Grid Layout: гайд по гридам (14:16); (б) b_cc3Blez9I — Анна Блок, 13:56
    16: "AUx0mVZMxKc", // Vallek — для чего нужны сабгриды (CSS subgrid) (11:30)
    17: "ahYuxTRjY0g", // Ламков — 20. Адаптивная верстка: mobile first, @media (12:22)
    18: "bP3ceQEXMhU", // Vadim Makeev — Container Queries: контейнер вместо вьюпорта (13:17); (б) 3n6e4RWKeDE — PurpleSchool, 13:22
    19: "wLWO58PJFrE", // Ламков — функции calc()/min()/max()/clamp() (10:06); (б) eEy3846ZHdw — ВебКадеми, clamp, 12:05
    20: "OgPY8FccBkI", // Ламков — CSS-переменные var() (10:48); (б) ncB_qYsscIE — ITDoctor, переменные в :root, 8:20
    21: "3a_iaHqazHo", // Ламков — 19. Анимации: @keyframes, animation (5:30); (б) aCN5h6Hj4uQ — transition/transform, 11:24; (б) g-EbZ684J30 — ITDoctor, 6:28
    22: "LAq9p4mqrpI", // RED Group — адаптация сайта под мобильные за 10 минут (14:43); (б) ahYuxTRjY0g — Ламков (совместно с 17)
  },
};
export const TECHS_WITH_VIDEO = ["html", "css"];

// Обложка постера генерируется как SVG (data-URI): современная «сочная»
// вёрстка на токенах палитры + НОМЕР УРОКА (крупный номер-водяной знак и
// чип LESSON NN). Логотип — тот же path, что в TechLogos; `vb` = размер
// viewBox исходника (html-логотип 24×24, css — 128×128), цель ~206px.
const COVER_LOGOS = {
  html: {
    color: "#e44d26",
    vb: 24,
    path: "M1.5 0h21l-1.91 21.563L11.977 24l-8.564-2.438L1.5 0zm7.031 9.75l-.232-2.718 10.059.003.23-2.622L5.412 4.41l.698 8.01h9.126l-.326 3.426-2.91.804-2.955-.81-.188-2.11H6.248l.33 4.171L12 19.351l5.379-1.443.744-8.157H8.531z",
  },
  css: {
    color: "#1572b6",
    vb: 128,
    path: "M8.76 1l10.055 112.883 45.118 12.58 45.244-12.626 10.063-112.837h-110.48zm89.591 25.862l-3.347 37.605.01.203-.014.467v-.004l-2.378 26.294-.262 2.336-28.36 7.844v.001l-.022.019-28.311-7.888-1.917-21.739h13.883l.985 11.054 15.386 4.17-.004.008v-.002l15.443-4.229 1.632-18.001h-32.283l-.277-3.043-.631-7.129-.331-3.828h34.749l1.264-14h-52.926l-.277-3.041-.63-7.131-.332-3.828h69.281l-.331 3.862z",
  },
};

const FONT = "'Space Grotesk','Inter',system-ui,sans-serif";

function coverSvg(name, logo, num) {
  const n = String(num).padStart(2, "0");
  const scale = 206 / (logo.vb || 24);
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
  <g transform="translate(64 196) scale(${scale})" fill="${logo.color}">
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
  const id = (LESSON_VIDEO_IDS[job.techId] || {})[num];
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
