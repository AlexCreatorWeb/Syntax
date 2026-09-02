# Урок 21. Pinia: стейт, геттеры, экшены

## Цель

После урока студент сможет: создать **хранилище (store)** через Pinia (`defineStore`), описывать **state**, **getters** и **actions**, использовать store в любом компоненте через `useStore()`, понимать, что Pinia — это «реактивное состояние приложения, доступное из любого места», и отличать Pinia от provide/inject и локальных `ref`.

## Теория

### Зачем Pinia

Локальные `ref` живут **в компоненте**. Provide/inject — «на ветку». А **состояние приложения** (корзина, авторизованный пользователь, настройки) нужно **многим** компонентам на **разной** глубине. **Pinia** — **официальный** менеджер состояния Vue: он даёт **глобальные** stores, которые:

- **реактивны** (как `ref`/`reactive`);
- **доступны** из **любого** компонента (не нужна «протяжка» через props);
- **структурированы** (state/getters/actions);
- **отлаживаются** (DevTools);
- **переживают** перерисовки (состояние не «потеряется» при смене компонента).

### Store: state / getters / actions

**Store** — это «объект состояния» с тремя частями:

- **state** — **данные** (реактивные);
- **getters** — **вычисляемые** (как `computed`, но на уровне store);
- **actions** — **функции** (меняют state, делают запросы).

Два стиля:

1. **Setup-стиль** (рекомендуется, «как `<script setup>`»):
   ```js
   import { defineStore } from "pinia";
   import { ref, computed } from "vue";

   export const useCart = defineStore("cart", () => {
     const items = ref([]);
     const total = computed(() => items.value.reduce((s, i) => s + i.price * i.qty, 0));
     function add(item) { items.value.push(item); }
     return { items, total, add };
   });
   ```
2. **Options-стиль** (`state()`, `getters:`, `actions:`) — аналог «объекта».

**Setup-стиль** — тот же `ref`/`computed`, что ты уже знаешь, просто **внутри** `defineStore`.

### Использование в компоненте

```js
import { useCart } from "./stores/cart.js";
const cart = useCart();
// cart.items, cart.total, cart.add(…)
```

`useCart()` **возвращает** store (реактивный). Можно вызывать **в любом** компоненте — **состояние общее** (один и тот же store для всего приложения).

### Actions и асинхронность

**Actions** — обычные функции (могут быть **async**): «загрузить данные», «отправить запрос», «изменить state». Это **единственное** место, где **менять** state (для «чистоты» и отладки).

TIP: держи **много маленьких** stores (по доменам: `cart`, `auth`, `theme`), а не **один большой**. Так проще **переиспользовать** и **отлаживать**.

NOTE: в раннере Syntax Pinia работает **внутри** превью. Store объявляется в **обычном** `<script>`-блоке SFC как `export const pinia` (и **stores** импортируются туда). Раннер вызовет `app.use(pinia)`.

## Пример

Store «Корзина» + компонент, который его использует:

```vue
<script>
import { createPinia, defineStore } from "pinia";
import { ref, computed } from "vue";

export const useCart = defineStore("cart", () => {
  const items = ref([]);
  const count = computed(() => items.value.length);
  const total = computed(() => items.value.reduce((s, i) => s + i.price * i.qty, 0));
  function add(name, price) {
    const found = items.value.find(i => i.name === name);
    if (found) found.qty++;
    else items.value.push({ name, price, qty: 1 });
  }
  function clear() { items.value = []; }
  return { items, count, total, add, clear };
});

export const pinia = createPinia();
</script>

<script setup>
import { useCart } from "./stores.js"; // (в раннере — см. ниже)
const cart = useCart();
</script>

<template>
  <div class="demo">
    <h3>Корзина ({{ cart.count }} шт., на {{ cart.total }} ₽)</h3>
    <ul>
      <li v-for="i in cart.items" :key="i.name">{{ i.name }} × {{ i.qty }} — {{ i.price * i.qty }} ₽</li>
    </ul>
    <p v-if="!cart.items.length" class="empty">Пусто</p>

    <button @click="cart.add('Курс Vue', 1000)">Добавить «Курс Vue»</button>
    <button @click="cart.add('Курс React', 1200)">Добавить «Курс React»</button>
    <button @click="cart.clear()">Очистить</button>
  </div>
</template>
```

В раннере (один файл `App.vue`) store **объявляется** в **обычном** `<script>`-блоке (как выше), а в `<script setup>` — **`const cart = useCart()`** (импорт того же `useCart`).

Что проверяется:

- `state` — `items` (ref);
- `getters` — `count`, `total` (computed);
- `actions` — `add`, `clear`;
- store **реактивен**: кнопка «Добавить» → `items` меняется → UI обновляется;
- store **общий**: если бы был **второй** компонент с `useCart()` — он видел **тот же** state.

## Частые ошибки

WARN: **забываешь** `app.use(pinia)` (в раннере — `export const pinia`). Тогда `useCart()` **упадёт** («no active Pinia»).

WARN: меняешь **state** **напрямую** из компонента (`cart.items.push(…)`). Лучше — **через action** (`cart.add(…)`). Для **простоты** допустимо, но **actions** — «одна точка входа» (легче **отлаживать** и **тестировать**).

WARN: **создаёшь** store **внутри** компонента **на каждый** рендер. `useCart()` — **идемпотентно** (возвращает **тот же** store), но **не** вызывай его **внутри** `computed`/`watch` без необходимости.

WARN: путаешь **Pinia** и **provide/inject**. Pinia — **глобальное** состояние **приложения** (любой компонент). Provide/inject — **локальное-для-ветки** (настройки, тема). Не «тасуй» Pinia для **локальных** вещей.

## Практическое задание

В `App.vue` сделай «Корзину + счётчик»:

1. Объяви store `useCart` (setup-стиль):
   - `state`: `items` (ref массив);
   - `getters`: `count`, `total`;
   - `actions`: `add(name, price)`, `remove(name)`, `clear()`.
2. `export const pinia = createPinia()`.
3. В `<script setup>`: `const cart = useCart()`.
4. В шаблоне:
   - список `cart.items` (v-for);
   - «Итого: {{ cart.total }} ₽ ({{ cart.count }} шт.)»;
   - кнопки: «Добавить A» (100 ₽), «Добавить B» (200 ₽), «Убрать A», «Очистить».
5. Создай **второй** inline-компонент `CartBadge`, который **тоже** вызывает `useCart()` и показывает `cart.count` (бейдж в «шапке»).
6. Запусти **Run**: убедись, что `CartBadge` **обновляется** при изменении корзины (state **общий**).
