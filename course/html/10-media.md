# Урок 10. Медиа: video, audio, iframe

## Цель
После урока студент сможет: встроить видео и аудио с фолбэками, подписями и постерами, безопасно встроить сторонний контент через `iframe` с `sandbox`/`title` и выбрать между `iframe`/`embed`/`object`.

## Теория

**`<video>` и `<audio>`** — нативные медиа-элементы HTML5. Оба поддерживают:
- `src` — один файл (простой случай).
- `<source>` — несколько источников (форматов), браузер берёт ПЕРВЫЙ поддерживаемый.
- `controls` — показать нативные кнопки (play/pause/seek/volume). Без них — «голый» плеер (управляется JS).
- `autoplay` — автовоспроизведение. **Современные браузеры запрещают `autoplay` со звуком** — работает только `muted autoplay` (или после взаимодействия пользователя).
- `loop` — зациклить.
- `muted` — без звука.
- `poster` (только video) — картинка «до старта».
- `preload` — `none` / `metadata` / `auto`: сколько грузить до старта. По умолчанию — поведение браузера.
- `width`/`height` — резерв места (как у img, против CLS).

**Форматы:** `mp4` (H.264) — максимальная поддержка; `webm` (VP9/Opus) — открытый. На практике: `mp4` + `webm` fallback. Аудио: `mp3`/`m4a` + `ogg`.

**`<track>` — подписи и главы:**
```html
<video controls poster="poster.jpg" width="640">
  <source src="lecture.mp4" type="video/mp4">
  <source src="lecture.webm" type="video/webm">
  <track kind="captions" src="subs.ru.vtt" srclang="ru" label="Русский" default>
  <track kind="chapters" src="chapters.vtt">
  Ваш браузер не поддерживает video.
  <a href="lecture.mp4">Скачать видео</a>.
</video>
```
- `kind`: `subtitles` (перевод), `captions` (полные титры: звук + музыка + «кто говорит»), `chapters` (главы), `descriptions` (аудио-описание для незрячих), `metadata`.
- Формат — WebVTT (`.vtt`). `default` — включена по умолчанию.
- Текст МЕЖДУ тегами (после source/track) — **fallback** для старых браузеров: показывается, если video не поддержан. Обязателен для валидности? Нет, но для a11y/UX — да.

**`<iframe>`** — «окно» на другой HTML-документ (видео с YouTube, карта, виджет).
- `src` — адрес.
- `title` — **обязателен**: имя для скринридера (iframe без title — a11y-проблема «безымянная рамка»).
- `sandbox` — ограничивает «чужую» страницу: без `allow-scripts` нет JS, без `allow-same-origin` нет cookie/localStorage в нашем домене, `allow-popups` и т.п. Для «чистого» встраивания (карта, форма) — `sandbox="allow-forms allow-popups"`.
- `loading="lazy"` — ленивая загрузка iframe (важно: iframe грузится при скролле).
- `referrerpolicy` — сколько «раскрывать» referrer.

**`<embed>` и `<object>`** — «унаследованные» встраивания. В 95% случаев — `iframe` (HTML) или `video`/`audio` (медиа). `<object>` — для PDF/Flash-legacy, `<embed>` — «универсальный» fallback. Новое: не используйте без нужды.

**`<canvas>`** — не медиа, а «холст» для JS-рисования (графики, игры, фильтры). В HTML-курсе упоминаем для ориентира; вёрстка на canvas — редкость.

## Пример

```html
<!-- 1. Видео с двумя форматами и подписями -->
<figure>
  <video controls preload="metadata" poster="lecture-poster.jpg"
         width="640" height="360">
    <source src="media/lecture.mp4" type="video/mp4">
    <source src="media/lecture.webm" type="video/webm">
    <track kind="captions" src="media/lecture.ru.vtt"
           srclang="ru" label="Русский" default>
    <a href="media/lecture.mp4">Видео: Введение в HTML (MP4)</a>
  </video>
  <figcaption>Видео-лекция «Введение в HTML» (12 мин)</figcaption>
</figure>

<!-- 2. Фоновый звук: autoplay + muted (разрешено браузерами) -->
<audio src="ambient.mp3" loop muted preload="auto"></audio>

<!-- 3. Аудио с controls (например, подкаст) -->
<figure>
  <audio controls src="podcast-ep1.mp3" preload="metadata">
    <a href="podcast-ep1.mp3">Скачать подкаст (MP3)</a>
  </audio>
  <figcaption>Подкаст, эпизод 1: «Семантика за 10 минут»</figcaption>
</figure>

<!-- 4. iframe: карта (sandbox: только формы и popup) -->
<iframe src="https://example.com/map.html"
        title="Карта офиса"
        width="600" height="400"
        loading="lazy"
        sandbox="allow-forms allow-popups"></iframe>

<!-- 5. iframe: YouTube (нужны скрипты и same-origin для плеера) -->
<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"
        title="Видео на YouTube: Rick Astley — Never Gonna Give You Up"
        width="640" height="360"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen></iframe>
```

Разбор:
- `preload="metadata"` — грузим только длительность/размер, не всё видео.
- `figure` вокруг видео — «иллюстрация с подписью» (урок 4).
- `title` у iframe — ЧИТАЕМОЕ имя (не «видео», а что именно).
- `allow="..."` — feature policy для YouTube (accelerometer для 360°, clipboard для копирования ссылок и т.п.).
- `sandbox` у YouTube не нужен (плееру нужен полный доступ) — `sandbox` для «чужого» контента, где мы хотим ограничить.

## Частые ошибки новичков

| Ошибка | Почему плохо | Как правильно |
|---|---|---|
| `autoplay` без `muted` | Браузер блокирует, консоль ругается | `muted autoplay` (фон) или `controls` (пользователь жмёт) |
| `video` без `width`/`height` | «Прыжок» макета при загрузке метаданных | Всегда пишем размеры |
| Один `src` на video (без `<source>`) | Не валидно, но работает; нет fallback-форматов | `<source>` для каждого формата |
| `track` без `srclang`/`label` | Скринридер не знает язык и «не может переключить» | Язык + подпись |
| `iframe` без `title` | «Безымянная рамка» в a11y | `title` = что внутри |
| `iframe` без `loading="lazy"` | Все iframe грузятся при старте (тяжелые!) | `loading="lazy"` (кроме первого экрана) |
| `object`/`embed` «на всякий случай» | Мёртвые пути, нет поддержки | `iframe`/`video`/`audio` |
| `canvas` для «картинки с текстом» | Нет alt, не индексируется, не масштабируется | `img`/`svg`/текст |
| `allowfullscreen` без `allow="..."` у YouTube | Некоторые функции (360°, PIP) не работают | Полный `allow`-список |
| Видео «на весь экран» без `poster` | До загрузки — чёрный/пустой блок | `poster` + `width`/`height` |

## Практическое задание

1. Найдите короткое видео (или используйте с sample-videos.com). Разметьте: `video` + 2 `source` (mp4+webm) + `track` (создайте простой .vtt: 2 строки) + `poster` + `controls` + `width`/`height`.
2. Добавьте `audio` с `controls` (любое mp3) и «фоновый» `audio muted loop` (проверьте: браузер его запускает).
3. Встройте iframe: карту (sandbox) и YouTube-видео (с `allow`/`allowfullscreen`). У каждого — `title` и `loading="lazy"`.
4. Проверьте: в DevTools → Accessibility iframe имеет имя; video — `poster` показывается до старта; `track` переключается в нативном плеере.
5. Бонус: создайте `.vtt` с 3 репликами и 2 «главами» (kind="chapters").
