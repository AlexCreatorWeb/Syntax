---
id: css-grid
track: css
type: guide
section: layout
order: 4
title:
  en: "CSS Grid"
  ru: "CSS Grid"
excerpt:
  en: "Two-dimensional layout: tracks and the fr unit, named template areas for page skeletons, and minmax with auto-fit for grids that reflow without media queries."
  ru: "Двумерная раскладка: треки и fr-единицы, именованные области для скелета страницы, minmax с auto-fit для сеток, которые перестраиваются без media queries."
version: "css3"
updated: 2026-09-03
relatedTask: css-007
---

CSS Grid lays out content in two dimensions at once: rows and columns are first-class citizens. You define the structure — the tracks — and place items into it. It is the right tool for page skeletons, dashboards, photo walls and card galleries.

## Tracks: columns, rows and the fr unit

```css
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto 100px;
  gap: 16px;
}
```

`display: grid` makes the element a container and its direct children become grid items. `grid-template-columns` and `grid-template-rows` define the tracks. `1fr` is a fraction of the free space — `repeat(3, 1fr)` creates three equal columns that absorb whatever width remains after the fixed tracks and gaps.

Mixing units in one template is the normal case:

```css
.layout {
  display: grid;
  grid-template-columns: 240px 1fr; /* fixed sidebar + fluid main */
  grid-template-rows: 64px 1fr auto; /* header / content / footer */
  height: 100vh;
}
```

`gap` sets the spacing between tracks — one value for both directions, or `row-gap` and `column-gap` separately. The tracks are the skeleton; the items are then placed into the cells.

### Line numbers and explicit placement

Every track creates lines around it: a three-column template has four vertical lines. You can place items by line number:

```css
.header  { grid-column: 1 / 3; }  /* from line 1 to line 3: spans both columns */
.sidebar { grid-row: 2 / 4; }     /* spans rows 2 and 3 */
.main    { grid-area: 2 / 2 / 4 / 3; } /* row-start / col-start / row-end / col-end */
```

`span` is friendlier for one-off cases: `grid-column: span 2` spans two columns. Negative line numbers count from the end of the grid — `-1` is the last line, so `grid-column: -2 / -1` always targets the last column, however many columns exist.

## Named areas: the page skeleton as a map

The most readable Grid is the one that draws itself:

```css
.layout {
  display: grid;
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
  grid-template-columns: 220px 1fr;
  grid-template-rows: auto 1fr auto;
  gap: 12px;
  min-height: 100vh;
}
.layout > header { grid-area: header; }
.layout > aside  { grid-area: sidebar; }
.layout > main   { grid-area: main; }
.layout > footer { grid-area: footer; }
```

Each string is a row; identical names form a rectangle; a dot is an empty cell. The children only declare which area they own, and the visual shape of the page is visible directly in the stylesheet. To make the layout responsive, redefine the map inside a media query — the children do not change at all:

```css
@media (max-width: 768px) {
  .layout {
    grid-template-areas:
      "header"
      "main"
      "footer";
    grid-template-columns: 1fr;
  }
}
```

> **TIP**
> Named areas turn a responsive redesign into a search-and-replace of a small ASCII map. The children's CSS stays untouched — only the container's template changes, and the diff stays tiny and reviewable.

## auto-fit, minmax and media-query-free grids

`minmax(min, max)` describes a track with a range, and `auto-fit` repeats as many tracks as fit:

```css
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}
```

Wide window: as many 200 px-or-wider columns as fit. Narrow window: one column. No media queries — the grid recomputes on every resize. The difference between `auto-fit` and `auto-fill`: with `auto-fit`, empty tracks collapse, so items stretch to fill the row; with `auto-fill`, empty tracks stay visible — useful when you reserve space for items not yet loaded.

A common production pattern — a stats dashboard:

```css
.dashboard {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}
.card--wide { grid-column: span 2; }
```

Note `minmax(0, 1fr)` instead of plain `1fr`: grid items, like flex items, have a default minimum size of "their content", and a long URL or an unbreakable string can blow the column open. `minmax(0, 1fr)` says "shrink below content if needed" — the standard fix for "my grid column is wider than the container".

> **WARNING**
> `repeat(4, 1fr)` plus a column containing long unbreakable text? The column overflows its share and the whole grid scrolls horizontally. Use `minmax(0, 1fr)` for fluid columns that must honor their fraction, or add `min-width: 0` to the overflowing item.

## Alignment in Grid

Alignment exists at two levels — the container and the items — and in both axes:

| Property | Level | Does |
| --- | --- | --- |
| `justify-items` | container | aligns every item horizontally within its cell |
| `align-items` | container | aligns every item vertically within its cell |
| `justify-content` | container | aligns the whole grid within the container |
| `align-content` | container | aligns the rows of the grid within the container |
| `justify-self` / `align-self` | item | overrides the container for one item |

`place-items: center` is the shorthand that sets both item alignments at once — the same famous centering trick you know from Flexbox. When the grid is smaller than the container, `justify-content` and `align-content` position the whole grid block.

## Common mistakes

Building a simple page with Flexbox and a two-dimensional skeleton with nested flex containers — it works, but Grid is shorter and clearer. Forgetting that Grid only controls direct children — if a component has several root nodes, wrap it in a single wrapper element. Using plain `1fr` with wide content and wondering why the track "ignores" the fraction — that is `minmax(0, 1fr)` territory. And placing items by pixel offsets instead of lines and named areas, which makes the template unreadable for the next person.

The properties worth bookmarking: `display: grid`, `grid-template-columns`, `grid-template-rows`, `grid-template-areas`, `gap`, `grid-column`, `grid-row`, `minmax()`, `repeat()` and `place-items`.

<!-- RU -->

CSS Grid раскладывает контент в двух измерениях сразу: строки и колонки — граждане первого класса. Вы определяете структуру — треки — и размещаете в ней элементы. Это правильный инструмент для скелетов страниц, дашбордов, фотостен и галерей карточек.

## Треки: колонки, строки и fr-единица

```css
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto 100px;
  gap: 16px;
}
```

`display: grid` делает элемент контейнером, а его непосредственные дети становятся grid-элементами. `grid-template-columns` и `grid-template-rows` задают треки. `1fr` — доля свободного пространства: `repeat(3, 1fr)` создаёт три равные колонки, которые вбирают всю ширину, оставшуюся после фиксированных треков и промежутков.

Смешивание единиц в одном шаблоне — нормальный случай:

```css
.layout {
  display: grid;
  grid-template-columns: 240px 1fr; /* фиксированный sidebar + жидкий main */
  grid-template-rows: 64px 1fr auto; /* header / content / footer */
  height: 100vh;
}
```

`gap` задаёт расстояние между треками — одно значение для обоих направлений, либо `row-gap` и `column-gap` по отдельности. Треки — это скелет, а элементы затем размещаются в ячейках.

### Нумерация линий и явное размещение

Каждый трек создаёт линии вокруг себя: шаблон с тремя колонками имеет четыре вертикальные линии. Размещать элементы можно по номерам линий:

```css
.header  { grid-column: 1 / 3; }  /* от линии 1 до линии 3: через обе колонки */
.sidebar { grid-row: 2 / 4; }     /* через строки 2 и 3 */
.main    { grid-area: 2 / 2 / 4 / 3; } /* row-start / col-start / row-end / col-end */
```

`span` дружелюбнее для единичных случаев: `grid-column: span 2` проходит две колонки. Отрицательные номера линий считают с конца грида — `-1` это последняя линия, поэтому `grid-column: -2 / -1` всегда целит в последнюю колонку, сколько бы их ни было.

## Именованные области: скелет страницы как карта

Самый читаемый Grid — тот, который рисует себя сам:

```css
.layout {
  display: grid;
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
  grid-template-columns: 220px 1fr;
  grid-template-rows: auto 1fr auto;
  gap: 12px;
  min-height: 100vh;
}
.layout > header { grid-area: header; }
.layout > aside  { grid-area: sidebar; }
.layout > main   { grid-area: main; }
.layout > footer { grid-area: footer; }
```

Каждая строка — это ряд; одинаковые имена образуют прямоугольник; точка — пустая ячейка. Дети лишь объявляют, какую область они занимают, и визуальная форма страницы видна прямо в стайлшите. Чтобы сделать раскладку адаптивной, переопределите карту внутри media query — дети вообще не меняются:

```css
@media (max-width: 768px) {
  .layout {
    grid-template-areas:
      "header"
      "main"
      "footer";
    grid-template-columns: 1fr;
  }
}
```

> **TIP**
> Именованные области превращают адаптивный редизайн в поиск-и-замену маленькой ASCII-карты. CSS детей остаётся нетронутым — меняется только шаблон контейнера, и diff остаётся крошечным и пересматриваемым.

## auto-fit, minmax и сетки без media queries

`minmax(min, max)` описывает трек с диапазоном, а `auto-fit` повторяет столько треков, сколько помещается:

```css
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}
```

Широкое окно: столько колонок шириной не менее 200 px, сколько помещается. Узкое окно: одна колонка. Без media queries — грид пересчитывается при каждом resize. Разница между `auto-fit` и `auto-fill`: с `auto-fit` пустые треки схлопываются и элементы растягиваются, заполняя строку; с `auto-fill` пустые треки остаются видимыми — полезно, когда вы резервируете место под ещё не загруженные элементы.

Типичный продакшен-паттерн — дашборд со статистикой:

```css
.dashboard {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}
.card--wide { grid-column: span 2; }
```

Обратите внимание на `minmax(0, 1fr)` вместо простого `1fr`: у grid-элементов, как и у flex, минимальный размер по умолчанию — «их контент», и длинный URL или неразрывная строка могут вырвать колонку наружу. `minmax(0, 1fr)` говорит «сжимайся ниже контента, если нужно» — стандартный фикс для «моя grid-колонка шире контейнера».

> **WARNING**
> `repeat(4, 1fr)` плюс колонка с длинным неразрывным текстом? Колонка переполнит свою долю, и весь грид уедет в горизонтальный скролл. Используйте `minmax(0, 1fr)` для жидких колонок, которые обязаны уважать свою долю, либо добавьте `min-width: 0` на переполняющий элемент.

## Выравнивание в Grid

Выравнивание существует на двух уровнях — контейнера и элементов — и в обоих осях:

| Свойство | Уровень | Делает |
| --- | --- | --- |
| `justify-items` | контейнер | выравнивает каждый элемент по горизонтали внутри ячейки |
| `align-items` | контейнер | выравнивает каждый элемент по вертикали внутри ячейки |
| `justify-content` | контейнер | выравнивает весь грид внутри контейнера |
| `align-content` | контейнер | выравнивает строки грида внутри контейнера |
| `justify-self` / `align-self` | элемент | переопределяет контейнер для одного элемента |

`place-items: center` — shorthand, который задаёт оба выравнивания элементов разом — тот же знаменитый трюк центрирования, что и в Flexbox. Когда грид меньше контейнера, `justify-content` и `align-content` позиционируют весь блок грида.

## Частые ошибки

Постройка простой страницы на Flexbox и двумерного скелета вложенными flex-контейнерами — работает, но Grid короче и понятнее. Забывание, что Grid управляет только непосредственными детьми — если у компонента несколько корневых узлов, оберните его в один wrapper. Использование простого `1fr` с широким контентом и удивление, почему трек «игнорирует» долю — это территория `minmax(0, 1fr)`. И размещение элементов по пиксельным сдвигам вместо линий и именованных областей, из-за чего шаблон становится нечитаемым для следующего человека.

Свойства, которые стоит запомнить: `display: grid`, `grid-template-columns`, `grid-template-rows`, `grid-template-areas`, `gap`, `grid-column`, `grid-row`, `minmax()`, `repeat()` и `place-items`.
