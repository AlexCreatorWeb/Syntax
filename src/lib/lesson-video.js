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
  // Курс JavaScript (42 урока). 42-й (финальный проект) — без RU-видео: заглушка.
  javascript: {
    1: "ZV8fNtV1mOM", // Ламков — var/let/const, строгий режим, именование (9:33)
    2: "6sfhfert1lA", // EduCatter — #2 JS с нуля: типы данных (9:07)
    3: "yIvIAU-7_SY", // Ламков — числа, Math, округление, парсинг (11:16)
    4: "Pi7vGjenpoA", // Лущенко — шаблонные строки: 5 плюсов, строковые литералы (17:04)
    5: "WLpvuqsf6cI", // ITDoctor — строковый и логический тип: булевы, truthy/falsy (17:00)
    6: "kfcl02Nd2YI", // Ламков — typeof, преобразование типов, интерполяция (13:55)
    7: "WtaEFxXGmv4", // Какие-то уроки — условия switch/case, тернарник (12:18)
    8: "_WlC6UxMyNE", // Ламков — циклы while/do-while/for, break/continue (10:56)
    9: "rJK0eMkI3BE", // Ламков — функции: область видимости, параметры, return (19:39)
    10: "IcgdjdeOziA", // Ламков — стрелочные функции, именование (14:57)
    11: "MFoo2q38x9c", // Shaitan — область видимости в JavaScript (18:23)
    12: "mI6Jcfsgma4", // Pomazkov JS — замыкания за 15 минут (14:48)
    13: "HkQ--STLf2Q", // Непомнящий — оператор многоточие: spread/rest (12:13)
    14: "dNhCSC-yJ2A", // Лущенко — callback: разбираемся просто (15:33)
    15: "HZcnq4Rx1vU", // ExtremeCode — вся суть чистого кода (8:15)
    16: "92k57_D-Yqs", // Лущенко — push/pop, базовые методы массивов (16:58)
    17: "WJUk3GXarMw", // Пузанков — map, reduce, filter, forEach (12:59)
    18: "KqbnxtLOeZk", // Лущенко — reduce, isArray (18:33)
    19: "X8JdA4hUURc", // Лущенко — every, some, find, includes (9:20)
    20: "YinzpmFSP44", // Дудукало — сортировка массива объектов (16:30)
    21: "9fpxuvIQ_nA", // Лущенко — 9 способов клонировать массив (13:40)
    22: "kXAM_VuiBMM", // Ламков — объекты: чтение, добавление, удаление, перебор (15:49)
    23: "segRDC22WJA", // Лущенко — деструктурирующее присваивание (17:49)
    24: "Ha2geO5Qw_Q", // Лущенко — Object keys/values/entries, enumerable (16:35)
    25: "cYx5ckAYhK8", // Ламков — this для начинающих: объекты и функции (14:50)
    26: "o_HntOTCqks", // Муравьев — #11 prototype: прототипы и наследование (17:13)
    27: "syZhAlHgrxs", // Ламков — JSON: парсинг и преобразование (6:42)
    28: "ubYPpR9acQc", // Ламков — try/catch/finally, throw, класс Error (10:53)
    29: "qKOUQX93gIo", // Непомнящий — ловим ошибки: браузерный дебаггер, точки останова (14:24)
    30: "01RGJQn-lAY", // Ламков — DOM: getElement и querySelector (15:55)
    31: "7ofRYfOkhbo", // Ламков — DOM-элементы: свойства, атрибуты, value, data-* (13:44)
    32: "N1HIezZEFcE", // Ламков — DOM: создание, вставка, перемещение, удаление (17:20)
    33: "H9XRtCjD3hA", // Муравьев — #1 обработчик событий addEventListener (9:11)
    34: "Qm-5u8e4Ct0", // Муравьев — #2 Event, всплытие и погружение (фазы) (17:15)
    35: "wtfxZ2VFYU4", // IT Rocket Star — todo list на чистом JS: разбор (18:47)
    36: "9m7o30iS8ck", // ITDoctor — #15 localStorage (19:55)
    37: "5nAg2zPgmF4", // Ламков — setTimeout/setInterval, clearTimeout (8:56)
    38: "377qAu37OTE", // Ulbi TV — Event Loop простыми словами (5:51)
    39: "yx7SU2BQbus", // Непомнящий — методы промисов: when to apply (17:54)
    40: "xXBTwb7cc88", // Лущенко — просто про async/await (15:55)
    41: "hZewa8d7lYc", // Лущенко — работа с API: запросы с fetch (11:45)
    // 42 — финальный проект: подходящего RU-видео нет → заглушка «Video coming soon»
  },
};
export const TECHS_WITH_VIDEO = ["html", "css", "javascript"];

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
  javascript: {
    color: "#f7df1e",
    vb: 24,
    path: "M0 0h24v24H0V0zm22.034 18.276c-.175-1.095-.888-2.015-3.003-2.873-.736-.345-1.554-.585-1.797-1.14-.091-.33-.105-.51-.046-.705.15-.646.915-.84 1.515-.66.39.12.75.42.976.9 1.034-.676 1.034-.676 1.755-1.125-.27-.42-.404-.601-.586-.78-.63-.705-1.469-1.065-2.834-1.034l-.705.089c-.676.165-1.32.525-1.71 1.005-1.14 1.291-.811 3.541.569 4.471 1.365 1.02 3.361 1.244 3.616 2.205.24 1.17-.87 1.545-1.966 1.41-.811-.18-1.26-.586-1.755-1.336l-1.83 1.051c.21.48.45.689.81 1.109 1.74 1.756 6.09 1.666 6.871-1.004.029-.09.24-.705.074-1.65l.046.067zm-8.983-7.245h-2.248c0 1.938-.009 3.864-.009 5.805 0 1.232.063 2.363-.138 2.711-.33.689-1.18.601-1.566.48-.396-.196-.597-.466-.83-.855-.063-.105-.11-.196-.127-.196l-1.825 1.125c.305.63.75 1.172 1.324 1.517.855.51 2.004.675 3.207.405.783-.226 1.458-.691 1.811-1.411.51-.93.402-2.07.397-3.346.012-2.054 0-4.109 0-6.179l.004-.056z",
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
