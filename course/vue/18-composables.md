# Урок 18. Композабли: переиспользование логики, provide/inject

## Цель

После урока студент сможет: выносить переиспользуемую логику в **композабл** (функцию `use…`), понимать, что композабл — это «логика + состояние» без привязки к компоненту, передавать данные «вглубь» через **provide/inject** (обходя «prop drilling»), и отличать provide/inject от props и Pinia.

## Теория

### Композаблы (composables)

**Композабл** — это **функция** (обычно с именем `use…`), которая возвращает **реактивную логику** (ref, computed, watch, обработчики). Она **не привязана** к конкретному компоненту — её можно вызывать в **любом** компоненте (или в другом композабле).

Зачем:

- **переиспользование** — одна и та же логика (например, «таймер», «мышь», «локальное хранилище») не дублируется;
- **ограничение размера** компонента — «вынести» сложную логику;
- **композиция** — композабл можно **комбинировать** (один вызывает другой).

Пример — `useMouse`:

```js
// useMouse.js
import { ref, onMounted, onUnmounted } from "vue";

export function useMouse() {
  const x = ref(0);
  const y = ref(0);
  function onMove(e) { x.value = e.clientX; y.value = e.clientY; }
  onMounted(() => window.addEventListener("mousemove", onMove));
  onUnmounted(() => window.removeEventListener("mousemove", onMove));
  return { x, y };
}
```

Использование в **нескольких** компонентах:

```js
const { x, y } = useMouse();
```

**Важно:** хуки внутри композабла (`onMounted`) работают, потому что композабл **вызывается** **во время** `setup` компонента (то есть в «контексте» компонента).

### Provide / Inject

**Provide** (в родителе) и **inject** (в потомке) — способ передать данные **вглубь** дерева, **обходя** промежуточные компоненты (без «prop drilling» — передачи props через 5 уровней).

```js
// Родитель (или App)
provide("theme", themeRef);

// Любой потомок (на любой глубине)
const theme = inject("theme");
```

- `provide(key, value)` — «публикует» значение (обычно `ref`/`reactive`);
- `inject(key, defaultValue?)` — «подхватывает» его.

Когда использовать:

- **глобальные** для ветки данные (тема, локация, «текущий пользователь», конфигурация);
- **глубокие** вложенные компоненты, где «протащить» props через 4 уровня — мука.

Когда **не** использовать:

- для «общего состояния приложения» (CRUD-данные, корзина) — **Pinia** (урок 21) даёт **типизацию**, **отладку** и **структуру**.

TIP: ключи provide/inject — **строки** (или символы). Держи их **константами** (чтобы не «опечататься»).

NOTE: в раннере Syntax композаблы и provide/inject работают так же, как в Vite. В рамках одного `App.vue` можно объявить композабл как функцию и вызвать его в inline-компонентах.

## Пример

Композабл `useCounter` + provide/inject для «темы»:

```vue
<script setup>
import { ref, computed, provide, inject } from "vue";

// Композабл (в реальном проекте — отдельный файл useCounter.js)
function useCounter(start = 0) {
  const count = ref(start);
  const doubled = computed(() => count.value * 2);
  function inc() { count.value++; }
  function reset() { count.value = start; }
  return { count, doubled, inc, reset };
}

// «Глубокий» потомок, которыйinjects тему
const DeepBadge = {
  setup() {
    const theme = inject("theme", "light");
    return { theme };
  },
  template: `<span class="badge" :data-theme="theme">Тема: {{ theme }}</span>`,
};

// Родитель: provide темы + два компонента с useCounter
const theme = ref("dark");
provide("theme", theme);

const counterA = useCounter(0);
const counterB = useCounter(100);
</script>

<template>
  <div class="demo">
    <button @click="theme = theme === 'dark' ? 'light' : 'dark'">Сменить тему</button>
    <DeepBadge />

    <h4>Композабл useCounter (два независимых экземпляра)</h4>
    <p>A: {{ counterA.count }} (×2 = {{ counterA.doubled }})
      <button @click="counterA.inc">+1</button>
      <button @click="counterA.reset">Сброс</button>
    </p>
    <p>B: {{ counterB.count }} (×2 = {{ counterB.doubled }})
      <button @click="counterB.inc">+1</button>
      <button @click="counterB.reset">Сброс</button>
    </p>
  </div>
</template>
```

Что проверяется:

- `useCounter` — **одна** логика, **два** независимых экземпляра (`counterA`, `counterB`);
- `provide("theme", theme)` в родителе → `inject("theme")` в `DeepBadge` (на любой глубине);
- смена темы — **обновляет** бейдж (реактивный `ref`).

## Частые ошибки

WARN: вызываешь композабл **вне** `setup` (например, в `setTimeout`/`Promise`/модульном уровне). Тогда `onMounted` внутри **не сработает** (нет «контекста» компонента). Композабл — **во время** `setup`.

WARN: **inject без provide** (или provide **позже** inject). Тогда `inject` вернёт `undefined` (или `defaultValue`). Убедись, что `provide` вызван **выше** в дереве и **до** рендера потомка.

WARN: путаешь **provide/inject** и **props**. Props — «родитель → **непосредственный** потомок». Provide/inject — «предок → **любой** потомок». Для «на один уровень вниз» — props.

WARN: используешь provide/inject для **всего** (CRUD, корзина). Это «спасательный круг» для **глобальных-для-ветки** настроек. Для **состояния приложения** — Pinia.

## Практическое задание

В `App.vue` сделай «Тема + счётчики»:

1. Напиши композабл `useLocalStorage(key, initial)`:
   - читает `localStorage` (или `initial`), возвращает `ref`;
   - при изменении — **записывает** обратно (используй `watch`).
2. В `App.vue`: `const theme = useLocalStorage("theme", "dark")` и `provide("theme", theme.value)`.
3. Создай **глубокий** потомок `ThemeDot` (вложенный в 2-3 уровня), который `inject("theme")` и показывает кружок цвета.
4. Кнопка «Сменить тему» (переключает `theme`).
5. Проверь **персистентность**: обновить страницу — тема «помнится» (localStorage).
6. Запусти **Run** и убедись, что `inject` «видит» `provide` на глубине.
