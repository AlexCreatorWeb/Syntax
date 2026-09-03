---
id: vue-components
track: vue
type: guide
section: components
order: 3
title:
  en: "Components & Props/Emits"
  ru: "Компоненты: props и emits"
excerpt:
  en: "Defining components, passing data down with props, sending events up with emits, and filling slots from the parent."
  ru: "Создание компонентов, передача данных вниз через props, события вверх через emits и заполнение слотов из родителя."
version: "vue 3.5"
updated: 2026-09-03
relatedTask: vue-005
---

Components are the unit of reuse in Vue: a template, some state and some behavior, packaged so a parent can place them in its own markup. This guide shows how to define a component, pass data down with props, send events back up with emits, and slot parent content into child layout.

## Defining a component

```vue
<script setup>
// A plain object with props + template is a valid component
const Greet = {
  props: { name: String },
  template: '<p class="greet">Hello, {{ name }}!</p>',
};
</script>

<template>
  <div>
    <Greet name="Syntax" />
    <Greet name="World" />
  </div>
</template>
```

In real projects the standard shape is a single-file component: one `MyCard.vue` file per component, imported with `import MyCard from "./MyCard.vue"`. The import is the default export, which the SFC compiler produces for you. In the sandbox and for quick experiments, a plain object with a `template` string works just as well, because the sandbox loads the full Vue build with runtime template compilation.

Registration in `<script setup>` is automatic: an imported name or a locally declared constant is available in the template under the same name, with no `components: {}` option. Use PascalCase in code and feel free to use kebab-case in templates — `<UserCard />` and `<user-card />` refer to the same component.

> **TIP**
> Prefer PascalCase file and component names (`UserProfile.vue`) and kebab-case tags in in-DOM templates. A kebab-case tag can never be mistaken for a native HTML element.

## Props: parent to child

Props are the child's public, read-only input. The parent renders the child with values; the child declares what it expects:

```vue
<script setup>
const Box = {
  props: {
    title: { type: String, required: true },
    tone: { type: String, default: "neutral" },
    count: { type: Number, validator: (v) => v >= 0 },
  },
  template: '<div class="box"><h3>{{ title }}</h3><span>{{ count }} items</span></div>',
};
</script>

<template>
  <Box title="Inbox" :count="42" tone="primary" />
</template>
```

Each prop declaration can carry a `type` (or an array of types), `required`, `default` and a `validator` function. In the template you bind with `:` whenever the value is an expression (`:count="42"` — here `42` alone would also work, but anything computed needs the binding); a plain attribute like `tone="primary"` passes a static string. Prop names are declared in camelCase and used in templates as kebab-case (`:first-name` for `firstName`).

> **WARNING**
> Mutating a prop inside the child is a bug in waiting: the parent owns the value, and a child-side write will not propagate back. If the child needs to change the value, emit an event and let the parent update the prop.

## Emits: child to parent

The other direction is events. The child emits a named event, optionally with a payload; the parent listens and reacts:

```vue
<script setup>
import { ref } from "vue";

const Box = {
  props: ["msg"],
  emits: ["ping", "close"],
  setup(props, { emit }) {
    return {
      onBoxClick: () => emit("ping", Date.now()),
      onClose: () => emit("close"),
    };
  },
  template: '<div class="box" @click="onBoxClick">{{ msg }}</div>',
};

const log = ref("");
const onPing = (ts) => { log.value = "ping at " + ts; };
const onClose = () => { log.value = "closed"; };
</script>

<template>
  <p>{{ log }}</p>
  <Box msg="Hi" @ping="onPing" @close="onClose" />
</template>
```

Inside an SFC with `<script setup>` you declare emits with the `defineEmits(["ping", "close"])` macro (or the object form, which supports per-event validation) and the returned function is the emitter. In a plain object component the emitter arrives as the second argument of `setup(props, { emit })`, as the example shows. Declaring `emits` has a second effect: listeners like `@ping` on the component are no longer treated as DOM attributes, so they do not leak into the rendered element.

The parent binds handlers with `@eventname` (shorthand for `v-on:eventname`). Component events are decoupled from the DOM: `@ping` does not rely on native event bubbling, and the payload is whatever the child passed to `emit`.

> **TIP**
> Keep event names in lowercase kebab-case (`item-click`). In in-DOM templates attribute names are lowercased by the browser, and a silently mismatched case is the classic "my event never fires" bug.

## Slots: content between the tags

Props pass data; slots pass markup. The child defines holes with `<slot>`, and the parent fills them with whatever it places between the child's tags:

```vue
<script setup>
const Card = {
  template: `
    <div class="card">
      <header><slot name="head">Default header</slot></header>
      <main><slot /></main>
      <footer><slot name="foot">No footer</slot></footer>
    </div>`,
};
</script>

<template>
  <Card>
    <template #head>My title</template>
    <p>Default slot content</p>
    <template #foot>Thanks!</template>
  </Card>
</template>
```

The anonymous `<slot />` is the default slot: it captures everything that was not assigned to a named slot. Named slots are filled with `<template #name>` (the `v-slot` shorthand). If a slot goes unfilled, its fallback content — the markup inside the `<slot>` tag — is rendered instead, which is why the card above has a default header and footer.

> **TIP**
> When a child has exactly one named slot and the parent fills nothing else, the shorthand `<Card #head="...">` is the same as wrapping it in a template tag — use it to keep the call site flat.

## Common mistakes

> **WARNING**
> A child component that renders nothing in an in-DOM template: the browser lowercases tag names before Vue sees them, so `<MyCard />` becomes `<mycard />`. In plain HTML files, use kebab-case tags for components.

> **WARNING**
> Passing data with `v-model` where a plain prop suffices creates a hidden event contract. If the child only reads the value, it is a prop; `v-model` is for two-way fields.

> **TIP**
> Prefer many small components over one big one. A 40-line template with three sub-components is easier to read, test and reuse than a 300-line template.

<!-- RU -->

Компоненты — единица переиспользования в Vue: template, часть state и часть поведения, упакованные так, чтобы родитель мог размещать их в своей разметке. Гайд показывает, как создать компонент, передать данные вниз через props, послать события вверх через emits и заполнить слоты из родителя.

## Создание компонента

```vue
<script setup>
// Обычный объект с props + template — валидный компонент
const Greet = {
  props: { name: String },
  template: '<p class="greet">Hello, {{ name }}!</p>',
};
</script>

<template>
  <div>
    <Greet name="Syntax" />
    <Greet name="World" />
  </div>
</template>
```

В реальных проектах стандартная форма — single-file-компонент: один файл `MyCard.vue` на компонент, импортируемый через `import MyCard from "./MyCard.vue"`. Импорт — это default-экспорт, который для вас создаёт SFC-компилятор. В песочнице и для быстрых экспериментов с тем же эффектом работает обычный объект со строкой `template`, потому что песочница грузит полный билд Vue с runtime-компиляцией шаблонов.

Регистрация в `<script setup>` автоматическая: импортированное имя или локально объявленная константа доступны в template под тем же именем, без опции `components: {}`. Используйте PascalCase в коде и, если хочется, kebab-case в template — `<UserCard />` и `<user-card />` ссылаются на один и тот же компонент.

> **TIP**
> Предпочитайте PascalCase для файлов и имён компонентов (`UserProfile.vue`) и kebab-case для тегов в in-DOM template. Kebab-case-тег никогда не спутается с нативным HTML-элементом.

## Props: от родителя к ребёнку

Props — публичный read-only вход ребёнка. Родитель рендерит ребёнка со значениями; ребёнок declares, что он ожидает:

```vue
<script setup>
const Box = {
  props: {
    title: { type: String, required: true },
    tone: { type: String, default: "neutral" },
    count: { type: Number, validator: (v) => v >= 0 },
  },
  template: '<div class="box"><h3>{{ title }}</h3><span>{{ count }} items</span></div>',
};
</script>

<template>
  <Box title="Inbox" :count="42" tone="primary" />
</template>
```

Каждое объявление пропса может нести `type` (или массив типов), `required`, `default` и функцию `validator`. В template значение привязывается через `:`, когда это expression (`:count="42"` — здесь `42` сам по себе тоже сработал бы, но всё вычисляемое требует связывания); обычный атрибут вроде `tone="primary"` передаёт статичную строку. Имена пропсов объявляются в camelCase и используются в template в kebab-case (`:first-name` для `firstName`).

> **WARNING**
> Мутация пропса внутри ребёнка — баг по построению: значением владеет родитель, и запись со стороны ребёнка не распространится назад. Если ребёнку нужно поменять значение — эмитните событие, и пусть родитель обновит пропс.

## Emits: от ребёнка к родителю

Обратное направление — события. Ребёнок эмитит именованное событие, опционально с payload; родитель слушает и реагирует:

```vue
<script setup>
import { ref } from "vue";

const Box = {
  props: ["msg"],
  emits: ["ping", "close"],
  setup(props, { emit }) {
    return {
      onBoxClick: () => emit("ping", Date.now()),
      onClose: () => emit("close"),
    };
  },
  template: '<div class="box" @click="onBoxClick">{{ msg }}</div>',
};

const log = ref("");
const onPing = (ts) => { log.value = "ping at " + ts; };
const onClose = () => { log.value = "closed"; };
</script>

<template>
  <p>{{ log }}</p>
  <Box msg="Hi" @ping="onPing" @close="onClose" />
</template>
```

Внутри SFC с `<script setup>` emits объявляются макросом `defineEmits(["ping", "close"])` (или объектной формой, которая поддерживает валидацию каждого события), и возвращаемая функция — эмиттер. В обычном объектном компоненте эмиттер приходит вторым аргументом `setup(props, { emit })`, как в примере. Объявление `emits` имеет второй эффект: слушатели вроде `@ping` на компоненте больше не считаются DOM-атрибутами и не попадают в отрендеренный элемент.

Родитель привязывает обработчики через `@eventname` (сокращение для `v-on:eventname`). События компонента отделены от DOM: `@ping` не опирается на нативное всплытие, а payload — это то, что ребёнок передал в `emit`.

> **TIP**
> Держите имена событий в lowercase kebab-case (`item-click`). В in-DOM template браузер переводит имена атрибутов в нижний регистр, и молчаливое несопадение регистра — классический баг «моё событие не срабатывает».

## Слоты: контент между тегами

Props передают данные; слоты — разметку. Ребёнок определяет «дыры» через `<slot>`, а родитель заполняет их тем, что кладёт между тегами ребёнка:

```vue
<script setup>
const Card = {
  template: `
    <div class="card">
      <header><slot name="head">Default header</slot></header>
      <main><slot /></main>
      <footer><slot name="foot">No footer</slot></footer>
    </div>`,
};
</script>

<template>
  <Card>
    <template #head>My title</template>
    <p>Default slot content</p>
    <template #foot>Thanks!</template>
  </Card>
</template>
```

Анонимный `<slot />` — это default-слот: он собирает всё, что не назначено именованным слотам. Именованные слоты заполняются через `<template #name>` (сокращение `v-slot`). Если слот не заполнен, рендерится его fallback-контент — разметка внутри тега `<slot>`, поэтому у карточки выше есть заголовочный и нижний фолбэки.

> **TIP**
> Если у ребёнка ровно один именованный слот и родитель ничего больше не заполняет, сокращение `<Card #head="...">` эквивалентно обёртке в template-тег — используйте его, чтобы вызов оставался плоским.

## Частые ошибки

> **WARNING**
> Ребёнок, который не рендерится в in-DOM template: браузер переводит имена тегов в нижний регистр до того, как Vue их увидит, и `<MyCard />` превращается в `<mycard />`. В обычных HTML-файлах используйте kebab-case-теги для компонентов.

> **WARNING**
> Передача данных через `v-model`, где хватило бы обычного пропса, создаёт скрытый контракт событий. Если ребёнок только читает значение — это пропс; `v-model` — для двусторонних полей.

> **TIP**
> Предпочитайте много маленьких компонентов одному большому. Template на 40 строк с тремя подкомпонентами читать, тестировать и переиспользовать проще, чем template на 300 строк.
