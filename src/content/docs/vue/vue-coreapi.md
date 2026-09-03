---
id: vue-coreapi
track: vue
type: reference
section: reference
order: 1
title:
  en: "Core API (ref / computed / watch)"
  ru: "Core API: ref / computed / watch"
excerpt:
  en: "A dense cheat sheet of the reactivity and effect APIs: what each function returns, when it recomputes, and which option changes its behavior."
  ru: "Плотный шпаргалочный справочник реактивных и effect-API: что возвращает каждая функция, когда пересчитывается и какой параметр меняет поведение."
version: "vue 3.5"
updated: 2026-09-03
relatedTask: vue-006
---

A bookmarkable map of the reactivity and effect APIs. When you are writing logic and cannot remember which primitive returns a box, when it recomputes, or which option flips its behavior — start here.

## ref, reactive, computed

| API | Input | Returns | Notes |
| --- | --- | --- | --- |
| `ref(value)` | any value | reactive box `{ value }` | `.value` in script; auto-unwrapped in templates |
| `shallowRef(value)` | any value | non-deep ref | the inner object is not tracked |
| `reactive(obj)` | object or array | reactive Proxy | deep; no `.value`; never reassign |
| `shallowReactive(obj)` | object | shallow Proxy | only top-level properties tracked |
| `computed(fn)` | getter | read-only reactive value | lazy and cached |
| `computed({ get, set })` | options object | writable reactive value | `set` runs on assignment |
| `toRef(obj, key)` | object + key | ref linked to that property | survives destructuring |
| `toRefs(obj)` | object | object of refs | safe destructuring of a reactive object |
| `readonly(refOrReactive)` | ref or reactive | read-only mirror | deep; dev warning on write |
| `markRaw(obj)` | object | the same object | excluded from reactivity (large, immutable data) |

```js
import { ref, reactive, computed, toRef, toRefs } from "vue";

const user = reactive({ name: "Ada", level: 1 });
const level = toRef(user, "level");   // stays linked to user.level
const { name } = toRefs(user);        // name is a ref, not a copy
const displayName = computed(() => name.value.toUpperCase());
```

Rule of thumb: `ref` for primitives and anything that may be reassigned, `reactive` for stable object shapes you mutate in place, `toRef` / `toRefs` to bridge the two worlds, and `computed` for every derived value you can name.

## watch and watchEffect

| API | Runs | Key options |
| --- | --- | --- |
| `watch(source, cb)` | when the source changes, before the next render by default | `immediate`, `deep`, `flush` |
| `watchEffect(fn)` | immediately, then on any reactive value read inside | `flush`, `onCleanup` |
| `watch(() => x.value, cb)` | getter source — precise, one dependency | same |
| `watch(obj, cb)` | whole reactive object — deep tracking | same |

```js
import { ref, watch, watchEffect, nextTick } from "vue";

const query = ref("");

// precise: runs only when query changes
watch(query, (newVal, oldVal) => {
  console.log(`"${oldVal}" -> "${newVal}"`);
}, { immediate: true });

// reactive: re-runs whenever any read dependency changes
watchEffect(() => {
  document.title = "Results for: " + query.value;
});

// the DOM is synced before the nextTick callback runs
watch(query, () => {
  nextTick(() => { /* safe to read the rendered list */ });
});
```

The `flush` option controls timing relative to the component render: `pre` (default) runs before the update, `post` runs after the DOM has re-rendered, and `sync` runs immediately on the write. A `watchEffect` can register an `onCleanup` callback that runs before every re-execution — the place to cancel an in-flight fetch so two requests never race.

> **TIP**
> Default to `watch` with an explicit getter — the dependencies are visible in the code. Reach for `watchEffect` only when "react to anything this function reads" is exactly what you want.

## Utility APIs

| API | Purpose |
| --- | --- |
| `nextTick(fn)` | wait for the DOM to flush after a state change |
| `onMounted` / `onUpdated` / `onUnmounted` | component lifecycle hooks |
| `provide(key, value)` / `inject(key)` | dependency injection across component depth |
| `defineProps` / `defineEmits` | SFC-only macros for props and events |
| `h(type, props, children)` | render-function API (no template) |
| `getCurrentInstance()` | current component instance (rare, composables only) |

```js
import { provide, inject, nextTick } from "vue";

provide("theme", { primary: "#22c55e" });
const theme = inject("theme", { primary: "#888888" });

function afterRender() {
  nextTick(() => {
    console.log("DOM is up to date");
  });
}
```

`provide` / `inject` move a value down the component tree without prop-drilling: a provider anywhere above can feed any depth of descendants. `nextTick` is the synchronization point whenever your logic needs the DOM to reflect a state change you just made.

> **WARNING**
> `watch` with `{ deep: true }` on a large object re-walks the whole tree on every change. Prefer a getter that selects just the value you need — it is faster and self-documenting.

<!-- RU -->

Закармливаемая карта реактивных и effect-API. Когда вы пишете логику и не помните, какой примитив возвращает «коробку», когда пересчитывается и какой параметр меняет поведение — начинайте отсюда.

## ref, reactive, computed

| API | Ввод | Возвращает | Примечания |
| --- | --- | --- | --- |
| `ref(value)` | любое значение | реактивная коробка `{ value }` | `.value` в скрипте; в template разматывается автоматически |
| `shallowRef(value)` | любое значение | non-deep ref | внутренний объект не отслеживается |
| `reactive(obj)` | объект или массив | reactive Proxy | deep; без `.value`; никогда не переприсваивать |
| `shallowReactive(obj)` | объект | shallow Proxy | отслеживаются только top-level свойства |
| `computed(fn)` | getter | read-only реактивное значение | ленивое и кэшированное |
| `computed({ get, set })` | объект опций | записываемое реактивное значение | `set` срабатывает при присваивании |
| `toRef(obj, key)` | объект + ключ | ref, связанный с этим свойством | переживает деструктуризацию |
| `toRefs(obj)` | объект | объект из ref'ов | безопасная деструктуризация reactive-объекта |
| `readonly(refOrReactive)` | ref или reactive | read-only зеркало | deep; warning в dev при записи |
| `markRaw(obj)` | объект | тот же объект | исключается из реактивности (большие неизменяемые данные) |

```js
import { ref, reactive, computed, toRef, toRefs } from "vue";

const user = reactive({ name: "Ada", level: 1 });
const level = toRef(user, "level");   // остаётся связан с user.level
const { name } = toRefs(user);        // name — ref, а не копия
const displayName = computed(() => name.value.toUpperCase());
```

Правило большого пальца: `ref` для примитивов и всего, что может быть переприсвоено, `reactive` для стабильных форм объектов, которые вы мутите на месте, `toRef` / `toRefs` — мост между двумя мирами, и `computed` для каждого производного значения, которое можно назвать.

## watch и watchEffect

| API | Когда выполняется | Ключевые опции |
| --- | --- | --- |
| `watch(source, cb)` | когда источник меняется; по умолчанию до следующего рендера | `immediate`, `deep`, `flush` |
| `watchEffect(fn)` | сразу, затем при каждом изменении прочитанного значения | `flush`, `onCleanup` |
| `watch(() => x.value, cb)` | getter-источник — точный, одна зависимость | те же |
| `watch(obj, cb)` | весь reactive-объект — deep-отслеживание | те же |

```js
import { ref, watch, watchEffect, nextTick } from "vue";

const query = ref("");

// точный: срабатывает только при изменении query
watch(query, (newVal, oldVal) => {
  console.log(`"${oldVal}" -> "${newVal}"`);
}, { immediate: true });

// реактивный: пересчитывается при изменении любой прочитанной зависимости
watchEffect(() => {
  document.title = "Results for: " + query.value;
});

// DOM синхронизирован до выполнения колбэка nextTick
watch(query, () => {
  nextTick(() => { /* можно безопасно читать отрендеренный список */ });
});
```

Опция `flush` управляет временем относительно рендера компонента: `pre` (по умолчанию) — до обновления, `post` — после перерисовки DOM, `sync` — сразу при записи. В `watchEffect` можно зарегистрировать колбэк `onCleanup`, который выполняется перед каждым повторным запуском — туда убирают незавершённый fetch, чтобы два запроса не гонялись друг за другом.

> **TIP**
> По умолчанию — `watch` с явным getter: зависимости видны в коде. Обращайтесь к `watchEffect`, только когда «реагировать на всё, что функция читает» — ровно то, что вы хотите.

## Утилитарные API

| API | Назначение |
| --- | --- |
| `nextTick(fn)` | дождаться промывки DOM после изменения state |
| `onMounted` / `onUpdated` / `onUnmounted` | lifecycle-хуки компонента |
| `provide(key, value)` / `inject(key)` | DI через глубину компонентного дерева |
| `defineProps` / `defineEmits` | SFC-макросы для пропсов и событий |
| `h(type, props, children)` | render-function API (без template) |
| `getCurrentInstance()` | текущий инстанс компонента (редко, только в компаузаблях) |

```js
import { provide, inject, nextTick } from "vue";

provide("theme", { primary: "#22c55e" });
const theme = inject("theme", { primary: "#888888" });

function afterRender() {
  nextTick(() => {
    console.log("DOM is up to date");
  });
}
```

`provide` / `inject` двигают значение вниз по компонентному дереву без prop-drilling: любой провайдер выше может кормить потомков на любой глубине. `nextTick` — точка синхронизации, когда вашей логике нужно, чтобы DOM отразил только что сделанное изменение state.

> **WARNING**
> `watch` с `{ deep: true }` на большом объекте обходит всё дерево при каждом изменении. Лучше getter, который выбирает только нужное значение — он быстрее и самодостаточен.
