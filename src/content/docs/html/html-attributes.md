---
id: html-attributes
track: html
type: reference
section: reference
order: 3
title:
  en: "Attributes Reference"
  ru: "Справочник по атрибутам"
excerpt:
  en: "The attributes that show up in daily markup, grouped by where they live — global, head, link and image, and form attributes. If it is here, you will meet it."
  ru: "Атрибуты, которые реально встречаются в повседневной разметке, сгруппированные по месту жизни — глобальные, head, ссылки и изображения, формы. Если он здесь — вы с ним столкнётесь."
version: "html5"
updated: 2026-09-03
---

The attributes that actually show up in daily markup, grouped by where they live. If an attribute is in this list, you will meet it; if you meet something that is not in it, it is a specialist.

## Global attributes

Every element can take these:

| Attribute | Purpose |
| ----------- | --------- |
| `id` | a unique hook for CSS, JS, and anchors |
| `class` | space-separated style and behavior hooks |
| `title` | a tooltip; fallback for the accessible name |
| `lang` | a per-fragment language override |
| `dir` | text direction: `ltr`, `rtl`, `auto` |
| `hidden` | removed from rendering and tab order |
| `tabindex` | `-1`: programmatic focus; `0`: in the tab order |
| `style` | inline CSS, the last resort |
| `data-*` | your own data, read via `dataset` |
| `contenteditable` | a rich-text region, with caution |

A short example combining several of them:

```html
<p id="intro" class="lead" lang="en" data-section="1" tabindex="-1">
  The first paragraph of the page.
</p>
```

## Head attributes

The metadata that the page uses before it renders:

| Attribute or element | Purpose |
| ---------------------- | --------- |
| `meta charset` | the encoding; the value is `UTF-8` |
| `meta name="…"` with `content` | description, keywords, author |
| `meta property="og:…"` with `content` | social share metadata |
| `meta http-equiv="refresh"` | auto-redirect, best avoided |
| `link rel` | stylesheet, icon, canonical, preload |
| `link href` | the target of `rel` |
| `script src` | an external JavaScript file |
| `script defer` | run after parsing, in order |
| `script async` | run as soon as loaded, out of order |
| `base href` | the base for all relative URLs |

The defer versus async question comes up constantly: `defer` preserves the order of multiple scripts and runs them after the DOM is ready; `async` runs each file as soon as it arrives. For most pages, `defer` is the right default.

## Link, image, and media attributes

| Attribute | On | Purpose |
| ----------- | ---- | --------- |
| `href` | `a`, `link` | the target URL |
| `target` | `a` | `_blank` opens a new tab |
| `rel` | `a`, `link` | the relationship; `noopener` with `_blank` |
| `download` | `a` | prompt a download |
| `src` | `img`, `script`, `video`, `iframe` | the resource URL |
| `srcset` / `sizes` | `img`, `source` | a responsive set of resolutions |
| `alt` | `img` | the text alternative |
| `width` / `height` | `img`, `video` | the reserved layout space |
| `poster` | `video` | the frame shown before playback |
| `controls` | `video`, `audio` | show the native controls |
| `preload` | `video`, `audio` | how much to download up front |
| `type` | `source` | the media type, e.g. `video/mp4` |
| `loading="lazy"` | `img`, `iframe` | defer off-screen loading |

## Form attributes

| Attribute | On | Purpose |
| ----------- | ---- | --------- |
| `action` | `form` | the submit URL |
| `method` | `form` | `get` or `post` |
| `novalidate` | `form` | skip browser validation |
| `type` | `input`, `button` | the kind of control |
| `for` | `label` | the `id` of the bound input |
| `name` | `input`, `select`, `textarea` | the key in the submitted data |
| `value` | `input`, `select`, `button` | the initial or current value |
| `required` | `input`, `select`, `textarea` | must not be empty |
| `placeholder` | `input`, `textarea` | a ghost hint, not a label |
| `min` / `max` / `step` | `input` number and date | bounds and increments |
| `minlength` / `maxlength` | `input`, `textarea` | the string size |
| `pattern` | `input` | a regex the value must match |
| `multiple` | `select`, `input file` | allow several values |
| `readonly` / `disabled` | `input`, `textarea` | read-only versus out of submission |
| `autocomplete` | `input` | browser autofill hints |

> **TIP**
> Two attributes that look minor and are not: `rel="noopener"` on every `target="_blank"` link (a security line), and `loading="lazy"` on below-the-fold images (a load-speed line). Add both by reflex.

<!-- RU -->

Атрибуты, которые реально встречаются в повседневной разметке, сгруппированные по месту жизни. Если атрибут в этом списке — вы с ним столкнётесь; если столкнулись с тем, чего тут нет, — это специалист.

## Глобальные атрибуты

Их может принять любой элемент:

| Атрибут | Назначение |
| --------- | ------------ |
| `id` | уникальный крючок для CSS, JS и якорей |
| `class` | пробельный список стилевых и поведенческих крючков |
| `title` | тултип; запасной доступный name |
| `lang` | переопределение языка для фрагмента |
| `dir` | направление текста: `ltr`, `rtl`, `auto` |
| `hidden` | убирает из отрисовки и tab-порядка |
| `tabindex` | `-1`: программный фокус; `0`: в tab-порядке |
| `style` | инлайновые CSS — последний аргумент |
| `data-*` | ваши собственные данные, читаются через `dataset` |
| `contenteditable` | rich-text-регион — осторожно |

Короткий пример с несколькими атрибутами сразу:

```html
<p id="intro" class="lead" lang="en" data-section="1" tabindex="-1">
  The first paragraph of the page.
</p>
```

## Атрибуты head

Метаданные, которые страница использует до отрисовки:

| Атрибут или элемент | Назначение |
| --------------------- | ------------ |
| `meta charset` | кодировка; значение `UTF-8` |
| `meta name="…"` с `content` | description, keywords, author |
| `meta property="og:…"` с `content` | метаданные для соцсетей |
| `meta http-equiv="refresh"` | авто-редирект, лучше избегать |
| `link rel` | stylesheet, icon, canonical, preload |
| `link href` | цель для `rel` |
| `script src` | внешний файл JavaScript |
| `script defer` | выполняется после разбора, по порядку |
| `script async` | выполняется сразу после загрузки, в любом порядке |
| `base href` | база для всех относительных URL |

Вопрос defer против async возникает постоянно: `defer` сохраняет порядок нескольких скриптов и запускает их после готовности DOM; `async` запускает каждый файл сразу после его прибытия. Для большинства страниц `defer` — правильный дефолт.

## Атрибуты ссылок, изображений и медиа

| Атрибут | Где | Назначение |
| --------- | ----- | ------------ |
| `href` | `a`, `link` | целевой URL |
| `target` | `a` | `_blank` открывает новую вкладку |
| `rel` | `a`, `link` | отношение; `noopener` вместе с `_blank` |
| `download` | `a` | предложить скачать файл |
| `src` | `img`, `script`, `video`, `iframe` | URL ресурса |
| `srcset` / `sizes` | `img`, `source` | адаптивный набор разрешений |
| `alt` | `img` | текстовый эквивалент |
| `width` / `height` | `img`, `video` | зарезервированное место макета |
| `poster` | `video` | кадр, показываемый до воспроизведения |
| `controls` | `video`, `audio` | показать нативные контролы |
| `preload` | `video`, `audio` | сколько скачивать заранее |
| `type` | `source` | тип медиа, например `video/mp4` |
| `loading="lazy"` | `img`, `iframe` | откладывать загрузку за экраном |

## Атрибуты форм

| Атрибут | Где | Назначение |
| --------- | ----- | ------------ |
| `action` | `form` | URL отправки |
| `method` | `form` | `get` или `post` |
| `novalidate` | `form` | пропустить валидацию браузера |
| `type` | `input`, `button` | вид контрола |
| `for` | `label` | `id` связанного input |
| `name` | `input`, `select`, `textarea` | ключ в отправляемых данных |
| `value` | `input`, `select`, `button` | начальное или текущее значение |
| `required` | `input`, `select`, `textarea` | не должно быть пустым |
| `placeholder` | `input`, `textarea` | призрачная подсказка, не лейбл |
| `min` / `max` / `step` | `input` number и date | границы и инкременты |
| `minlength` / `maxlength` | `input`, `textarea` | размер строки |
| `pattern` | `input` | regex, которому должно соответствовать значение |
| `multiple` | `select`, `input file` | разрешить несколько значений |
| `readonly` / `disabled` | `input`, `textarea` | только чтение против исключения из отправки |
| `autocomplete` | `input` | подсказки автозаполнения браузера |

> **TIP**
> Два атрибута, которые выглядят мелкими, но не являются: `rel="noopener"` на каждой ссылке с `target="_blank"` (строка безопасности) и `loading="lazy"` на изображениях ниже первого экрана (строка скорости загрузки). Добавляйте оба на рефлексии.
