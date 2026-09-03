---
id: css-box
track: css
type: guide
section: core
order: 2
title:
  en: "The Box Model"
  ru: "Box Model"
excerpt:
  en: "Content, padding, border and margin: how every element is a box, why widths are never what you expect, and how box-sizing: border-box fixes it."
  ru: "Контент, padding, border и margin: почему каждый элемент — это бокс, почему width ведёт себя не так, как ждёшь, и как это чинит box-sizing: border-box."
version: "css3"
updated: 2026-09-03
relatedTask: css-002
---

Every element on a page is a rectangular box — a text line, an image, a button, even a div you "did not style at all". The box model defines what that rectangle consists of and how the space around it is computed. Once you internalize it, layout bugs stop being magic.

## Anatomy of a box

Each box has four concentric layers, from the inside out: content, padding, border, margin.

```text
+---------------------------- margin ----------------------------+
|  +-------------------------- border -------------------------+ |
|  |  +------------------------ padding ---------------------+  | |
|  |  |  +----------------------- content -----------------+  |  | |
|  |  |  |                                                  |  |  | |
|  |  |  +--------------------------------------------------+  |  | |
|  |  +--------------------------------------------------------+  | |
|  +--------------------------------------------------------------+ |
+-------------------------------------------------------------------+
```

The content is the text or image itself. Padding is the space between the content and the border — it is painted with the element's background. The border is the visible edge of the box. Margin is the transparent space outside the border that pushes neighboring elements away.

```css
.box {
  width: 200px;           /* width of the CONTENT layer only (by default) */
  padding: 20px;
  border: 2px solid gray;
  margin: 40px;
  background: lightblue;  /* the background fills content + padding */
}
```

### The classic arithmetic

With the default `box-sizing: content-box`, `width` sets only the content layer. The space the element actually occupies is width + horizontal padding + horizontal borders. For the `.box` above: 200 + 40 + 4 = 244 px wide, plus 40 px of margin on each side — a 324 px footprint on the page.

This arithmetic is the number-one source of "why is my div wider than its container" bugs, because nobody does it in their head while typing.

## box-sizing: border-box

The fix used in every modern stylesheet:

```css
/* One rule, applied to everything, usually at the very top */
*,
*::before,
*::after {
  box-sizing: border-box;
}
```

With `border-box`, `width` describes the whole box up to the outer border edge: padding and border are subtracted from the width, not added to it. `width: 200px` plus `padding: 20px` plus `border: 2px` produces a box that occupies exactly 200 px horizontally — the content shrinks to whatever fits.

> **TIP**
> Put the universal `box-sizing: border-box` reset in the first lines of your stylesheet. Every width you type after that matches what you see in DevTools, and "why is this 44px wider" bugs disappear on arrival.

Two asymmetries to keep in mind. `height` works the same way, but vertical margins between block elements can collapse — see the next section. And `margin` is never included in either sizing mode: it is always outside the box.

### A centered reading column

The canonical example of border-box in practice:

```css
.article {
  max-width: 680px;
  padding: 24px;
  margin: 0 auto; /* centers the column in the window */
}
```

With `border-box`, the 680 px cap includes the 24 px padding — the text column itself is 632 px wide, which is exactly the length your eyes want for comfortable reading.

## Padding, margins and margin collapse

Padding is the easy part: it is the box's own space, painted with the background, with no surprises.

Margin is where the model has one famous quirk — vertical margin collapse. When two block-level elements stack vertically, their margins do not add up; the larger of the two wins:

```css
p { margin-top: 20px; margin-bottom: 20px; }

/* two consecutive <p> get a 20px gap between them — not 40px */
```

The same thing happens between a parent and its first (or last) child when the parent has no border, padding or height to separate them — the child's margin "pops through" the parent's edge and appears outside:

```css
/* margin-top of the <h1> collapses out of .card's top edge */
.card h1 { margin-top: 32px; }
```

Three standard defenses, in order of preference.

Use Flexbox or Grid on the parent — flex and grid containers never collapse with their children, and item margins do not collapse with each other inside them. This is why margin collapse mostly vanishes once a project moves to modern layout.

Give the parent `padding-top` or a `border-top` — the margin stops collapsing through, because the edge is no longer "empty".

Start a new block formatting context with `overflow: hidden` or `contain: content` on the parent. This works, but it has side effects on overflow, so reach for it last.

> **TIP**
> If you build most layouts with Flexbox or Grid, you will encounter margin collapse rarely. When you do see "my padding looks bigger than I set it", check whether a child margin escaped the container — the parent's own styles are usually innocent.

## Borders, outlines and shadows

```css
.card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgb(0 0 0 / 0.08);
}
.card:focus-visible {
  outline: 2px solid blue;
}
```

The `border` shorthand takes width, style and color in any order; `border-radius` rounds the corners — one value for all four, four values clockwise from top-left. `box-shadow` takes offset-x, offset-y, blur, spread and color; the shadow is painted outside the border and, unlike the border, does not affect layout at all.

The practical difference between `border` and `outline`: a border consumes layout space (it grows the box), while an outline is painted over the margin area and shifts nothing. That makes `outline` the right tool for focus rings and temporary debugging boxes — you can leave a debugging outline in place without breaking a single layout.

## Common mistakes

A few mistakes this box model produces in every project.

Setting a width and padding in the same rule without `border-box`, then wondering why the element overflows its grid cell or pushes the page into horizontal scroll. Forgetting that percentage `padding-top` resolves against the parent's WIDTH, not its height — which is exactly how the classic responsive-square placeholder was built (`padding-top: 100%`) before `aspect-ratio` existed.

Applying margin to the last child "just in case" and doubling the visual gap together with the parent's padding. Mixing px and % in width without understanding which layer of the box each value actually sizes.

Finally, verify your assumptions live: DevTools → Computed shows the four layers with exact pixel values, and the box model diagram marks which margins collapsed. Two seconds of looking there answers most questions this page explains.

<!-- RU -->

Каждый элемент на странице — прямоугольный бокс: строка текста, изображение, кнопка, даже div, который вы «вообще не стилизовали». Box model описывает, из чего состоит этот прямоугольник и как считается пространство вокруг него. Как только это внутренне усвоено, layout-баги перестают быть магией.

## Анатомия бокса

Каждый бокс имеет четыре концентрических слоя — от центра к краю: content, padding, border, margin.

```text
+---------------------------- margin ----------------------------+
|  +-------------------------- border -------------------------+ |
|  |  +------------------------ padding ---------------------+  | |
|  |  |  +----------------------- content -----------------+  |  | |
|  |  |  |                                                  |  |  | |
|  |  |  +--------------------------------------------------+  |  | |
|  |  +--------------------------------------------------------+  | |
|  +--------------------------------------------------------------+ |
+-------------------------------------------------------------------+
```

Content — сам текст или изображение. Padding — пространство между контентом и бордером, оно закрашивается фоном элемента. Border — видимая кромка бокса. Margin — прозрачное пространство снаружи бордера, которое отталкивает соседние элементы.

```css
.box {
  width: 200px;           /* по умолчанию — ширина ТОЛЬКО content-слоя */
  padding: 20px;
  border: 2px solid gray;
  margin: 40px;
  background: lightblue;  /* фон закрашивает content + padding */
}
```

### Классическая арифметика

При дефолтном `box-sizing: content-box` `width` задаёт только контентный слой. Пространство, которое элемент реально занимает, — это width + горизонтальный padding + горизонтальные бордеры. Для `.box` выше: 200 + 40 + 4 = 244 px в ширину, плюс по 40 px margin с каждой стороны — footprint 324 px на странице.

Именно эта арифметика — причина №1 багов «почему мой div шире контейнера», потому что никто не считает это в голове во время печати.

## box-sizing: border-box

Фикс, который используется в каждом современном стайлшите:

```css
/* Одно правило для всего, обычно в самом начале файла */
*,
*::before,
*::after {
  box-sizing: border-box;
}
```

С `border-box` `width` описывает весь бокс до внешней кромки бордера: padding и border вычитаются из ширины, а не прибавляются к ней. `width: 200px` + `padding: 20px` + `border: 2px` дают бокс, который занимает ровно 200 px по горизонтали — контент сжимается до того, что помещается.

> **TIP**
> Поставьте универсальный сброс `box-sizing: border-box` в первые строки стайлшита. Каждая ширина, которую вы напишете после, совпадёт с тем, что видно в DevTools, и баги «почему это на 44px шире» исчезают сразу.

Две асимметрии, о которых стоит помнить. `height` работает так же, но вертикальные margin между блочными элементами могут схлопываться — см. следующий раздел. И `margin` никогда не включается ни в один режим расчёта: он всегда снаружи бокса.

### Центрированная колонка чтения

Канонический пример border-box в работе:

```css
.article {
  max-width: 680px;
  padding: 24px;
  margin: 0 auto; /* центрирует колонку в окне */
}

```

Именно такая колонка — базовый приём любой текстовой страницы: ширина ограничена, отступы внутри бокса (в border-box они уже «включены» в max-width), а `margin: 0 auto` центрирует колонку по горизонтали.

## Padding, margin и схлопывание margin

Padding — безобидная часть: это собственное пространство бокса, закрашенное фоном, без сюрпризов.

С margin у модели есть одна знаменитая особенность — вертикальное схлопывание (margin collapse). Когда два блочных элемента стоят друг под другом, их вертикальные margin не складываются; побеждает больший из двух:

```css
p { margin-top: 20px; margin-bottom: 20px; }

/* два соседних <p> дают зазор 20px между собой — не 40px */
```

То же происходит между родителем и его первым (или последним) дочерним элементом, если у родителя нет border, padding или высоты, отделяющих их — margin «выстреливает через край» родителя и оказывается снаружи:

```css
/* margin-top у <h1> схлопывается через верхний край .card */
.card h1 { margin-top: 32px; }
```

Три стандартных способа защиты — в порядке предпочтения.

Сделайте родителя Flexbox или Grid — flex/grid-контейнеры никогда не схлопываются с детьми, и margin элементов внутри них тоже не схлопываются друг с другом. Именно поэтому margin collapse почти исчезает, как только проект переходит на современный layout.

Дайте родителю `padding-top` или `border-top` — margin перестаёт схлопываться через край, потому что край больше не «пустой».

Запустите новый block formatting context через `overflow: hidden` или `contain: content` на родителе. Работает, но со своими побочными эффектами на overflow — к этому прибегают последним.

> **TIP**
> Если большинство layout вы строите на Flexbox или Grid, с margin collapse вы столкнётесь редко. Когда увидите, что «отступ больше, чем я задавал», проверьте, не выскокочил ли margin дочернего элемента из контейнера — собственный стиль родителя обычно ни при чём.

## Border, outline и тени

```css
.card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgb(0 0 0 / 0.08);
}
.card:focus-visible {
  outline: 2px solid blue;
}
```

Шорткат `border` принимает ширину, стиль и цвет в любом порядке; `border-radius` скругляет углы — одно значение на все четыре, четыре значения по часовой стрелке от левого верхнего. `box-shadow` — offset-x, offset-y, blur, spread и цвет; тень рисуется снаружи бордера и, в отличие от бордера, вообще не влияет на layout.

Практическая разница между `border` и `outline`: border занимает место в layout (увеличивает бокс), а outline рисуется поверх margin-области и ничего не сдвигает. Поэтому `outline` — правильный инструмент для focus-индикаторов и временных отладочных рамок — отладочный outline можно оставить в коде, не сломав ни одного layout.

## Частые ошибки

Несколько ошибок, которые эта модель даёт в каждом проекте.

Задают width и padding в одном правиле без `border-box` и потом удивляются, почему элемент вылезает из ячейки грида или уводит страницу в горизонтальный скролл. Забывают, что процентный `padding-top` считается от ШИРИНЫ родителя, а не от его высоты — именно так строились классические «квадратные» плейсхолдеры для изображений (`padding-top: 100%`) до появления `aspect-ratio`.

Ставят margin на последнего дочерний элемент «на всякий случай» и удваивают видимый зазор вместе с padding родителя. Мешают px и % в width, не понимая, какой именно слой бокса задаёт каждое значение.

И наконец — проверяйте предположения вживую: DevTools → Computed показывает все четыре слоя с точными пиксельными значениями, а диаграмма box model помечает, какие margin схлопнулись. Две секунды взгляда туда отвечают на большинство вопросов этой страницы.
