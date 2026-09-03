---
id: css-flexbox
track: css
type: guide
section: layout
order: 3
title:
  en: "Flexbox"
  ru: "Flexbox"
excerpt:
  en: "One-dimensional layout: the main and cross axes, justify-content vs align-items, flex-grow/shrink/basis, wrap and gap — with a toolbar and a card row you can copy."
  ru: "Одномерная раскладка: главная и поперечная оси, justify-content против align-items, flex-grow/shrink/basis, wrap и gap — с готовым тулбаром и рядом карточек."
version: "css3"
updated: 2026-09-03
relatedTask: css-005
---

Flexbox lays out items along one axis at a time. It is the right tool whenever you need to distribute a row of buttons, center a single element, or make a set of cards share space — anything that is fundamentally "one direction". Two-dimensional layouts belong to Grid.

## The two axes

`display: flex` turns a block into a flex container and makes its direct children into flex items. The container gets two axes: the main axis, along which items are laid out, and the cross axis, perpendicular to it.

```css
.toolbar {
  display: flex;            /* row by default: main axis horizontal */
  flex-direction: column;   /* or: items go down, main axis vertical */
}
```

The four `flex-direction` values — `row`, `row-reverse`, `column`, `column-reverse` — rotate the main axis. Every "justify" property works along the main axis; every "align" property works along the cross axis. Confusing the two is the classic beginner bug, because the property names do not tell you which direction they control.

> **TIP**
> When items align "the wrong way", check `flex-direction` first: with `column`, `justify-content` is vertical and `align-items` is horizontal. The names stay the same, the axes swap.

### Centering, finally

The famous three-line solution, which works for any content size:

```css
.modal {
  display: flex;
  justify-content: center; /* main axis: horizontal in a row */
  align-items: center;     /* cross axis: vertical in a row */
  min-height: 100vh;
}
```

For a row of items, `justify-content` offers `flex-start`, `flex-end`, `center`, `space-between` (first and last at the edges, the rest evenly spaced), `space-around` (equal space around each item) and `space-evenly` (all gaps equal, including the edges).

`align-items` aligns items across the axis: `stretch` (the default — items stretch to the container's cross size), `center`, `start`, `end`, `baseline`. There is also `align-content`, which distributes wrapped lines against each other when `flex-wrap` is on, and `align-self`, which lets a single item override the container's choice.

## Space: grow, shrink and basis

Each item has three numbers that decide how much of the available space it takes:

```css
.item { flex: 1 1 160px; }
/* grow   = 1   — take a share of free space
   shrink = 1   — give back space when it runs out
   basis  = 160px — the size the item starts from */
```

`flex-basis` is the starting size (it behaves like width in a row). `flex-grow` says how the item divides leftover space: two items with `flex-grow: 1` share it 50/50, while `1` and `2` share it 33/67. `flex-shrink` works the same way in reverse when the items overflow the container.

The full `flex` shorthand resets all three parts when you omit some of them (`flex: 1` means `1 1 0%`), which surprises people:

```css
.sidebar { flex: 0 0 240px; } /* fixed 240px column, never grows */
.main    { flex: 1; }          /* takes everything the sidebar leaves */
```

### A realistic toolbar

```css
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
}
```

The logo at the left edge, the actions at the right edge, the middle items between them — one rule, no floats, no inline-block hacks, no absolute positioning.

## Wrap, gap and the card row

`flex-wrap: wrap` lets items move to a new line when the row overflows. Combined with a sensible `flex-basis`, you get a responsive card layout without a single media query:

```css
.cards {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.cards > article {
  flex: 1 1 220px; /* at least 220px, grow to fill the line */
}
```

Narrow window: three cards per line. Phone: one card per line. The browser reflows by itself, and `gap` keeps the spacing identical in both directions — it sets the row gap and the column gap at once, replacing the old margin juggling.

> **TIP**
> Prefer `gap` over margins between flex items. Margins inside flex do not collapse, but they still double at the edges of the container; `gap` has no edge problem and works in Grid containers too.

### When items refuse to shrink

A long word or a wide image can push a flex item past its computed size. Two standard fixes: give the item `min-width: 0` — flex items default to `min-width: auto`, which means "never smaller than my content" — and let text wrap with `overflow-wrap: anywhere` if the overflow comes from a long string.

> **WARNING**
> `min-width: auto` is the reason "my flex item does not shrink" is a classic bug. The fix is always the same: `min-width: 0` on the shrinking item — add `overflow: hidden` if you need to clip what no longer fits.

## Flexbox or Grid?

Flexbox: one dimension, content-driven sizing, distribution of space among items. Grid: two dimensions, track-driven layout, items placed into explicit cells. In practice a page uses both — Grid for the page skeleton (header, sidebar, main, footer), Flexbox for everything inside a card, a toolbar or a list of buttons.

A quick decision rule: if you can describe the layout as "items in a line that may wrap", reach for Flexbox. If you need rows and columns to exist regardless of their content, reach for Grid.

## Common mistakes

`justify-content` used for vertical centering in a row (that is `align-items`). A `flex` shorthand "eating" a previously set width, because the basis overrides the main-axis size. Forgetting that `display: flex` only affects direct children — grandchildren keep their own layout untouched. And building two-dimensional page skeletons with nested flex containers, which works but fights the browser; a single Grid container with named areas is shorter and clearer.

The properties worth bookmarking: `display: flex`, `flex-direction`, `flex-wrap`, `gap`, `justify-content`, `align-items`, `align-self` — and on items, `flex`, `order` and `min-width`.

<!-- RU -->

Flexbox раскладывает элементы по одной оси за раз. Это правильный инструмент, когда нужно распределить ряд кнопок, по центру разместить один элемент или разделить пространство между набором карточек — всё, что по сути «однонаправленно». Двумерные раскладки — за Grid.

## Две оси

`display: flex` превращает блок во flex-контейнер, а его непосредственных детей — во flex-элементы. У контейнера появляются две оси: главная (main axis), вдоль которой раскладываются элементы, и поперечная (cross axis), перпендикулярная ей.

```css
.toolbar {
  display: flex;            /* по умолчанию row: главная ось горизонтальна */
  flex-direction: column;   /* или: элементы идут вниз, главная ось вертикальна */
}
```

Четыре значения `flex-direction` — `row`, `row-reverse`, `column`, `column-reverse` — поворачивают главную ось. Все «justify»-свойства работают вдоль главной оси, все «align»-свойства — вдоль поперечной. Путаница между ними — классическая ошибка новичка, потому что имена свойств не говорят, какое направление они контролируют.

> **TIP**
> Если элементы выравниваются «не в ту сторону», сначала проверьте `flex-direction`: при `column` `justify-content` — это вертикаль, а `align-items` — горизонталь. Названия остаются теми же, оси меняются местами.

### Наконец-то центрирование

Знаменитое трёхстрочное решение, работающее с любым размером контента:

```css
.modal {
  display: flex;
  justify-content: center; /* главная ось: в row — горизонталь */
  align-items: center;     /* поперечная ось: в row — вертикаль */
  min-height: 100vh;
}
```

Для ряда элементов `justify-content` предлагает `flex-start`, `flex-end`, `center`, `space-between` (первый и последний у краёв, остальные равномерно), `space-around` (равное пространство вокруг каждого) и `space-evenly` (все промежутки равны, включая края).

`align-items` выравнивает элементы по поперечной оси: `stretch` (по умолчанию — элементы растягиваются поперёк), `center`, `start`, `end`, `baseline`. Есть ещё `align-content` — распределяет перенесённые строки относительно друг друга при включённом `flex-wrap`, и `align-self` — позволяет одному элементу переопределить выбор контейнера.

## Пространство: grow, shrink и basis

У каждого элемента три числа, определяющие, сколько доступного пространства он забирает:

```css
.item { flex: 1 1 160px; }
/* grow   = 1   — забрать долю свободного пространства
   shrink = 1   — отдать пространство, если его не хватает
   basis  = 160px — размер, с которого элемент стартует */
```

`flex-basis` — стартовый размер (ведёт себя как width в ряду). `flex-grow` говорит, как элемент делит остаток пространства: два элемента с `flex-grow: 1` делят его 50/50, а `1` и `2` — 33/67. `flex-shrink` работает так же наоборот, когда элементы не помещаются в контейнер.

Полный shorthand `flex` сбрасывает пропущенные части до дефолтов (`flex: 1` означает `1 1 0%`) — это неожиданно для многих:

```css
.sidebar { flex: 0 0 240px; } /* фиксированная колонка 240px, не растёт */
.main    { flex: 1; }          /* забирает всё, что оставил sidebar */
```

### Реалистичный тулбар

```css
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
}
```

Лого у левого края, действия у правого, средние элементы между ними — одно правило, без float, без inline-block хаков, без абсолютного позиционирования.

## Wrap, gap и ряд карточек

`flex-wrap: wrap` позволяет элементам уходить на новую строку, когда ряд не помещается. В связке с осмысленным `flex-basis` это даёт адаптивную раскладку карточек без единого media query:

```css
.cards {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.cards > article {
  flex: 1 1 220px; /* минимум 220px, растёт, заполняя строку */
}
```

Узкое окно: три карточки в строке. Телефон: одна карточка на строку. Браузер перестраивает сам, а `gap` держит одинаковое расстояние в обоих направлениях — он задаёт и row-gap, и column-gap разом, заменяя старую возню с margin.

> **TIP**
> Предпочитайте `gap` вместо margin между flex-элементами. Margin внутри flex не схлопываются, но всё равно дублируются на краях контейнера; у `gap` проблемы с краями нет, и он так же работает в Grid-контейнерах.

### Когда элемент не хочет сжиматься

Длинное слово или широкая картинка могут вытолкнуть flex-элемент за его вычисленный размер. Два стандартных фикса: дайте элементу `min-width: 0` — у flex-элементов по умолчанию `min-width: auto`, то есть «никогда меньше моего контента» — и разрешите тексту переноситься через `overflow-wrap: anywhere`, если переполнение даёт длинная строка.

> **WARNING**
> `min-width: auto` — причина, по которой «мой flex-элемент не сжимается» — классический баг. Лечение всегда одно: `min-width: 0` на сжимающемся элементе — плюс `overflow: hidden`, если нужно обрезать то, что не поместилось.

## Flexbox или Grid?

Flexbox: одно измерение, размер от контента, распределение пространства между элементами. Grid: два измерения, раскладка по трекам, элементы ставятся в явные ячейки. На практике страница использует и то, и другое — Grid для скелета страницы (header, sidebar, main, footer), Flexbox для всего внутри карточки, тулбара или списка кнопок.

Быстрое правило: если раскладку можно описать как «элементы в ряду, который может переноситься» — берите Flexbox. Если нужны строки и колонки, существующие независимо от контента — берите Grid.

## Частые ошибки

`justify-content` для вертикального центрирования в row (это `align-items`). Shorthand `flex`, «съедающий» ранее заданный width, потому что basis перебивает размер по главной оси. Забывание, что `display: flex` влияет только на непосредственных детей — внуки сохраняют свою раскладку. И постройка двумерного скелета страницы вложенными flex-контейнерами: работает, но воюет с браузером — один Grid-контейнер с именованными областями короче и понятнее.

Свойства, которые стоит запомнить: `display: flex`, `flex-direction`, `flex-wrap`, `gap`, `justify-content`, `align-items`, `align-self` — и у элементов: `flex`, `order` и `min-width`.
