---
id: html-structure
track: html
type: guide
section: basics
order: 1
title:
  en: "Document Structure"
  ru: "Структура HTML-документа"
excerpt:
  en: "How an HTML document is put together: the DOCTYPE, the head with metadata, and the body with visible content. The valid skeleton every page starts from."
  ru: "Как собирается HTML-документ: DOCTYPE, head с метаданными и body с видимым содержимым. Корректный каркас, с которого начинается каждая страница."
version: "html5"
updated: 2026-09-03
relatedTask: html-001
---

Every HTML page on the web — a landing, an app, a single file saved on disk — is built from the same skeleton: a declaration, a head with metadata, and a body with visible content. This page walks through each part in the exact order the browser expects, so that by the end you can write a valid page skeleton from memory.

## Why the skeleton matters

HTML is a markup language: you wrap content in tags, and the browser builds a tree out of the result. That tree — the DOM — is what CSS styles, what JavaScript queries, and what screen readers walk. When the skeleton is broken (a missing DOCTYPE, a body before the head, a forgotten closing tag), the browser tries to repair your document with its own heuristics, and the result is unpredictable: the box model shifts, the tab shows a blank title, and assistive tools lose their bearings.

The good news is that a valid skeleton is short. Once you understand why each line exists, you will type it without thinking, hundreds of times.

## The DOCTYPE declaration

The document must start with exactly one DOCTYPE line — on the very first line, before any space or newline:

```html
<!DOCTYPE html>
```

This line does two things. It tells the browser to render the document in standards mode, following the HTML5 rules, and it stops older browser heuristics from switching the page into quirks mode, where the box model and form rendering differ in subtle, annoying ways. The declaration is case-insensitive, but by convention we write it in uppercase. Put nothing on that line: no leading spaces, no trailing comment, no BOM from the text editor.

## The html element

Immediately after the DOCTYPE comes the root element of the document. Every element of the page — visible or not — lives inside it:

```html
<html lang="en">
  <!-- <head> and <body> go inside -->
</html>
```

The `lang` attribute is not decoration. Screen readers use it to pick the right pronunciation rules, search engines use it to index the page in the right language, and the browser uses it to choose a spell-checking dictionary. Use a valid BCP-47 language code: `en`, `ru`, `de`, or a regional variant like `pt-BR`.

## The head: metadata before pixels

The head holds everything the browser needs to know before it renders a single pixel: the encoding, the viewport size, the page title, and references to stylesheets and scripts. The user never sees the head, but its absence is always visible — as mojibake, a stretched mobile layout, or a tab with no name.

### The three tags every page needs

```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>My Page</title>
</head>
```

`meta charset` fixes the document encoding; without it, accented letters and emoji often render as question marks. The `viewport` meta tells mobile browsers to use the real screen width; without it, phones pretend the page is 980 pixels wide and shrink everything to a miniature. The `title` is the text in the browser tab, in bookmarks, and in search results — one sentence, roughly 60 characters, that says what the page is.

Beyond these three essentials, the head is where the page introduces itself to the outside world: a `meta name="description"` for search engines, `og:` tags for social previews, and a `link rel="icon"` for the tab. None of them are required for the page to work, and the "Attributes Reference" page in this set covers them all.

## The body: visible content

The body holds everything the user sees and touches. By convention it starts with a heading that names the page, followed by the content itself:

```html
<body>
  <h1>Learning HTML</h1>
  <p>This is my first properly structured page.</p>
</body>
```

Keep one `h1` per page: it is the page's name, and both search engines and screen readers treat it that way. Everything else — navigation, media, forms, sidebars — gets its own element, and the "Semantic HTML" and "Text, Headings & Links" pages in this set cover them in detail.

## A complete minimal page

Here is the whole skeleton with every piece in the right order. It is short enough to memorize and correct enough to build on:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>My Page</title>
  </head>
  <body>
    <h1>Hello</h1>
    <p>The structure is in place — now add content.</p>
  </body>
</html>
```

## Common mistakes

> **WARNING**
> Anything before the DOCTYPE — a stray space, an early comment, an invisible BOM — is usually tolerated by browsers but flagged by validators, and it is the first thing to check when a page misbehaves. The DOCTYPE belongs on line one, character one.

> **WARNING**
> `<head>` and `<body>` look optional, because browsers will invent them for you. An invented body means your document is a pile of fragments, and that pile will keep costing you hours of debugging.

> **TIP**
> When you start a new project, paste the skeleton above and change only three things: `lang`, the `title`, and the `h1`. A consistent skeleton means every page in the project starts from the same, already-correct base.

<!-- RU -->

Каждая HTML-страница в интернете — лендинг, приложение, одиночный файл на диске — собирается из одного и того же каркаса: декларация, head с метаданными и body с видимым содержимым. В этой странице мы пройдём каждую часть в том самом порядке, который ждёт браузер, и к концу вы сможете написать валидный каркас страницы наизусть.

## Зачем нужен каркас

HTML — язык разметки: вы оборачиваете содержимое в теги, а браузер строит из результата дерево. Это дерево — DOM — то, что стилизует CSS, что опрашивает JavaScript и по чему ходит скринридер. Когда каркас сломан (нет DOCTYPE, body раньше head, забыт закрывающий тег), браузер чинит документ своими эвристиками, и результат непредсказуем: сдвигается box model, во вкладке пустой заголовок, а вспомогательные инструменты сбиваются с толку.

Хорошая новость: валидный каркас короткий. Как только вы поймёте, зачем нужна каждая строка, будете писать его не думая, сотни раз.

## Декларация DOCTYPE

Документ должен начинаться ровно одной строкой DOCTYPE — самой первой строкой, до любого пробела или переноса:

```html
<!DOCTYPE html>
```

Эта строка делает две вещи. Она говорит браузеру рендерить документ в standards mode по правилам HTML5 и не даёт старым эвристикам переключить страницу в quirks mode, где box model и отрисовка форм отличаются тонко, но ощутимо. Декларация нечувствительна к регистру, но по конвенции её пишут заглавными. Ничего не ставьте на этой строке: без ведущих пробелов, без комментария в конце и без BOM от текстового редактора.

## Элемент html

Сразу после DOCTYPE идёт корневой элемент документа. Внутри него живёт каждый элемент страницы — видимый и невидимый:

```html
<html lang="en">
  <!-- внутри — <head> и <body> -->
</html>
```

Атрибут `lang` — не украшение. Скринридеры по нему выбирают правила произношения, поисковики используют его, чтобы индексировать страницу в правильном языке, а браузер — чтобы подобрать словарь проверки орфографии. Используйте валидные коды языка BCP-47: `en`, `ru`, `de` или региональный вариант вроде `pt-BR`.

## Head: метаданные до пикселей

В head — всё, что браузеру нужно знать до отрисовки первого пикселя: кодировка, размер вьюпорта, заголовок страницы и ссылки на стили и скрипты. Пользователь head никогда не видит, но его отсутствие всегда заметно — как кракозябры, растянутый мобильный макет или вкладка без имени.

### Три тега, которые нужны на каждой странице

```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>My Page</title>
</head>
```

`meta charset` фиксирует кодировку документа; без неё буквы с диакритикой и эмодзи часто превращаются в вопросительные знаки. `viewport`-мета говорит мобильным браузерам использовать реальную ширину экрана; без него телефон считает, что страница 980 пикселей, и сжимает всё до миниатюры. `title` — текст во вкладке браузера, в закладках и в результатах поиска: одно предложение, около 60 символов, говорящее, что это за страница.

Помимо этих трёх обязательных, head — место, где страница представляет себя внешнему миру: `meta name="description"` для поисковиков, `og:`-теги для превью в соцсетях и `link rel="icon"` для вкладки. Ничто из этого не требуется, чтобы страница работала, и страница «Справочник по атрибутам» из этого набора разбирает всё перечисленное.

## Body: видимое содержимое

В body — всё, что пользователь видит и с чем взаимодействует. По конвенции он начинается с заголовка, называющего страницу, а дальше идёт само содержимое:

```html
<body>
  <h1>Learning HTML</h1>
  <p>This is my first properly structured page.</p>
</body>
```

Держите один `h1` на страницу: это имя страницы, и именно так его трактуют и поисковики, и скринридеры. Всё остальное — навигация, медиа, формы, сайдбары — получает свои элементы, а страницы «Семантическая разметка» и «Текст, заголовки и ссылки» из этого набора разбирают их подробно.

## Полная минимальная страница

Вот весь каркас, каждая деталь которого стоит на своём месте. Он достаточно короток, чтобы его запомнить, и достаточно корректен, чтобы строить на нём:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>My Page</title>
  </head>
  <body>
    <h1>Hello</h1>
    <p>The structure is in place — now add content.</p>
  </body>
</html>
```

## Частые ошибки

> **WARNING**
> Что-то ДО DOCTYPE — лишний пробел, ранний комментарий, невидимый BOM — браузеры обычно прощают, но валидаторы помечают, и это первое, что проверяют, когда страница ведёт себя странно. DOCTYPE — на первой строке, с первого символа.

> **WARNING**
> `<head>` и `<body>` выглядят опциональными, потому что браузеры изобретают их за вас. Изобретённый body — признак того, что документ — куча фрагментов, и эта куча будет стоить вам часы отладки.

> **TIP**
> Когда начинаете новый проект, вставьте каркас выше и измените только три вещи: `lang`, `title` и `h1`. Единый каркас означает, что каждая страница проекта стартует с одной и той же, уже корректной базы.
