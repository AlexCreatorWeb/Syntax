## Цель

После урока студент сможет: отличать `ref` от `reactive`, создавать реактивные объекты, вычислять производные данные через `computed` (только чтение и двухсторонние), понимать, чем `computed` отличается от вычисления в шаблоне или в функции, и выбирать между `ref` и `reactive`.

## Теория

### reactive: реактивный объект

`reactive(obj)` возвращает **Proxy** над объектом — он сам по себе «реактивный», без обёртки `.value`:

- `const state = reactive({ count: 0, name: "Анна" })`;
- в JS — `state.count = 5` (без `.value`);
- в шаблоне — `{{ state.count }}`;
- глубинно реактивен: вложенные объекты и массивы тоже отслеживаются.

Ключевое отличие от `ref`: **нет обёртки**. Но это и слабость: `reactive` — только объект (примитив не обёрнешь), и при **замене** объекта целиком (`state = { … }`) реактивность теряется (привязка — к конкретному объекту, а не к переменной). Поэтому для «меняемых целиком» значений `ref` надёжнее.

### computed: производные данные

`computed(fn)` создаёт **реактивное вычисляемое** значение. Оно:

- **читает** реактивные зависимости внутри `fn` (подписывается на них);
- **кэширует** результат — пересчитывает только когда изменилась одна из зависимостей;
- по умолчанию **только для чтения** (`.value` — readonly).

Почему это важно:

1. **Производительность** — сложное выражение (`list.filter(…).sort(…).map(…)`) пересчитывается только при изменении `list`, а не при каждом рендере.
2. **Читаемость** — `{{ filteredCount }}` вместо `{{ items.filter(i => i.done).length }}`.
3. **Корректность** — одно вычисление в одном месте, а не в трёх местах шаблона.

### computed vs функция vs шаблон

- **Шаблон** `{{ items.filter(…).length }}` — пересчитывается при каждом рендере.
- **Функция** `countDone()` — тоже при каждом вызове в шаблоне, без кэша.
- **computed** `const done = computed(() => items.filter(…).length)` — кэш, пересчёт по зависимостям.

Для простых выражений разница незаметна; для тяжёлых (сортировка, группировка, поиск по большому массиву) — `computed` обязателен.

### Двухсторонний computed

Если нужен setter, передай объект: `computed({ get: () => a.value + b.value, set: (v) => { … } })` — тогда `total.value = 10` вызовет `set`. Редко, но бывает (например, «общая сумма», редактируемая пользователем).

TIP: правило выбора: **примитив → ref; объект, который меняем полями → reactive или ref; производное значение → computed.** Не дублируй данные: если значение вычисляется — не храни его отдельно.

NOTE: в раннере Syntax `computed` работает так же, как в Vite. Проверь: измени исходные — и вычисленное значение обновится.

## Пример

```vue
<script setup>
import { ref, reactive, computed } from "vue";

// reactive: объект, меняем поля
const form = reactive({ first: "Анна", last: "Смирнова", age: 28 });

// ref: массив
const items = ref([
  { title: "Выучить ref", done: true },
  { title: "Выучить reactive", done: true },
  { title: "Выучить computed", done: false },
]);

// computed: производные
const fullName = computed(() => `${form.first} ${form.last}`);
const isAdult = computed(() => form.age >= 18);
const doneCount = computed(() => items.value.filter(i => i.done).length);
const progress = computed(() => Math.round((doneCount.value / items.value.length) * 100));
const remaining = computed(() => items.value.filter(i => !i.done));

function toggle(item) { item.done = !item.done; }
</script>

<template>
  <div class="demo">
    <h3>reactive + computed</h3>
    <p>ФИО: <strong>{{ fullName }}</strong>, возраст: {{ form.age }}, совершеннолетний: {{ isAdult ? "да" : "нет" }}</p>

    <h3>computed по массиву</h3>
    <p>Выполнено: {{ doneCount }} из {{ items.length }} ({{ progress }}%)</p>
    <ul>
      <li v-for="item in items" :key="item.title">
        <label>
          <input type="checkbox" :checked="item.done" @change="toggle(item)" />
          {{ item.title }}
        </label>
      </li>
    </ul>
    <p v-if="remaining.length">Осталось: {{ remaining.map(i => i.title).join(", ") }}</p>
  </div>
</template>
```

Что проверить:

- `fullName` — при изменении `form.first`/`form.last` обновится;
- `doneCount`/`progress`/`remaining` — при клике на чекбокс пересчитаются;
- `isAdult` — при изменении `form.age`.

## Частые ошибки

WARN: путаешь `ref` и `reactive` — пишешь `const count = reactive(0)` (не сработает, `reactive` ждёт объект) или `const state = ref({ … })` и потом `state.count = 5` (без `.value`). Помни: `ref` — с `.value`, `reactive` — без.

WARN: используешь `computed` для действия (с побочным эффектом). `computed` — только **чистое вычисление**. Если нужно «сделать что-то при изменении» — это `watch` (урок 07).

WARN: дублируешь данные: хранишь `fullName` как отдельную переменную и «обновляешь» её вручную. Пусть `computed` считает — меньше ошибок.

WARN: забываешь, что `computed` кэширует: если внутри `fn` ты читаешь **нереактивную** переменную (не `ref`/`reactive`), значение не обновится.

## Практическое задание

В `App.vue` сделай «Корзину покупок»:

1. `const cart = reactive({ items: [{ name: "Курс", price: 1000, qty: 1 }], discount: 0.1 })`.
2. `computed` `total` — сумма `price * qty` по всем элементам.
3. `computed` `discounted` — `total * (1 - discount)`, округлено.
4. Кнопка «Добавить элемент» (пушит `{ name: "…", price: 500, qty: 1 }`).
5. Слайдер/инпут на `discount` (0..0.5) через `v-model` (или `@input` + `$event`).
6. Выведи: «Итого: {total}, со скидкой: {discounted}».
7. Запусти **Run** и проверь, что `total` и `discounted` пересчитываются.
