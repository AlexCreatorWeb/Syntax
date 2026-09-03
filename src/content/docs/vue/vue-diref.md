---
id: vue-diref
track: vue
type: reference
section: reference
order: 2
title:
  en: "Directives Reference"
  ru: "Справочник по директивам"
excerpt:
  en: "Every built-in directive with syntax and behavior, the full modifier list, and dynamic/argument forms for binding and events."
  ru: "Все встроенные директивы с синтаксисом и поведением, полный список модификаторов и динамические/аргументные формы привязок и событий."
version: "vue 3.5"
updated: 2026-09-03
---

A quick lookup of the built-in directive set: syntax, behavior and the sharp edges. Keep this page open while you write templates.

## Core directives

| Directive | Syntax | Behavior |
| --- | --- | --- |
| `v-if` | `v-if="expr"` | render the node only while expr is truthy; lazy |
| `v-else-if` | `v-else-if="expr"` | chain link; must directly follow a `v-if` / `v-else-if` |
| `v-else` | `v-else` | fallback branch of the chain |
| `v-show` | `v-show="expr"` | always rendered; toggles `display: none` |
| `v-for` | `v-for="(item, i) in list"` | repeat per item; `:key` required |
| `v-bind` | `:attr="expr"` | attribute set from an evaluated expression |
| `v-on` | `@event="handler"` | event listener (DOM or component) |
| `v-model` | `v-model="prop"` | two-way binding: value in, update event out |
| `v-text` | `v-text="expr"` | set `textContent` — no HTML parsing |
| `v-html` | `v-html="expr"` | set `innerHTML` — XSS risk on user data |
| `v-once` | `v-once` | render once, skip future updates |
| `v-pre` | `v-pre` | skip compilation, the raw `{{ }}` stays literal |
| `v-cloak` | `v-cloak` | removed at mount; pair with CSS to hide uncompiled markup |

`v-if` and `v-show` solve the same visible problem with different costs: `v-if` keeps the DOM minimal but rebuilds the branch on every switch, `v-show` keeps the node alive and just flips a style. `v-for` demands a stable `:key` per item — with index keys, inserts and deletes patch the wrong DOM nodes. `v-html` is the only directive that parses markup, and it parses what you give it: escape user content first.

## Event and binding modifiers

| Modifier | Where | Effect |
| --- | --- | --- |
| `.prevent` | events | call `event.preventDefault()` |
| `.stop` | events | call `event.stopPropagation()` |
| `.self` | events | ignore events bubbled from children |
| `.once` | events | fire at most once |
| `.passive` | events | passive listener (scroll/touch performance) |
| `.capture` | events | listen in the capture phase |
| `.window` / `.document` / `.body` | events | attach the listener to that target |
| `.enter` / `.tab` / `.esc` / `.space` | key events | run only for that key |
| `.trim` | v-model | strip whitespace from the value |
| `.number` | v-model | parse the value into a number |
| `.lazy` | v-model | sync on `change`, not on every `input` |

```vue
<template>
  <form @submit.prevent="onSave">
    <input v-model.trim="title" />
    <input v-model.number="count" type="text" />
    <input @keyup.enter="onSave" @blur.stop="quiet" />
    <button type="submit" @click.once="onSave">Save</button>
  </form>
</template>
```

Modifiers compose on one directive — `.stop.prevent` is legal — and the order between them does not matter. Key modifiers accept system keys without configuration; for arbitrary keys use the `@keyup="onKey"` handler and check `event.key` yourself.

## Arguments and dynamic forms

Arguments narrow a directive; dynamic forms let the argument itself come from state:

| Syntax | Meaning |
| --- | --- |
| `:prop="val"` | bind a static prop name |
| `:[propName]="val"` | evaluate the prop name from an expression |
| `@click.right="fn"` | mouse-button argument on events |
| `@[eventName]="fn"` | dynamic event name (component events) |
| `v-bind="attrsObject"` | spread an object of attributes |
| `v-on="listenersObject"` | spread an object of event listeners |

```vue
<script setup>
import { ref } from "vue";

const eventName = ref("ping");
const attrs = { class: "card", id: "main-card" };
</script>

<template>
  <MyCard v-bind="attrs" @[eventName]="onEvent" />
</template>
```

The spread forms are how wrapper components forward unknown props and listeners: a card that accepts any class or id without re-declaring each one. Custom directives follow the same argument rules — a local `const vFocus = {}` is used as `v-focus`, and `v-highlight:yellow` passes `yellow` as `binding.arg`.

<!-- RU -->

Быстрый справочник по встроенным директивам: синтаксис, поведение и острые края. Держите эту страницу открытой во время работы с template.

## Основные директивы

| Директива | Синтаксис | Поведение |
| --- | --- | --- |
| `v-if` | `v-if="expr"` | рендерит узел, пока expr truthy; ленивая |
| `v-else-if` | `v-else-if="expr"` | звено цепи; должно напрямую следовать за `v-if` / `v-else-if` |
| `v-else` | `v-else` | фолбэк-ветка цепи |
| `v-show` | `v-show="expr"` | всегда рендерится; переключает `display: none` |
| `v-for` | `v-for="(item, i) in list"` | повторяет по элементам; обязателен `:key` |
| `v-bind` | `:attr="expr"` | атрибут из вычисленного выражения |
| `v-on` | `@event="handler"` | слушатель события (DOM или компонента) |
| `v-model` | `v-model="prop"` | двусторонняя связка: значение в, событие update наружу |
| `v-text` | `v-text="expr"` | задаёт `textContent` — без разбора HTML |
| `v-html` | `v-html="expr"` | задаёт `innerHTML` — риск XSS на пользовательских данных |
| `v-once` | `v-once` | рендер один раз, без будущих обновлений |
| `v-pre` | `v-pre` | без компиляции, сырые `{{ }}` остаются литералом |
| `v-cloak` | `v-cloak` | снимается при монтировании; в паре с CSS скрывает нескомпилированную разметку |

`v-if` и `v-show` решают одну видимую проблему с разными затратами: `v-if` держит DOM минимальным, но пересобирает ветку при каждом переключении, `v-show` держит узел живым и просто переключает стиль. `v-for` требует стабильный `:key` на элемент — с index-ключами вставки и удаления патчат неправильные DOM-узлы. `v-html` — единственная директива, которая разбирает разметку, и она разбирает ровно то, что ей дали: экранируйте пользовательский контент заранее.

## Модификаторы событий и привязок

| Модификатор | Где | Эффект |
| --- | --- | --- |
| `.prevent` | события | вызывает `event.preventDefault()` |
| `.stop` | события | вызывает `event.stopPropagation()` |
| `.self` | события | игнорирует события, всплывшие из детей |
| `.once` | события | срабатывает не более одного раза |
| `.passive` | события | passive-слушатель (производительность scroll/touch) |
| `.capture` | события | слушает в capture-фазе |
| `.window` / `.document` / `.body` | события | вешает слушателя на этот target |
| `.enter` / `.tab` / `.esc` / `.space` | key-события | срабатывает только для этой клавиши |
| `.trim` | v-model | отбрасывает пробелы в значении |
| `.number` | v-model | парсит значение в число |
| `.lazy` | v-model | синхронизация на `change`, а не на каждый `input` |

```vue
<template>
  <form @submit.prevent="onSave">
    <input v-model.trim="title" />
    <input v-model.number="count" type="text" />
    <input @keyup.enter="onSave" @blur.stop="quiet" />
    <button type="submit" @click.once="onSave">Save</button>
  </form>
</template>
```

Модификаторы комбинируются на одной директиве — `.stop.prevent` легально — и порядок между ними не важен. Key-модификаторы работают с системными клавишами без настройки; для произвольных клавиш используйте обработчик `@keyup="onKey"` и сами проверяйте `event.key`.

## Аргументы и динамические формы

Аргументы сужают директиву; динамические формы позволяют аргументу приходить из state:

| Синтаксис | Значение |
| --- | --- |
| `:prop="val"` | связывание статичного имени пропса |
| `:[propName]="val"` | имя пропса вычисляется из выражения |
| `@click.right="fn"` | аргумент мышиной кнопки в событиях |
| `@[eventName]="fn"` | динамическое имя события (события компонентов) |
| `v-bind="attrsObject"` | spread объекта атрибутов |
| `v-on="listenersObject"` | spread объекта слушателей |

```vue
<script setup>
import { ref } from "vue";

const eventName = ref("ping");
const attrs = { class: "card", id: "main-card" };
</script>

<template>
  <MyCard v-bind="attrs" @[eventName]="onEvent" />
</template>
```

Spread-формы — так обёртывающие компоненты пробрасывают неизвестные props и слушателей: карточка, которая принимает любой class или id, не переобъявляя каждый. Собственные директивы подчиняются тем же правилам аргументов — локальный `const vFocus = {}` используется как `v-focus`, а `v-highlight:yellow` передаёт `yellow` как `binding.arg`.
