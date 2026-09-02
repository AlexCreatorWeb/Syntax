## Цель

После урока студент сможет: отправлять события «вверх» от дочернего компонента через `defineEmits`/`emit`, слушать их в родителе через `v-on` (или сокращение `@`), передавать данные в событии, понимать связь с `v-model` (урок 12) и отличать emit от изменения prop.

## Теория

### Зачем emit

Props текут **вниз** (parent → child). Но дочернему компоненту иногда нужно **сообщить** родителю о чём-то («кнопку нажали», «значение изменилось», «элемент удалили»). Для этого есть **события** (`emits`):

- дочерний компонент **вызывает** `emit("событие", данные)`;
- родитель **слушает** через `@событие="обработчик"` (или `v-on:событие`).

Это **однонаправленный поток вверх**: дочерний **не меняет** состояние родителя напрямую, а **просит** («измени, пожалуйста») — и родитель сам решает, как отреагировать.

### Объявление emit

В `<script setup>`:

```js
const emit = defineEmits(["save", "remove", "update:modelValue"]);
```

(Можно и в объектной форме с валидацией аргументов, но для начала — список строк.)

Вызов:

```js
emit("save", { id: 1, title: "…" });   // с данными
emit("remove");                         // без данных
```

### Слушание в родителе

```html
<TodoItem :todo="todo" @save="onSave" @remove="onRemove" />
```

Обработчик получает данные из `emit`:

```js
function onSave(payload) { /* payload — то, что передал emit */ }
function onRemove() { /* … */ }
```

### Связь с v-model

`v-model` на компоненте (урок 12) — это **синтаксический сахар** над `:modelValue` + `@update:modelValue`. То есть «компонентный v-model» — это **emit** `update:modelValue`. Понимание emit раскрывает механику `v-model`.

TIP: имена событий — в **кебаб-кейсе** (`@update:model-value`), а `emit` — так, как ты объявил. Vue нормализует. Для `v-model` — всегда `update:modelValue`.

NOTE: в раннере Syntax emit работает так же, как в Vite. Проверь: нажал кнопку в дочернем — и родитель отреагировал (состояние/текст изменился).

## Пример

`TodoItem` (дочерний) + `App.vue` (родитель):

```vue
<script setup>
import { ref } from "vue";

const TodoItem = {
  props: { todo: Object },
  emits: ["toggle", "remove"],
  setup(props, { emit }) {
    function toggle() { emit("toggle", props.todo.id); }
    function remove() { emit("remove", props.todo.id); }
    return { toggle, remove };
  },
  template: `
    <li class="todo" :class="{ done: todo.done }">
      <label>
        <input type="checkbox" :checked="todo.done" @change="toggle" />
        {{ todo.text }}
      </label>
      <button @click="remove">Удалить</button>
    </li>
  `,
};

const todos = ref([
  { id: 1, text: "Выучить props", done: true },
  { id: 2, text: "Выучить emit", done: false },
]);

function toggle(id) {
  const t = todos.value.find(t => t.id === id);
  if (t) t.done = !t.done;
}
function remove(id) {
  todos.value = todos.value.filter(t => t.id !== id);
}
</script>

<template>
  <div class="demo">
    <ul>
      <TodoItem v-for="t in todos" :key="t.id" :todo="t" @toggle="toggle" @remove="remove" />
    </ul>
  </div>
</template>
```

Что происходит:

- `TodoItem` **не меняет** `todos` напрямую — он **эмитит** `toggle`/`remove` с `id`;
- родитель (`App.vue`) **слушает** `@toggle`/`@remove` и **сам** меняет `todos`;
- состояние (`todos`) живёт **в родителе** — однонаправленный поток соблюдён.

## Частые ошибки

WARN: дочерний компонент **меняет prop** (например, `props.todo.done = !props.todo.done`). Для **объектов** это «работает» (меняет вложенное свойство), но **нарушает** однонаправленный поток и сбивает с толку. Правильно — **emit** + родитель меняет.

WARN: забыл **объявить** событие в `defineEmits` — Vue предупредит («Component emitted event X but it is currently declared…»), и событие не «дотянется» корректно (особенно с `v-model`).

WARN: путаешь **имя** события в `emit` и в `@`. `emit("toggle")` ↔ `@toggle="…"`. Не `@Toggle` (регистр не важен, но держи один стиль).

WARN: ожидаешь, что `emit` **возвращает** что-то. Нет: `emit` — **односторонняя** передача (дочерний → родитель). Родитель не «отвечает» через `emit`.

## Практическое задание

В `App.vue` сделай «Список гостей»:

1. Inline-компонент `GuestRow`:
   - `props: { guest: Object }`;
   - `emits: ["promote", "leave"]`;
   - кнопка «Вверх» → `emit("promote", guest.id)`, кнопка «Ушёл» → `emit("leave", guest.id)`.
2. В `App.vue`: `const guests = ref([{ id, name, level }, …])` (3 гостя, `level` — число).
3. Обработчики:
   - `promote(id)` — `level++` (найти гостя по `id`);
   - `leave(id)` — удалить гостя (фильтр).
4. Рендер `v-for` → `<GuestRow :guest="g" @promote="promote" @leave="leave" :key="g.id" />`.
5. Отображай `level` рядом с именем.
6. Запусти **Run**: «Вверх» увеличивает `level`, «Ушёл» удаляет строку. Убедись, что состояние — в родителе.
