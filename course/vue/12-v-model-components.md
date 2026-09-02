## Цель

После урока студент сможет: понимать, как `v-model` работает **с компонентами** (под капотом — `:modelValue` + `@update:modelValue`), создавать кастомный компонент с `v-model` через `defineProps`/`defineEmits`, и отличать «встроенный» `v-model` (input) от «компонентного».

## Теория

### v-model с компонентами

Для **встроенных** элементов (`input`, `select`) `v-model` — это `:value` + `@input`. Для **компонентов** Vue 3 использует другую пару:

- **prop** `modelValue` — текущее значение (снаружи → внутрь);
- **событие** `update:modelValue` — компонент сообщает «значение изменилось» (внутри → наружу).

То есть `v-model="myVal"` на компоненте `<MyComp>` **раскрывается** до:

```html
<MyComp :modelValue="myVal" @update:modelValue="myVal = $event" />
```

Это **то же самое** «двустороннее» поведение, но через **prop + emit**, а не `value`/`input`.

### Как создать кастомный компонент с v-model

В компоненте:

1. Объяви **prop** `modelValue` (через `defineProps`).
2. Объяви **emits** `update:modelValue` (через `defineEmits`).
3. Когда значение меняется — **вызови** `emit("update:modelValue", newValue)`.

```vue
<script setup>
const props = defineProps({ modelValue: String });
const emit = defineEmits(["update:modelValue"]);

function onInput(e) {
  emit("update:modelValue", e.target.value);
}
</script>

<template>
  <input :value="modelValue" @input="onInput" />
</template>
```

Использование:

```html
<MyInput v-model="text" />
<!-- = <MyInput :modelValue="text" @update:modelValue="text = $event" /> -->
```

### Почему так

Это **однонаправленный поток данных**: состояние живёт **снаружи** (в родителе), компонент только **показывает** его и **сообщает** об изменениях. Компонент не «владеет» значением — он **отражает** `modelValue` и **эмитит** изменения. Это делает компонент **переиспользуемым** и **предсказуемым** (состояние в одном месте).

### Несколько v-model

Vue 3 позволяет **несколько** `v-model` на одном компоненте через **именованные**:

- `v-model:title="title"` → prop `title` + событие `update:title`;
- `v-model:content="content"` → prop `content` + `update:content`.

Компонент объявляет `defineProps({ title: String, content: String })` и `defineEmits(["update:title", "update:content"])`.

TIP: кастомный «ввод с кнопкой» (например, «поле + чипы», «автоварианты», «слайдер с подписью») — всегда делай через `modelValue`/`update:modelValue`. Тогда он заменяет обычный `input` в любом месте.

NOTE: в раннере Syntax `v-model` на компонентах работает так же, как в Vite. Проверь: значение, введённое в кастомный компонент, обновляет состояние родителя (видно в `{{ }}`).

## Пример

Кастомный компонент-обёртка над `input` с подсказкой и кнопкой-очисткой:

```vue
<!-- ScriptText.vue -->
<script setup>
const props = defineProps({ modelValue: { type: String, default: "" } });
const emit = defineEmits(["update:modelValue"]);

function onInput(e) {
  emit("update:modelValue", e.target.value);
}
function clear() {
  emit("update:modelValue", "");
}
</script>

<template>
  <div class="field">
    <input :value="modelValue" @input="onInput" placeholder="Напечатай…" />
    <button type="button" @click="clear">Очистить</button>
  </div>
</template>
```

Использование в `App.vue`:

```vue
<script setup>
import { ref } from "vue";
import ScriptText from "./ScriptText.vue";

const text = ref("");
</script>

<template>
  <div class="demo">
    <ScriptText v-model="text" />
    <p>Родитель видит: «{{ text }}» (длина: {{ text.length }})</p>
  </div>
</template>
```

Что происходит:

- `v-model="text"` → `:modelValue="text"` + `@update:modelValue="text = $event"`;
- ввод в `input` внутри `ScriptText` → `emit("update:modelValue", …)` → `text` в родителе обновляется;
- кнопка «Очистить» → `emit("update:modelValue", "")` → `text` сбрасывается;
- `{{ text }}` в родителе **живое** — состояние в одном месте.

## Частые ошибки

WARN: путаешь «встроенный» `v-model` (input — `:value`/`@input`) и «компонентный» (`:modelValue`/`@update:modelValue`). Для **компонента** — `modelValue`, а не `value`.

WARN: в компоненте **меняешь** `modelValue` напрямую (`modelValue = "…"`) — это **prop**, менять его изнутри нельзя (предупреждение Vue). Всегда **`emit`**.

WARN: забыл **объявить** `modelValue` в `defineProps` или `update:modelValue` в `defineEmits` — тогда `v-model` не сработает (значение не обновится).

WARN: ожидаешь, что компонент «помнит» значение сам. Нет: состояние — **в родителе** (в `text`), компонент только отображает `modelValue`. При пересоздании компонента значение «прилетит» из родителя.

## Практическое задание

В `App.vue` сделай «Кастомный инпут-счётчик»:

1. Создай компонент `CounterInput.vue`:
   - `defineProps({ modelValue: { type: Number, default: 0 } })`;
   - `defineEmits(["update:modelValue"])`;
   - отображение значения и кнопки «−1», «+1», «Сброс».
2. При клике на кнопки — `emit("update:modelValue", newValue)`.
3. В `App.vue`: `const count = ref(0)` и `<CounterInput v-model="count" />`.
4. Под ним — `{{ count }}` и `:style="{ width: count * 10 + '%' }"` (полоска).
5. Запусти **Run**: убедись, что кнопки меняют `count` в родителе, и полоска растёт.
6. (Бонус) Добавь `v-model:label="label"` — второй именованный `v-model` для текстовой подписи компонента.
