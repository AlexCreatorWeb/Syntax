# Урок 7. Формы I: каркас и типы input

## Цель
После урока студент сможет: собрать форму с правильным связыванием `label` и полей, выбрать нужный `type="input"` под каждый тип данных, сгруппировать поля через `fieldset`/`legend` и отличить `button` от `input[type=submit]`.

## Теория

Форма — это **контракт** между пользователем и приложением: «дай мне такие-то данные». HTML5 даёт инструментарий, чтобы контракт был честным: правильные поля под правильный ввод (телефонная клавиатура на телефоне для `tel`), валидация «из коробки» (урок 8), доступность «из коробки» (label).

**Каркас формы:**
```html
<form action="/subscribe" method="post">
  ... поля ...
  <button type="submit">Подписаться</button>
</form>
```
- `action` — куда отправить. Пустой/отсутствует — на текущую страницу.
- `method` — `get` (данные в URL, для поиска) или `post` (в теле запроса, для отправлений). По умолчанию `get`.
- `enctype` — `multipart/form-data` НУЖЕН, когда есть `<input type="file">` (иначе файл не уйдёт).

**`<label>` — сердце доступности формы.** Два способа связать:
1. Явный: `<label for="email">` + `<input id="email">`. `for`/`id` — точное совпадение.
2. Вложенный: `<label>Почта <input type="email"></label>`.

Зачем: клик по подписи фокусирует поле; скринридер при фокусе на поле ЧИТАЕТ подпись (без label — «текстовое поле, без имени»). `placeholder` — НЕ замена label: он исчезает при вводе, плохо читается (слабый контраст), а скринридеры не всегда озвучивают.

**Выбор `type` у `input`** (HTML5-зоопарк):

| type | Когда | Что даёт |
|---|---|---|
| `text` | любой текст | базовый |
| `email` | почта | проверка @, мобильная клавиатура с @ |
| `tel` | телефон | цифровая клавиатура, +, -, # |
| `url` | ссылка | проверка формата |
| `number` | число | стрелки, min/max/step |
| `range` | слайдер | ползунок (min/max/step) |
| `password` | пароль | маскировка |
| `search` | поиск | стиль + кнопка очистки в некоторых браузерах |
| `date`, `month`, `week`, `time`, `datetime-local` | даты | нативный пикер |
| `color` | цвет | пикер |
| `checkbox` | много выбора из набора | галочка |
| `radio` | один из набора | круг (группируются по `name`) |
| `file` | загрузка файла | диалог выбора файла (+enctype) |
| `hidden` | данные для формы, невидимые | скрытое поле |

**`name`** — имя поля в данных отправки (без `name` поле «не существует» для сервера). **`value`** — стартовое/выбранное значение.

**`<fieldset>` + `<legend>`** — группа полей с общей подписью: «Адрес доставки» (индекс, город, улица). `legend` — название группы, скринридер объявляет его при входе в группу. Для `radio`-группы `fieldset` практически обязан: без него скринридер не понимает, что радио — ОДНА группа (а не три независимых).

**`<button>` vs `<input type="submit">`:**
- `<button>` — гибче: внутри может быть `<img>`, иконка, HTML. Дефолтный `type` у button — **`submit`** (ловушка: button внутри формы без type «отправляет» форму).
- `<input type="submit" value="OK">` — прост и валиден, но только текст.
- Кнопка-действие (не отправка: «очистить», «ещё товар») — `type="button"` (иначе тоже отправит форму).

**`<select>`, `<textarea>`** — в уроке 8. Пока запомните: `<textarea>` — НЕ однострочный, размер задаётся `rows`/`cols` (или CSS), «значение» — текст МЕЖДУ тегами.

## Пример

```html
<form action="/register" method="post">
  <h1>Регистрация</h1>

  <label for="name">Имя</label>
  <input type="text" id="name" name="name" required autocomplete="given-name">

  <label for="email">Почта</label>
  <input type="email" id="email" name="email" required
         autocomplete="email" placeholder="you@example.com">

  <label for="phone">Телефон</label>
  <input type="tel" id="phone" name="phone" autocomplete="tel">

  <label for="birthday">Дата рождения</label>
  <input type="date" id="birthday" name="birthday">

  <fieldset>
    <legend>Пол</legend>
    <label><input type="radio" name="gender" value="f"> Женский</label>
    <label><input type="radio" name="gender" value="m"> Мужской</label>
    <label><input type="radio" name="gender" value="other"> Другое / не важно</label>
  </fieldset>

  <fieldset>
    <legend>Как узнали о нас</legend>
    <label><input type="checkbox" name="src" value="search"> Поисковик</label>
    <label><input type="checkbox" name="src" value="friend"> Друг</label>
    <label><input type="checkbox" name="src" value="ads"> Реклама</label>
  </fieldset>

  <label for="avatar">Аватар</label>
  <input type="file" id="avatar" name="avatar" accept="image/*">

  <p>
    <label><input type="checkbox" name="agree" required>
    <span>Соглашаюсь с <a href="/terms">условиями</a></span></label>
  </p>

  <button type="submit">Зарегистрироваться</button>
  <button type="button">Сбросить</button>
  <input type="hidden" name="page" value="signup">
</form>
```

Обратите внимание:
- `autocomplete="email"` — браузер предложит сохранённую почту; значения: `name`, `given-name`, `email`, `tel`, `street-address` и десятки других (W3C vocabulary).
- `accept="image/*"` — ограничивает диалог выбора файла.
- `fieldset` у radio ОБЯЗАТЕЛЕН (урок 11 объяснит почему).
- `button type="button"` — «Сбросить» не отправит форму.

## Частые ошибки новичков

| Ошибка | Почему плохо | Как правильно |
|---|---|---|
| Подпись «над» полем как `<span>`/`<p>`, label нет | Скринридер: «текстовое поле» без имени; клик по подписи не фокусирует | `<label for>` + `id` (или вложенный label) |
| `placeholder` как единственная «подсказка» | Исчезает при вводе, слабый контраст, a11y-проблема | label всегда; placeholder — только пример формата |
| `name` у input пропущен | Поле не отправляется на сервер | `name` — у каждого «живого» поля |
| Радио-группа без одинакового `name` | Три независимых «включателя», а не выбор | Одинаковый `name` у группы |
| Радио без `fieldset`/`legend` | Скринридер не объявляет группу и её тему | fieldset + legend |
| `button` без `type` внутри формы | По умолчанию `submit` — «кнопка-декор» отправляет форму | Явный `type="button"` для не-отправки |
| `input type="file"` без `enctype="multipart/form-data"` | Файл не доезжает | enctype на `<form>` |
| `size="30"` на text как «ширина» | Это символы, не px | Ширина — CSS |
| `<input type="text">` для всего (почта, телефон, число) | Нет мобильной клавиатуры, нет проверки | Правильный `type` |
| `id`/`for` «на глаз» не совпадают | label молча не работает | Точное совпадение, проверять в devtools |

## Практическое задание

1. Соберите форму обратной связи: имя (text), почта (email), тема (select-заглушка — текст «select будет в уроке 8»), сообщение (заглушка textarea-текст), checkbox «согласен на обработку», кнопка отправки.
2. Добавьте `fieldset` «Контакт» с `legend` и полями телефон (tel) + город (text) + дата встречи (date).
3. Каждая подпись — `label`; каждый `input` имеет `name` и (где уместно) `autocomplete`.
4. Проверьте: клик по любой подписи фокусирует поле; на телефоне (DevTools → device mode) для `tel` открывается цифровая клавиатура.
5. Бонус: добавьте `button type="button"` «Очистить» и убедитесь, что он НЕ отправляет форму (нет перехода).
