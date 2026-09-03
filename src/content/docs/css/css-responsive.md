---
id: css-responsive
track: css
type: guide
section: responsive
order: 5
title:
  en: "Responsive Design & Media Queries"
  ru: "Адаптивная вёрстка и media queries"
excerpt:
  en: "The viewport tag, mobile-first media queries, fluid values with clamp(), and the container queries that let a component adapt to its own box."
  ru: "Viewport-тег, mobile-first media queries, fluid-значения через clamp() и container queries, которые позволяют компоненту адаптироваться к своему контейнеру."
version: "css3"
updated: 2026-09-03
---

Responsive design is the promise that one codebase serves every screen. The toolchain: a viewport that matches the device, media queries that branch on its size, fluid values that scale between the branches, and container queries that react to a component's own space. This page covers the full chain from the meta tag to a working adaptive layout.

## The viewport meta tag

Phones and tablets report a "virtual" viewport of about 980 px wide by default — the page is rendered as a tiny desktop and zoomed out. The meta tag makes the viewport equal the device's real width:

```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

Without this line most mobile media queries never fire, because the browser keeps pretending the screen is 980 px. Put it in the head of every document; in practice it is part of your HTML template forever, next to the charset line.

## Media queries

A media query applies CSS conditionally on a feature of the environment — most often the viewport width:

```css
/* Base styles: one column (mobile) */
.content { display: grid; grid-template-columns: 1fr; }

/* Tablet and up: two columns */
@media (min-width: 640px) {
  .content { grid-template-columns: 1fr 1fr; }
}

/* Desktop and up: three columns */
@media (min-width: 1024px) {
  .content { grid-template-columns: repeat(3, 1fr); }
}
```

This is mobile-first: the base styles target the smallest screen, and each media query adds capability as space appears. The alternative — desktop-first with `max-width` — also works, but mobile-first keeps the default simple and the exceptions additive, which is easier to read and easier to remove.

### Choosing breakpoints

Breakpoints are a property of your content, not of any device model. Set them where the layout actually breaks: text lines get too long, columns get too cramped, a card's basis no longer fits. Typical starting points are around 640 px (phone landscape), 768–900 px (tablet) and 1024–1280 px (laptop) — then adjust per project.

> **WARNING**
> The most common mistake is writing media queries per device — "for iPhone 15", "for iPad Pro". Devices come and go; a layout that branches on pixel widths works forever. Test at the widths where your content starts to look wrong, and add breakpoints only there.

You can combine conditions — `@media (min-width: 640px) and (max-width: 900px)` — and query more than width: `prefers-color-scheme` for dark mode, `prefers-reduced-motion`, `orientation`, `pointer: coarse` for touch devices. Several media queries can also be listed comma-separated in one rule.

## Fluid values between breakpoints

Media queries are steps; fluid values are the ramp between the steps. Three workhorses.

`clamp(min, preferred, max)` picks the preferred value but never lets it leave the min-to-max corridor:

```css
h1 {
  /* grows from 24px to 40px as the viewport grows from 320px to 1200px */
  font-size: clamp(24px, 4vw + 8px, 40px);
}

.hero { padding: clamp(24px, 5vw, 64px); }
```

Percentages and `fr` make tracks fluid by construction, and `vw`/`vh` — one percent of the viewport width and height — tie values directly to the window. The classic trap: `100vw` includes the scrollbar gutter, so a full-bleed `width: 100vw` causes a horizontal scrollbar on desktop. Prefer `width: 100%` of the layout container, or accept the quirk deliberately.

> **TIP**
> The practical recipe is hybrid: mobile-first steps for structural changes (columns appear, the sidebar moves) plus `clamp()` for everything that can scale smoothly — font sizes, paddings, image sizes. Steps for topology, ramps for proportions.

### Images and media

The minimum viable rule for images:

```css
img { max-width: 100%; height: auto; }
```

The image never overflows its container and keeps its aspect ratio. For downloads, `srcset` and `sizes` (in HTML, not CSS) let the browser pick a properly sized file instead of pulling a 4K original onto a phone screen.

## Container queries

Media queries react to the viewport; container queries react to the nearest container that declared itself as a query context:

```css
.card__context {
  container-type: inline-size;
  container-name: card;
}

@container card (min-width: 400px) {
  .card__media { float: left; margin-right: 16px; }
  .card__title { font-size: 24px; }
}
```

Now the same card component renders stacked vertically in a narrow sidebar and side-by-side in a wide main column — with zero knowledge of the viewport. This is what makes truly reusable components possible: the component styles itself against its own space, wherever it is dropped.

## A working responsive page

Putting the chain together:

```css
:root {
  --step-0: clamp(1rem, 0.9rem + 0.5vw, 1.25rem);
}

.page {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

@media (min-width: 900px) {
  .page {
    grid-template-columns: 240px 1fr;
    padding: 40px;
  }
}
```

Mobile: a single column with 24 px gutters and a fluid base font. Desktop: a sidebar appears, gutters grow — and the content CSS between the two is identical.

## Common mistakes

The missing viewport meta — the classic "works on desktop, zoomed out on a phone". Desktop-first `max-width` with a mobile base that is never actually tested. Fixed pixel widths on the outer container, where `max-width` plus `margin: 0 auto` belongs instead. Forgetting that `vw` units do not account for the scrollbar. And building every breakpoint by hand, instead of letting `auto-fit`/`minmax` or `clamp()` handle the intermediate sizes.

> **TIP**
> Resize the devtools window continuously while developing the layout instead of checking three fixed widths. Watching the transition points live is the fastest way to find the breakpoints your content actually needs.

<!-- RU -->

Адаптивный дизайн — это обещание, что один кодовый базис обслуживает любой экран. Инструменты: viewport, совпадающий с устройством; media queries, разветвляющие стили по его размеру; fluid-значения, масштабирующиеся между разветвлениями; и container queries, реагирующие на собственное пространство компонента. Эта страница проходит всю цепочку — от meta-тега до работающей адаптивной раскладки.

## Viewport-тег

Телефоны и планшеты по умолчанию сообщают «виртуальный» viewport шириной около 980 px — страница рендерится как крошечный десктоп и уменьщается. Meta-тег делает viewport равным реальной ширине устройства:

```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

Без этой строки большинство мобильных media queries никогда не срабатывают, потому что браузер продолжает считать экран 980 px. Поставьте её в head каждого документа; на практике это часть вашего HTML-шаблона навсегда, рядом с charset-строчкой.

## Media queries

Media query применяет CSS условно — в зависимости от характеристики окружения, чаще всего ширины viewport:

```css
/* Базовые стили: одна колонка (мобилка) */
.content { display: grid; grid-template-columns: 1fr; }

/* Планшет и шире: две колонки */
@media (min-width: 640px) {
  .content { grid-template-columns: 1fr 1fr; }
}

/* Десктоп и шире: три колонки */
@media (min-width: 1024px) {
  .content { grid-template-columns: repeat(3, 1fr); }
}
```

Это mobile-first: базовые стили нацелены на самый маленький экран, и каждый media query добавляет возможности по мере появления места. Альтернатива — desktop-first с `max-width` — тоже работает, но mobile-first держит дефолт простым, а исключения — добавляемыми; это легче читать и легче выкидывать.

### Выбор точек перелома

Breakpoints — свойство вашего контента, а не какой-то модели устройства. Ставьте их там, где раскладка реально ломается: строки текста становятся слишком длинными, колонки слишком тесными, basis карточки перестаёт помещаться. Типичные стартовые значения — около 640 px (горизонтальный телефон), 768–900 px (планшет) и 1024–1280 px (ноутбук) — дальше подгоняйте под проект.

> **WARNING**
> Самая частая ошибка — писать media queries под конкретные устройства: «для iPhone 15», «для iPad Pro». Устройства приходят и уходят, а раскладка, разветвлённая по пиксельным ширинам, работает вечно. Тестируйте на ширинах, где контент начинает выглядеть плохо, и добавляйте breakpoints только там.

Условия можно сочетать — `@media (min-width: 640px) and (max-width: 900px)` — и опрашивать не только ширину: `prefers-color-scheme` для тёмной темы, `prefers-reduced-motion`, `orientation`, `pointer: coarse` для тач-устройств. Несколько media queries можно перечислить через запятую в одном правиле.

## Fluid-значения между breakpoints

Media queries — это ступеньки, а fluid-значения — рампа между ними. Три рабочие лошадки.

`clamp(min, preferred, max)` выбирает желаемое значение, но не даёт ему выйти из коридора min–max:

```css
h1 {
  /* растёт с 24px до 40px, когда viewport растёт с 320px до 1200px */
  font-size: clamp(24px, 4vw + 8px, 40px);
}

.hero { padding: clamp(24px, 5vw, 64px); }
```

Проценты и `fr` делают треки жидкими по построению, а `vw`/`vh` — по одному проценту ширины и высоты viewport — привязывают значения прямо к окну. Классическая ловушка: `100vw` включает зону под скроллбар, поэтому full-bleed `width: 100vw` вызывает горизонтальный скролл на десктопе. Предпочитайте `width: 100%` layout-контейнера — либо принимайте этот квирк осознанно.

> **TIP**
> Практический рецепт — гибридный: mobile-first ступеньки для структурных изменений (появляются колонки, sidebar меняет место) плюс `clamp()` для всего, что может масштабироваться плавно — размеры шрифта, padding, размеры изображений. Ступеньки для топологии, рампы для пропорций.

### Изображения и медиа

Минимально жизнеспособное правило для изображений:

```css
img { max-width: 100%; height: auto; }
```

Изображение никогда не переполняет контейнер и сохраняет пропорции. Для загрузки `srcset` и `sizes` (в HTML, не в CSS) позволяют браузеру выбрать файл нужного размера вместо того, тащить 4K-оригинал на телефонный экран.

## Container queries

Media queries реагируют на viewport; container queries — на ближайший контейнер, объявивший себя контекстом запроса:

```css
.card__context {
  container-type: inline-size;
  container-name: card;
}

@container card (min-width: 400px) {
  .card__media { float: left; margin-right: 16px; }
  .card__title { font-size: 24px; }
}
```

Теперь один и тот же компонент карточки рендерится стопкой в узком sidebar и бок о бок в широкой main-колонке — при полном незнании viewport. Это то, что делает по-настоящему переиспользуемые компоненты возможными: компонент стилизует себя под собственное пространство, где бы его ни разместили.

## Рабочая адаптивная страница

Собираем цепочку воедино:

```css
:root {
  --step-0: clamp(1rem, 0.9rem + 0.5vw, 1.25rem);
}

.page {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

@media (min-width: 900px) {
  .page {
    grid-template-columns: 240px 1fr;
    padding: 40px;
  }
}
```

Мобилка: одна колонка с 24 px отступами и fluid-базовым шрифтом. Десктоп: появляется sidebar, отступы растут — а CSS контента между двумя состояниями идентичен.

## Частые ошибки

Отсутствие viewport-meta — классика: «на десктопе работает, на телефоне уезжает в уменьшение». Desktop-first с `max-width` и мобильным базисом, который никогда реально не тестируют. Фиксированные пиксельные ширины на внешнем контейнере, где должны быть `max-width` плюс `margin: 0 auto`. Забывание, что `vw`-единицы не учитывают скроллбар. И ручная постройка каждого breakpoint вместо того, чтобы `auto-fit`/`minmax` или `clamp()` обрабатывали промежуточные размеры.

> **TIP**
> Во время разработки раскладки непрерывно меняйте размер окна devtools, а не проверяйте три фиксированные ширины. Наблюдать за точками перехода вживую — самый быстрый способ найти breakpoints, которые вашему контенту реально нужны.
