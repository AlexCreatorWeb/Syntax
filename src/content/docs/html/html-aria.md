---
id: html-aria
track: html
type: reference
section: reference
order: 4
title:
  en: "ARIA Quick Reference"
  ru: "ARIA: шпаргалка"
excerpt:
  en: "The ARIA roles, states, and properties you will actually meet — with the first rule of ARIA: do not use it where a native element works."
  ru: "Роли, состояния и свойства ARIA, с которыми вы реально столкнётесь — и первое правило ARIA: не используйте его там, где справляется нативный элемент."
version: "html5"
updated: 2026-09-03
relatedTask: html-011
---

ARIA (Accessible Rich Internet Applications) is a set of attributes that describe widgets to assistive technology. Native elements do most of the job on their own — ARIA is for the gaps. The first rule of ARIA: do not use ARIA where a native element works.

## Roles

`role` tells assistive technology what kind of widget an element is. Use it when a semantic element is not enough:

| Role | Use on | Announced as |
| ------ | -------- | -------------- |
| `button` | a clickable `div` or `span` | a button (you must handle Enter and Space) |
| `dialog` | a custom modal | a dialog |
| `alert` | an error that interrupts | an alert, read immediately |
| `status` | a quiet update | a status, read politely |
| `tablist` / `tab` / `tabpanel` | a custom tab set | tabs with selection state |
| `menubar` / `menuitem` | a custom menu | a menu, use with care |
| `navigation` | a non-`nav` navigation region | a navigation region |
| `main` / `banner` / `contentinfo` | landmark substitutes | region names |
| `search` | a search form | a search region |
| `img` | a graphic that is not an `img` | an image with a name |
| `presentation` | a decorative element | nothing, hidden from AT |

## States and properties

These attributes carry the current state of a widget or its relationship to other elements. They are the attributes you will actually use in day-to-day markup:

| Attribute | Purpose | Example |
| ----------- | --------- | --------- |
| `aria-label` | an accessible name without visible text | a `×` close button |
| `aria-labelledby` | a name taken from another element's text | a panel naming its heading |
| `aria-describedby` | extra description from another element | a hint paragraph for a field |
| `aria-hidden="true"` | hide from assistive technology | a decorative duplicate |
| `aria-expanded` | open or closed state of a disclosure | a collapsible toggle |
| `aria-checked` | a toggle's state | a custom checkbox |
| `aria-selected` | the selected item in a set | a custom tab |
| `aria-current` | the current item in a list | the active page in a menu |
| `aria-busy` | content is loading | a spinner region |
| `aria-invalid` | a validation error, with `aria-describedby` | a failed field |
| `aria-required` | a required field, when `required` is not available | custom form controls |
| `aria-live` | live region politeness: `polite`, `assertive` | a notification area |
| `aria-atomic` | read the whole live region, not just the delta | a result count |

A working example — a custom disclosure, the one case where `role` and state really are needed:

```html
<button aria-expanded="false" aria-controls="panel" id="toggle">
  Shipping details
</button>
<div id="panel" hidden>
  <p>Free over $50, otherwise $4.</p>
</div>
```

## Live regions

When content changes after load, assistive technology only announces it if the container is a live region. `aria-live="polite"` waits for the user to finish reading; `aria-live="assertive"` interrupts immediately. Keep live regions small — a status line, not the whole page — create them in the markup before the content changes, and prefer a native `role="status"` or `role="alert"` over the raw attribute.

> **TIP**
> Before you write any ARIA, ask: which native element does this job? A `button`, a `details`, a `dialog`, a `progress` element — if one exists, ship it and skip the attributes. ARIA is the exception, and the exception is expensive: every role you fake, you must maintain.

<!-- RU -->

ARIA (Accessible Rich Internet Applications) — набор атрибутов, описывающих виджеты вспомогательным технологиям. Нативные элементы делают большую часть работы сами — ARIA для пробелов. Первое правило ARIA: не используйте ARIA там, где справляется нативный элемент.

## Роли

`role` говорит вспомогательным технологиям, какой виджет перед ними. Используйте, когда семантического элемента не хватает:

| Роль | Где | Озвучивается как |
| ------ | ----- | ------------------ |
| `button` | кликабельный `div` или `span` | кнопка (Enter и Space — обрабатывать самому) |
| `dialog` | собственная модалка | диалог |
| `alert` | прерывающая ошибка | алерт, читается сразу |
| `status` | тихое обновление | статус, читается вежливо |
| `tablist` / `tab` / `tabpanel` | собственные табы | табы со состоянием выбора |
| `menubar` / `menuitem` | собственное меню | меню, используйте осторожно |
| `navigation` | навигационный регион без `nav` | регион навигации |
| `main` / `banner` / `contentinfo` | замены лендмаркам | имена регионов |
| `search` | поисковая форма | регион поиска |
| `img` | графика, не являющаяся `img` | изображение с именем |
| `presentation` | декоративный элемент | ничего, скрыто от AT |

## Состояния и свойства

Эти атрибуты несут текущее состояние виджета или его связь с другими элементами. С ними вы реально столкнётесь в повседневной разметке:

| Атрибут | Назначение | Пример |
| --------- | ------------ | -------- |
| `aria-label` | доступное имя без видимого текста | кнопка закрытия `×` |
| `aria-labelledby` | имя, взятое из текста другого элемента | панель, называющая свой заголовок |
| `aria-describedby` | дополнительное описание из другого элемента | абзац-подсказка для поля |
| `aria-hidden="true"` | скрыть от вспомогательных технологий | декоративный дубль |
| `aria-expanded` | открыто/закрыто для раскрывающегося блока | toggle-кнопка |
| `aria-checked` | состояние переключателя | собственный чекбокс |
| `aria-selected` | выбранный элемент в наборе | собственный таб |
| `aria-current` | текущий элемент в списке | активная страница в меню |
| `aria-busy` | содержимое грузится | регион-спиннер |
| `aria-invalid` | ошибка валидации, вместе с `aria-describedby` | несостоявшееся поле |
| `aria-required` | обязательное поле, когда `required` недоступен | собственные контролы форм |
| `aria-live` | вежливость live-региона: `polite`, `assertive` | область уведомлений |
| `aria-atomic` | читать весь live-регион, а не только дельту | счётчик результатов |

Рабочий пример — собственный раскрывающийся блок, тот случай, где `role` и состояния действительно нужны:

```html
<button aria-expanded="false" aria-controls="panel" id="toggle">
  Shipping details
</button>
<div id="panel" hidden>
  <p>Free over $50, otherwise $4.</p>
</div>
```

## Live-регионы

Когда содержимое меняется после загрузки, вспомогательные технологии озвучивают его только если контейнер — live-регион. `aria-live="polite"` ждёт, пока пользователь дочитает; `aria-live="assertive"` прерывает сразу. Держите live-регионы маленькими — строка статуса, а не вся страница, — создавайте их в разметке ДО изменения содержимого и предпочитайте нативные `role="status"` или `role="alert"` голому атрибуту.

> **TIP**
> Прежде чем писать ARIA, спросите: какой нативный элемент делает эту работу? `button`, `details`, `dialog`, `progress` — если он существует, ставьте его и пропускайте атрибуты. ARIA — исключение, и исключение дорогое: каждую поддельную роль придётся поддерживать.
