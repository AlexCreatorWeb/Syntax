---
id: css-shorthand
track: css
type: reference
section: reference
order: 4
title:
  en: "Shorthand Cheat Sheet"
  ru: "Shorthand-шпаргалка"
excerpt:
  en: "padding, margin, border, background, font, flex, grid, transition, animation — the syntax of each shorthand and the silent resets they perform."
  ru: "padding, margin, border, background, font, flex, grid, transition, animation — синтаксис каждого сокращения и тихие сбросы, которые они выполняют."
version: "css3"
updated: 2026-09-03
---

Shorthands compress several longhand properties into one declaration. They are faster to write and — the part people forget — setting a shorthand resets every longhand it covers to its default. This page is the syntax reference plus the reset traps.

## Spacing and borders

| Shorthand | Parts (order) | Example |
| --- | --- | --- |
| `padding` / `margin` | 1 to 4 lengths: top, right, bottom, left | `margin: 8px 16px` = 8 vertical, 16 horizontal |
| `border` | width, style, color (any order) | `border: 1px solid #e5e7eb` |
| `border-top / right / bottom / left` | the same three parts, one side | `border-bottom: 2px dashed gray` |
| `border-radius` | 1 to 4 lengths: TL, TR, BR, BL | `border-radius: 12px 0 12px 0` |
| `outline` | width, style, color | `outline: 2px solid blue` |
| `inset` | 1 to 4 offsets: top, right, bottom, left | `inset: 0` = all four offsets zero |

The 1-to-4 value pattern is shared by `padding`, `margin` and `inset`: one value means all sides; two means top/bottom plus left/right; three means top, left/right, bottom; four goes clockwise from the top. `border-radius` follows the same clockwise logic for the four corners.

> **WARNING**
> `border: 1px solid` resets all four sides at once. A later `border-left: 4px` works fine, but a later `border: none` wipes the left border you set separately. Shorthands reset; longhands never do — when in doubt, write the longhand.

## Layout shorthands

| Shorthand | Parts (order) | Example |
| --- | --- | --- |
| `flex` | grow, shrink, basis | `flex: 1 1 160px` |
| `flex-flow` | wrap, direction | `flex-flow: row wrap` |
| `gap` | row-gap, column-gap | `gap: 8px 16px` |
| `place-items` | align-items, justify-items | `place-items: center` |
| `place-content` | align-content, justify-content | `place-content: center` |
| `grid-template` | rows, columns, areas (in one line) | `grid-template: "a b" 100px / 1fr 2fr` |
| `grid-area` | row-start col-start row-end col-end, or a name | `grid-area: 1 / 1 / 3 / 3` |
| `grid-column` / `grid-row` | start / end, or span | `grid-column: 2 / span 2` |

### The flex reset trap

`flex: 1` expands to `flex-grow: 1; flex-shrink: 1; flex-basis: 0%`. So this rule looks innocent and is not:

```css
.item {
  width: 200px;
  flex: 1; /* the basis 0% overrides the width in a row */
}
```

The basis wins over the main-axis size. If you want a fixed-size flex item, write the explicit form: `flex: 0 0 200px` — no surprises, and the next person reading it knows exactly what happens.

## Text and motion shorthands

| Shorthand | Parts (order) | Example |
| --- | --- | --- |
| `font` | style, weight, size/line-height, family (size and family REQUIRED) | `font: 700 16px/1.5 Inter, sans-serif` |
| `background` | position/size, image, color, repeat, attachment, origin, clip | `background: url(bg.png) center / cover no-repeat` |
| `list-style` | position, image, type | `list-style: none` |
| `transition` | property, duration, timing, delay (comma lists) | `transition: opacity 0.3s ease 0.1s` |
| `animation` | name, duration, timing, delay, count, direction, fill, play-state | `animation: pulse 1s ease-in-out infinite` |
| `text-decoration` | line, style, color, thickness | `text-decoration: underline red 2px` |

`background` is the most permissive shorthand: you can write `background: url(x.png) center / cover no-repeat` and the browser figures out which value is which by its type. `font` is the strictest: without both size and family the declaration is simply invalid and silently ignored — a common "why did my font rule vanish" bug.

> **TIP**
> Use `transition` with explicit properties — `transition: transform 0.2s, opacity 0.2s` — never `transition: all`. `all` animates every animatable property on the element, including ones you set for a different effect, and it makes performance profiling a guessing game.

### Shorthands that silently reset

| Setting this… | Also resets |
| --- | --- |
| `background` | every `background-*` longhand: image, position, color, repeat, … |
| `border` | width, style and color of all four sides |
| `padding` / `margin` / `inset` | the sides you did not list |
| `flex` | grow, shrink and basis |
| `font` | all `font-*` properties |
| `outline` | outline-width, -style, -color, -offset |
| `transition` | the whole transition list (it is a list, not additive) |
| `animation` | the whole animation list |
| `grid-template` | grid-template-rows, -columns and -areas |

The rule of thumb: if you need to keep a longhand value, declare the longhand, or repeat the value inside the shorthand.

> **WARNING**
> `transition` and `animation` are lists: a second declaration fully replaces the first. Writing `transition: color 0.2s; transition: opacity 0.3s;` ends with only opacity animated — a classic source of "half of my hover effect is instant" bugs.

<!-- RU -->

Shorthand-сокращения сжимают несколько longhand-свойств в одну декларацию. Писать их быстрее, и — то, что люди забывают — установка shorthand сбрасывает каждый покрываемый longhand до дефолта. Эта страница — справочник по синтаксису плюс ловушки сбросов.

## Отступы и бордеры

| Shorthand | Части (порядок) | Пример |
| --- | --- | --- |
| `padding` / `margin` | от 1 до 4 длин: top, right, bottom, left | `margin: 8px 16px` = 8 вертикально, 16 горизонтально |
| `border` | ширина, стиль, цвет (в любом порядке) | `border: 1px solid #e5e7eb` |
| `border-top / right / bottom / left` | те же три части, одна сторона | `border-bottom: 2px dashed gray` |
| `border-radius` | от 1 до 4 длин: TL, TR, BR, BL | `border-radius: 12px 0 12px 0` |
| `outline` | ширина, стиль, цвет | `outline: 2px solid blue` |
| `inset` | от 1 до 4 смещений: top, right, bottom, left | `inset: 0` = все четыре смещения нулевые |

Паттерн «от 1 до 4 значений» общий для `padding`, `margin` и `inset`: одно значение — все стороны; два — top/bottom плюс left/right; три — top, left/right, bottom; четыре — по часовой стрелке от верха. `border-radius` следует той же логике по часовой стрелки для четырёх углов.

> **WARNING**
> `border: 1px solid` сбрасывает все четыре стороны разом. Позднее `border-left: 4px` работает нормально, но позднее `border: none` сотрёт левый бордер, который вы задали отдельно. Shorthand сбрасывают, longhand никогда — сомневаетесь, пишите longhand.

## Layout-сокращения

| Shorthand | Части (порядок) | Пример |
| --- | --- | --- |
| `flex` | grow, shrink, basis | `flex: 1 1 160px` |
| `flex-flow` | wrap, direction | `flex-flow: row wrap` |
| `gap` | row-gap, column-gap | `gap: 8px 16px` |
| `place-items` | align-items, justify-items | `place-items: center` |
| `place-content` | align-content, justify-content | `place-content: center` |
| `grid-template` | строки, колонки, области (в одну строку) | `grid-template: "a b" 100px / 1fr 2fr` |
| `grid-area` | row-start col-start row-end col-end, либо имя | `grid-area: 1 / 1 / 3 / 3` |
| `grid-column` / `grid-row` | start / end, либо span | `grid-column: 2 / span 2` |

### Ловушка сброса flex

`flex: 1` раскрывается в `flex-grow: 1; flex-shrink: 1; flex-basis: 0%`. Поэтому это правило выглядит невинным, а не является им:

```css
.item {
  width: 200px;
  flex: 1; /* basis 0% перебивает width в ряду */
}
```

Basis побеждает размер по главной оси. Если нужен flex-элемент фиксированного размера, пишите явную форму: `flex: 0 0 200px` — без сюрпризов, и следующий человек, читающий код, точно знает, что произойдёт.

## Типографические и motion-сокращения

| Shorthand | Части (порядок) | Пример |
| --- | --- | --- |
| `font` | style, weight, size/line-height, family (size и family ОБЯЗАТЕЛЬНЫ) | `font: 700 16px/1.5 Inter, sans-serif` |
| `background` | position/size, image, color, repeat, attachment, origin, clip | `background: url(bg.png) center / cover no-repeat` |
| `list-style` | position, image, type | `list-style: none` |
| `transition` | property, duration, timing, delay (через запятую) | `transition: opacity 0.3s ease 0.1s` |
| `animation` | name, duration, timing, delay, count, direction, fill, play-state | `animation: pulse 1s ease-in-out infinite` |
| `text-decoration` | line, style, color, thickness | `text-decoration: underline red 2px` |

`background` — самый терпимый shorthand: можно написать `background: url(x.png) center / cover no-repeat`, и браузер разберётся, какое значение какое, по типу. `font` — самый строгий: без размера и family декларация просто невалидна и молча игнорируется — частый баг «почему моё font-правило пропало».

> **TIP**
> Используйте `transition` с явными свойствами — `transition: transform 0.2s, opacity 0.2s` — никогда `transition: all`. `all` анимирует каждое анимабельное свойство элемента, включая те, что вы задали для другого эффекта, и превращает перформанс-профилирование в гадание.

### Shorthand, которые молча сбрасывают

| Ставите это… | Сбрасываются ещё |
| --- | --- |
| `background` | все `background-*` longhand: image, position, color, repeat, … |
| `border` | ширина, стиль и цвет всех четырёх сторон |
| `padding` / `margin` / `inset` | стороны, которые вы не перечислили |
| `flex` | grow, shrink и basis |
| `font` | все `font-*` свойства |
| `outline` | outline-width, -style, -color, -offset |
| `transition` | весь transition-список (это список, а не аддитивно) |
| `animation` | весь animation-список |
| `grid-template` | grid-template-rows, -columns и -areas |

Правило-ориентир: если нужно сохранить longhand-значение — объявляйте longhand либо повторяйте значение внутри shorthand.

> **WARNING**
> `transition` и `animation` — списки: вторая декларация полностью заменяет первую. Написав `transition: color 0.2s; transition: opacity 0.3s;`, вы получите анимацию только opacity — классический источник багов «половина моего hover-эффекта мгновенная».
