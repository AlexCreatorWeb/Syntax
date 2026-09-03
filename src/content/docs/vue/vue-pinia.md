---
id: vue-pinia
track: vue
type: guide
section: state
order: 6
title:
  en: "State Management with Pinia"
  ru: "Состояние: Pinia"
excerpt:
  en: "Creating Pinia stores, using them in components, writing async actions, and avoiding the destructuring trap that breaks reactivity."
  ru: "Создание Pinia-сторов, использование в компонентах, асинхронные action'ы и обход ловушки деструктуризации, ломающей реактивность."
version: "vue 3.5"
updated: 2026-09-03
---

Pinia is the official state management library for Vue: a store is a composable with a global identity, so the mental model you already have from components carries over directly. This guide creates a store, uses it in components, writes async actions, and shows the one reactivity trap that catches every newcomer.

## Creating a store

A store is defined once with `defineStore` and installed on the app with `createPinia`. There are two authoring styles — options style and setup style — and both produce the same store:

```js
// stores/cart.js — options style
import { defineStore } from "pinia";

export const useCartStore = defineStore("cart", {
  state: () => ({ items: [], coupon: null }),
  getters: {
    count: (state) => state.items.length,
    subtotal: (state) => state.items.reduce((sum, i) => sum + i.price * i.qty, 0),
  },
  actions: {
    add(product) { this.items.push({ ...product, qty: 1 }); },
    applyCoupon(code) { this.coupon = code; },
  },
});
```

```js
// stores/cart.js — setup style (a composable inside)
import { ref, computed } from "vue";
import { defineStore } from "pinia";

export const useCartStore = defineStore("cart", () => {
  const items = ref([]);
  const coupon = ref(null);
  const count = computed(() => items.value.length);
  function add(product) { items.value.push({ ...product, qty: 1 }); }
  return { items, coupon, count, add };
});
```

The first argument is the store's id, which makes it unique across the app and is what devtools display. `state` must be a function returning an object — Pinia wraps it in `reactive` for you. Getters are derived, synchronous values, exactly like `computed`. Actions are methods that mutate state, and `this` inside them is the store.

Install once in the entry file before mounting:

```js
// main.js
import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";

createApp(App).use(createPinia()).mount("#root");
```

> **TIP**
> Both styles produce the same store — pick one per project and stick to it. Setup style is what you already know from components; options style keeps the store shape explicit at a glance.

## Using stores in components

Calling `useCartStore()` from anywhere returns the same store instance — a per-app singleton — so components read and mutate shared state without prop-drilling:

```vue
<script setup>
import { storeToRefs } from "pinia";
import { useCartStore } from "../stores/cart.js";

const cart = useCartStore();
const { items, count } = storeToRefs(cart);

cart.add({ id: 1, name: "Keyboard", price: 89 });
</script>

<template>
  <p>Cart: {{ count }} items</p>
  <ul>
    <li v-for="item in items" :key="item.id">{{ item.name }} — {{ item.price }}</li>
  </ul>
</template>
```

Actions are called directly on the store object, state and getters are read as plain properties. The subtle part is destructuring: state and getters live inside reactive objects, so pulling them out with plain destructuring copies the value and drops the binding.

> **WARNING**
> `const { count } = useCartStore()` copies a plain number — the template stops updating when items change. Use `storeToRefs(store)` for state and getters; actions can be destructured freely, they are just functions.

## Async actions

Actions are where side effects belong, and they can be async — fetch calls, storage writes, timers, navigation:

```js
actions: {
  async fetchCoupon(code) {
    const res = await fetch("/api/coupons/" + code);
    if (res.ok) this.coupon = (await res.json()).value;
  },
},
```

Keep getters synchronous and derived; anything that waits on the outside world moves to an action. Pinia also exposes store-level utilities you will reach for in real apps: `$patch` to apply a partial update, `$reset` to return to the initial state (options style only), `$subscribe` to observe every mutation, and `$dispose` to drop the store.

> **TIP**
> Wire `$subscribe((mutation, state) => …)` during development — it is the Pinia equivalent of Redux DevTools mutation logging and it comes built in.

## Store to store access

Stores can use other stores, which is how cross-domain logic lives in one place instead of a component:

```js
export const useOrdersStore = defineStore("orders", {
  state: () => ({ orders: [] }),
  actions: {
    checkout() {
      const cart = useCartStore();
      this.orders.push({ items: cart.items, total: cart.subtotal });
      cart.items = [];
    },
  },
});
```

The rule is laziness: call `useCartStore()` inside an action or a getter, not at the module top level. Store modules are imported before `createPinia()` is installed on the app, so a top-level `useCartStore()` would run with no active pinia instance.

A common pattern on top of that is a composable that wraps a store — `useCheckout()` calls `useCartStore()` internally and exposes `placeOrder()`. The component stays thin, the store stays testable, and the flow logic lives in a named function you can unit-test.

> **WARNING**
> A circular dependency between two stores is legal (they resolve lazily) but usually means the split is wrong. If store A and store B both reach into each other on every action, move the shared state into one store.

> **TIP**
> One store per domain (cart, auth, catalog) reads better than one store per page. Pages compose stores; domains own state.

<!-- RU -->

Pinia — официальная библиотека управления состоянием для Vue: стор — это компаузабель с глобальной идентичностью, поэтому ментальная модель, которую вы уже знаете из компонентов, переносится напрямую. Гайд создаёт стор, использует его в компонентах, пишет асинхронные action'ы и показывает единственную ловушку реактивности, в которую попадает каждый новичок.

## Создание стора

Стор объявляется один раз через `defineStore` и ставится на приложение через `createPinia`. Есть два стиля записи — options style и setup style — и оба дают один и тот же стор:

```js
// stores/cart.js — options style
import { defineStore } from "pinia";

export const useCartStore = defineStore("cart", {
  state: () => ({ items: [], coupon: null }),
  getters: {
    count: (state) => state.items.length,
    subtotal: (state) => state.items.reduce((sum, i) => sum + i.price * i.qty, 0),
  },
  actions: {
    add(product) { this.items.push({ ...product, qty: 1 }); },
    applyCoupon(code) { this.coupon = code; },
  },
});
```

```js
// stores/cart.js — setup style (внутри — компаузабель)
import { ref, computed } from "vue";
import { defineStore } from "pinia";

export const useCartStore = defineStore("cart", () => {
  const items = ref([]);
  const coupon = ref(null);
  const count = computed(() => items.value.length);
  function add(product) { items.value.push({ ...product, qty: 1 }); }
  return { items, coupon, count, add };
});
```

Первый аргумент — id стора, который делает его уникальным в приложении и который показывают devtools. `state` обязан быть функцией, возвращающей объект — Pinia сама оборачивает его в `reactive`. Getters — производные синхронные значения, ровно как `computed`. Action'ы — методы, мутящие state, а `this` внутри них — сам стор.

Один раз ставьте пинью в entry-файле до монтирования:

```js
// main.js
import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";

createApp(App).use(createPinia()).mount("#root");
```

> **TIP**
> Оба стиля дают один и тот же стор — выберите один на проект и держитесь его. Setup style — то, что вы уже знаете из компонентов; options style держит форму стора явной на первый взгляд.

## Использование сторов в компонентах

Вызов `useCartStore()` откуда угодно возвращает один и тот же инстанс стора — синглтон на приложение, — поэтому компоненты читают и меняют общий state без prop-drilling:

```vue
<script setup>
import { storeToRefs } from "pinia";
import { useCartStore } from "../stores/cart.js";

const cart = useCartStore();
const { items, count } = storeToRefs(cart);

cart.add({ id: 1, name: "Keyboard", price: 89 });
</script>

<template>
  <p>Cart: {{ count }} items</p>
  <ul>
    <li v-for="item in items" :key="item.id">{{ item.name }} — {{ item.price }}</li>
  </ul>
</template>
```

Action'ы вызываются напрямую на объекте стора, state и getters читаются как обычные свойства. Тонкое место — деструктуризация: state и getters живут внутри реактивных объектов, поэтому их вытаскивание обычной деструктуризацией копирует значение и рвёт связь.

> **WARNING**
> `const { count } = useCartStore()` копирует обычное число — template перестанет обновляться, когда меняются items. Для state и getters используйте `storeToRefs(store)`; action'ы можно деструктурировать свободно — это просто функции.

## Асинхронные action'ы

Action'ы — место для side effects, и они могут быть асинхронными — fetch, запись в storage, таймеры, навигация:

```js
actions: {
  async fetchCoupon(code) {
    const res = await fetch("/api/coupons/" + code);
    if (res.ok) this.coupon = (await res.json()).value;
  },
},
```

Держите getters синхронными и производными; всё, что ждёт внешний мир, уходит в action. Pinia также даёт утилиты на уровне стора, к которым прибегают в настоящих приложениях: `$patch` для частичного обновления, `$reset` для возврата к начальному state (только options style), `$subscribe` для наблюдения за каждой мутацией и `$dispose` для удаления стора.

> **TIP**
> Подключите `$subscribe((mutation, state) => …)` на время разработки — это Pinia-аналог логирования мутаций Redux DevTools, и он встроен.

## Доступ стора к стору

Сторы могут использовать другие сторы — именно так кросс-доменная логика живёт в одном месте, а не в компоненте:

```js
export const useOrdersStore = defineStore("orders", {
  state: () => ({ orders: [] }),
  actions: {
    checkout() {
      const cart = useCartStore();
      this.orders.push({ items: cart.items, total: cart.subtotal });
      cart.items = [];
    },
  },
});
```

Правило — ленивость: вызывайте `useCartStore()` внутри action'а или getter, а не на top-level модуля. Модули сторов импортируются до того, как `createPinia()` установлен на приложение, поэтому top-level вызов `useCartStore()` выполнился бы без активного пинья-инстанса.

Распространённый паттерн поверх этого — компаузабель, который оборачивает стор: `useCheckout()` внутри вызывает `useCartStore()` и экспонирует `placeOrder()`. Компонент остаётся тонким, стор остаётся тестируемым, а логика потока живёт в именованной функции, которую можно юнит-тестить.

> **WARNING**
> Циклическая зависимость двух сторов — легальна (они разрешаются лениво), но обычно значит, что разбивка неправильная. Если стор A и стор B дотягиваются друг до друга в каждом action'е — перенесите общий state в один стор.

> **TIP**
> Один стор на домен (cart, auth, catalog) читается лучше, чем один стор на страницу. Страницы комбинируют сторы; домены владеют state.
