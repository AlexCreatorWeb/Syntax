---
id: html-semantic
track: html
type: guide
section: semantics
order: 5
title:
  en: "Semantic HTML"
  ru: "Семантическая разметка"
excerpt:
  en: "Landmarks, article, section, and the smaller meaning-carrying elements — when to use each, the rules that keep them honest, and how to stop writing div soup."
  ru: "Лендмарки, article, section и маленькие элементы с смыслом — когда использовать каждый, правила, которые не дают им врать, и как перестать писать div-суп."
version: "html5"
updated: 2026-09-03
relatedTask: html-005
---

The same pixels can be marked up two ways: a stack of `div`s with class names, or elements whose names describe their role. Semantics is the second way. This page covers the landmark and content elements, when to use each, and why the difference shows up in search results, in screen readers, and in your own future code reviews.

## What semantics buy you

Three audiences read your markup, and none of them is the user's eyes. Search engines use the structure to understand what a page is about — an `article` with a heading inside it reads as a piece of content, not as a layout fragment. Screen readers use landmarks to build a map the user can jump around: "navigation", "main content", "footer". And the next developer reading your code reads the tag names before they read a single class.

None of this requires extra effort. Replacing a `div` with a `nav` is one word.

## Landmark elements

Landmarks are the big regions of a page. The core set, in a realistic layout:

```html
<body>
  <header>
    <h1>My Site</h1>
    <nav>
      <a href="/">Home</a>
      <a href="/blog">Blog</a>
    </nav>
  </header>

  <main>
    <p>The page's primary content lives here.</p>
  </main>

  <aside>
    <h2>Extra</h2>
    <p>Related but secondary content.</p>
  </aside>

  <footer>
    <p>© 2026 My Site</p>
  </footer>
</body>
```

`header` and `footer` frame the page (or any section), `nav` wraps a block of links, `main` is the dominant content, and `aside` is content that is tangential — a sidebar, a pull quote, related links.

### The rules that keep landmarks honest

`main` must appear exactly once per page, and it must not be nested inside another `header`, `footer`, or `nav`. `nav` is for primary or local navigation blocks, not for every link on the page. And `header` inside an `article` is that article's header, not the page's — context changes the meaning.

## Article and section

`article` is a self-contained composition that could be lifted out and still make sense: a blog post, a product card, a comment. `section` is a thematic grouping inside a document, and it almost always has a heading:

```html
<article>
  <header>
    <h1>How we ship on Fridays</h1>
    <time datetime="2026-09-01">Sept 1, 2026</time>
  </header>
  <section>
    <h2>The checklist</h2>
    <p>Tests green, changelog written, deploy scheduled.</p>
  </section>
  <footer>
    <p>By Ada</p>
  </footer>
</article>
```

The test for choosing between the two: can it survive a syndication feed or a "related stories" block on its own? If yes, it is an `article`. If it only exists as a chapter of the page, it is a `section`.

## Smaller semantic elements

A handful of inline and block elements carry meaning worth using:

| Element | Meaning |
| --------- | --------- |
| time | a machine-readable date or time in `datetime`, human text inside |
| figure | self-contained media with an optional figcaption |
| blockquote | a quotation from another source |
| mark | text highlighted for relevance, like a highlighter pen |
| abbr | an abbreviation with the expansion in `title` |
| address | contact information for the page or article |
| progress | a task's progress, with `value` and `max` |
| meter | a known value within a range |
| details / summary | a native collapsible section |

```html
<p>
  Published on <time datetime="2026-09-01">Sept 1, 2026</time>.
  See also <abbr title="HyperText Markup Language">HTML</abbr>.
</p>
```

## Div and span: still there, still fine

Semantic does not mean "never use a `div`". `div` and `span` remain the neutral boxes for when no element fits — a flex container, a styling hook. The rule of thumb: reach for the semantic element first, and fall back to `div` only when nothing else fits. A page full of `div class="nav"` is a page where class names are doing the work the tags should be doing.

## Common mistakes

> **WARNING**
> Multiple `main` elements break the landmark map. One page, one `main`; the rest of the content goes in `article`, `aside`, or `section`.

> **WARNING**
> Wrapping the whole top of the page in a `nav` because "the header has links" turns the entire header into one giant navigation landmark. Keep `nav` around the link list only.

> **TIP**
> Audit a page by reading only its element names, top to bottom. If the story the tags tell is weaker than the story the content tells, you have div soup — replace the names.

<!-- RU -->

Одни и те же пиксели можно разметить двумя способами: стопкой `div` с именами классов или элементами, чьи имена описывают их роль. Семантика — второй способ. В этой странице — лендмарки и контентные элементы, когда использовать каждый и почему разница проявляется в результатах поиска, в скринридерах и в ваших же будущих code review.

## Что даёт семантика

Разметку читают три аудитории, и ни одна из них — не глаза пользователя. Поисковики используют структуру, чтобы понять, о чём страница: `article` с заголовком внутри читается как контент, а не как фрагмент макета. Скринридеры используют лендмарки, чтобы построить карту, по которой пользователь может прыгать: «навигация», «основное содержимое», «футер». А следующий разработчик, читающий ваш код, читает имена тегов раньше, чем хоть один класс.

Всё это не требует дополнительных усилий. Замена `div` на `nav` — одно слово.

## Лендмарки

Лендмарки — большие регионы страницы. Базовый набор в реалистичном макете:

```html
<body>
  <header>
    <h1>My Site</h1>
    <nav>
      <a href="/">Home</a>
      <a href="/blog">Blog</a>
    </nav>
  </header>

  <main>
    <p>The page's primary content lives here.</p>
  </main>

  <aside>
    <h2>Extra</h2>
    <p>Related but secondary content.</p>
  </aside>

  <footer>
    <p>© 2026 My Site</p>
  </footer>
</body>
```

`header` и `footer` обрамляют страницу (или любую секцию), `nav` оборачивает блок ссылок, `main` — доминирующее содержимое, а `aside` — второстепенное: сайдбар, выносная цитата, связанные ссылки.

### Правила, которые держат лендмарки честными

`main` должен появляться ровно один раз на страницу, и его нельзя вкладывать внутрь другого `header`, `footer` или `nav`. `nav` — для основного или локального блока навигации, а не для каждой ссылки на странице. А `header` внутри `article` — это заголовок статьи, а не страницы: контекст меняет смысл.

## Article и section

`article` — самостоятельная композиция, которую можно вынести и она всё равно будет иметь смысл: пост блога, карточка товара, комментарий. `section` — тематическая группировка внутри документа, и почти всегда с заголовком:

```html
<article>
  <header>
    <h1>How we ship on Fridays</h1>
    <time datetime="2026-09-01">Sept 1, 2026</time>
  </header>
  <section>
    <h2>The checklist</h2>
    <p>Tests green, changelog written, deploy scheduled.</p>
  </section>
  <footer>
    <p>By Ada</p>
  </footer>
</article>
```

Проверка для выбора между ними: переживёт ли он синдикацию в ленту или блок «похожие материалы» сам по себе? Если да — это `article`. Если он существует только как глава страницы — это `section`.

## Маленькие семантические элементы

Небольшая группа инлайновых и блочных элементов несёт смысл, который стоит использовать:

| Элемент | Смысл |
| --------- | ------- |
| time | машиночитаемая дата или время в `datetime`, человекочитаемый текст внутри |
| figure | самостоятельное медиа с опциональным figcaption |
| blockquote | цитата из другого источника |
| mark | текст, выделенный по значимости, как маркером |
| abbr | аббревиатура с расшифровкой в `title` |
| address | контактная информация страницы или статьи |
| progress | прогресс задачи, с `value` и `max` |
| meter | известное значение в пределах диапазона |
| details / summary | нативный сворачиваемый блок |

```html
<p>
  Published on <time datetime="2026-09-01">Sept 1, 2026</time>.
  See also <abbr title="HyperText Markup Language">HTML</abbr>.
</p>
```

## Div и span: всё ещё тут, всё ещё в порядке

«Семантика» не означает «никогда не использовать `div`». `div` и `span` остаются нейтральными боксами на случай, когда не подошёл ни один элемент — flex-контейнер, крючок для стилей. Правило: сначала тянитесь к семантическому элементу, а к `div` уходите только когда ничего не подошло. Страница, полная `div class="nav"` — это страница, где имена классов делают ту работу, которую должны делать теги.

## Частые ошибки

> **WARNING**
> Несколько элементов `main` ломают карту лендмарков. Одна страница — один `main`; остальное содержимое — в `article`, `aside` или `section`.

> **WARNING**
> Завернуть всю верхнюю часть страницы в `nav`, потому что «в хедере есть ссылки», превращает весь хедер в один гигантский лендмарк навигации. Держите `nav` вокруг списка ссылок.

> **TIP**
> Аудитируйте страницу, читая только имена элементов, сверху вниз. Если история, которую рассказывают теги, слабее истории, которую рассказывает контент, — у вас div-суп; замените имена.
