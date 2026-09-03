---
id: html-anatomy
track: html
type: reference
section: reference
order: 1
title:
  en: "Document Anatomy"
  ru: "Анатомия HTML-документа"
excerpt:
  en: "A one-page map of a valid HTML document: every part, where it lives, what it does, and what breaks when it is missing. Use it as a pre-publish checklist."
  ru: "Одностраничная карта валидного HTML-документа: каждая часть, где она живёт, что делает и что ломается при её отсутствии. Используйте как чек-лист перед публикацией."
version: "html5"
updated: 2026-09-03
relatedTask: html-001
---

A compact map of a valid HTML document: what every part is, where it lives, and what happens when it is missing. Bookmark this page and use it as a checklist before you publish.

## The skeleton, annotated

```html
<!DOCTYPE html>            <!-- standards mode, must be line one -->
<html lang="en">           <!-- root element, declares the language -->
  <head>                   <!-- metadata, never rendered -->
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Page title</title>
  </head>
  <body>                   <!-- everything that gets rendered -->
    <h1>Page name</h1>
    <p>Content.</p>
  </body>
</html>
```

The order is fixed: DOCTYPE, then `html` (with `lang`), then `head`, then `body`. A browser will repair a broken order with its heuristics, but every heuristic is a place where your intent can be lost.

## Everything that goes in head

| Element / attribute | Purpose | Required |
| --------------------- | --------- | ---------- |
| `meta charset="UTF-8"` | encoding; first meta for a reason | de facto yes |
| `meta name="viewport"` | mobile scaling | yes for responsive |
| `title` | tab, bookmarks, search results | yes |
| `meta name="description"` | the search snippet | recommended |
| `link rel="icon"` | the tab favicon | recommended |
| `link rel="stylesheet"` | CSS | as needed |
| `script src="…" defer` | JS after parsing, in order | as needed |
| `meta property="og:…"` | social share previews | as needed |
| `link rel="canonical"` | canonical URL for search engines | as needed |

The head is parsed before anything renders, so keep it fast: the charset on the first meta, the viewport right after, the title before any stylesheet link.

## Everything that goes in body

| Element | Role | How many per page |
| --------- | ------ | ------------------- |
| `header` | header for the page or a section | 0 to many |
| `nav` | a block of navigation links | 0 to many |
| `main` | the primary content | exactly one |
| `article` | a self-contained composition | 0 to many |
| `section` | a thematic group with a heading | 0 to many |
| `aside` | tangential content, a sidebar | 0 to many |
| `footer` | footer for the page or a section | 0 to many |
| `h1` | the page's name | one (recommended) |

## What the browser does with it

The parser turns the byte stream into a tree of nodes — the DOM. Every tag becomes a node, every attribute becomes a property, and the document is the root of that tree. CSS selectors, JavaScript queries, and screen-reader navigation all walk this same tree, which is why a broken skeleton does not just "look wrong" — it changes what every other layer of the page sees.

> **TIP**
> Paste the annotated skeleton into a blank file and change `lang` and `title`. The result is your checklist: DOCTYPE first, `lang` present, charset first in head, exactly one `main` in body.

<!-- RU -->

Компактная карта валидного HTML-документа: что такое каждая часть, где она живёт и что происходит, когда её нет. Добавьте страницу в закладки и используйте как чек-лист перед публикацией.

## Каркас с аннотациями

```html
<!DOCTYPE html>            <!-- standards mode, обязательна первая строка -->
<html lang="en">           <!-- корневой элемент, объявляет язык -->
  <head>                   <!-- метаданные, никогда не рендерятся -->
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Page title</title>
  </head>
  <body>                   <!-- всё, что рендерится -->
    <h1>Page name</h1>
    <p>Content.</p>
  </body>
</html>
```

Порядок фиксирован: DOCTYPE, затем `html` (с `lang`), затем `head`, затем `body`. Браузер чинит сломанный порядок своими эвристиками, но каждая эвристика — место, где может потеряться ваш замысел.

## Всё, что живёт в head

| Элемент / атрибут | Назначение | Обязателен |
| ------------------- | ------------ | ------------ |
| `meta charset="UTF-8"` | кодировка; первый meta не зря | фактически да |
| `meta name="viewport"` | масштабирование на мобильных | да для адаптивности |
| `title` | вкладка, закладки, поиск | да |
| `meta name="description"` | поисковый сниппет | рекомендуется |
| `link rel="icon"` | favicon вкладки | рекомендуется |
| `link rel="stylesheet"` | CSS | по необходимости |
| `script src="…" defer` | JS после разбора, по порядку | по необходимости |
| `meta property="og:…"` | превью при шаринге в соцсетях | по необходимости |
| `link rel="canonical"` | канонический URL для поисковиков | по необходимости |

Head разбирается до любой отрисовки, поэтому держите его быстрым: charset в первом meta, viewport сразу после, title перед ссылками на стили.

## Всё, что живёт в body

| Элемент | Роль | Сколько на страницу |
| --------- | ------ | --------------------- |
| `header` | заголовок страницы или секции | от 0 до многих |
| `nav` | блок ссылок навигации | от 0 до многих |
| `main` | основное содержимое | ровно один |
| `article` | самостоятельная композиция | от 0 до многих |
| `section` | тематическая группа с заголовком | от 0 до многих |
| `aside` | второстепенное содержимое, сайдбар | от 0 до многих |
| `footer` | футер страницы или секции | от 0 до многих |
| `h1` | имя страницы | один (рекомендуется) |

## Что браузер с этим делает

Парсер превращает поток байтов в дерево узлов — DOM. Каждый тег становится узлом, каждый атрибут — свойством, а документ — корнем дерева. CSS-селекторы, JavaScript-запросы и навигация скринридера ходят по одному и тому же дереву, поэтому сломанный каркас не просто «выглядит криво» — он меняет то, что видят все остальные слои страницы.

> **TIP**
> Вставьте аннотированный каркас в пустой файл и поменяйте `lang` и `title`. Получится ваш чек-лист: DOCTYPE первым, `lang` есть, charset первым в head, ровно один `main` в body.
