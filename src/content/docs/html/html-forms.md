---
id: html-forms
track: html
type: guide
section: forms
order: 4
title:
  en: "Forms & Inputs"
  ru: "Формы и поля ввода"
excerpt:
  en: "Build a complete form: the form element, a dozen input types, labels that really bind, fieldset grouping, and the built-in browser validation that works before any JavaScript."
  ru: "Соберите полноценную форму: элемент form, дюжина типов input, лейблы, которые реально привязаны, группировка fieldset и встроенная валидация браузера — до единой строчки JavaScript."
version: "html5"
updated: 2026-09-03
relatedTask: html-007
---

Forms are where the user hands data to the machine. HTML gives you a dozen input types, built-in validation, and a way to group and label every field — all before a single line of JavaScript. This page covers the form element, its children, and the attributes that make the browser do the checking for you.

## Form anatomy

`form` wraps the fields and tells the browser where to send them. `action` is the destination URL, `method` is how the data travels:

```html
<form action="/contact" method="post">
  <label for="name">Name</label>
  <input id="name" type="text" required />

  <label for="email">Email</label>
  <input id="email" type="email" required />

  <button type="submit">Send</button>
</form>
```

With `method="get"` the values go into the URL as a query string — fine for searches, visible and bookmarkable. With `method="post"` they travel in the request body — fine for anything sensitive. The `button` with `type="submit"` is what actually fires the form. A bare `button` with no type defaults to `submit` too, which surprises people, so always write the type explicitly.

## The input element and its types

One element, many faces: `input` renders differently depending on `type`. The most common ones:

| Type | Renders as | Typical use |
| ------ | ------------ | ------------- |
| text | single-line field | names, search |
| email | field with built-in email check | contact forms |
| password | masked field | login |
| number | field with spinners, min/max/step | quantities |
| date | date picker | appointments |
| checkbox | on/off box | opt-ins, toggles |
| radio | mutually exclusive set | one-of-N choices |
| range | slider | volume, filters |
| color | color picker | themes |
| file | file chooser | uploads |

Radio buttons in one group must share the same `name` — the browser keeps only one checked per name:

```html
<fieldset>
  <legend>Plan</legend>
  <label><input type="radio" name="plan" value="free" /> Free</label>
  <label><input type="radio" name="plan" value="pro" checked /> Pro</label>
</fieldset>
```

## Labels: the invisible connection

A label binds to a field with `for` pointing at the field's `id`. The payoff: clicking anywhere on the label focuses the field, and a screen reader announces the label together with the field:

```html
<label for="terms">Accept the terms</label>
<input id="terms" type="checkbox" />
```

Wrapping the input inside the label works too — `<label>Email <input type="email" /></label>` — but the `for`/`id` form is the one you can see and reason about, and the one validators expect for most fields.

## Fieldsets: grouping related fields

`fieldset` visually and semantically groups a set of fields, and `legend` names the group:

```html
<fieldset>
  <legend>Delivery address</legend>
  <label for="street">Street</label>
  <input id="street" type="text" />
  <label for="city">City</label>
  <input id="city" type="text" />
</fieldset>
```

Screen readers announce the legend when focus enters the group and stop when it leaves — the difference between hearing "City" and hearing "Delivery address — City" is exactly that.

## Built-in validation

Browsers validate forms before your code ever runs. The attributes that do the work:

| Attribute | What it checks |
| ----------- | ---------------- |
| required | the field must not be empty |
| type | format: email, url, number, date… |
| min / max | value bounds for numbers and dates |
| minlength / maxlength | string size |
| step | allowed increments for numbers |
| pattern | a custom regex the value must match |

```html
<form action="/signup" method="post">
  <label for="email">Email</label>
  <input id="email" type="email" required placeholder="you@example.com" />

  <label for="password">Password</label>
  <input id="password" type="password" minlength="8" />

  <label for="terms">Accept the terms</label>
  <input id="terms" type="checkbox" required />

  <button type="submit">Sign up</button>
</form>
```

On submit, the browser blocks the send, focuses the first invalid field, and shows a native message in the user's language. Add `novalidate` to the form to disable all of it when you want to validate in JavaScript instead.

## Select and textarea

For pick-from-a-list, use `select` with `option` children. For multi-line text, use `textarea` — its text goes between the tags, not into a `value` attribute:

```html
<label for="country">Country</label>
<select id="country">
  <option value="ru">Russia</option>
  <option value="us">United States</option>
  <option value="de">Germany</option>
</select>

<label for="bio">Bio</label>
<textarea id="bio" rows="4" placeholder="A few words about you"></textarea>
```

## Common mistakes

> **WARNING**
> An unlabeled input is a form failure. "Name" floating above a field is not a label unless it is connected with `for` or a wrap — without that connection, keyboard and screen-reader users get an anonymous box.

> **WARNING**
> Forgetting the `type` on a `button` inside a form means a "Reset" or "Preview" button silently submits the form. Write `type="button"` for anything that is not a submit.

> **TIP**
> Build every form with native validation first — `required`, `type`, and `minlength` cover most cases for free — and only add JavaScript validation for the rules HTML cannot express.

<!-- RU -->

Формы — место, где пользователь передаёт данные машине. HTML даёт дюжину типов input, встроенную валидацию и способ сгруппировать и подписать каждое поле — всё это до единой строчки JavaScript. В этой странице — элемент form, его дети и атрибуты, которые заставляют браузер проверять данные за вас.

## Анатомия формы

`form` оборачивает поля и говорит браузеру, куда их отправить. `action` — адрес-получатель, `method` — как данные едут:

```html
<form action="/contact" method="post">
  <label for="name">Name</label>
  <input id="name" type="text" required />

  <label for="email">Email</label>
  <input id="email" type="email" required />

  <button type="submit">Send</button>
</form>
```

С `method="get"` значения уходят в URL строкой запроса — подходит для поиска: видно и можно сохранить в закладки. С `method="post"` они едут в теле запроса — подходит для всего чувствительного. `button` с `type="submit"` — то, что реально отправляет форму. Голый `button` без типа по умолчанию тоже `submit` — это удивляет, поэтому всегда пишите тип явно.

## Элемент input и его типы

Один элемент, много лиц: `input` рендерится по-разному в зависимости от `type`. Самые частые:

| Тип | Что рендерится | Типичное применение |
| ----- | ---------------- | --------------------- |
| text | однострочное поле | имена, поиск |
| email | поле со встроенной проверкой email | контактные формы |
| password | маскированное поле | вход |
| number | поле со спиннерами, min/max/step | количества |
| date | выбор даты | записи, даты |
| checkbox | переключатель вкл/выкл | подписки, тумблеры |
| radio | взаимоисключающий набор | выбор одного из N |
| range | ползунок | громкость, фильтры |
| color | выбор цвета | темы |
| file | выбор файла | загрузка |

Радио-кнопки в одной группе должны делить один `name` — браузер держит включённой только одну на имя:

```html
<fieldset>
  <legend>Plan</legend>
  <label><input type="radio" name="plan" value="free" /> Free</label>
  <label><input type="radio" name="plan" value="pro" checked /> Pro</label>
</fieldset>
```

## Лейблы: невидимая связь

Лейбл привязывается к полю через `for`, указывающий на `id` поля. Выгода: клик по любому месту лейбла фокусирует поле, а скринридер озвучивает лейбл вместе с полем:

```html
<label for="terms">Accept the terms</label>
<input id="terms" type="checkbox" />
```

Завернуть input внутрь лейбла тоже работает — `<label>Email <input type="email" /></label>` — но форма `for`/`id` видна и предсказуема, и именно её валидаторы ждут для большинства полей.

## Fieldset: группировка связанных полей

`fieldset` визуально и семантически группирует набор полей, а `legend` называет группу:

```html
<fieldset>
  <legend>Delivery address</legend>
  <label for="street">Street</label>
  <input id="street" type="text" />
  <label for="city">City</label>
  <input id="city" type="text" />
</fieldset>
```

Скринридеры озвучивают легенду, когда фокус входит в группу, и перестают, когда выходит — разница между услышанным «City» и «Delivery address — City» именно в этом.

## Встроенная валидация

Браузеры валидируют формы до того, как запускается ваш код. Атрибуты, которые работают:

| Атрибут | Что проверяет |
| --------- | --------------- |
| required | поле не должно быть пустым |
| type | формат: email, url, number, date… |
| min / max | границы значений для чисел и дат |
| minlength / maxlength | размер строки |
| step | допустимые инкременты для чисел |
| pattern | собственный regex, которому должно соответствовать значение |

```html
<form action="/signup" method="post">
  <label for="email">Email</label>
  <input id="email" type="email" required placeholder="you@example.com" />

  <label for="password">Password</label>
  <input id="password" type="password" minlength="8" />

  <label for="terms">Accept the terms</label>
  <input id="terms" type="checkbox" required />

  <button type="submit">Sign up</button>
</form>
```

При отправке браузер блокирует запрос, фокусирует первое невалидное поле и показывает нативное сообщение на языке пользователя. Добавьте `novalidate` в форму, чтобы отключить всё это, когда валидация делается в JavaScript.

## Select и textarea

Для выбора из списка — `select` с дочерними `option`. Для многострочного текста — `textarea`: его текст пишется МЕЖДУ тегами, а не в атрибут `value`:

```html
<label for="country">Country</label>
<select id="country">
  <option value="ru">Russia</option>
  <option value="us">United States</option>
  <option value="de">Germany</option>
</select>

<label for="bio">Bio</label>
<textarea id="bio" rows="4" placeholder="A few words about you"></textarea>
```

## Частые ошибки

> **WARNING**
> Input без лейбла — это провальная форма. «Name», парящий над полем, — не лейбл, пока его не связать `for` или обёрткой; без этой связи клавиатурные пользователи и скринридеры получают анонимный бокс.

> **WARNING**
> Забытый `type` у `button` внутри формы означает, что кнопка «Reset» или «Preview» молча отправляет форму. Для всего, что не submit, пишите `type="button"`.

> **TIP**
> Собирайте каждую форму сначала с нативной валидацией — `required`, `type` и `minlength` покрывают большинство случаев бесплатно — и добавляйте JavaScript-валидацию только для правил, которые HTML не умеет выразить.
