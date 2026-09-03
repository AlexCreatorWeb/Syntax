---
id: vue-vs-options
track: vue
type: reference
section: reference
order: 3
title:
  en: "Composition vs Options API"
  ru: "Composition API и Options API"
excerpt:
  en: "The same counter in both APIs, a full feature-mapping table, and honest guidance on which style to pick and when."
  ru: "Один и тот же счётчик в обоих API, полная таблица соответствия фич и честные рекомендации, какой стиль выбрать и когда."
version: "vue 3.5"
updated: 2026-09-03
---

The same component written two ways, plus a complete mapping between the APIs and the reasoning behind a style choice. Use this page when you inherit an Options-style codebase or when someone asks why your team standardized on `<script setup>`.

## The same component, two ways

```vue
<!-- Options API -->
<script>
export default {
  data() {
    return { count: 0, step: 2 };
  },
  computed: {
    doubled() { return this.count * this.step; },
  },
  methods: {
    increment() { this.count += this.step; },
  },
  mounted() {
    console.log("mounted");
  },
};
</script>

<template>
  <button @click="increment">{{ count }} → {{ doubled }}</button>
</template>
```

```vue
<!-- Composition API -->
<script setup>
import { ref, computed, onMounted } from "vue";

const count = ref(0);
const step = ref(2);
const doubled = computed(() => count.value * step.value);

function increment() { count.value += step.value; }
onMounted(() => console.log("mounted"));
</script>

<template>
  <button @click="increment">{{ count }} → {{ doubled }}</button>
</template>
```

Both compile to the same render output — the template is untouched. The difference is organization: options code groups by kind (all data together, all methods together), composition code groups by feature (all counter logic together). The difference becomes visible the moment one feature needs four options.

## Feature mapping

| Options API | Composition API | Notes |
| --- | --- | --- |
| `data()` | `const x = ref(...)` | top-level of `<script setup>` |
| `computed: { f() }` | `const f = computed(() => …)` | lazy, cached |
| `methods: { fn() }` | plain `function fn() {}` | no `this` |
| `watch: { x() }` | `watch(x, (v, o) => …)` | explicit sources |
| `watch: { deep: true }` | `watch(obj, cb, { deep: true })` | same behavior |
| `mounted(fn)` | `onMounted(fn)` | same timing |
| `beforeDestroy(fn)` | `onUnmounted(fn)` | renamed in Vue 3 |
| `props: [...]` | `defineProps([...])` | SFC macro |
| `emits: [...]` | `defineEmits([...])` | SFC macro |
| `this.$refs.x` | `const x = ref(null)` template ref | explicit ref per element |
| `this.$emit("x")` | `emit("x")` from `defineEmits` | declared events |
| mixins | composables (`useX`) | no name-collision hell |
| `this.$parent` / `$children` | `provide` / `inject` | recommended pattern |
| `this.$forceUpdate()` | rarely needed | reactivity covers it |

The biggest mental shift is that `this` disappears: in `<script setup>` there is no component instance object, everything is a named variable in scope. A `this.count` copied from an Options file is `undefined`, not a typo.

> **TIP**
> Both APIs coexist in one file: a plain `<script>` with `export default { … }` next to a `<script setup>` block, with their options merged at compile time. That is the standard gradual-migration path.

## Which to pick

For a small static component — a badge, a label, a presentational card — either style is fine, and Options reads naturally for "some data, a method, done". The case for composition starts at the first reusable behavior: a composable is a plain function you can import, unit-test in Node without a DOM, and reuse across a project, while a mixin is a global patch with name collisions and no type inference.

Practical rules that hold up in real codebases: use `<script setup>` by default for new SFCs; keep Options style only when you genuinely prefer its explicit shape; never mix both for the same feature in the same component. Vue's own tooling — the SFC compiler, Vite, devtools — is built around `<script setup>` first, which is also why the Composition API is the style the official docs teach.

> **WARNING**
> The number one migration bug is `this.` leftovers. There is no instance in `<script setup>` — rename every `this.x` to the ref and add `.value`, or the code breaks silently at runtime.

<!-- RU -->

Один и тот же компонент в двух вариантах, плюс полная карта соответствия API и рассуждения о выборе стиля. Используйте эту страницу, когда унаследовали Options-кодовую базу или когда спрашивают, почему команда стандартизировалась на `<script setup>`.

## Один и тот же компонент, два способа

```vue
<!-- Options API -->
<script>
export default {
  data() {
    return { count: 0, step: 2 };
  },
  computed: {
    doubled() { return this.count * this.step; },
  },
  methods: {
    increment() { this.count += this.step; },
  },
  mounted() {
    console.log("mounted");
  },
};
</script>

<template>
  <button @click="increment">{{ count }} → {{ doubled }}</button>
</template>
```

```vue
<!-- Composition API -->
<script setup>
import { ref, computed, onMounted } from "vue";

const count = ref(0);
const step = ref(2);
const doubled = computed(() => count.value * step.value);

function increment() { count.value += step.value; }
onMounted(() => console.log("mounted"));
</script>

<template>
  <button @click="increment">{{ count }} → {{ doubled }}</button>
</template>
```

Оба варианта компилируются в один и тот же render-вывод — template не тронут. Разница — в организации: options-код группирует по виду (весь data вместе, все methods вместе), composition-код — по фиче (вся логика счётчика вместе). Разница становится видимой в момент, когда одной фиче нужны четыре опции.

## Соответствие фич

| Options API | Composition API | Примечания |
| --- | --- | --- |
| `data()` | `const x = ref(...)` | top-level в `<script setup>` |
| `computed: { f() }` | `const f = computed(() => …)` | ленивый, кэшированный |
| `methods: { fn() }` | обычная `function fn() {}` | без `this` |
| `watch: { x() }` | `watch(x, (v, o) => …)` | явные источники |
| `watch: { deep: true }` | `watch(obj, cb, { deep: true })` | то же поведение |
| `mounted(fn)` | `onMounted(fn)` | то же время |
| `beforeDestroy(fn)` | `onUnmounted(fn)` | переименовано в Vue 3 |
| `props: [...]` | `defineProps([...])` | SFC-макрос |
| `emits: [...]` | `defineEmits([...])` | SFC-макрос |
| `this.$refs.x` | `const x = ref(null)` template ref | явный ref на элемент |
| `this.$emit("x")` | `emit("x")` из `defineEmits` | объявленные события |
| mixins | компаузабели (`useX`) | без адских коллизий имён |
| `this.$parent` / `$children` | `provide` / `inject` | рекомендуемый паттерн |
| `this.$forceUpdate()` | почти не нужен | реактивность покрывает |

Самый большой сдвиг в голове — исчезновение `this`: в `<script setup>` нет объекта инстанса компонента, всё — именованные переменные в области видимости. Скопированный из Options-файла `this.count` — это `undefined`, а не опечатка.

> **TIP**
> Оба API сосуществуют в одном файле: обычный `<script>` с `export default { … }` рядом с блоком `<script setup>`, и их опции склеиваются на этапе компиляции. Это стандартный путь постепенной миграции.

## Что выбрать

Для маленького статичного компонента — бейджа, подписи, презентационной карточки — любой стиль годится, и Options читается естественно для «немного data, method, всё». Случай для composition начинается с первого переиспользуемого поведения: компаузабель — обычная функция, которую можно импортировать, юнит-тестить в Node без DOM и переиспользовать по проекту, а миксин — глобальный патч с коллизиями имён и без type inference.

Практические правила, которые держатся в реальных кодовых базах: `<script setup>` по умолчанию для новых SFC; Options style — только когда вы действительно предпочитаете его явную форму; никогда не смешивайте оба API для одной фичи в одном компоненте. Инфраструктура самого Vue — SFC-компилятор, Vite, devtools — построена вокруг `<script setup>` в первую очередь, и поэтому Composition API — тот стиль, который преподают в официальных доках.

> **WARNING**
> Ошибка номер один при миграции — остатки `this.`. В `<script setup>` нет инстанса: переименуйте каждый `this.x` в ref и добавьте `.value`, иначе код молча сломается в рантайме.
