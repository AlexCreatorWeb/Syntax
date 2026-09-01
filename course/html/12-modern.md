# Урок 12. Современные элементы: dialog, details, time и «забытые» теги

## Цель
После урока студент сможет: добавить модалку без единой строчки JS-логики видимости (`<dialog>`), раскрывающиеся блоки (`details`/`summary`), машино-читаемые даты (`time`), автодополнение (`datalist`) и заготовки (`template`), а также корректно заполнить meta-блок (SEO, Open Graph, favicon).

## Теория

HTML5 «дописан» не в 2014-м: стандарт живой (HTML Living Standard). Разберём элементы, которые давно должны быть в арсенале, но часто «неизвестны».

**`<dialog>` — нативная модалка.**
```html
<dialog id="confirm" aria-labelledby="confirm-h">
  <h2 id="confirm-h">Удалить?</h2>
  <p>Действие необратимо.</p>
  <menu>
    <button type="button" id="cancel">Отмена</button>
    <button type="submit">Удалить</button>
  </menu>
</dialog>
<button type="button" id="open">Удалить пост</button>

<script>
  const dlg = document.getElementById("confirm");
  document.getElementById("open").addEventListener("click", () => dlg.showModal());
  document.getElementById("cancel").addEventListener("click", () => dlg.close());
</script>
```
Что получает «из коробки»:
- `showModal()` — открывает в **modal** режиме: оверлей `::backdrop`, фокус «заперт» внутри, `Esc` закрывает, `Tab` не выходит наружу.
- `show()` — non-modal (в потоке документа).
- Закрывание по клику на `::backdrop` — через `dialog.addEventListener("click", e => { if (e.target === dlg) dlg.close(); })`.
- Атрибут `open` — «открыто» в разметке.
Это закрывает урок 11 («модалка без ловушки фокуса») без тысячи строк JS.

**`<details>` + `<summary>` — раскрывающийся блок.**
```html
<details>
  <summary>Что такое HTML?</summary>
  <p>Язык разметки: описывает СТРУКТУРУ...</p>
</details>

<details open>
  <summary>Уже раскрытый блок</summary>
  <p>Атрибут <code>open</code> — «открыт по умолчанию».</p>
</details>
```
- `summary` — «заголовок» (кликабельная стрелка).
- `open` — открыт по умолчанию.
- Внутри можно любой контент (списки, формы, видео).
- Идеален для: FAQ, «показать больше», глоссария, аккордеона (без JS).

**`<time>` — машино-читаемая дата/время.**
```html
<time datetime="2026-07-15">15 июля 2026</time>
<time datetime="2026-07-15T14:30">15 июля, 14:30</time>
<time datetime="2026-07">июль 2026</time>
<time datetime="PT1H30M">1 ч 30 мин</time>
<time datetime="2026-07-15T14:30" pubdate>15 июля</time>
```
- `datetime` — ISO 8601. Видимый текст — что угодно (человек читает).
- `pubdate` — «дата публикации» (для article).
- Зачем: поиск/микроформаты (schema.org), «N дней назад» на JS без парсинга «15 июля 2026».

**`<datalist>` — автодополнение для input.**
```html
<label for="browser">Ваш браузер</label>
<input type="text" id="browser" list="browsers">
<datalist id="browsers">
  <option value="Chrome">
  <option value="Firefox">
  <option value="Safari">
  <option value="Edge">
</datalist>
```
- Не «выпадающий список» (select), а «подсказки»: пользователь может ввести и своё.
- `list` на input ссылается на `id` datalist.

**`<template>` — «черновик» DOM.**
```html
<template id="card-tpl">
  <article class="card">
    <h3><span data-field="title"></span></h3>
    <p><span data-field="desc"></span></p>
  </article>
</template>
<script>
  const tpl = document.getElementById("card-tpl");
  const clone = tpl.content.cloneNode(true);
  clone.querySelector('[data-field="title"]').textContent = "Новый пост";
  clone.querySelector('[data-field="desc"]').textContent = "Описание";
  document.querySelector("main").append(clone);
</script>
```
- Контент `<template>` НЕ рендерится, НЕ грузится (картинки внутри не скачаются).
- `template.content` — DocumentFragment; клонируем и вставляем.
- Паттерн: «каркас» для повторяющихся блоков (JS-рендер без string-concat).

**Мета-блок (head) — SEO/OG/favicon:**
```html
<meta name="description" content="Курс HTML5: от структуры до a11y">
<link rel="canonical" href="https://example.com/course/html">
<meta property="og:title" content="Курс HTML5">
<meta property="og:description" content="13 уроков: структура, семантика, a11y">
<meta property="og:image" content="https://example.com/og.png">
<meta property="og:url" content="https://example.com/course/html">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch.png">
<meta name="theme-color" content="#0a0f0d">
```
- `description` — сниппет в поиске.
- `canonical` — «канонический» URL (защита от дублей).
- `og:*` — карточка при шаринге (Facebook/Telegram/Slack).
- `theme-color` — цвет «браузерного» UI (мобильные).
- Favicon: минимум `icon.svg` + `apple-touch-icon` (180×180).

## Частые ошибки новичков

| Ошибка | Почему плохо | Как правильно |
|---|---|---|
| Модалка на `div` + `display:none` + JS-фокус-ловушка | 100 строк JS на то, что даёт `dialog` «из коробки» | `<dialog>` + `showModal()` |
| `details` для «аккордеона» с «одним открытым» | Нативно — каждый блок раскрывается независимо | JS: `details.addEventListener("toggle", ...)` закрывает siblings |
| `time` с `datetime="15/07/2026"` | Не ISO 8601, парсится неверно | `2026-07-15` (или полный формат) |
| `select` там, где нужно «и своё» (город: список + «другой») | select — закрытый набор | `datalist` (автодополнение) или input+JS |
| `template` с `<script>` внутри | Скрипт при клонировании НЕ исполняется (fallback) | События вешать ПОСЛЕ вставки |
| OG без `og:image` | Карточка без картинки — низкий CTR | 1200×630 (или 800×418 минимум) |
| `favicon.ico` один на все | Старые форматы, нет SVG | SVG + PNG (180) + `sizes="any"` |
| `theme-color` «на всякий случай» без тёмной/светлой | Мобильный UI не синхронизирован | Два meta с `media="(prefers-color-scheme: ...)"` |
| `dialog` без `aria-labelledby` | Модалка без имени | `aria-labelledby` на заголовок |
| `details` в `summary` со сложным HTML (кнопки) | Скринридер «не понимает» структуру | summary = текст/простой элемент |

## Практическое задание

1. Добавьте в страницу `<dialog>` (модалка «Подтвердите подписку»): кнопка-триггер, `showModal()`, Esc-закрытие, клик на backdrop закрывает.
2. Сделайте FAQ из 4 `<details>` (один `open` по умолчанию).
3. Разметьте 3 даты через `<time datetime>` (включая `pubdate`).
4. Добавьте `<datalist>` с 5 опциями к полю «Ваш фреймворк».
5. Наполните `head`: `description`, `canonical`, 4 `og:*`, 2 favicon (svg+png), `theme-color` (тёмный/светлый через media).
6. Бонус: сделайте «генератор карточек» на `<template>` (кнопка «+ пост» клонирует и вставляет).
