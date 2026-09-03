---
id: html-tags
track: html
type: reference
section: reference
order: 2
title:
  en: "Tags Quick Reference"
  ru: "Шпаргалка по тегам"
excerpt:
  en: "A fast lookup of HTML elements by job — what each tag is for, its key attributes, and the traps. Consult it while writing markup to confirm the right element."
  ru: "Быстрый справочник HTML-элементов по назначению — что делает каждый тег, его ключевые атрибуты и ловушки. Подсказывает правильный тег прямо во время разметки."
version: "html5"
updated: 2026-09-03
---

A lookup of the HTML elements grouped by job: what each tag is for, its key attributes, and the trap to watch out for. Use it while writing markup to confirm the right element — not a style, not a guess.

## Text and headings

The elements that carry the page's words. Headings form the outline, `p` carries the prose, and the inline elements mark up individual words.

| Tag | Purpose | Key notes |
| ----- | --------- | ----------- |
| `h1`–`h6` | headings, six levels | one `h1`, never skip levels |
| `p` | a paragraph | block element; another `p` closes it |
| `strong` | importance | renders bold |
| `em` | stress | renders italic |
| `b` / `i` | styling without extra meaning | product names, technical terms |
| `code` | inline code | monospace font |
| `pre` | a preformatted block | preserves whitespace and newlines |
| `blockquote` | a quotation | `cite` attribute for the source URL |
| `mark` | relevance highlighting | like a highlighter pen |
| `small` | fine print | side comments, legal notes |
| `abbr` | an abbreviation | `title` holds the expansion |
| `time` | a date or time | `datetime` holds the machine format |
| `hr` | a thematic break | void element |
| `br` | a line break | avoid in flowing text |
| `sub` / `sup` | subscript / superscript | chemical formulas, math |

## Structure and landmarks

The big regions of a page. Their names are announced by screen readers and read by search engines, so the choice is not cosmetic.

| Tag | Purpose | Key notes |
| ----- | --------- | ----------- |
| `header` | header for a page or section | may contain `nav` and headings |
| `nav` | a block of navigation links | one per navigation area |
| `main` | the primary content | exactly one per page |
| `article` | a self-contained composition | blog post, card, comment |
| `section` | a thematic group | should have a heading |
| `aside` | tangential content | sidebar, pull quote |
| `footer` | footer for a page or section | copyright, metadata |
| `figure` / `figcaption` | media plus its caption | caption optional |
| `details` / `summary` | a native collapsible | no JavaScript needed |
| `dialog` | a modal or non-modal window | `showModal()` for the modal |
| `div` | a neutral block | when no semantic element fits |
| `span` | a neutral inline | a styling hook |

## Media

The elements that embed things the page does not contain as text.

| Tag | Purpose | Key notes |
| ----- | --------- | ----------- |
| `img` | an image | void; `alt` required; `width`/`height` |
| `picture` / `source` | art-directed images | the browser picks a source |
| `video` | a video player | `controls`; `source` children |
| `audio` | an audio player | `controls`; `source` children |
| `source` | a format option for media | `type` selects the format |
| `track` | captions and subtitles | `src`, `kind`, `srclang` |
| `canvas` | programmatic drawing | 2D context or WebGL |
| `iframe` | an embedded document | `title` attribute for a11y |
| `embed` / `object` | plugin and legacy embeds | rarely needed today |

## Forms

The elements where the user hands data to the page.

| Tag | Purpose | Key notes |
| ----- | --------- | ----------- |
| `form` | a group of fields plus submit | `action`, `method` |
| `input` | a field of a given type | the `type` attribute drives everything |
| `label` | a control's name | `for` points at the input's `id` |
| `fieldset` / `legend` | a group of fields plus its name | legend announced on focus entry |
| `select` / `option` / `optgroup` | a pick-from-a list | `multiple` allowed |
| `textarea` | multi-line text | content goes between the tags |
| `button` | a clickable action | `type`: submit, button, reset |
| `datalist` | suggestions for an input | connected via the `list` attribute |
| `output` | the result of a calculation | `for` names the related inputs |

> **TIP**
> When in doubt between two tags, ask which one a screen reader announces more honestly — and which one a search engine reads as content. The answer is almost always the semantic element.

<!-- RU -->

Справочник HTML-элементов по группам-ролям: что делает каждый тег, его ключевые атрибуты и ловушка, на которую стоит смотреть. Используйте во время разметки, чтобы подтвердить, что тег выбран правильно — не на глаз и не по привычке.

## Текст и заголовки

Элементы, которые несут слова страницы. Заголовки формируют план, `p` несёт связный текст, инлайновые элементы размечают отдельные слова.

| Тег | Назначение | Ключевые заметки |
| ----- | ------------ | ------------------ |
| `h1`–`h6` | заголовки, шесть уровней | один `h1`, без пропусков уровней |
| `p` | параграф | блочный; следующий `p` закрывает его |
| `strong` | важность | рендерится жирным |
| `em` | ударение | рендерится курсивом |
| `b` / `i` | стилизация без доп. значения | имена продуктов, термины |
| `code` | инлайновый код | моноширинный шрифт |
| `pre` | препроформатированный блок | сохраняет пробелы и переносы |
| `blockquote` | цитата | `cite` — URL источника |
| `mark` | выделение по значимости | как маркером |
| `small` | мелкий шрифт | сбоку, юридические примечания |
| `abbr` | аббревиатура | `title` — расшифровка |
| `time` | дата или время | `datetime` — машиночитаемый формат |
| `hr` | тематический разделитель | пустой элемент |
| `br` | перенос строки | избегать в потоковом тексте |
| `sub` / `sup` | подстрочный / надстрочный | формулы, математика |

## Структура и лендмарки

Большие регионы страницы. Их имена озвучивают скринридеры и читают поисковики, поэтому выбор не косметический.

| Тег | Назначение | Ключевые заметки |
| ----- | ------------ | ------------------ |
| `header` | заголовок страницы или секции | может содержать `nav` и заголовки |
| `nav` | блок ссылок навигации | один на каждую зону навигации |
| `main` | основное содержимое | ровно один на страницу |
| `article` | самостоятельная композиция | пост, карточка, комментарий |
| `section` | тематическая группа | должен иметь заголовок |
| `aside` | второстепенное содержимое | сайдбар, выносная цитата |
| `footer` | футер страницы или секции | копирайт, метаданные |
| `figure` / `figcaption` | медиа плюс подпись | подпись опциональна |
| `details` / `summary` | нативный сворачиваемый блок | без JavaScript |
| `dialog` | модалка или окно | `showModal()` — для модалки |
| `div` | нейтральный блок | когда не подошёл семантический |
| `span` | нейтральный инлайн | крючок для стилей |

## Медиа

Элементы, встраивающие то, чего нет на странице текстом.

| Тег | Назначение | Ключевые заметки |
| ----- | ------------ | ------------------ |
| `img` | изображение | void; `alt` обязателен; `width`/`height` |
| `picture` / `source` | адаптивные изображения | браузер выбирает source |
| `video` | видеоплеер | `controls`; дочерние `source` |
| `audio` | аудиоплеер | `controls`; дочерние `source` |
| `source` | вариант формата медиа | `type` выбирает формат |
| `track` | субтитры и подписи | `src`, `kind`, `srclang` |
| `canvas` | программная отрисовка | 2D-контекст или WebGL |
| `iframe` | встроенный документ | `title` для доступности |
| `embed` / `object` | плагины и legacy-встраивание | сегодня редко нужны |

## Формы

Элементы, где пользователь передаёт данные странице.

| Тег | Назначение | Ключевые заметки |
| ----- | ------------ | ------------------ |
| `form` | группа полей плюс отправка | `action`, `method` |
| `input` | поле заданного типа | атрибут `type` управляет всем |
| `label` | имя контрола | `for` указывает на `id` input |
| `fieldset` / `legend` | группа полей плюс её имя | легенда озвучивается при входе фокуса |
| `select` / `option` / `optgroup` | выбор из списка | допустимо `multiple` |
| `textarea` | многострочный текст | содержимое между тегами |
| `button` | кликабельное действие | `type`: submit, button, reset |
| `datalist` | подсказки для input | связывается атрибутом `list` |
| `output` | результат вычисления | `for` называет связанные поля |

> **TIP**
> Если сомневаетесь между двумя тегами, спросите, какой из них более честно озвучит скринридер — и какой поисковик прочитает как контент. Ответ почти всегда — семантический элемент.
