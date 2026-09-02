# Урок 8. Практика: форма с валидацией

## Цель

После урока студент сможет: собрать интерактивную форму с валидацией, объединив `ref`/`reactive`, `computed` (для проверки валидности), `v-if`/`:class` (для отображения ошибок) и обработчики событий. Это «контрольная» по модулю реактивности.

## Теория

### Что объединяем

Форма с валидацией — классическая задача, где пересекаются все инструменты модуля:

- **Состояние** — `reactive` (объект полей формы) или несколько `ref`.
- **Вычисляемые** — `computed` для «валидна ли форма?», «какие поля заполнены?», «ошибки по каждому полю».
- **Директивы** — `v-model` (связь input ↔ состояние), `:class` (подсветка ошибки), `v-if` (показать/скрыть сообщение).
- **События** — `@submit.prevent` (отправить), `@input` (если нужна кастомная логика).

### Паттерн: состояние → вычисления → UI

Держи **одно источник истины** (объект формы) и **не храни** производные значения (валидность, сообщения об ошибках) отдельно — пусть их считает `computed`. Тогда:

- изменил поле → `computed` пересчитался → UI обновился;
- нет «синхронизации» между полем и состоянием валидности (источник один).

### Валидация как чистые функции

Валидацию удобно вынести в **чистые функции** (возвращают `true`/`false` или строку ошибки), а `computed` — вызывать их:

```js
const emailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email));
const passwordValid = computed(() => form.password.length >= 8);
const formValid = computed(() => emailValid.value && passwordValid.value);
```

Тогда «правила» живут в скрипте (их легко тестировать и переиспользовать), а шаблон просто показывает результат.

TIP: для «живой» валидации (пока пользователь печатает) — `computed` обновляется автоматически. Если валидация дорогая (запрос на сервер) — `watch` + debounce.

NOTE: задание этого урока — «собрать» форму по скелету. Раннер Syntax покажет результат в превью, консоль — в нижней панели.

## Пример

Готовая форма (решение, для ориентира — в задании будет скелет с `TODO`):

```vue
<script setup>
import { reactive, computed } from "vue";

const form = reactive({ name: "", email: "", password: "" });
const submitted = ref(false);

const nameValid = computed(() => form.name.trim().length >= 2);
const emailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email));
const passwordValid = computed(() => form.password.length >= 8);
const formValid = computed(() => nameValid.value && emailValid.value && passwordValid.value);

const errors = computed(() => {
  const e = [];
  if (!nameValid.value) e.push("Имя: минимум 2 символа");
  if (!emailValid.value) e.push("Email: некорректный формат");
  if (!passwordValid.value) e.push("Пароль: минимум 8 символов");
  return e;
});

function onSubmit() {
  if (!formValid.value) return;
  submitted.value = true;
  console.log("Оформлено:", { ...form });
}
</script>

<template>
  <form class="signup" @submit.prevent="onSubmit">
    <h3>Регистрация</h3>

    <label>
      Имя
      <input v-model.trim="form.name" :class="{ invalid: form.name && !nameValid }" />
    </label>
    <p v-if="form.name && !nameValid" class="err">Минимум 2 символа</p>

    <label>
      Email
      <input v-model="form.email" :class="{ invalid: form.email && !emailValid }" />
    </label>
    <p v-if="form.email && !emailValid" class="err">Некорректный email</p>

    <label>
      Пароль
      <input type="password" v-model="form.password" :class="{ invalid: form.password && !passwordValid }" />
    </label>
    <p v-if="form.password && !passwordValid" class="err">Минимум 8 символов</p>

    <ul v-if="!formValid && (form.name || form.email || form.password)" class="summary">
      <li v-for="e in errors" :key="e">{{ e }}</li>
    </ul>

    <button type="submit" :disabled="!formValid">Отправить</button>
    <p v-if="submitted" class="ok">Успех! Данные: {{ form.name }}, {{ form.email }}</p>
  </form>
</template>
```

Что здесь демонстрируется:

- `reactive` — объект формы (источник истины);
- `computed` — валидность каждого поля и формы в целом, список ошибок;
- `:class="{ invalid: … }"` — подсветка;
- `v-if` — показать ошибку только если поле «трогалось»;
- `:disabled="!formValid"` — кнопка inactive до валидности;
- `v-model.trim` — убрать пробелы у имени.

## Частые ошибки

WARN: хранишь `formValid` как `ref` и «обновляешь» его вручную в `@input`. Источник должен быть один: `computed` считает валидность из полей.

WARN: валидируешь **на сабмите**, но показываешь ошибки **во время ввода** — и они «мигают». Решай: валидация «по blur» (когда поле покинули) или «живая» (по вводу). Для «по blur» — добавь флаг `touched` на каждое поле.

WARN: `v-model` на `type="number"` — значение может стать `""` (пустая строка) при очистке. Обрабатывай `null`/`""` в `computed`.

WARN: `@submit` без `.prevent` — форма улетит на сервер и страница перезагрузится. Для SPA-форм — `.prevent` по умолчанию.

## Практическое задание

В `App.vue` (скелет с `TODO`) сделай:

1. `reactive` объект `form` с полями: `username`, `email`, `age`.
2. `computed`:
   - `usernameValid` — длина 3..20;
   - `emailValid` — regex на email;
   - `ageValid` — число от 18 до 99;
   - `formValid` — все три.
3. В шаблоне: три `<input>` с `v-model`, `:class="{ invalid: … }"` и `<p class="err">` под каждым (показывать, если поле не пустое и невалидно).
4. Кнопка «Сохранить» с `:disabled="!formValid"` и `@submit.prevent`.
5. При сабмите — `console.log` объекта формы и показ `<p class="ok">Готово: {username}</p>`.
6. Запусти **Run**: проверь невалидные значения (красная подсветка, кнопка inactive), затем валидные — сабмит работает.
