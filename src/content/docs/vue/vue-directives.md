---
id: vue-directives
track: vue
type: guide
section: composition
order: 5
title:
  en: "Directives & Lifecycle"
  ru: "Директивы и жизненный цикл"
excerpt:
  en: "The built-in directive set, v-model on inputs and components, lifecycle hooks with cleanup, and writing your own directive."
  ru: "Набор встроенных директив, v-model для инпутов и компонентов, lifecycle-хуки с cleanup и запись своей директивы."
version: "vue 3.5"
updated: 2026-09-03
relatedTask: vue-004
---

Directives are special attributes that teach a template to do something Vue-specific. You have already met `v-bind`, `v-if` and `v-for`; this guide covers the rest of the built-in set — event handling, `v-model`, the rarely-needed ones — plus lifecycle hooks and how to write a directive of your own.

## The built-in set you use daily

| Directive | What it does |
| --- | --- |
| `v-if` / `v-else-if` / `v-else` | render a branch only while the expression is truthy |
| `v-show` | always render, toggle CSS `display` |
| `v-for` | repeat an element or template per collection item |
| `v-on` (`@`) | listen to DOM or component events |
| `v-bind` (`:`) | bind an attribute or prop to an expression |
| `v-model` | two-way binding between a control and state |
| `v-text` | set raw text content |
| `v-html` | set raw HTML content |
| `v-once` | render once and never update |
| `v-pre` | skip compilation, show the raw markup |
| `v-cloak` | marker removed at mount, to hide uncompiled markup |

Event handling is the `@` (v-on) family: `@click="handler"` is shorthand for `v-on:click`. The native event arrives as `$event`, and modifiers filter it before your handler runs:

```vue
<script setup>
import { ref } from "vue";

const count = ref(0);

function onKey(event) {
  if (event.key === "Enter") console.log("submit");
}
</script>

<template>
  <button @click="count++">Clicked {{ count }} times</button>
  <input @keyup.enter="onKey" @blur.stop="onKey" />
  <form @submit.prevent="onKey">
    <button type="submit">Save</button>
  </form>
</template>
```

Key modifiers such as `.enter`, `.tab` and `.esc` skip the handler for other keys, and event modifiers like `.prevent`, `.stop`, `.once` and `.passive` replace the boilerplate `event.preventDefault()` lines inside handlers. In-DOM templates lowercase everything, so for multi-word event names use kebab-case with the dot syntax.

## v-model: two-way binding

`v-model` on a form control is the pairing of `:value` and `@input` in one directive: the control reads the state and writes the user's input back to it. It works on text inputs, checkboxes (boolean), radio groups (matched value), `select` (selected option) and textareas:

```vue
<script setup>
import { ref } from "vue";

const name = ref("");
const agreed = ref(false);
const size = ref("M");
</script>

<template>
  <input v-model="name" />
  <p>Hi, {{ name }}</p>

  <input id="ok" type="checkbox" v-model="agreed" />
  <label for="ok">{{ agreed ? "agreed" : "not yet" }}</label>

  <select v-model="size">
    <option>S</option>
    <option>M</option>
    <option>L</option>
  </select>
</template>
```

Modifiers tune the synchronization. `.lazy` writes on `change` (blur or commit) instead of every keystroke, `.number` parses the value into a real number, and `.trim` strips whitespace. For numeric form fields the standard pair is `v-model.lazy.number`: the model updates when the user leaves the field, and it is a number, not a string.

On components, `v-model` means a specific contract: the parent passes a `modelValue` prop and the child emits `update:modelValue`. Since Vue 3.4 the same pattern scales to multiple models with an argument: `v-model:title` binds a `title` prop to a `update:title` event, so one child can carry several two-way fields.

> **TIP**
> When you build a reusable input component, declare `props: ["modelValue"]` and `emits: ["update:modelValue"]` explicitly. A missing emits declaration makes `v-model` listeners leak into the DOM as attributes.

## Lifecycle hooks

Every component instance goes through a lifecycle: created, mounted, updated repeatedly, then unmounted. In the Composition API the three hooks that matter in practice are:

```vue
<script setup>
import { onMounted, onUpdated, onUnmounted } from "vue";

onMounted(() => console.log("mounted — DOM is ready"));
onUpdated(() => console.log("updated — after a state change re-rendered us"));
onUnmounted(() => console.log("unmounted — clean up here"));
</script>
```

`onMounted` is where you touch the DOM for the first time, fetch initial data, and start listeners — the rendered element exists, but no reactive update has happened yet. `onUpdated` fires after your state changed and the DOM re-rendered; it is rare and usually a smell, because reacting to your own render is circular. `onUnmounted` is the cleanup moment: stop intervals, remove listeners, cancel subscriptions.

All three must be called synchronously during setup, and a hook registered inside a composable binds to the calling component — which is why composables can manage their own side effects (see the Composition API guide).

> **WARNING**
> In SSR, `onMounted` still runs on the server during hydration bookkeeping, so guard browser-only APIs (`window`, `document`) — or run them in a client-only component — or the first render crashes.

## Custom directives

A directive is a function, or an object of hooks, that receives the element it is applied to:

```vue
<script setup>
import { ref } from "vue";

const vFocus = {
  mounted(el) { el.focus(); },
};
</script>

<template>
  <input v-focus placeholder="I get focused on mount" />
</template>
```

The object form supports the lifecycle hooks `created`, `beforeMount`, `mounted`, `beforeUpdate`, `updated`, `beforeUnmount` and `unmounted`, each receiving the element and a `binding` object with `binding.value`, `binding.arg` and `binding.modifiers`. A locally declared `vFocus` becomes `v-focus` in the template; to make a directive global you register it on the app instance with `app.directive("focus", vFocus)`.

Directives are the escape hatch for raw DOM access that a component would over-engineer: focusing an input, measuring a tooltip position, wiring an IntersectionObserver. They get the element, not reactivity — any state they need must arrive through `binding.value`.

> **TIP**
> Before writing a directive, ask whether a small component does the job: components have reactivity, props and slots, while a directive only gets the raw DOM. Pick the component by default, the directive when you need element-level access.

## Common mistakes

> **WARNING**
> `v-html` injects raw markup. Escape user content or you are one malicious post away from XSS — use `v-html` only for trusted, pre-rendered HTML.

> **WARNING**
> A `v-model` on a component without the `modelValue` prop declared does not bind: the value arrives as a plain attribute and the update event goes nowhere. Declare the prop and the emit.

> **TIP**
> `v-once` and `v-pre` exist for lists of static rows: render the markup once and take it out of the update loop.

<!-- RU -->

Директивы — специальные атрибуты, которые учат template делать что-то специфичное для Vue. Вы уже встречали `v-bind`, `v-if` и `v-for`; гайд покрывает остальную часть встроенного набора — обработку событий, `v-model`, редкие случаи — плюс lifecycle-хуки и то, как написать собственную директиву.

## Встроенный набор, который используется ежедневно

| Директива | Что делает |
| --- | --- |
| `v-if` / `v-else-if` / `v-else` | рендерит ветку, пока выражение truthy |
| `v-show` | всегда рендерит, переключает CSS `display` |
| `v-for` | повторяет элемент или template по элементам коллекции |
| `v-on` (`@`) | слушает DOM- и компонентные события |
| `v-bind` (`:`) | связывает атрибут или пропс с выражением |
| `v-model` | двусторонняя связка между контролом и state |
| `v-text` | задаёт текстовое содержимое |
| `v-html` | задаёт HTML-содержимое |
| `v-once` | рендер один раз и больше не обновляется |
| `v-pre` | не компилируется, разметка показана как есть |
| `v-cloak` | маркер, снимаемый при монтировании, скрывает нескомпилированную разметку |

Обработка событий — это семейство `@` (v-on): `@click="handler"` — сокращение для `v-on:click`. Нативное событие приходит как `$event`, а модификаторы фильтруют его до вашего обработчика:

```vue
<script setup>
import { ref } from "vue";

const count = ref(0);

function onKey(event) {
  if (event.key === "Enter") console.log("submit");
}
</script>

<template>
  <button @click="count++">Clicked {{ count }} times</button>
  <input @keyup.enter="onKey" @blur.stop="onKey" />
  <form @submit.prevent="onKey">
    <button type="submit">Save</button>
  </form>
</template>
```

Key-модификаторы вроде `.enter`, `.tab` и `.esc` пропускают обработчик для других клавиш, а event-модификаторы `.prevent`, `.stop`, `.once` и `.passive` заменяют шаблонные `event.preventDefault()`-строки внутри обработчиков. В in-DOM template всё приводится к нижнему регистру, поэтому для многословных имён событий используйте kebab-case с точечным синтаксисом.

## v-model: двусторонняя связка

`v-model` на form-контроле — это пара `:value` и `@input` в одной директиве: контрол читает state и записывает ввод пользователя обратно. Работает на text-инпутах, чекбоксах (булево значение), группах radio (совпавшее значение), `select` (выбранный пункт) и textarea:

```vue
<script setup>
import { ref } from "vue";

const name = ref("");
const agreed = ref(false);
const size = ref("M");
</script>

<template>
  <input v-model="name" />
  <p>Hi, {{ name }}</p>

  <input id="ok" type="checkbox" v-model="agreed" />
  <label for="ok">{{ agreed ? "agreed" : "not yet" }}</label>

  <select v-model="size">
    <option>S</option>
    <option>M</option>
    <option>L</option>
  </select>
</template>
```

Модификаторы настраивают синхронизацию. `.lazy` пишет на `change` (blur или коммит), а не на каждый удар по клавише, `.number` парсит значение в настоящее число, а `.trim` отбрасывает пробелы. Для числовых полей форм стандартная пара — `v-model.lazy.number`: модель обновляется, когда пользователь уходит с поля, и это число, а не строка.

На компонентах `v-model` означает конкретный контракт: родитель передаёт пропс `modelValue`, а ребёнок эмитит `update:modelValue`. Начиная с Vue 3.4 тот же паттерн масштабируется на несколько моделей с аргументом: `v-model:title` связывает пропс `title` с событием `update:title`, так что один ребёнок может нести несколько двусторонних полей.

> **TIP**
> Когда вы делаете переиспользуемый input-компонент, явно объявляйте `props: ["modelValue"]` и `emits: ["update:modelValue"]`. Без объявления emits слушатели `v-model` утекают в DOM как атрибуты.

## Lifecycle-хуки

Каждый инстанс компонента проходит жизненный цикл: created, mounted, повторные updated и наконец unmounted. В Composition API на практике важны три хука:

```vue
<script setup>
import { onMounted, onUpdated, onUnmounted } from "vue";

onMounted(() => console.log("mounted — DOM is ready"));
onUpdated(() => console.log("updated — after a state change re-rendered us"));
onUnmounted(() => console.log("unmounted — clean up here"));
</script>
```

`onMounted` — место, где вы впервые трогаете DOM, грузите начальные данные и вешаете слушателей: отрендеренный элемент существует, но реактивных обновлений ещё не было. `onUpdated` срабатывает после того, как state изменился и DOM перерисовался; он редкий и чаще пахнет багом, потому что реакция на собственный рендер — это цикл. `onUnmounted` — момент cleanup: остановить интервалы, снять слушателей, отменить подписки.

Все три вызываются синхронно во время setup, и хук, зарегистрированный внутри компаузабла, привязывается к вызывающему компоненту — поэтому компаузаблы могут сами управлять своими side effects (см. гайд по Composition API).

> **WARNING**
> В SSR `onMounted` всё равно выполняется на сервере во время hydration-бухгалтерии, поэтому оборачивайте браузерные API (`window`, `document`) в guard — или выносите их в client-only компонент — иначе первый рендер упадёт.

## Собственные директивы

Директива — функция или объект хуков, которая получает элемент, к которому применена:

```vue
<script setup>
import { ref } from "vue";

const vFocus = {
  mounted(el) { el.focus(); },
};
</script>

<template>
  <input v-focus placeholder="I get focused on mount" />
</template>
```

Объектная форма поддерживает lifecycle-хуки `created`, `beforeMount`, `mounted`, `beforeUpdate`, `updated`, `beforeUnmount` и `unmounted`; каждый получает элемент и объект `binding` с `binding.value`, `binding.arg` и `binding.modifiers`. Локально объявленный `vFocus` становится `v-focus` в template; чтобы сделать директиву глобальной, регистрируйте её на инстансе приложения через `app.directive("focus", vFocus)`.

Директивы — escape-hatch для прямого доступа к DOM, где компонент был бы переусложнением: фокус инпута, замер позиции тултипа, навес IntersectionObserver. Директиве достаётся элемент, а не реактивность — всё состояние, которое ей нужно, должно приходить через `binding.value`.

> **TIP**
> Прежде чем писать директиву, спросите, не решит ли её маленький компонент: у компонентов есть реактивность, props и слоты, а директиве достаётся только голый DOM. По умолчанию выбирайте компонент, директиву — когда нужен доступ к элементу.

## Частые ошибки

> **WARNING**
> `v-html` вставляет сырую разметку. Экранируйте пользовательский контент, иначе одна злонамеренная запись отделяет вас от XSS — используйте `v-html` только для доверенной, заранее отрендеренной HTML.

> **WARNING**
> `v-model` на компоненте без объявленного пропса `modelValue` не связывается: значение приходит обычным атрибутом, а событие update уходит в никуда. Объявите пропс и emit.

> **TIP**
> `v-once` и `v-pre` существуют для списков статичных строк: отрендерите разметку один раз и выньте её из цикла обновлений.
