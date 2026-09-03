---
id: html-media
track: html
type: guide
section: media
order: 3
title:
  en: "Images & Media"
  ru: "Изображения и медиа"
excerpt:
  en: "Embed images, video, and audio the right way: alt text that works, width and height that prevent layout shift, srcset for responsive screens, and source fallbacks for formats."
  ru: "Корректная вставка изображений, видео и аудио: alt-текст, который работает, width/height против layout shift, srcset для разных экранов и source-фолбэки для форматов."
version: "html5"
updated: 2026-09-03
relatedTask: html-004
---

Images, video, and audio are the parts of a page that load last and break most often. This page covers the elements that embed media, the attributes that keep them fast and accessible, and the fallback strategies for when the browser does not like a format.

## Images: the img element

`img` is a void element — it has no closing tag. The four attributes that matter are `src` (where the file is), `alt` (what the picture says), and `width` with `height` (how much space to reserve):

```html
<img
  src="photos/lake.jpg"
  alt="A mountain lake at sunrise"
  width="600"
  height="400"
/>
```

`alt` is not optional. It is the only text alternative the image has: a screen reader announces it, search engines index it, and it shows up when the file fails to load. Write it like a caption that describes what the picture tells you — not "image of" or "photo of", but the actual content.

### When alt should be empty

Decorative images — background patterns, ornamental dividers — should get `alt=""` rather than a description. An empty `alt` tells assistive tech to skip the element entirely. A "descriptive" alt for a decorative flourish is noise that interrupts the reading flow for every screen-reader user on the page.

## Figure and figcaption

When an image, chart, or video is part of the content and deserves a caption, wrap it in `figure` and put the caption in `figcaption`:

```html
<figure>
  <img
    src="charts/growth.png"
    alt="Monthly signups, January to August 2026"
    width="640"
    height="320"
  />
  <figcaption>Signups grew every month in the first half of 2026.</figcaption>
</figure>
```

`figure` groups the media with its caption as one block, and screen readers announce the `figcaption` together with the figure. Use it for self-contained content — a diagram, a code screenshot, a photo with context — not for every image on the page.

## Responsive images with srcset

One file, one size, is a bad deal on both ends: phones download desktop-sized files, and high-resolution screens get blurry stretches. `srcset` lets the browser pick from several resolutions:

```html
<img
  src="hero-800.jpg"
  srcset="hero-400.jpg 400w, hero-800.jpg 800w, hero-1600.jpg 1600w"
  sizes="(max-width: 600px) 100vw, 600px"
  alt="The team at the 2026 conference"
  width="800"
  height="500"
/>
```

`srcset` lists the files and their intrinsic widths; `sizes` tells the browser how wide the image will be rendered at different viewports. The browser downloads the file that best matches the screen and the connection. Keep the plain `src` plus `width` and `height` in place as a fallback — older browsers ignore `srcset` but still reserve the correct space.

## Video and audio

`video` and `audio` embed media with native controls. Give them a `controls` attribute or the user gets a silent, frozen box:

```html
<video controls width="640" poster="flower.jpg">
  <source src="media/flower.mp4" type="video/mp4" />
  <source src="media/flower.webm" type="video/webm" />
  <p>Your browser does not support video — download the file instead.</p>
</video>
```

Each `source` is a format the browser may use; it walks the list top to bottom and plays the first one it supports. `poster` shows before playback starts, `preload="metadata"` limits the download to just enough for the controls, and the text after the last `source` is the fallback for browsers with no video support at all. `audio` works the same way, minus the `width` and `poster` attributes.

## Common mistakes

> **WARNING**
> Missing `width` and `height` cause layout shift: the page loads, then jumps when the image arrives. Reserve the space with attributes (or CSS) so the layout is stable from the first paint.

> **WARNING**
> A `video` without `controls` is invisible to the user — no play button, no sound, no way in. If the media is meant to be interactive, the attribute is required.

> **TIP**
> Name your files for what they are — `pricing-table.png`, not `IMG_0142.jpg` — and keep alt text under about 125 characters. Future you and every screen-reader user will be grateful.

<!-- RU -->

Изображения, видео и аудио — части страницы, которые грузятся последними и ломаются чаще всего. В этой странице — элементы, встраивающие медиа, атрибуты, которые держат их быстрыми и доступными, и стратегии фолбэка на случай, если браузеру не нравится формат.

## Изображения: элемент img

`img` — пустой элемент (void), у него нет закрывающего тега. Четыре атрибута, которые имеют значение: `src` (где лежит файл), `alt` (что изображено) и `width` с `height` (сколько места резервировать):

```html
<img
  src="photos/lake.jpg"
  alt="A mountain lake at sunrise"
  width="600"
  height="400"
/>
```

`alt` — не опциональная штука. Это единственный текстовый эквивалент картинки: его озвучивает скринридер, по нему индексируют поисковики, и именно он показывается, когда файл не загрузился. Пишите его как подпись, описывающую, что картинка сообщает, — не «изображение чего-то» и не «фото чего-то», а фактическое содержание.

### Когда alt должен быть пустым

Декоративные изображения — фоновые паттерны, орнаментальные разделители — должны получать `alt=""`, а не описание. Пустой `alt` говорит вспомогательным технологиям полностью пропустить элемент. «Описательный» alt для декоративной фиоритуры — это шум, прерывающий поток чтения у каждого пользователя скринридера на странице.

## Figure и figcaption

Когда изображение, график или видео — часть контента и заслуживает подписи, оберните его в `figure` и положите подпись в `figcaption`:

```html
<figure>
  <img
    src="charts/growth.png"
    alt="Monthly signups, January to August 2026"
    width="640"
    height="320"
  />
  <figcaption>Signups grew every month in the first half of 2026.</figcaption>
</figure>
```

`figure` объединяет медиа с подписью в один блок, а скринридеры озвучивают `figcaption` вместе с фигурой. Используйте его для самостоятельного контента — схема, скриншот кода, фото с контекстом, — а не для каждой картинки на странице.

## Адаптивные изображения через srcset

Один файл одного размера — плохая сделка для обоих: телефоны скачивают desktop-файлы, а экраны с высоким разрешением получают размытое растяжение. `srcset` позволяет браузеру выбрать из нескольких разрешений:

```html
<img
  src="hero-800.jpg"
  srcset="hero-400.jpg 400w, hero-800.jpg 800w, hero-1600.jpg 1600w"
  sizes="(max-width: 600px) 100vw, 600px"
  alt="The team at the 2026 conference"
  width="800"
  height="500"
/>
```

`srcset` перечисляет файлы и их фактические ширины; `sizes` говорит браузеру, какой шириной будет отрисовано изображение в разных вьюпортах. Браузер скачивает файл, который лучше всего подходит под экран и соединение. Оставьте обычный `src` плюс `width` и `height` как фолбэк — старые браузеры игнорируют `srcset`, но всё равно зарезервируют правильное место.

## Видео и аудио

`video` и `audio` встраивают медиа с нативными контролами. Дайте им атрибут `controls`, иначе пользователь получит бесшумный замороженный прямоугольник:

```html
<video controls width="640" poster="flower.jpg">
  <source src="media/flower.mp4" type="video/mp4" />
  <source src="media/flower.webm" type="video/webm" />
  <p>Your browser does not support video — download the file instead.</p>
</video>
```

Каждый `source` — формат, который браузер может использовать; он идёт по списку сверху вниз и запускает первый поддерживаемый. `poster` показывается до начала воспроизведения, `preload="metadata"` ограничивает скачивание тем объёмом, которого хватает для контролов, а текст после последнего `source` — фолбэк для браузеров без поддержки видео вообще. `audio` работает так же, за вычетом `width` и `poster`.

## Частые ошибки

> **WARNING**
> Отсутствие `width` и `height` вызывает layout shift: страница загружается, а потом прыгает, когда приезжает картинка. Резервируйте место атрибутами (или CSS), чтобы макет был стабилен с первой отрисовки.

> **WARNING**
> `video` без `controls` невидим для пользователя — ни кнопки воспроизведения, ни звука, ни способа войти. Если медиа задумано интерактивным, атрибут обязателен.

> **TIP**
> Называйте файлы по содержимому — `pricing-table.png`, а не `IMG_0142.jpg` — и держите alt-текст в пределах ~125 символов. Будущий вы и каждый пользователь скринридера скажут спасибо.
