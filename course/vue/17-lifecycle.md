## Цель

После урока студент сможет: понимать **жизненный цикл** компонента (создание → монтаж → обновление → размонтирование), использовать **Composition-хуки** (`onMounted`, `onUpdated`, `onUnmounted`, `onBeforeMount` и др.), знать, **когда** безопасно работать с DOM, и применять хуки для «побочных эффектов» (таймеры, подписки, запросы).

## Теория

### Фазы жизненного цикла

Компонент проходит через ряд **фаз**:

1. **Создание** (setup) — выполняется `<script setup>`, создаются `ref`/`reactive`, регистрируются хуки. **DOM ещё нет.**
2. **Mount** (монтаж) — Vue **создаёт** DOM и вставляет в страницу. После этого **доступны** DOM-элементы.
3. **Update** (обновление) — при изменении реактивных данных Vue **перерисовывает** (Virtual DOM → patch).
4. **Unmount** (размонтирование) — компонент **удаляется** из DOM (например, из-за `v-if`).

### Composition-хуки

В `<script setup>` хуки — это **функции-импорты** из `vue`:

- `onBeforeMount` / `onMounted` — до/после монтажа (после `onMounted` **доступен** DOM);
- `onBeforeUpdate` / `onUpdated` — до/после перерисовки;
- `onBeforeUnmount` / `onUnmounted` — до/после удаления;
- `onErrorCaptured` — перехват ошибок потомков.

Вызов: `onMounted(() => { /* код */ })` — callback зарегистрируется и сработает в нужной фазе.

### Когда что делать

- **Работа с DOM** (измерения, фокус, сторонние библиотеки, canvas) — **только** в `onMounted` (после, DOM есть). В `setup`/`onBeforeMount` DOM **ещё нет**.
- **Таймеры/подписки** — начать в `onMounted`, **завершить** в `onUnmounted` (иначе «утечка»: таймер тикает после удаления компонента).
- **Запросы к API** — часто в `onMounted` (или в `setup`, если не нужен DOM).

### Cleanup через return

`onMounted`/`onUpdated` могут **вернуть** функцию **cleanup**, которая вызовется в **`onUnmounted`** (и перед каждым **update** для `onUpdated`):

```js
onMounted(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id); // cleanup
});
```

Это **удобный** способ «открыть ресурс → закрыть».

TIP: **минимум** хуков. Если можешь обойтись **`watch`** (урок 07) или **`computed`** — используй их. Хуки — для «побочных эффектов» (DOM, таймеры, подписки).

NOTE: в раннере Syntax хуки работают так же, как в Vite. `onMounted` сработает **после** того, как раннер отрендерит компонент в превью.

## Пример

```vue
<script setup>
import { ref, onMounted, onUnmounted, onUpdated } from "vue";

const count = ref(0);
const elapsed = ref(0);
let timer = null;

onBeforeMount(() => {
  console.log("[lifecycle] beforeMount: DOM ещё нет");
});

onMounted(() => {
  console.log("[lifecycle] mounted: DOM есть");
  timer = setInterval(() => { elapsed.value++; }, 1000);
  return () => {
    console.log("[lifecycle] cleanup: clearInterval");
    clearInterval(timer);
  };
});

onUpdated(() => {
  console.log("[lifecycle] updated (count = " + count.value + ")");
});

onUnmounted(() => {
  console.log("[lifecycle] unmounted");
});

function show() { visible.value = !visible.value; }
const visible = ref(true);
</script>

<template>
  <div class="demo">
    <button @click="count++">count +1</button>
    <p>Секунд с момента монтажа: {{ elapsed }}</p>
    <p>Кнопка «count» вызывает `onUpdated` (смотри в консоль).</p>

    <button @click="show">Показать/скрыть блок (v-if)</button>
    <InnerBlock v-if="visible" />
  </div>
</template>
```

Где `InnerBlock` — inline-компонент с `onMounted`/`onUnmounted` (чтобы увидеть «mount/unmount» при `v-if`).

Что проверить в консоли:

- при старте: `beforeMount` → `mounted` (и `mounted` у `InnerBlock`);
- при `count++`: `updated`;
- при «Показать/скрыть»: `unmounted`/`mounted` у `InnerBlock`;
- таймер `elapsed` тикает, а после «скрыть» (если таймер в `InnerBlock`) — останавливается.

## Частые ошибки

WARN: работаешь с **DOM** в `setup`/`onBeforeMount` — элемента **нет** (`null`). Жди **`onMounted`**.

WARN: **забываешь** остановить таймер/подписку в `onUnmounted` — «утечка» (таймер тикает, подписчик зовётся после удаления компонента). Используй **cleanup** (return из `onMounted`).

WARN: хук **не работает** (callback не вызывается). Проверь: хук вызван **во время** `setup` (на верхнем уровне), а не **внутри** `setTimeout`/`Promise`/обработчика (т.е. не «асинхронно после setup»).

WARN: путаешь **`onUpdated`** и **`watch`**. `onUpdated` — «после перерисовки» (неизвестно, **что** изменилось). Для «реагировать на конкретное значение» — `watch`.

## Практическое задание

В `App.vue` сделай «Таймер с cleanup»:

1. `const seconds = ref(0)` и `let timer = null`.
2. В `onMounted`: стартуй `setInterval` (инкремент `seconds` каждую секунду) и **верни cleanup** (`clearInterval`).
3. `onUnmounted` — логируй «размонтирован».
4. Добавь `const showTimer = ref(true)` и `<TimerBlock v-if="showTimer" />` (inline-компонент с `onMounted`/`onUnmounted` и **своим** таймером).
5. Кнопка «Показать/скрыть» — переключает `showTimer`.
6. Запусти **Run**: убедись, что таймер `InnerBlock` **останавливается** при «скрыть» (cleanup сработал) и **стартует** при «показать».
