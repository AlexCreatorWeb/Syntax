# Урок 4. v-on: события, $event, модификаторы

## Цель

После урока студент сможет: подключать обработчики событий через `v-on` (и сокращение `@`), получать объект события через `$event`, применять модификаторы (`.prevent`, `.stop`, `.self`, `.exact`), ограничивать обработчик клавиатурными и мыльными модификаторами и передавать аргументы в обработчик.

## Теория

### Обработчики событий

`v-on:событие="обработчик"` (сокращённо `@событие`) вешает listener на элемент. Значение — имя функции из `<script setup>` или инлайн-выражение:

- `@click="onSave"` — имя функции (вызовется при событии);
- `@click="count++"` — короткое инлайн-выражение;
- `@click="add(3)"` — с аргументами;
- `@click="toggle"="…"` — нет, просто `@click="toggle"`.

Имя функции в `<script setup>` доступно в шаблоне автоматически — как и переменные.

### $event

Обработчик получает **объект события** как первый аргумент: `$event` (или именованный параметр `e`). Так ты читаешь `e.target.value`, `e.key`, `e.preventDefault()` и т.д.

- `@input="onInput"` → `function onInput(e) { text.value = e.target.value; }`
- инлайн: `@keydown.enter="submit()"` — здесь `e` передаётся неявно, если вызвать функцию без аргументов.

### Модификаторы

Модификаторы — точки после имени события. Они добавляют поведение, не заставляя писать лишние `if` и `preventDefault` вручную:

- `.prevent` — `e.preventDefault()` (остановить дефолтное действие, например, сабмит формы или переход по ссылке);
- `.stop` — `e.stopPropagation()` (не пробрасывать выше);
- `.self` — сработать только если `e.target` — сам элемент, а не потомок;
- `.once` — сработать один раз;
- `.passive` — подсказка браузеру, что обработчик не вызовет `preventDefault`.

Они комбинируются: `@submit.prevent`, `@click.stop.self`.

### Клавиатура и мышь

Для `keydown`/`keyup` есть модификаторы по клавишам: `.enter`, `.tab`, `.delete`, `.esc`, `.space`, `.up`, `.down` и др. Для мыши: `.left`, `.right`, `.middle`.

Пример: `@keydown.enter="submit"` — сработает только при нажатии Enter.

TIP: для горячих клавиш в форме (`@keydown.enter.prevent="submit"`) — `.prevent` важен, чтобы Enter не убрал фокус/не отправил форму «в обход» твоего кода.

NOTE: в раннере Syntax события работают в обычном iframe-превью. Если обработчик пишет в `console.log`, ты увидишь его в консоли под редактором.

## Пример

```vue
<script setup>
import { ref } from "vue";

const text = ref("");
const clicks = ref(0);
const lastKey = ref("—");

function onInput(e) { text.value = e.target.value; }

function addBy(n) { clicks.value += n; }

function onKey(e) {
  lastKey.value = e.key;
}

function onSubmit() {
  console.log("отправляем:", text.value);
}
</script>

<template>
  <div class="demo">
    <!-- $event: читаем value -->
    <input :value="text" @input="onInput" placeholder="Печатай…" />
    <p>Введено: {{ text || "ничего" }}</p>

    <!-- инлайн-выражение и аргументы -->
    <button @click="clicks++">+1 ({{ clicks }})</button>
    <button @click="addBy(5)">+5 ({{ clicks }})</button>

    <!-- клавиатурные модификаторы -->
    <input
      :value="lastKey"
      @keydown="onKey"
      readonly
      placeholder="Посмотри, какая клавиша"
    />
    <p>Последняя клавиша: {{ lastKey }}</p>

    <!-- .prevent на форме -->
    <form @submit.prevent="onSubmit">
      <input :value="text" @input="onInput" />
      <button type="submit">Отправить (prevent)</button>
    </form>
  </div>
</template>
```

Обрати внимание:

- `@input="onInput"` + `e.target.value` — чтение значения события;
- `@click="addBy(5)"` — аргументы в обработчике;
- `@keydown="onKey"` и `e.key` — имя нажатой клавиши;
- `@submit.prevent="onSubmit"` — форма не перезагружает страницу.

## Частые ошибки

WARN: путаешь имя функции и вызов. `@click="onSave"` — корректно (Vue вызовет). `@click="onSave()"` — тоже работает, но тогда ты сам вызываешь, и `$event` не подставится, если не передашь вручную. Для простого обработчика — имя без скобок.

WARN: в инлайн-выражении пишешь `@click="count = count + 1" $event"`. Если нужен `$event`, это должен быть параметр функции, а не инлайн. Инлайн-выражениям `$event` доступен, но лучше не смешивать.

WARN: забыл `.prevent` на `<form @submit>`. Без него форма отправится и страница перезагрузится (в SPA — потерется состояние). Для любых submit — держи `.prevent` по умолчанию.

## Практическое задание

В `App.vue` сделай:

1. Объяви `const items = ref([])` и `const draft = ref("")`.
2. Поле ввода: `@input` пишет в `draft` через `$event`.
3. Кнопка «Добавить» (`@click`): пушит `draft` в `items` и очищает `draft`.
4. Форма с `@submit.prevent`: та же логика, что у кнопки (Enter в поле = добавить).
5. Счётчик «нажатий на Enter»: поле, `@keydown.enter` инкрементирует `enterCount`.
6. Кнопка «+1» и «+10» — инкремент через `addBy(n)` с аргументом.
7. Запусти **Run** и проверь: форма не перезагружает страницу, счётчики растут, список растёт.
