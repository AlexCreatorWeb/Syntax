---
id: css-animation
track: css
type: guide
section: visuals
order: 6
title:
  en: "Transitions & Animation"
  ru: "Transition и анимации"
excerpt:
  en: "When to use a transition versus a keyframe animation, the full syntax of both, and why transform and opacity are the only properties that stay smooth."
  ru: "Когда нужен transition, а когда keyframe-анимация, полный синтаксис обоих и почему плавными остаются только transform и opacity."
version: "css3"
updated: 2026-09-03
relatedTask: css-009
---

Motion in CSS has two engines: `transition` animates the path between two states when a property changes, and `@keyframes` define a multi-step timeline that runs on its own. Knowing which engine to reach for — and how to keep animations at 60 fps — is what this page is about.

## Transitions

A transition says: "when this property changes, do not jump — interpolate over a duration". The classic case is a hover effect:

```css
.card {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgb(0 0 0 / 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgb(0 0 0 / 0.15);
}
```

The shorthand is `transition: property duration timing-function delay` — declare it on the base state, not on `:hover`. The browser reads the transition from the state it is moving toward, so declaring it only on hover makes the "un-hover" snap back instantly.

Multiple properties are comma-separated, each with its own duration and easing. The `timing-function` shapes the curve: `ease` (the default, slow-fast-slow), `linear`, `ease-in`, `ease-out`, or a custom Bezier such as `cubic-bezier(0.2, 0, 0, 1)`. The value `transition: all 0.3s` works, but it is a habit to avoid — it also animates properties you never meant to.

> **WARNING**
> The most common transition bug is declaring the effect only on `:hover`. Moving in animates, moving out snaps. Declare the transition on the element's base rule and both directions animate smoothly.

## @keyframes

Keyframes define a timeline: a named sequence of states the browser steps through over a duration:

```css
@keyframes pulse {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.dot {
  animation: pulse 1s infinite;
}
```

Percentages are optional: `from` means 0%, `to` means 100%, and any intermediate stop is a named percentage. Between the stops the browser interpolates every animatable property. A timeline can hold as many properties as you like — a card that slides in while fading is one declaration:

```css
@keyframes slide-in {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

### The animation property

`animation` is a shorthand of: `name duration [timing-function] [delay] [iteration-count] [direction] [fill-mode] [play-state]`. An element can run several animations at once, comma-separated:

```css
.badge {
  animation:
    slide-in 0.4s ease-out,
    pulse 2s ease-in-out 0.4s infinite; /* starts after slide-in, loops */
}
```

The parts worth knowing: `infinite` loops the timeline forever; a `delay` postpones the start; `direction: alternate` reverses every second pass, so the motion ping-pongs instead of jumping back; `fill-mode: forwards` keeps the last keyframe's values after the animation ends, and `backwards` applies the first keyframe during the delay.

> **TIP**
> `animation-fill-mode: forwards` is the answer to "my element snaps back after the animation". Without it, the element returns to its normal style the moment the timeline ends. For a one-shot entrance effect, `forwards` is almost always what you want.

## Performance: the compositor's favorites

Browsers can animate some properties on the compositor thread — no layout, no repaint, just GPU compositing. Those stay smooth even when the main thread is busy:

| Property | Smooth? | Why |
| --- | --- | --- |
| `transform` | yes | compositor: move, scale, rotate |
| `opacity` | yes | compositor: fade |
| `box-shadow` | mostly | repaint only, no layout |
| `width` / `height` / `top` / `left` | no | layout recalculation on every frame |
| `margin`, `padding` | no | layout recalculation on every frame |

The practical rule: animate `transform` and `opacity`. A "slide" is `transform: translateX(...)`, not an animating `left`; a "grow" is `transform: scale(...)`, not an animating `width`. If you must animate a layout property, keep the duration short and the subtree small.

`will-change: transform` promotes an element to its own compositor layer ahead of time — useful for a hero animation you know is coming, harmful in bulk because every layer costs memory. And always respect the user's preference:

```css
@media (prefers-reduced-motion: reduce) {
  .card, .badge {
    animation: none;
    transition: none;
  }
}
```

> **TIP**
> Ship a `prefers-reduced-motion` block in every project that has motion. It is three lines, and it makes the site pleasant for people who would otherwise have to disable animations system-wide.

## Common mistakes

A `transition: all 2s` on a card, which makes the whole layout feel sluggish. Keyframes with `top`/`left` on a fixed element — janky on every low-end phone. Forgetting `fill-mode` and losing the end state. Animating between very different pixel values where a relative transform would do. And stacking two animations on the same property — the last one wins, so give each timeline its own property.

The properties worth bookmarking: `transition`, `@keyframes`, `animation`, `animation-fill-mode`, `transform`, `opacity`, `will-change` — and the `prefers-reduced-motion` media query.

<!-- RU -->

Движение в CSS имеет два двигателя: `transition` анимирует путь между двумя состояниями, когда свойство меняется, а `@keyframes` задают многошаговую таймлайн, которая запускается сама по себе. Знание, к какому двигателю обращаться — и как держать анимации на 60 fps — это и есть тема страницы.

## Transition

Transition говорит: «когда это свойство изменится — не прыгай, интерполируй в течение длительности». Классический случай — hover-эффект:

```css
.card {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgb(0 0 0 / 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgb(0 0 0 / 0.15);
}
```

Shorthand: `transition: property duration timing-function delay` — объявляйте его в базовом состоянии, а не в `:hover`. Браузер читает transition из того состояния, к которому движется, поэтому объявление только в hover делает возврат в базовое состояние мгновенным.

Несколько свойств разделяются запятой, у каждого своя длительность и easing. `timing-function` задаёт форму кривой: `ease` (дефолт, медленно-быстро-медленно), `linear`, `ease-in`, `ease-out` или кастомная кривая вроде `cubic-bezier(0.2, 0, 0, 1)`. Значение `transition: all 0.3s` работает, но это привычка, от которой стоит отказаться — оно анимирует и те свойства, которые вы не имели в виду.

> **WARNING**
> Самый частый transition-баг — объявление эффекта только в `:hover`. Заход анимируется, уход — прыгает. Объявите transition в базовом правиле элемента, и оба направления будут анимироваться плавно.

## @keyframes

Keyframes задают таймлайн: именованную последовательность состояний, по которым браузер проходит в течение длительности:

```css
@keyframes pulse {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.dot {
  animation: pulse 1s infinite;
}
```

Проценты опциональны: `from` означает 0%, `to` — 100%, а любые промежуточные остановки — именованные проценты. Между остановками браузер интерполирует каждое анимабельное свойство. В таймлайне может быть сколько угодно свойств — карточка, которая въезжает и появляется, — это одно объявление:

```css
@keyframes slide-in {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

### Свойство animation

`animation` — это shorthand: `name duration [timing-function] [delay] [iteration-count] [direction] [fill-mode] [play-state]`. Элемент может запускать несколько анимаций разом, через запятую:

```css
.badge {
  animation:
    slide-in 0.4s ease-out,
    pulse 2s ease-in-out 0.4s infinite; /* стартует после slide-in, зациклена */
}
```

Части, которые стоит знать: `infinite` зацикливает таймлайн навсегда; `delay` откладывает старт; `direction: alternate` разворачивает каждый второй проход — движение пинг-понгом, а не прыжком назад; `fill-mode: forwards` держит значения последнего keyframe после окончания анимации, а `backwards` применяет первый keyframe во время delay.

> **TIP**
> `animation-fill-mode: forwards` — ответ на «мой элемент прыгает назад после анимации». Без него элемент возвращается к обычным стилям в момент окончания таймлайна. Для разового entrance-эффекта почти всегда нужен именно `forwards`.

## Производительность: любимцы композитора

Браузер может анимировать некоторые свойства на compositor-потоке — без layout, без перерисовки, только GPU-композитинг. Они остаются плавными, даже когда основной поток занят:

| Свойство | Плавно? | Почему |
| --- | --- | --- |
| `transform` | да | композитор: сдвиг, масштаб, поворот |
| `opacity` | да | композитор: затухание |
| `box-shadow` | почти | только перерисовка, без layout |
| `width` / `height` / `top` / `left` | нет | пересчёт layout на каждом кадре |
| `margin`, `padding` | нет | пересчёт layout на каждом кадре |

Практическое правило: анимируйте `transform` и `opacity`. «Сдвиг» — это `transform: translateX(...)`, а не анимируемый `left`; «рост» — `transform: scale(...)`, а не анимируемый `width`. Если приходится анимировать layout-свойство — держите длительность короткой и поддерево маленьким.

`will-change: transform` поднимает элемент на собственный compositor-слой заранее — полезно для hero-анимации, которую вы знаете заранее, вредно в массовом порядке, потому что каждый слой стоит памяти. И всегда уважайте настройку пользователя:

```css
@media (prefers-reduced-motion: reduce) {
  .card, .badge {
    animation: none;
    transition: none;
  }
}
```

> **TIP**
> Выпускайте блок `prefers-reduced-motion` в каждом проекте с движением. Это три строки, и они делают сайт приятным для людей, которым иначе пришлось бы выключать анимации во всём系统中.

## Частые ошибки

`transition: all 2s` на карточке, из-за которого весь layout кажется вязким. Keyframes с `top`/`left` на fixed-элементе — дёрганье на каждом слабом телефоне. Забывание `fill-mode` и потеря конечного состояния. Анимация между сильно разными пиксельными значениями, где справился бы относительный transform. И наложение двух анимаций на одно свойство — побеждает последняя, поэтому давайте каждой таймлайну своё свойство.

Свойства, которые стоит запомнить: `transition`, `@keyframes`, `animation`, `animation-fill-mode`, `transform`, `opacity`, `will-change` — и media query `prefers-reduced-motion`.
