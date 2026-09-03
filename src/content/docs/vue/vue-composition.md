---
id: vue-composition
track: vue
type: guide
section: composition
order: 4
title:
  en: "Composition API"
  ru: "Composition API"
excerpt:
  en: "Organizing component logic by feature: writing composables with state, lifecycle and cleanup, and the rules that keep them reliable."
  ru: "Организация логики компонента по фичам: компаузабели со state, lifecycle и cleanup, и правила, которые делают их надёжными."
version: "vue 3.5"
updated: 2026-09-03
relatedTask: vue-007
---

The Composition API is the way of organizing component logic by feature instead of by option. Related state, computed values and effects live next to each other — and can be extracted into reusable functions called composables. This guide builds two real composables, shows how lifecycle hooks work inside them, and covers the rules that keep shared logic reliable.

## Why composition

Options-style components split one feature across several options: a "debounced search" lives in `data()` (the query), `watch` (the timer), `methods` (the request) and `mounted` (the initial load). Composition-style code keeps the whole feature in one place, because it is just a group of named declarations:

```vue
<script setup>
import { ref, watch } from "vue";

// Debounced search: all the parts of one feature in one block
const query = ref("");
let timer = null;

watch(query, (q) => {
  clearTimeout(timer);
  timer = setTimeout(() => runSearch(q), 300);
});

function runSearch(q) {
  console.log("search:", q);
}
</script>

<template>
  <input v-model="query" />
</template>
```

The payoff shows up when the feature grows. Reading the debounced-search block tells you everything the search does; with options you had to hop between four keys to assemble the same picture. Logic also stops fighting `this`: in `<script setup>` every declaration is a plain variable in scope.

## Composables: extracting logic

A composable is a plain function that uses Vue reactivity and returns an API. By convention it is named `useSomething`:

```vue
<script setup>
import { ref } from "vue";

function useCounter(initial) {
  const value = ref(initial);
  return {
    value,
    increment: () => value.value++,
    decrement: () => value.value--,
    reset: () => { value.value = initial; },
  };
}

const { value, increment, decrement, reset } = useCounter(5);
</script>

<template>
  <span>{{ value }}</span>
  <button @click="increment">+</button>
  <button @click="decrement">-</button>
  <button @click="reset">reset</button>
</template>
```

Because a composable is a function, logic is shared across components without mixins, inheritance or dependency injection. Put each composable in its own file (`composables/useCounter.js`), import it where needed, and test it in isolation — a composable with no template is just a function you can run in Node.

> **TIP**
> Name composables `useX` and make them accept configuration (like `initial` above) instead of reading globals. Two callers of `useCounter(0)` and `useCounter(10)` then get two independent pieces of state.

## Composables with lifecycle

Hooks called inside a composable bind to the component that is currently setting up — the caller, not the composable itself:

```vue
<script setup>
import { ref, onMounted, onUnmounted } from "vue";

function useClock() {
  const now = ref(new Date());
  let timer = null;

  onMounted(() => {
    timer = setInterval(() => { now.value = new Date(); }, 1000);
  });
  onUnmounted(() => clearInterval(timer));

  return { now };
}

const { now } = useClock();
</script>

<template>
  <p>{{ now.toLocaleTimeString() }}</p>
</template>
```

That pattern — start work in `onMounted`, cancel it in `onUnmounted` — covers almost every side effect: intervals, event listeners, subscriptions, aborted fetches. The component that calls the composable unmounts, and the cleanup runs automatically, no matter how many components share the same composable.

> **WARNING**
> Hooks must be called synchronously during setup. Calling `onMounted` inside an `if`, a loop or a promise callback registers nothing (or crashes in dev) — the current component instance is only available synchronously.

## Passing state between composables

Composables can receive each other's refs as arguments, which is how bigger features are assembled from smaller ones:

```vue
<script setup>
import { ref, watch } from "vue";

function usePersisted(key) {
  const raw = localStorage.getItem(key);
  const value = ref(raw ? Number(raw) : 0);
  watch(value, (v) => localStorage.setItem(key, String(v)));
  return value;
}

const saved = usePersisted("votes");
</script>

<template>
  <span>{{ saved }}</span>
  <button @click="saved++">vote</button>
</template>
```

The child composable does not know or care where the ref comes from — a component, another composable, a store. Dependencies flow in as parameters, and the only rule is that what you pass in must be the same ref instance the caller keeps.

> **WARNING**
> A composable called inside a conditional or a loop is a bug in waiting: each call would register its own hooks and its own state, and the count would drift between renders. Call composables exactly once, at the top level of `<script setup>` or `setup()`.

## Common mistakes

> **WARNING**
> Forgetting the `use` prefix is a lint violation for a reason: composables must look like composables. `counter(5)` reads like a pure factory; `useCounter(5)` signals "this hooks into component state and lifecycle".

> **TIP**
> If a composable returns a value the consumer will destructure and reassign, return a `ref`. Refs survive destructuring; a plain reactive object does not.

> **TIP**
> Keep a composable single-purpose. `useSearch` that also handles auth and routing is a component, not a composable — split it.

<!-- RU -->

Composition API — способ организовать логику компонента по фичам, а не по опциям. Связанные state, computed-значения и эффекты живут рядом — и могут быть вынесены в переиспользуемые функции, называемые компаузеблями. Гайд собирает два настоящих компаузабеля, показывает, как lifecycle-хуки работают внутри них, и разбирает правила, которые делают общую логику надёжной.

## Зачем composition

Options-стиль рассеивает одну фичу по нескольким опциям: «debounced-поиск» живёт в `data()` (запрос), `watch` (таймер), `methods` (запрос к API) и `mounted` (первичная загрузка). Composition-стиль держит всю фичу в одном месте, потому что это просто группа именованных деклараций:

```vue
<script setup>
import { ref, watch } from "vue";

// Debounced-поиск: все части одной фичи в одном блоке
const query = ref("");
let timer = null;

watch(query, (q) => {
  clearTimeout(timer);
  timer = setTimeout(() => runSearch(q), 300);
});

function runSearch(q) {
  console.log("search:", q);
}
</script>

<template>
  <input v-model="query" />
</template>
```

Выгода проявляется, когда фича растёт. Читая блок debounced-поиска, вы узнаете всё, что делает поиск; с опциями приходилось бы прыгать между четырьмя ключами, чтобы собрать ту же картину. Логика перестаёт бороться с `this`: в `<script setup>` каждая декларация — обычная переменная в области видимости.

## Компаузабели: вынесение логики

Компаузабель — обычная функция, которая использует реактивность Vue и возвращает API. По конвенции именуется `useSomething`:

```vue
<script setup>
import { ref } from "vue";

function useCounter(initial) {
  const value = ref(initial);
  return {
    value,
    increment: () => value.value++,
    decrement: () => value.value--,
    reset: () => { value.value = initial; },
  };
}

const { value, increment, decrement, reset } = useCounter(5);
</script>

<template>
  <span>{{ value }}</span>
  <button @click="increment">+</button>
  <button @click="decrement">-</button>
  <button @click="reset">reset</button>
</template>
```

Поскольку компаузабель — функция, логика переиспользуется между компонентами без миксинов, наследования и DI. Каждый компаузабель живёт в своём файле (`composables/useCounter.js`), импортируется где нужен и тестируется в изоляции — компаузабель без template это просто функция, которую можно прогнать в Node.

> **TIP**
> Именуйте компаузабели `useX` и пусть они принимают конфигурацию (как `initial` выше), а не читают глобалы. Два вызова `useCounter(0)` и `useCounter(10)` получают две независимые единицы state.

## Компаузабели с lifecycle

Хуки, вызванные внутри компаузабла, привязываются к компоненту, который сейчас устанавливается — к вызывающему, а не к самому компаузаблу:

```vue
<script setup>
import { ref, onMounted, onUnmounted } from "vue";

function useClock() {
  const now = ref(new Date());
  let timer = null;

  onMounted(() => {
    timer = setInterval(() => { now.value = new Date(); }, 1000);
  });
  onUnmounted(() => clearInterval(timer));

  return { now };
}

const { now } = useClock();
</script>

<template>
  <p>{{ now.toLocaleTimeString() }}</p>
</template>
```

Этот паттерн — запустить работу в `onMounted`, отменить в `onUnmounted` — покрывает почти любой side effect: интервалы, слушатели событий, подписки, аборт fetch'ей. Компонент, вызвавший компаузабель, размонтируется — и cleanup выполнится автоматически, независимо от того, сколько компонентов делят один и тот же компаузабель.

> **WARNING**
> Хуки должны вызываться синхронно во время setup. Вызов `onMounted` внутри `if`, цикла или promise-колбэка ничего не зарегистрирует (или упадёт в dev) — текущий инстанс компонента доступен только синхронно.

## Передача state между компаузеблями

Компаузабели принимают ref'ы друг друга как аргументы — именно так большие фичи собираются из маленьких:

```vue
<script setup>
import { ref, watch } from "vue";

function usePersisted(key) {
  const raw = localStorage.getItem(key);
  const value = ref(raw ? Number(raw) : 0);
  watch(value, (v) => localStorage.setItem(key, String(v)));
  return value;
}

const saved = usePersisted("votes");
</script>

<template>
  <span>{{ saved }}</span>
  <button @click="saved++">vote</button>
</template>
```

Внутренний компаузабель не знает и не должен знать, откуда пришёл ref — из компонента, другого компаузабла или стора. Зависимости приходят параметрами, и единственное правило: передаваемый ref обязан быть тем же инстансом, который хранит вызывающий.

> **WARNING**
> Компаузабель, вызванный внутри условия или цикла, — баг по построению: каждый вызов зарегистрировал бы свои хуки и свой state, и число было бы разным от рендера к рендеру. Вызывайте компаузабели ровно один раз, на top-level `<script setup>` или `setup()`.

## Частые ошибки

> **WARNING**
> Забытый префикс `use` — нарушение lint не случайно: компаузабели обязаны выглядеть как компаузабели. `counter(5)` читается как чистая фабрика; `useCounter(5)` сигнализирует «здесь подключение к state и lifecycle компонента».

> **TIP**
> Если компаузабель возвращает значение, которое потребитель будет деструктурировать и переприсваивать, возвращайте `ref`. Ref'ы переживают деструктуризацию; обычный reactive-объект — нет.

> **TIP**
> Держите компаузабель одноцелевым. `useSearch`, который ещё и auth, и роутинг — это компонент, а не компаузабель. Разделите.
