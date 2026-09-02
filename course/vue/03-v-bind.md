## Цель

После урока студент сможет: связывать атрибуты DOM с данными через `v-bind` (и её сокращение `:`), динамически вычислять `class` (массив, объект, тернарник) и `style` (объект, строка), и использовать `v-bind` с событиями-виртуальными атрибутами вроде `href`.

## Теория

### Связывание атрибутов

Обычный HTML-атрибут — это статичная строка. `v-bind:атрибут="выражение"` заменяет значение атрибута **реактивным значением**:

- `v-bind="..."` можно сокращать до `:": ..."` — `:src="logoUrl"`;
- значение может быть переменной, выражением, вызовом функции;
- работает с любыми атрибутами: `src`, `href`, `disabled`, `placeholder`, `data-*`.

Если привязать значение `null` или `undefined` — атрибут **удалится** из DOM. Это удобно для условных атрибутов (например, `aria-label` только при определённом состоянии).

### Динамические class

`class` — самый частый сценарий `v-bind`. Три способа задать значение:

1. **Объект**: `:class="{ active: isActive, 'text-red': danger }"` — классы из ключей добавляются, когда значение истинное.
2. **Массив**: `:class="[baseClass, isActive ? 'is-active' : 'is-dim']"` — классы, для которых значение truthy (строки и вложенные объекты).
3. **Тернарник/строка**: `:class="count > 5 ? 'many' : 'few'"`.

Vue **объединяет** статичный `class="base"` с динамическим `:class` — оба применяются.

### Динамические style

`style` принимается объектом (рекомендуется) или строкой:

- объект: `:style="{ color: activeColor, 'font-size': size + 'px' }"` — camelCase-свойства или kebab-case в кавычках;
- строка: `:style="'color: ' + activeColor"` — хуже читаемостью, но допустимо;
- несколько объектов в массиве — последовательное слияние.

TIP: для темизинга (вариантов цвета) держи объект маппинга `colorMap = { ok: "#2e7d32", warn: "#e65100" }` и привязывай `:style="{ color: colorMap[status] }"`.

### :href и события

`v-bind` не только для визуальных атрибутов: `:href="url"` — динамические ссылки (полезно для навигации), `:src` — картинки, `:disabled="loading"` — состояние кнопок. Всё это делает интерфейс «живым»: данные → атрибуты → поведение.

NOTE: в раннере Syntax `:class` и `:style` работают ровно как в браузере — проверь результат глазами в превью.

## Пример

```vue
<script setup>
import { ref } from "vue";

const count = ref(3);
const loading = ref(false);
const status = ref("ok"); // ok | warn | error
const base = "btn";

const colors = { ok: "#2e7d32", warn: "#e65100", error: "#c62828" };
const size = ref(16);

function inc() { count.value++; }
</script>

<template>
  <div class="demo">
    <!-- :href — динамический атрибут -->
    <a :href="'/user/' + count" target="_blank" rel="noopener">Ссылка на /user/{{ count }}</a>

    <!-- class: объект -->
    <p :class="{ visible: count > 0, 'big-text': count > 10 }">
      Счётчик: {{ count }}
    </p>

    <!-- class: массив + тернарник -->
    <button class="btn" :class="[base, count > 5 ? 'btn--many' : 'btn--few']" @click="inc">
      +1 (сейчас: {{ count }})
    </button>

    <!-- style: объект, цвет из маппинга -->
    <p :style="{ color: colors[status], 'font-size': size + 'px' }">
      Статус: {{ status }}
    </p>

    <!-- :disabled -->
    <button :disabled="loading" @click="loading = true">
      {{ loading ? "Загружаем…" : "Запустить" }}
    </button>
  </div>
</template>
```

Обрати внимание:

- `:class="{ visible: count > 0 }"` — класс `visible` появляется/исчезает автоматически;
- `:class="[base, …]"` — статичный `class="btn"` + динамический массив;
- `:style="{ 'font-size': size + 'px' }"` — kebab-свойство в кавычках;
- `:disabled="loading"` — кнопка реально становится некликабельной.

## Частые ошибки

WARN: пишешь `v-bind:href="/user/" + count` — всё, что после `=`, уже **выражение в JavaScript**, и кавычки нужны вокруг строки: `:href="'/user/' + count"`. Частая ошибка — забыть кавычки вокруг константной части.

WARN: `:class="{ active }"` работает, но `{ active: someVar }` — ясная форма. Когда ключ и переменная совпадают по имени, сокращение допустимо; когда нет — обязательно `ключ: значение`.

WARN: camelCase vs kebab-case в `:style`. `fontSize` без кавычек и `"font-size"` с кавычками — оба работают, но смешивать в одном объекте не стоит. Для CSS-переменных (`--my-var`) — только строка с кавычками: `:style="{ '--my-var': value }"`.

## Практическое задание

В `App.vue` сделай:

1. Объяви `const progress = ref(35)` и функцию `step()` (меняет прогресс на +10, максимум 100).
2. Выведи полоску: `<div class="bar"><div class="bar__fill" :style="{ width: progress + '%' }"></div></div>` + стили.
3. Добавь `:class`-объект: `danger` при `progress > 80`, `warn` при `progress > 50`, `ok` иначе (используй тернарник внутри объекта).
4. Сделай кнопку «Сброс», у которой `:disabled="progress === 0"`.
5. Выведи `<a :href="'https://vuejs.org/guide/#' + progress">` — ссылка меняется при клике на кнопку.
6. Запусти **Run**, побей счётчик до danger и проверь, что классы и ссылка меняются.
