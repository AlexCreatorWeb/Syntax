---
id: css-properties
track: css
type: reference
section: reference
order: 1
title:
  en: "Properties Quick Reference"
  ru: "Шпаргалка по свойствам"
excerpt:
  en: "The properties you actually use daily: layout, display, position, visual and typography — values and what they do, in one page."
  ru: "Свойства, которые вы реально используете каждый день: layout, display, position, визуальные и типографические — значения и эффект, на одной странице."
version: "css3"
updated: 2026-09-03
---

A cheat sheet of the properties that appear in nearly every stylesheet, grouped by job. Use it to look up values fast; the guides in the core and layout sections explain the mechanics behind each group. If a property is not on this page, it is either niche or legacy.

## Layout and display

| Property | Common values | What it does |
| --- | --- | --- |
| `display` | `block`, `inline`, `inline-block`, `flex`, `grid`, `none` | Changes the box type and how the element participates in layout |
| `box-sizing` | `content-box` (default), `border-box` | Whether `width` includes padding and border |
| `position` | `static`, `relative`, `absolute`, `fixed`, `sticky` | Anchors the element in or out of the normal flow |
| `top / right / bottom / left` | length, %, `auto` | Offsets for positioned and sticky elements |
| `z-index` | integer, `auto` | Stacking order inside a stacking context |
| `overflow` | `visible`, `hidden`, `scroll`, `auto` | What happens to content larger than the box |
| `width / height` | length, %, `auto` | Box dimensions (mind border-box) |
| `min-width / max-width` | length, %, `none` | Size limits |
| `float` | `left`, `right`, `none` | Takes the box out of flow (legacy) |
| `clear` | `left`, `right`, `both` | Pushes a box below preceding floats |

`display: flex` and `display: grid` are the workhorses of modern layout, and most of the other entries in this table exist to serve them. `display: none` removes the element from layout entirely, while `visibility: hidden` keeps its space — the distinction matters whenever you toggle UI elements.

## Visual properties

| Property | Common values | What it does |
| --- | --- | --- |
| `color` | any color | Text color |
| `background` | color, image, position, size | Backgrounds (shorthand) |
| `background-color` | color | The fill behind content and padding |
| `background-image` | `url(...)`, gradients | Layers of images or gradients, comma-separated |
| `background-size` | `cover`, `contain`, length | How an image fills the box |
| `border` | `1px solid #ccc` | Edge: width + style + color |
| `border-top / right / bottom / left` | same three parts, one side | Per-side borders |
| `border-radius` | length, % | Rounded corners (1 to 4 values) |
| `box-shadow` | `x y blur spread color` | Shadow outside the border, no layout impact |
| `opacity` | 0 to 1 | Whole-box transparency (children included) |
| `outline` | `2px solid blue` | Non-layout ring, usually for focus |
| `cursor` | `pointer`, `not-allowed`, … | Mouse cursor over the element |
| `filter` | `blur(4px)`, `grayscale(1)` | Visual effects on the rendered box |

Color comes in several spellings that all work in modern browsers: `red`, `#f80`, `#ff8800`, `rgb(255, 136, 0)`, the modern space syntax `rgb(255 136 0 / 0.5)` with alpha, `hsl(25 100% 50%)`, and `currentcolor`, which inherits the element's own `color`.

## Typography and text

| Property | Common values | What it does |
| --- | --- | --- |
| `font-family` | `"Inter", system-ui, sans-serif` | Font stack, first available match wins |
| `font-size` | `16px`, `1rem`, `1.5em`, `clamp(…)` | Glyph size |
| `font-weight` | 100 to 900, `normal`, `bold` | Weight (700 is bold) |
| `line-height` | `1.6`, `24px` | Distance between lines; unitless multiplier preferred |
| `letter-spacing` | `-0.02em`, `1px` | Space between letters |
| `text-align` | `left`, `center`, `right`, `justify` | Horizontal alignment of text |
| `text-transform` | `uppercase`, `capitalize`, … | Case rendering |
| `text-decoration` | `underline`, `none`, `line-through` | Underline, strike, and their style |
| `white-space` | `normal`, `nowrap`, `pre-wrap` | Wrapping and whitespace handling |
| `overflow-wrap` | `break-word`, `anywhere` | Break long words that overflow |
| `text-overflow` | `ellipsis` | Clip overflow with `…` (with `nowrap`) |

Reading-comfort rules of thumb that come up in every design system: body text 16 to 18 px, line-height 1.5 to 1.7, line length 45 to 75 characters (a `max-width` around 640 to 720 px), and headings with a slight negative `letter-spacing`, typically `-0.01em` to `-0.03em`.

> **TIP**
> Set a `font-size` on `html` (for example 16 px) and size everything else in `rem`. One change to the root then rescales the whole design, and `rem` stays correct no matter how deep the nesting.

## The properties nobody remembers

| Property | Why it matters |
| --- | --- |
| `user-select: none` | Prevents text selection (labels, drag handles) |
| `pointer-events: none` | Element ignores the mouse (overlays) |
| `pointer-events: auto` | Restores interactivity for a child inside a `none` parent |
| `contain: content` | Layout and performance isolation; also stops margin collapse |
| `aspect-ratio: 16 / 9` | Keeps a box's proportions (video, cards, avatars) |
| `gap` | Space between flex and grid items — the modern replacement for margin juggling |
| `scroll-behavior: smooth` | Smooth anchor scrolling |
| `object-fit: cover` | How an image fills its box (pair with `object-position`) |

> **WARNING**
> `line-height: 1.6` is a unitless multiplier of the element's font-size. A value of `1.6px` is a rounding bug waiting to happen — use unitless multipliers for text, and absolute values only when you really mean them.

<!-- RU -->

Шпаргалка по свойствам, которые встречаются практически в каждом стайлшите, сгруппированным по назначению. Используйте её для быстрого поиска значений; гайды в разделах core и layout объясняют механику за каждой группой. Если свойства нет на этой странице — оно либо нишевое, либо легаси.

## Layout и display

| Свойство | Типичные значения | Что делает |
| --- | --- | --- |
| `display` | `block`, `inline`, `inline-block`, `flex`, `grid`, `none` | Меняет тип бокса и то, как элемент участвует в раскладке |
| `box-sizing` | `content-box` (дефолт), `border-box` | Включает ли `width` в себя padding и border |
| `position` | `static`, `relative`, `absolute`, `fixed`, `sticky` | Якорит элемент внутри или вне обычного потока |
| `top / right / bottom / left` | length, %, `auto` | Смещения для позиционированных и sticky-элементов |
| `z-index` | целое, `auto` | Порядок в стеке внутри stacking context |
| `overflow` | `visible`, `hidden`, `scroll`, `auto` | Что происходит с контентом больше бокса |
| `width / height` | length, %, `auto` | Размеры бокса (помните про border-box) |
| `min-width / max-width` | length, %, `none` | Ограничения размера |
| `float` | `left`, `right`, `none` | Выводит бокс из потока (легаси) |
| `clear` | `left`, `right`, `both` | Отталкивает бокс вниз под предшествующими float |

`display: flex` и `display: grid` — рабочие лошади современного layout, и большинство остальных строк этой таблицы существуют, чтобы служить им. `display: none` убирает элемент из раскладки полностью, а `visibility: hidden` сохраняет его место — разница важна, когда вы переключаете UI-элементы.

## Визуальные свойства

| Свойство | Типичные значения | Что делает |
| --- | --- | --- |
| `color` | любой цвет | Цвет текста |
| `background` | цвет, изображение, позиция, размер | Фоны (shorthand) |
| `background-color` | цвет | Заполнение под контентом и padding |
| `background-image` | `url(...)`, градиенты | Слои изображений или градиентов, через запятую |
| `background-size` | `cover`, `contain`, length | Как изображение заполняет бокс |
| `border` | `1px solid #ccc` | Кромка: ширина + стиль + цвет |
| `border-top / right / bottom / left` | те же три части, одна сторона | Бордеры по сторонам |
| `border-radius` | length, % | Скругление углов (от 1 до 4 значений) |
| `box-shadow` | `x y blur spread color` | Тень снаружи бордера, без влияния на layout |
| `opacity` | от 0 до 1 | Прозрачность всего бокса (включая детей) |
| `outline` | `2px solid blue` | Кольцо вне layout, обычно для focus |
| `cursor` | `pointer`, `not-allowed`, … | Курсор мыши над элементом |
| `filter` | `blur(4px)`, `grayscale(1)` | Визуальные эффекты над отрисованным боксом |

Цвет записывается несколькими способами, все работают в современных браузерах: `red`, `#f80`, `#ff8800`, `rgb(255, 136, 0)`, современный синтаксис с пробелами `rgb(255 136 0 / 0.5)` с альфой, `hsl(25 100% 50%)` и `currentcolor`, который наследует собственный `color` элемента.

## Типографика и текст

| Свойство | Типичные значения | Что делает |
| --- | --- | --- |
| `font-family` | `"Inter", system-ui, sans-serif` | Стек шрифтов, побеждает первый доступный |
| `font-size` | `16px`, `1rem`, `1.5em`, `clamp(…)` | Размер глифов |
| `font-weight` | от 100 до 900, `normal`, `bold` | Насыщенность (700 — bold) |
| `line-height` | `1.6`, `24px` | Расстояние между строками; предпочтителен безразмерный множитель |
| `letter-spacing` | `-0.02em`, `1px` | Пространство между буквами |
| `text-align` | `left`, `center`, `right`, `justify` | Горизонтальное выравнивание текста |
| `text-transform` | `uppercase`, `capitalize`, … | Рендер регистра |
| `text-decoration` | `underline`, `none`, `line-through` | Подчёркивание, зачёркивание и их стиль |
| `white-space` | `normal`, `nowrap`, `pre-wrap` | Переносы и обработка пробельных символов |
| `overflow-wrap` | `break-word`, `anywhere` | Перенос длинных слов, вылезающих наружу |
| `text-overflow` | `ellipsis` | Обрезка переполнения на `…` (с `nowrap`) |

Правила читабельности, которые встречаются в каждой дизайн-системе: базовый текст 16–18 px, line-height 1.5–1.7, длина строки 45–75 символов (`max-width` около 640–720 px) и заголовки с лёгким отрицательным `letter-spacing`, обычно `-0.01em`…`-0.03em`.

> **TIP**
> Задайте `font-size` на `html` (например, 16 px) размечайте всё остальное в `rem`. Тогда одно изменение корня перескалирует весь дизайн, а `rem` остаётся корректным при любой глубине вложения.

## Свойства, которые никто не помнит

| Свойство | Почему важно |
| --- | --- |
| `user-select: none` | Отключает выделение текста (лейблы, drag-элементы) |
| `pointer-events: none` | Элемент игнорирует мышь (оверлеи) |
| `pointer-events: auto` | Возвращает интерактивность ребёнку внутри `none`-родителя |
| `contain: content` | Изоляция layout и производительности; также останавливает margin collapse |
| `aspect-ratio: 16 / 9` | Держит пропорции бокса (видео, карточки, аватары) |
| `gap` | Пространство между flex/grid-элементами — современная замена возне с margin |
| `scroll-behavior: smooth` | Плавный скролл к якорям |
| `object-fit: cover` | Как изображение заполняет бокс (в паре с `object-position`) |

> **WARNING**
> `line-height: 1.6` — безразмерный множитель font-size элемента. Значение `1.6px` — это баг округления, который ждёт своего часа. Используйте безразмерные множители для текста, а абсолютные значения — только когда вы их реально имеете в виду.
