## Цель

После урока студент сможет: передавать данные «вниз» через `props`, объявлять props в `<script setup>` через `defineProps` (с типами и дефолтами), использовать их в шаблоне и логике, понимать **однонаправленный** поток данных и не менять prop изнутри.

## Теория

### Что такое props

**Props** — способ передать данные от **родителя** к **дочернему** компоненту. Родитель пишет `<Child :title="myTitle" :count="n" />`, а дочерний компонент объявляет эти props и использует их.

Это **однонаправленный поток**: данные текут **вниз** (parent → child). Дочерний компонент **читает** props, но **не должен** их менять (если нужно «изменить» — родитель делает это, или дочерний **эмитит** событие — урок 15).

### Объявление в <script setup>

Через `defineProps`. Два стиля:

1. **Аббревиатура** (только имена, без типов/дефолтов):
   ```js
   const props = defineProps(["title", "count"]);
   ```
2. **Полный** (с типами и дефолтами):
   ```js
   const props = defineProps({
     title: { type: String, required: true },
     count: { type: Number, default: 0 },
     items: { type: Array, default: () => [] },
   });
   ```

После этого `props.title`, `props.count` доступны в логике, а `title`/`count` — в шаблоне.

### Использование

В шаблоне дочернего компонента — как обычные переменные:

```html
<h3>{{ title }}</h3>
<p>Счётчик: {{ count }}</p>
```

В логике — через `props`:

```js
const doubled = computed(() => props.count * 2);
```

### Дефолты и required

- `default` — значение, если родитель **не передал** prop;
- `required: true` — предупреждение, если prop **отсутствует**;
- для **объектов/массивов** `default` — **функция** (чтобы не было «общего» объекта): `default: () => []`.

### Наименование: kebab-case

В шаблоне родителя props передаются в **kebab-case**: `<MyComp :some-prop="…" />`, а в `defineProps` — **camelCase** (`someProp`). Vue сам конвертирует.

TIP: держи props **минимальными** (только то, что реально нужно). Если данных «много» и они «общие» — это повод для **provide/inject** (урок 18) или **Pinia** (урок 21).

NOTE: в раннере Syntax props работают так же, как в Vite. Проверь: измени значение в родителе — и дочерний компонент обновится.

## Пример

`Rating` (дочерний) + использование в `App.vue`:

```vue
<script setup>
import { ref, computed } from "vue";

const Rating = {
  props: {
    value: { type: Number, required: true },
    max: { type: Number, default: 5 },
  },
  setup(props) {
    const active = ref(props.value);
    const label = computed(() => (active.value >= 4 ? "Отлично" : active.value >= 3 ? "Норм" : "Слабо"));
    function set(n) { active.value = n; }
    return { active, label, set };
  },
  template: `
    <div class="rating">
      <span v-for="n in max" :key="n" class="star" :class="{ on: n <= active }" @click="set(n)">★</span>
      <em>{{ label }}</em>
    </div>
  `,
};

const products = [
  { name: "Курс Vue", rating: 5 },
  { name: "Курс CSS", rating: 3 },
];
</script>

<template>
  <div class="demo">
    <section v-for="p in products" :key="p.name">
      <h4>{{ p.name }}</h4>
      <Rating :value="p.rating" :max="5" />
    </section>
  </div>
</template>
```

Что проверяется:

- `:value="p.rating"` — родитель передаёт рейтинг;
- `:max="5"` — дефолт тоже можно переопределить;
- `props.value`/`props.max` — дочерний читает;
- `active` — **состояние внутри** дочернего (не prop), может отличаться от `value` после клика.

## Частые ошибки

WARN: **меняешь** prop изнутри дочернего (`props.count = 5` или `count++` в шаблоне). Props — **read-only**. Vue предупредит. Для «изменения» — эмит (урок 15) или локальная копия.

WARN: `default` для объекта/массива — **не функция** (`default: []`). Тогда **все** экземпляры получат **один и тот же** массив. Используй `default: () => []`.

WARN: передаёшь prop **без `:`** (кавычки вокруг значения). `<Child title="Привет" />` — это **строка** «Привет». Для **переменной** — `:title="myVar"`.

WARN: **kebab vs camel** — `<MyComp some-prop="…" />` в шаблоне, а в `defineProps` — `someProp`. Не путай: в шаблоне родителя — kebab, в объявлении — camel.

## Практическое задание

В `App.vue` сделай «Профиль пользователя»:

1. Inline-компонент `ProfileCard`:
   - `defineProps`: `name` (String, required), `role` (String, default «student»), `skills` (Array, default `() => []`), `active` (Boolean, default false);
   - шаблон: аватар (инициалы), имя, роль, список `skills` (v-for), бейдж «Активен» если `active`.
2. В `App.vue`: `const users = [{ name, role, skills, active }, …]` (3 пользователя, у одного `active: true`).
3. Рендер `v-for` → `<ProfileCard :name="u.name" :role="u.role" :skills="u.skills" :active="u.active" :key="u.name" />`.
4. Проверь **дефолты**: у одного пользователя убери `role` и `skills` — компонент покажет дефолты.
5. Запусти **Run** и убедись, что props корректно передаются.
