# Урок 15. Современные элементы: dialog, details, time

## Цель
После урока студент сможет: добавить модалку без JS-логики видимости (`<dialog>`), раскрывающиеся блоки (`details`/`summary`), машино-читаемые даты (`<time>`), автодополнение (`<datalist>`) и заготовки DOM (`<template>`).

## Теория
### dialog — нативная модалка
`<dialog id="confirm">…</dialog>` + `showModal()` из JS. Что даёт «из коробки»: оверлей `::backdrop`, фокус «заперт» внутри, Esc закрывает, Tab не выходит наружу — это закрывает урок 13 («модалка без ловушки фокуса») без сотни строк JS. `show()` — non-modal (в потоке), атрибут `open` — «открыто» в разметке. Клик по фону закрывает через обработчик на `::backdrop` (event.target === dialog). Имя для скринридера — `aria-labelledby` на заголовок.

### details и summary
Раскрывающийся блок: `<summary>` — «заголовок» (кликабельная стрелка), `open` — раскрыт по умолчанию, внутри — любой контент. Идеален для FAQ, «показать больше», глоссария, мобильного меню (урок 5). «Аккордеон с одним открытым» требует JS (toggle-событие закрывает siblings) — нативно каждый блок независим.

### time
`<time datetime="2026-07-15">15 июля 2026</time>` — машино-читаемая дата: формат ISO 8601 (YYYY-MM-DD, с T — время; PT1H30M — длительность), видимый текст — что угодно. `pubdate` — «дата публикации» для article. Зачем: поиск/микроформаты, «N дней назад» без парсинга «15 июля 2026».

### datalist и template
`<datalist>` — автодополнение: input со ссылкой `list="id"` + набор option; отличие от select — пользователь может ввести и своё. `<template>` — «черновик» DOM: контент НЕ рендерится и НЕ грузится; `template.content` — DocumentFragment, клонируем и вставляем (паттерн: каркас повторяющихся блоков без строкового конкатената). Все пять элементов поддерживаются всеми современными браузерами «из коробки».

TIP: dialog + details + time закрывают 80% «мелкой интерактивности» (модалки, FAQ, даты) без единого внешнего скрипта — это и есть «современный HTML».

## Пример
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
<details open>
  <summary>Что такое HTML?</summary>
  <p>Язык разметки: описывает СТРУКТУРУ страницы.</p>
</details>
<details>
  <summary>Чем отличается от CSS?</summary>
  <p>HTML — структура, CSS — внешний вид.</p>
</details>
<p>Опубликовано: <time datetime="2026-07-15" pubdate>15 июля 2026</time>.
Длительность: <time datetime="PT1H30M">1 ч 30 мин</time>.</p>
<label for="browser">Ваш браузер</label>
<input type="text" id="browser" list="browsers">
<datalist id="browsers">
  <option value="Chrome">
  <option value="Firefox">
  <option value="Safari">
</datalist>
<template id="card-tpl">
  <article>
    <h3><span data-field="title"></span></h3>
  </article>
</template>
<script>
  const dlg = document.getElementById("confirm");
  document.getElementById("open").onclick = () => dlg.showModal();
  document.getElementById("cancel").onclick = () => dlg.close();
</script>
```

## Частые ошибки
WARN: модалка на div + display:none + своя фокус-ловушка — сто строк JS на то, что даёт dialog «из коробки».
WARN: time с datetime="15/07/2026" — не ISO 8601, парсится неверно; пишем 2026-07-15.
WARN: select там, где нужно «и своё» (город: список + «другой») — select закрытый набор; datalist.
WARN: script внутри template «при клонировании» — не исполняется; события вешать ПОСЛЕ вставки.
WARN: dialog без aria-labelledby — модалка без имени для скринридера.

## Практическое задание
1. В стартовом файле соберите dialog (модалка «Подписка»): h2, текст, кнопка закрытия; script: showModal/close.
2. Проверьте: Esc закрывает, Tab «заперт» внутри, клик по фону (backdrop) закрывает.
3. Сделайте FAQ из 4 details (один open).
4. Добавьте 2 даты через time datetime (одна pubdate) и input + datalist с 5 опциями.
5. Бонус: кнопка «+ пост» клонирует template и вставляет в main.
