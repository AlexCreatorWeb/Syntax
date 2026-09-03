---
id: vue-sfc
track: vue
type: reference
section: reference
order: 4
title:
  en: "SFC Anatomy"
  ru: "Устройство SFC"
excerpt:
  en: "What a .vue file is made of: template, script variants including script setup, style scoping, and file conventions."
  ru: "Из чего состоит .vue-файл: template, варианты script включая script setup, scoping стилей и конвенции файлов."
version: "vue 3.5"
updated: 2026-09-03
relatedTask: vue-001
---

A single-file component is a file convention: one `.vue` file, several blocks, one exported component. This page is the map — which blocks may exist, what each script variant compiles to, and how styles are scoped.

## The three blocks

```vue
<script setup>
import { ref } from "vue";
const count = ref(0);
</script>

<template>
  <button @click="count++">Clicked {{ count }} times</button>
</template>

<style scoped>
button {
  padding: 8px 16px;
}
</style>
```

An SFC contains exactly one `<template>` (the component's own markup; it is optional, because a render function or a functional component can replace it), one or two `<script>` blocks, and any number of `<style>` blocks. The SFC compiler turns the file into a JavaScript module whose default export is the component: the template is compiled into a render function, the script supplies state and logic, and the styles are extracted and injected at runtime.

> **TIP**
> In `<script setup>` the top-level declarations ARE the component's setup state — the block compiles into a `setup()` function body, so an `import` at the top of the file is the component's import, and `const x = ref(0)` becomes reactive state.

## Script block variants

| Block | What it is | When to use |
| --- | --- | --- |
| `<script setup>` | compile-time scoped script; top-level bindings are the template scope | the default for new SFCs |
| `<script>` (plain) | a normal ES module; `export default { … }` carries the component options | Options API, or named exports (a store, a router) |
| both together | options object + setup bindings, merged at compile time | gradual migration |
| `lang="ts"` | TypeScript in the script block | TypeScript projects |
| `generic` (Vue 3.3+) | a generic component with `defineProps<{ T }>()` | library code |

Macros are the bridge between the two worlds: `defineProps`, `defineEmits`, `defineExpose`, `withDefaults` and `defineOptions` are compiler macros — no import needed, no runtime call generated. They only exist in `<script setup>` (or in `setup()` via the corresponding compiler output).

> **WARNING**
> Named exports are not allowed inside `<script setup>` — only the component is the default export. `export const router` or a Pinia store must live in a separate plain `<script>` block, which is the documented two-script pattern.

## Style blocks and scoping

A plain `<style>` block is global: every rule applies to the whole document, which is how you theme a design system. A `<style scoped>` block gets a data attribute stamped onto the component's own elements, and every selector is rewritten to match that attribute — your `button` rule stops leaking into child components:

```vue
<style scoped>
/* applies to this component's markup only */
.card { border: 1px solid #e5e7eb; }

/* reach into a child component's internals on purpose */
.card :deep(.inner) { padding: 8px; }
</style>
```

Multiple style blocks are merged in order, so one file can carry a global reset for its element plus scoped rules for its layout. The `:deep()` combinator (formerly `::v-deep`) is the deliberate escape hatch for styling a child's internals, and `<style module>` gives you CSS modules with a generated class-name object.

> **TIP**
> Scoped styles are the default for component files; keep global styles in a dedicated entry stylesheet. The moment a rule needs to reach "somewhere else", that is a sign it belongs in a global file, not a `:deep()` hack.

## File conventions

One component per file, and the file name is the component name: `UserProfile.vue` exports a component used as `<UserProfile>` or `<user-profile>`. Devtools pick the file name up, so vague names (`Component1.vue`) show up as vague names everywhere in your debugging workflow.

There is no enforced order of blocks; the official docs and most codebases write `<script setup>` first, then `<template>`, then `<style>` — logic first makes the file read like code. The template tag must be a single root in older Vue 2 days only; since Vue 3 fragments are fine, and you can have several root nodes.

<!-- RU -->

Single-file-компонент — файловая конвенция: один `.vue`-файл, несколько блоков, один экспортируемый компонент. Эта страница — карта: какие блоки существуют, что компилирует каждый вариант script и как скопируются стили.

## Три блока

```vue
<script setup>
import { ref } from "vue";
const count = ref(0);
</script>

<template>
  <button @click="count++">Clicked {{ count }} times</button>
</template>

<style scoped>
button {
  padding: 8px 16px;
}
</style>
```

SFC содержит ровно один `<template>` (собственная разметка компонента; опционален, потому что его может заменить render-функция или functional-компонент), один или два `<script>`-блока и любое число `<style>`-блоков. SFC-компилятор превращает файл в JavaScript-модуль, чей default-экспорт — компонент: template компилируется в render-функцию, script даёт state и логику, а стили вытаскиваются и инжектятся в рантайме.

> **TIP**
> В `<script setup>` top-level декларации И ЕСТЬ state setup компонента — блок компилируется в тело функции `setup()`, поэтому `import` наверху файла — импорт компонента, а `const x = ref(0)` становится реактивным state.

## Варианты script-блока

| Блок | Что это | Когда использовать |
| --- | --- | --- |
| `<script setup>` | компилируемый со скоупом скрипт; top-level связки — область видимости template | дефолт для новых SFC |
| `<script>` (обычный) | обычный ES-модуль; `export default { … }` несёт опции компонента | Options API или именованные экспорты (стор, роутер) |
| оба вместе | options-объект + setup-связки, склеиваются при компиляции | постепенная миграция |
| `lang="ts"` | TypeScript в script-блоке | TS-проекты |
| `generic` (Vue 3.3+) | generic-компонент с `defineProps<{ T }>()` | lib-код |

Макросы — мост между двумя мирами: `defineProps`, `defineEmits`, `defineExpose`, `withDefaults` и `defineOptions` — это компиляторные макросы: импорт не нужен, runtime-вызов не генерируется. Они существуют только в `<script setup>` (или в `setup()` через соответствующий компиляторный вывод).

> **WARNING**
> Именованные экспорты запрещены внутри `<script setup>` — default-экспорт только компонент. `export const router` или Pinia-стор должны жить в отдельном обычном `<script>`-блоке — это задокументированный two-script паттерн.

## Style-блоки и scoping

Обычный `<style>`-блок — глобальный: каждое правило применяется ко всему документу, и именно так темизируется дизайн-система. Блок `<style scoped>` получает data-атрибут, который ставится на собственные элементы компонента, и каждый селектор переписывается под этот атрибут — ваше правило для `button` перестаёт утекать в дочерние компоненты:

```vue
<style scoped>
/* применяется только к разметке этого компонента */
.card { border: 1px solid #e5e7eb; }

/* целенаправленно достаём внутрь дочернего компонента */
.card :deep(.inner) { padding: 8px; }
</style>
```

Несколько style-блоков склеиваются по порядку, поэтому в одном файле может лежать и глобальный reset для элемента, и scoped-правила для вёрстки. Комбинатор `:deep()` (ранее `::v-deep`) — осознанный escape-hatch для стилязации внутренностей ребёнка, а `<style module>` даёт CSS modules с сгенерированным объектом class-имён.

> **TIP**
> Scoped-стили — дефолт для файлов компонентов; глобальные стили держите в отдельном entry-файле. Как только правилу нужно достать «куда-то ещё» — это признак того, что оно belongs в глобальном файле, а не в `:deep()`-хаке.

## Файловые конвенции

Один компонент на файл, и имя файла — имя компонента: `UserProfile.vue` экспортирует компонент, который используется как `<UserProfile>` или `<user-profile>`. Devtools подхватывают имя файла, поэтому размытые имена (`Component1.vue`) показываются размытыми везде в вашем отладочном workflow.

Принудительного порядка блоков нет; официальные доки и большинство кодовых баз пишут `<script setup>` первым, затем `<template>`, затем `<style>` — логика впереди делает файл читаемым как код. Requirement единого корня в тегах template был только во времена Vue 2; начиная с Vue 3 фрагменты легальны, и корневых узлов может быть несколько.
