---
id: css-units
track: css
type: reference
section: reference
order: 2
title:
  en: "Units & Values"
  ru: "Единицы и значения"
excerpt:
  en: "px vs rem vs em vs vw — what each unit resolves against, with worked examples, plus angle, time, percentage and color value formats."
  ru: "px против rem против em против vw — от чего считается каждая единица, с примерами расчёта, плюс форматы значений: углы, время, проценты и цвета."
version: "css3"
updated: 2026-09-03
---

Units decide how far a value reaches. The trap is that several units resolve against different things — the element's own font-size, the parent's font-size, or the viewport — and mixing them up silently is a classic subtle bug. This page is the lookup: what each unit resolves against and when to reach for it.

## Length units

| Unit | Resolves against | Typical use |
| --- | --- | --- |
| `px` | 1 device-independent pixel | Borders, icons, small fixed sizes |
| `em` | the element's OWN font-size | Padding that should scale with the element |
| `rem` | the root (`html`) font-size | Font sizes and spacing that scale with user settings |
| `%` | per-property reference (see below) | Relative widths, gutters |
| `vw` / `vh` | 1% of viewport width / height | Hero text, full-bleed sections |
| `vmin` / `vmax` | 1% of the smaller / larger viewport edge | Decorative sizing in any orientation |
| `ch` | the width of the "0" glyph | Line lengths (`min-width: 30ch`) |
| `fr` | free space in a grid track | Grid tracks only |
| `ex` | the x-height of the font | Rare |

### The em/rem worked example

Assume the root is `html { font-size: 16px }`.

```css
button {
  font-size: 1.25rem;  /* 20px — computed from the ROOT, not the button */
  padding: 0.5em 1em;  /* 10px 20px — computed from the BUTTON's 20px */
}
```

`rem` is predictable: 1.25 rem is 20 px (at a 16 px root) no matter where the rule sits in the file. `em` is relative: the same `0.5em` padding is 8 px on a 16 px element and 12 px on a 24 px element — which is exactly what you want for spacing that should hug the text.

> **TIP**
> A convention that keeps projects consistent: font sizes in `rem`, padding and margin that belong to the element in `em`, layout widths in `%` / `fr` / `px`, and a handful of `clamp()` values for fluid scaling.

### Percentages resolve per property

`%` is not one unit — it is "a fraction of the corresponding property's reference". `width: 50%` is 50% of the parent's width; `margin: 10%` is 10% of the parent's WIDTH (yes, horizontal margins use width as reference); `top: 50%` is 50% of the containing block's HEIGHT; `font-size: 100%` is the parent's font-size. And `padding-top: 100%` is 100% of the parent's width — the classic trick for responsive square placeholders before `aspect-ratio` existed.

## Time, angle and other values

| Kind | Examples | Where |
| --- | --- | --- |
| Time | `0.3s`, `500ms` | `transition`, `animation`, delays |
| Angle | `45deg`, `0.75turn`, `1.5rad` | `transform: rotate()`, `conic-gradient()` |
| Number | `3`, `0.8`, `-0.02` | `z-index`, `scale(1.2)`, `opacity`, `line-height` |
| Percentage | `50%` | property-dependent (see above) |
| Color | `red`, `#0f0`, `rgb(0 255 0 / 0.5)`, `hsl(120 100% 50%)`, `currentcolor`, `transparent` | everywhere a color is allowed |
| Keywords | `auto`, `inherit`, `initial`, `unset`, `revert` | universal value keywords |

The universal keywords deserve a minute. `inherit` takes the parent's computed value. `initial` resets to the property's default. `unset` is `inherit` for inherited properties and `initial` for the rest. `revert` hands the decision back to the browser and user stylesheets. `auto` is per-property magic — margins centering, flex sizing — and usually means "the browser decides".

> **WARNING**
> `100vw` is wider than the page while a vertical scrollbar is visible — the scrollbar gutter is not viewport content. A full-bleed `width: 100vw` produces a horizontal scrollbar on desktop. Prefer `100%` of the containing block, or accept the quirk deliberately.

## Choosing the right unit

| You want | Use |
| --- | --- |
| The same size on every screen, every user setting | `px` (small details) or `rem` |
| Scales with the user's browser font setting | `rem` |
| Scales with the element's own text | `em` |
| A proportion of the parent | `%` |
| Tied to the window size | `vw` / `vh` / `vmin` / `vmax` |
| Text-proportional line lengths | `ch` |
| Fluid between two limits | `clamp(min, val, max)` |

> **TIP**
> `clamp()` is the modern answer to most responsive typography: one value instead of three media queries. Example: `font-size: clamp(1.25rem, 0.9rem + 1.5vw, 2rem)` — 20 px on a phone, 32 px on a desktop, smooth in between.

<!-- RU -->

Единицы определяют, насколько далеко дотягивается значение. Ловушка в том, что несколько единиц считаются от разных вещей — собственный font-size элемента, font-size родителя или viewport — и молчаливое их перепутывание — классический тонкий баг. Эта страница — шпаргалка: от чего считается каждая единица и когда за неё браться.

## Единицы длины

| Единица | Считается от | Типичное применение |
| --- | --- | --- |
| `px` | 1 device-independent пиксель | Бордеры, иконки, мелкие фиксированные размеры |
| `em` | СОБСТВЕННЫЙ font-size элемента | Padding, который должен масштабироваться с элементом |
| `rem` | font-size корня (`html`) | Размеры шрифта и отступы, масштабирующиеся с настройками пользователя |
| `%` | от-свойства референс (см. ниже) | Относительные ширины, gutter |
| `vw` / `vh` | 1% ширины / высоты viewport | Hero-текст, full-bleed секции |
| `vmin` / `vmax` | 1% меньшего / большего края viewport | Декоративные размеры в любой ориентации |
| `ch` | ширина глифы «0» | Длины строк (`min-width: 30ch`) |
| `fr` | свободное пространство grid-трека | Только grid-треки |
| `ex` | x-height шрифта | Редко |

### Рабочий пример em/rem

Пусть корень — `html { font-size: 16px }`.

```css
button {
  font-size: 1.25rem;  /* 20px — считается от КОРНЯ, а не от кнопки */
  padding: 0.5em 1em;  /* 10px 20px — считается от 20px самой КНОПКИ */
}
```

`rem` предсказуем: 1.25 rem — это 20 px (при корне 16 px), где бы ни стояло правило в файле. `em` относителен: тот же `0.5em` padding — это 8 px на элементе 16 px и 12 px на элементе 24 px — ровно то, что нужно отступам, которые должны прилипать к тексту.

> **TIP**
> Конвенция, которая держит проекты консистентными: размеры шрифта в `rem`, padding и margin, принадлежащие элементу, в `em`, ширины раскладки в `%` / `fr` / `px`, и несколько `clamp()`-значений для fluid-масштабирования.

### Проценты считаются по свойству

`%` — это не одна единица, а «доля от референса соответствующего свойства». `width: 50%` — 50% ширины родителя; `margin: 10%` — 10% ШИРИНЫ родителя (да, горизонтальные margin используют ширину как референс); `top: 50%` — 50% ВЫСОТЫ содержащего блока; `font-size: 100%` — font-size родителя. А `padding-top: 100%` — 100% ширины родителя — классический трюк для адаптивных квадратичных плашек, до появления `aspect-ratio`.

## Время, угол и другие значения

| Вид | Примеры | Где |
| --- | --- | --- |
| Время | `0.3s`, `500ms` | `transition`, `animation`, delay |
| Угол | `45deg`, `0.75turn`, `1.5rad` | `transform: rotate()`, `conic-gradient()` |
| Число | `3`, `0.8`, `-0.02` | `z-index`, `scale(1.2)`, `opacity`, `line-height` |
| Процент | `50%` | зависит от свойства (см. выше) |
| Цвет | `red`, `#0f0`, `rgb(0 255 0 / 0.5)`, `hsl(120 100% 50%)`, `currentcolor`, `transparent` | везде, где разрешён цвет |
| Ключевые слова | `auto`, `inherit`, `initial`, `unset`, `revert` | универсальные keywords |

Универсальные keywords заслуживают минуты. `inherit` берёт вычисленное значение родителя. `initial` сбрасывает к дефолту свойства. `unset` — это `inherit` для наследуемых свойств и `initial` для остальных. `revert` возвращает решение браузеру и user-стилям. `auto` — магия по свойству: центрирование margin, flex-размер — и обычно означает «решает браузер».

> **WARNING**
> `100vw` шире страницы, пока виден вертикальный скроллбар — зона под скроллбар не является контентом viewport. Full-bleed `width: 100vw` даёт горизонтальный скролл на десктопе. Предпочитайте `100%` содержащего блока — либо принимайте этот квирк осознанно.

## Выбор правильной единицы

| Вы хотите | Используйте |
| --- | --- |
| Один размер на всех экранах и настройках | `px` (мелкие детали) или `rem` |
| Масштабирование с браузерной настройкой шрифта пользователя | `rem` |
| Масштабирование с собственным текстом элемента | `em` |
| Долю от родителя | `%` |
| Привязку к размеру окна | `vw` / `vh` / `vmin` / `vmax` |
| Длины строк, пропорциональные тексту | `ch` |
| Fluid между двумя пределами | `clamp(min, val, max)` |

> **TIP**
> `clamp()` — современный ответ на большинство адаптивной типографики: одно значение вместо трёх media queries. Пример: `font-size: clamp(1.25rem, 0.9rem + 1.5vw, 2rem)` — 20 px на телефоне, 32 px на десктопе, плавно между ними.
