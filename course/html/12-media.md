# Урок 12. Медиа: video, audio, iframe

## Цель
После урока студент сможет: встроить видео и аудио с фолбэками, подписями (WebVTT) и постерами, безопасно встроить сторонний контент через `iframe` с `title` и `sandbox`, и выбрать между iframe/embed/object.

## Теория
### video и audio
Оба поддерживают: `src` (один файл) или несколько `<source>` (форматов) — браузер берёт ПЕРВЫЙ поддерживаемый; `controls` — нативные кнопки плеера; `autoplay` — в современных браузерах работает ТОЛЬКО вместе с `muted` (иначе блокируется); `loop`, `muted`; `poster` (только video) — картинка до старта; `preload` — сколько грузить до старта (none/metadata/auto); `width`/`height` — резерв места (против CLS, как у img).

Форматы: mp4 (H.264) — максимальная поддержка, webm — открытый; на практике mp4 + webm-fallback. Аудио: mp3/m4a + ogg.

### track — подписи и главы
`<track kind="captions" src="subs.ru.vtt" srclang="ru" label="Русский" default>` — файл WebVTT. Виды: `subtitles` (перевод), `captions` (полные титры: звук, музыка, «кто говорит»), `chapters` (главы), `descriptions` (аудио-описание для незрячих), `metadata`. `default` — включена по умолчанию. Текст МЕЖДУ тегами video (после source/track) — fallback для старых браузеров: «Ваш браузер не поддерживает видео. Скачать (ссылка)».

### iframe
«Окно» на другой HTML-документ: карта, виджет, видео. `title` — ОБЯЗАТЕЛЕН (имя для скринридера: без него — «безымянная рамка»). `sandbox` — ограничивает «чужую» страницу: без allow-scripts нет JS, без allow-same-origin нет cookie; для YouTube плееру sandbox НЕ нужен, зато нужен `allow="..."` (feature policy) и `allowfullscreen`. `loading="lazy"` — iframe грузится при скролле (важно, они тяжёлые).

### embed и object
«Унаследованные» встраивания: в 95% случаев достаточно iframe (HTML) или video/audio (медиа). object — для PDF/legacy, embed — «универсальный» fallback. Новое: не используйте без нужды. `<canvas>` — не медиа, а холст для JS-рисования; вёрстка «картинки с текстом» на canvas — плохая идея (нет alt, не индексируется).

TIP: у «медиа-блока» с подписью (видео-лекция + подпись) — оборачивайте в figure/figcaption (урок 6): подпись станет частью контента для скринридера.

## Пример
```html
<figure>
  <video controls preload="metadata" poster="poster.jpg"
         width="640" height="360">
    <source src="media/lecture.mp4" type="video/mp4">
    <source src="media/lecture.webm" type="video/webm">
    <track kind="captions" src="media/lecture.ru.vtt"
           srclang="ru" label="Русский" default>
    <a href="media/lecture.mp4">Видео: Введение в HTML (MP4)</a>
  </video>
  <figcaption>Видео-лекция «Введение в HTML» (12 мин)</figcaption>
</figure>
<audio controls src="podcast-ep1.mp3" preload="metadata">
  <a href="podcast-ep1.mp3">Скачать подкаст (MP3)</a>
</audio>
<iframe src="https://example.com/map.html"
        title="Карта офиса"
        width="600" height="400"
        loading="lazy"
        sandbox="allow-forms allow-popups"></iframe>
<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"
        title="Видео на YouTube: Never Gonna Give You Up"
        width="640" height="360"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen></iframe>
```
Разбор: preload="metadata" грузит только длительность; у обоих iframe есть человекочитаемый title; sandbox — только для «чужой» карты, YouTube-плееру — allow.

## Частые ошибки
WARN: autoplay без muted — браузер блокирует воспроизведение, консоль ругается; фон = muted autoplay, иначе controls.
WARN: video без width/height — макет «прыгает», когда подгрузятся метаданные.
WARN: iframe без title — «безымянная рамка» в a11y; title = что именно внутри.
WARN: track без srclang и label — скринридер не знает язык и «не может переключить».
WARN: <object>/<embed> «на всякий случай» — мёртвые пути; iframe / video / audio.

## Практическое задание
1. В стартовом файле соберите <video controls width height>: 2 source (mp4+webm, любые URL), poster.
2. Добавьте <track kind="captions"> (создайте простой .vtt: 2 строки) и fallback-ссылку между тегами.
3. Добавьте <audio controls> с fallback-текстом.
4. Встройте 2 iframe: карту (sandbox + title) и YouTube (allow + allowfullscreen + title).
5. Бонус: проверьте в DevTools → Accessibility, что у iframe есть имена; создайте .vtt с 3 репликами.
