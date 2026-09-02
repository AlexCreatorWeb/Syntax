## Цель

После урока студент сможет: реагировать на изменения данных через `watch` (на конкретное значение) и `watchEffect` (на весь граф зависимостей), понимать разницу между ними, использовать опции `immediate` и `deep`, и знать, когда нужен `watch`, а когда достаточно `computed`.

## Теория

### Зачем watch

`computed` вычисляет **значение**, а `watch` запускает **действие** при изменении данных. Типичные сценарии для `watch`:

- отправить запрос, когда изменился поисковый ввод (debounce-поиск);
- сохранить данные, когда форма стала валидной;
- обновить что-то «внешнее» (таймер, анимация, сторонняя библиотека).

Правило: **если результат можно считать — используй `computed`; если нужно сделать действие — `watch`.**

### watchEffect: «просто сработай»

`watchEffect(fn)` выполняет `fn` **сразу** и каждый раз, когда изменится **любая** реактивная переменная, которую `fn` **прочитал**. Зависимости отслеживаются автоматически (как в шаблоне):

```js
watchEffect(() => {
  // читает count и name — подписывается на обе
  console.log("Счётчик:", count.value, "Имя:", name.value);
});
```

Плюс: не нужно указывать зависимости. Минус: **неизвестно**, что именно изменилось (нет «старого» и «нового» значений), и эффект сработает при любом изменении прочитанных данных.

### watch: контроль

`watch(source, callback, options)` — явное указание, на что смотреть:

- `source` — `ref`, `reactive`-объект, **геттер-функция** `() => obj.prop` или **массив** источников;
- `callback(newValue, oldValue)` — получает новое и старое значение;
- `options`: `immediate: true` (вызвать сразу, не дожидаясь первого изменения), `deep: true` (глубинное отслеживание объекта/массива).

Примеры:

```js
watch(count, (newVal, oldVal) => { console.log(oldVal, "→", newVal); });
watch(() => form.email, (newVal) => { /* валидация */ });
watch([name, age], ([n, a]) => { /* обе изменились */ });
```

Для **reactive-объекта** без `deep` сработает только при **замене** поля объекта (не при изменении вложенного). Для **геттера** `() => obj.prop` — сработает при изменении `prop`.

### immediate и deep

- `immediate: true` — callback вызовется **сразу** при регистрации (с `oldValue === undefined`). Полезно, если нужно «обработать начальное значение».
- `deep: true` — Vue рекурсивно отслеживает объект/массив (включая вложенные свойства). Без `deep` на reactive-объекте — только замена ссылок.

TIP: чаще всего достаточно `watch(() => someRef.value, cb)` или `watch(someRef, cb)`. `deep` — только если нужен «глубинный» триггер (изменение вложенного свойства).

NOTE: в раннере Syntax `watch`/`watchEffect` работают так же, как в Vite. Если действие пишет в `console.log`, увидишь его в консоли.

## Пример

```vue
<script setup>
import { ref, reactive, watch, watchEffect } from "vue";

const count = ref(0);
const search = ref("");
const form = reactive({ email: "", age: 18 });

// watchEffect: автоматически отслеживает прочитанное
watchEffect(() => {
  console.log("[effect] count =", count.value, "search =", search.value);
});

// watch на ref
watch(count, (newVal, oldVal) => {
  console.log("[watch] count:", oldVal, "→", newVal);
});

// watch на геттер (конкретное свойство)
watch(() => form.email, (newVal) => {
  console.log("[watch] email изменился на:", newVal);
});

// watch с immediate
watch(search, (newVal) => {
  console.log("[search]", newVal || "(пусто)");
}, { immediate: true });
</script>

<template>
  <div class="demo">
    <button @click="count++">count +1</button>
    <input v-model="search" placeholder="Поиск (watch immediate)" />
    <input v-model="form.email" placeholder="Email (watch на геттер)" />
  </div>
</template>
```

Что увидишь в консоли:

- при `count++` — и `[effect]`, и `[watch] count` (оба отслеживают);
- при вводе в поиск — `[search]` (и сразу при старте, из-за `immediate`);
- при вводе email — только `[watch] email изменился`.

## Частые ошибки

WARN: используешь `watchEffect` там, где нужен `watch` с `immediate` — и «не знаешь», почему эффект сработал. `watchEffect` — когда не важно, что именно изменилось. Для «обработать начальное значение» — `watch(…, { immediate: true })`.

WARN: `watch(reactiveObj, cb)` без `deep` — не сработает при изменении вложенного `obj.nested.prop`. Или добавь `deep: true`, или следи за геттером `() => obj.nested.prop`.

WARN: путаешь `computed` и `watch`. Если тебе нужно **значение** (показать в шаблоне) — `computed`. Если **действие** (запрос, лог) — `watch`. `computed` с побочным эффектом — антипаттерн.

WARN: `watch(() => form, cb)` — геттер возвращает **тот же объект** (ссылка не меняется), callback не сработает. Нужно `() => form.someProp` или `watch(form, cb, { deep: true })`.

## Практическое задание

В `App.vue` сделай «Живой поиск»:

1. `const query = ref("")` и `const fruits = ref(["яблоко", "груша", "апельсин", "банан", "мандарин"])`.
2. `computed` `filtered` — элементы, содержащие `query` (регистр не важен).
3. `watch(query, cb)` — в `cb` логируй «Ищем: {query}, найдено: {N}» (N — длина `filtered`).
4. `watchEffect` — логируй «Поиск активен: {query.length > 0}».
5. `watch(query, cb, { immediate: true })` — логируй начальное состояние.
6. Выведи список `filtered` через `v-for`.
7. Запусти **Run**, вводи разные запросы, сверяй консоль с ожиданиями.
