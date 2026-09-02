## Цель

После урока студент сможет: связывать формы с состоянием через `v-model`, использовать его на `input` (текст, number, range), `textarea`, `checkbox` (один и массив), `radio` и `select`, применять модификаторы `.trim`, `.number`, `.lazy` и понимать, что `v-model` — это синтаксический сахар над `:value` + `@input`.

## Теория

### Что делает v-model

`v-model` — **двусторонняя связь** между значением элемента и переменной. Вместо ручного `:value="x"` + `@input="x = $event.target.value"` ты пишешь `v-model="x"`:

- элемент **читает** `x` как значение;
- при вводе **пишет** обратно в `x`.

Под капотом для `<input type="text">` это эквивалентно:

```html
<input :value="x" @input="x = $event.target.value" />
```

Для разных типов элементов поведение отличается (см. ниже).

### Типы элементов

- **text / textarea**: `v-model="text"` — строка.
- **checkbox (один)**: `v-model="isChecked"` — булево (`true`/`false`).
- **checkbox (массив)**: `v-model="selected"` где `selected` — **массив**, а `value` чекбокса — элемент; при галочке элемент **добавляется/удаляется** из массива.
- **radio**: `v-model="chosen"` + `value="вариант"` у каждой кнопки; `chosen` становится значением выбранной.
- **select**: `v-model="picked"` + `<option value="…">`; `picked` — значение выбранного option. Для **мультивыбора** (`multiple`) — массив.
- **range**: `v-model="n"` + `type="range"` — число (строка — с `.number` модификатором).

### Модификаторы

- `.trim` — убрать пробелы по краям (для текста).
- `.number` — привести к числу (`parseFloat`); для `type="number"`/`range`.
- `.lazy` — обновлять **по `change`** (потеря фокуса), а не по каждому `input`. Полезно для дорогих операций.

Примеры: `v-model.trim="name"`, `v-model.number="age"`, `v-model.lazy="query"`.

### number и «пустое» поле

`type="number"` с `v-model` может дать **`null`** (если поле пустое) — Vue приводит. В `computed`/логике обрабатывай `null`/`""`.

TIP: для форм с **многом** полями — собери объект `reactive({ … })` и привязывай `v-model="form.field"`. Для «массив выбранных» (теги, роли) — `v-model="selectedArray"` на группах чекбоксов.

NOTE: в раннере Syntax `v-model` работает так же, как в Vite. Проверь: ввод в поле мгновенно меняет состояние (видно в `{{ }}` рядом).

## Пример

```vue
<script setup>
import { ref, reactive } from "vue";

// text + trim
const name = ref("");
// number + number
const age = ref(0);
// checkbox один
const subscribe = ref(false);
// checkbox массив
const interests = ref([]);
const allInterests = ["vue", "react", "node"];
// radio
const plan = ref("free");
// select
const color = ref("blue");
// range
const volume = ref(50);
</script>

<template>
  <div class="demo">
    <h3>Текст</h3>
    <input v-model.trim="name" placeholder="Имя (trim)" />
    <p>Имя: «{{ name }}» (длина: {{ name.length }})</p>

    <h3>Число</h3>
    <input type="number" v-model.number="age" placeholder="Возраст" />
    <p>Возраст: {{ age }} (тип: {{ typeof age }})</p>

    <h3>Чекбокс (один)</h3>
    <label><input type="checkbox" v-model="subscribe" /> Подписаться</label>
    <p>Подписка: {{ subscribe }}</p>

    <h3>Чекбоксы (массив)</h3>
    <label v-for="it in allInterests" :key="it">
      <input type="checkbox" :value="it" v-model="interests" /> {{ it }}
    </label>
    <p>Выбрано: {{ interests.join(", ") || "ничего" }}</p>

    <h3>Radio</h3>
    <label><input type="radio" value="free" v-model="plan" /> Free</label>
    <label><input type="radio" value="pro" v-model="plan" /> Pro</label>
    <p>Тариф: {{ plan }}</p>

    <h3>Select</h3>
    <select v-model="color">
      <option value="red">Красный</option>
      <option value="blue">Синий</option>
      <option value="green">Зелёный</option>
    </select>
    <p :style="{ color }">Цвет: {{ color }}</p>

    <h3>Range</h3>
    <input type="range" v-model.number="volume" />
    <p>Громкость: {{ volume }}%</p>
  </div>
</template>
```

Что проверить:

- `v-model.trim` — пробелы по краям не учитываются в длине;
- `v-model.number` — `typeof age` — `number`, а не `string`;
- чекбоксы-массив — `interests` — массив выбранных;
- radio — `plan` — значение выбранного;
- select — `color` — значение option;
- range — `volume` — число от 0 до 100.

## Частые ошибки

WARN: `v-model` на `checkbox` без `value` (в режиме «массив»). Тогда в массив добавляется **`true`**, а не нужный элемент. Для «массива выбранных» — обязательно `:value="элемент"`.

WARN: ждёшь `number` от `type="number"` без `.number`. Без модификатора значение — **строка** (`"25"`). Добавь `.number`.

WARN: `v-model` на `select` без `value` на `<option>`. Тогда `v-model` возьмёт **текст** option, а не значение. Дай `<option value="…">`.

WARN: `v-model.lazy` — обновление по `change`, а не по `input`. Если ждёшь «живое» обновление при вводе — убери `.lazy`.

## Практическое задание

В `App.vue` сделай «Анкету»:

1. `reactive` объект `profile = { name: "", age: 0, hobbies: [], city: "", notify: false }`.
2. Поле имени с `v-model.trim`.
3. Поле возраста `type="number"` + `.number`.
4. Группа чекбоксов «Хобби» (3 варианта) с `v-model="profile.hobbies"` (массив) и `:value`.
5. `select` «Город» (3 города) с `v-model="profile.city"`.
6. Чекбокс «Уведомления» с `v-model="profile.notify"`.
7. Выведи «резюме»: имя, возраст, хобби (join), город, уведомления — и обновляй в реальном времени.
8. Запусти **Run** и заполни анкету — проверь, что всё синхронизировано.
