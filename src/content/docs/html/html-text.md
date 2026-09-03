---
id: html-text
track: html
type: guide
section: content
order: 2
title:
  en: "Text, Headings & Links"
  ru: "Текст, заголовки и ссылки"
excerpt:
  en: "Headings with a real hierarchy, paragraphs and emphasis, links that behave, and tables for row-and-column data. The core text vocabulary of every page."
  ru: "Заголовки с настоящей иерархией, параграфы и выделение, ссылки, которые ведут себя корректно, и таблицы для данных строками и колонками. Базовый текстовый словарь любой страницы."
version: "html5"
updated: 2026-09-03
relatedTask: html-002
---

Text is the bulk of what users read on the web, and HTML gives it a proper vocabulary: six levels of headings, paragraphs, emphasis, links, and tables. This page covers the core text elements and how they combine into content that is readable on screen, in a search snippet, and out loud from a screen reader.

## Headings: six levels, one hierarchy

HTML offers six heading levels, from `h1` to `h6`. `h1` is the most important, `h6` the least. The document outline is built from the order of these elements, and both search engines and screen readers navigate your page by it:

```html
<h1>JavaScript in 2026</h1>
<p>The ecosystem keeps moving.</p>
<h2>Modules</h2>
<p>ES modules replaced script tags for most apps.</p>
<h3>Import and export</h3>
<p>Each module keeps its own scope.</p>
```

The hierarchy must read like a table of contents: one `h1`, then `h2` sections, then `h3` subsections inside them. The level number is not just visual weight — it is structure.

### Do not skip levels

Jumping from `h1` straight to `h3` leaves a hole in the outline. Screen-reader users who jump between headings suddenly skip a level with no idea what happened, and SEO tools report a broken structure. If you need a bigger font for a line, fix it with CSS — not with an out-of-place heading level.

## Paragraphs and emphasis

`p` is the workhorse: blocks of running text. Inside a paragraph you can mark up individual words:

```html
<p>
  The <strong>important</strong> part is the event loop.
  Use <em>italics</em> for a voice shift, and
  <code>Promise.all()</code> for inline code.
</p>
```

`strong` means "important", `em` means "stress". The older tags `b` and `i` exist too, but they mean "styled, without extra meaning" — reserve them for cases where the emphasis is purely visual, like part of a product name. For a quotation from another source use `blockquote`, and for fine print use `small`.

## Links

The anchor element `a` is what makes the web a web. The `href` attribute is where the link goes; the text between the tags is what the user sees and what a screen reader announces:

```html
<!-- internal link -->
<a href="/about">About the project</a>

<!-- external link, new tab -->
<a href="https://example.com" target="_blank" rel="noopener">
  Example site
</a>

<!-- email -->
<a href="mailto:hello@example.com">Write to us</a>

<!-- jump to a section on this page -->
<a href="#references">Go to references</a>
```

Internal links use a path (`/about`), external links use a full URL, `mailto:` opens the mail client, and `#fragment` scrolls to the element with that `id`. For every link that opens a new tab, add `rel="noopener"` — it keeps the new page from reaching into your page's `window`.

### Write link text that makes sense alone

Link text is all a screen-reader user hears. "Click here" and "read more" become meaningless when the page is read as a flat list of links. Prefer "read the caching guide" over "click here" — the destination should be clear without any surrounding context.

## Tables for data

When information has rows and columns — prices, schedules, comparisons — use a table, not divs with fixed widths. A table has a header row and a body:

```html
<table>
  <thead>
    <tr><th>Item</th><th>Qty</th><th>Price</th></tr>
  </thead>
  <tbody>
    <tr><td>Apples</td><td>3</td><td>1.50</td></tr>
    <tr><td>Bread</td><td>1</td><td>2.00</td></tr>
  </tbody>
</table>
```

`th` marks a header cell — it renders bold and is announced as a column header. `td` marks a data cell. `thead`, `tbody`, and `tfoot` group rows, and `colspan="2"` or `rowspan="2"` merges cells when the layout really needs it.

## Common mistakes

> **WARNING**
> Styling a table with CSS to display "as blocks" and using it for page layout defeats the point: screen readers will happily read your layout table row by row. Tables are for tabular data; layout belongs to CSS.

> **WARNING**
> An external link with `target="_blank"` and no `rel="noopener"` lets the opened page access your `window` through `window.opener`. Two attributes, one line — do not skip it.

> **TIP**
> If you are unsure which heading level to use, number your outline first: 1 for the page, 2 for sections, 3 for subsections. If a number is missing in the sequence, your structure has a gap.

<!-- RU -->

Текст — основное, что пользователи читают в интернете, и HTML даёт ему полноценный словарь: шесть уровней заголовков, параграфы, выделение, ссылки и таблицы. В этой странице — базовые текстовые элементы и то, как они собираются в контент, который читается на экране, в поисковом сниппете и вслух со скринридера.

## Заголовки: шесть уровней, одна иерархия

HTML предлагает шесть уровней заголовков — от `h1` до `h6`. `h1` — самый важный, `h6` — самый мелкий. План документа строится из порядка этих элементов, и именно по нему навигаются по вашей странице и поисковики, и скринридеры:

```html
<h1>JavaScript in 2026</h1>
<p>The ecosystem keeps moving.</p>
<h2>Modules</h2>
<p>ES modules replaced script tags for most apps.</p>
<h3>Import and export</h3>
<p>Each module keeps its own scope.</p>
```

Иерархия должна читаться как оглавление: один `h1`, затем `h2`-секции, внутри них — `h3`-подсекции. Номер уровня — это не только визуальный вес, это структура.

### Не пропускайте уровни

Прыжок с `h1` сразу на `h3` оставляет дыру в плане. Пользователь скринридера, прыгающий по заголовкам, внезапно пропускает уровень, не понимая что произошло, а SEO-инструменты сообщают о сломанной структуре. Если строке нужен больший шрифт — почините это CSS, а не заголовком не того уровня.

## Параграфы и выделение

`p` — рабочий конь: блоки связного текста. Внутри параграфа можно разметить отдельные слова:

```html
<p>
  The <strong>important</strong> part is the event loop.
  Use <em>italics</em> for a voice shift, and
  <code>Promise.all()</code> for inline code.
</p>
```

`strong` означает «важно», `em` — «ударение». Старые теги `b` и `i` тоже существуют, но означают «выделено стилем, без доп. значения» — оставляйте их на случаи, когда выделение чисто визуальное, например часть имени продукта. Для цитаты из другого источника используйте `blockquote`, для мелкого шрифта — `small`.

## Ссылки

Якорный элемент `a` — то, что делает веб сетью. Атрибут `href` — куда ведёт ссылка; текст между тегами — то, что видит пользователь и что озвучивает скринридер:

```html
<!-- внутренняя ссылка -->
<a href="/about">About the project</a>

<!-- внешняя ссылка, новая вкладка -->
<a href="https://example.com" target="_blank" rel="noopener">
  Example site
</a>

<!-- email -->
<a href="mailto:hello@example.com">Write to us</a>

<!-- переход к секции на этой странице -->
<a href="#references">Go to references</a>
```

Внутренние ссылки используют путь (`/about`), внешние — полный URL, `mailto:` открывает почтовый клиент, а `#fragment` прокручивает к элементу с таким `id`. Для каждой ссылки, открывающейся в новой вкладке, добавляйте `rel="noopener"` — она не даёт новой странице добраться до `window` вашей страницы.

### Пишите текст ссылки, понятный сам по себе

Текст ссылки — это всё, что слышит пользователь скринридера. «Нажмите сюда» и «читать дальше» превращаются в бессмыслицу, когда страница читается как плоский список ссылок. Лучше «прочитать гайд по кэшированию», чем «нажмите сюда» — назначение должно быть понятно без окружающего контекста.

## Таблицы для данных

Если информация устроена строками и колонками — цены, расписания, сравнения — используйте таблицу, а не div с фиксированными ширинами. У таблицы есть строка заголовков и тело:

```html
<table>
  <thead>
    <tr><th>Item</th><th>Qty</th><th>Price</th></tr>
  </thead>
  <tbody>
    <tr><td>Apples</td><td>3</td><td>1.50</td></tr>
    <tr><td>Bread</td><td>1</td><td>2.00</td></tr>
  </tbody>
</table>
```

`th` отмечает ячейку заголовка — она рендерится жирным и озвучивается как заголовок колонки. `td` отмечает ячейку данных. `thead`, `tbody` и `tfoot` группируют строки, а `colspan="2"` или `rowspan="2"` объединяют ячейки, когда это действительно нужно макету.

## Частые ошибки

> **WARNING**
> Стилизовать таблицу через CSS в «блоки» и использовать её для верстки страницы — против самой сути: скринридеры с удовольствием прочтут вашу layout-таблицу построчно. Таблицы — для табличных данных; макет — это задача CSS.

> **WARNING**
> Внешняя ссылка с `target="_blank"` без `rel="noopener"` позволяет открытой странице получить доступ к вашему `window` через `window.opener`. Два атрибута, одна строка — не пропускайте.

> **TIP**
> Если не уверены, какой уровень заголовка выбрать, сначала пронумеруйте план: 1 — страница, 2 — секции, 3 — подсекции. Если в последовательности пропущен номер — в структуре дыра.
