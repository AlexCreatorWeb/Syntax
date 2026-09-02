# Урок 20. Динамические маршруты, параметры, навигация

## Цель

После урока студент сможет: описывать **динамические маршруты** с **параметрами** (`/user/:id`), читать параметры через `useRoute`, делать **программную навигацию** через `useRouter` (`push`/`replace`/`back`), понимать **вложенные** маршруты (nested) и **watch** за изменениями маршрута.

## Теория

### Динамические маршруты и параметры

Маршрут может содержать **параметры** — «заполнители» в пути:

```js
const routes = [
  { path: "/user/:id", component: UserProfile },
];
```

При пути `/user/42` параметр `id` равен `"42"`. Читаем через **`useRoute`**:

```js
import { useRoute } from "vue-router";
const route = useRoute();
// route.params.id === "42"
```

Можно несколько параметров: `/user/:id/post/:postId`.

**Важно:** параметры — **строки** (даже числа). Для чисел — `Number(route.params.id)`.

### Программная навигация

`useRouter` даёт **методы** навигации:

- `router.push("/path")` — **добавляет** запись в историю (кнопка «назад» браузера работает);
- `router.replace("/path")` — **заменяет** текущую запись (без новой записи в истории);
- `router.back()` / `router.go(-1)` — назад;
- `router.forward()` — вперёд.

Пример — «кнопка „Далее"» или «перенаправить после сабмита»:

```js
import { useRouter } from "vue-router";
const router = useRouter();
function goNext() { router.push("/step2"); }
```

### Вложенные маршруты

Маршрут может иметь **`children`** — «вложенные» маршруты (страница с «вкладками» внутри):

```js
const routes = [
  {
    path: "/user/:id",
    component: UserLayout,
    children: [
      { path: "", component: UserPosts },       // /user/42
      { path: "profile", component: UserProfile }, // /user/42/profile
    ],
  },
];
```

`UserLayout` содержит **свой** `<router-view>` — туда встанет «вложенный» компонент. Так строятся «мультиуровневые» страницы (например, «профиль → вкладка „Посты" / „Настройки"»).

### Watch за маршрутом

Чтобы «отреагировать» на **смену** маршрута (например, перезагрузить данные), **`watch`** за `route`:

```js
watch(() => route.params.id, (newId) => {
  loadUser(newId);
});
```

TIP: для «разных страниц по одному компоненту» (например, `UserPosts` для разных `id`) — **`watch`** на `route.params` или **`onMounted`** + **key** (пересоздать компонент при смене `id`).

NOTE: в раннере Syntax **параметры** и **программная навигация** работают (через hash-URL в iframe). Проверь: измени параметр — и компонент обновится.

## Пример

«Профиль пользователя» с параметром и программной навигацией:

```vue
<script>
import { createRouter, createWebHashHistory } from "vue-router";

const UserList = {
  template: `
    <section>
      <h2>Пользователи</h2>
      <ul>
        <li v-for="u in users" :key="u.id">
          <router-link :to="'/user/' + u.id">{{ u.name }}</router-link>
        </li>
      </ul>
    </section>
  `,
  data() { return { users: [{ id: 1, name: "Анна" }, { id: 2, name: "Борис" }] }; },
};

const UserProfile = {
  template: `
    <section>
      <h2>Пользователь: {{ id }}</h2>
      <p>Профиль пользователя с id = {{ id }}.</p>
      <button @click="back">← Назад</button>
    </section>
  `,
  computed: { id() { return this.$route.params.id; } },
  methods: { back() { this.$router.back(); } },
};

const routes = [
  { path: "/", component: UserList },
  { path: "/user/:id", component: UserProfile },
];

export const router = createRouter({ history: createWebHashHistory(), routes });
</script>

<script setup>
// Общая логика App
</script>

<template>
  <div class="demo">
    <router-view />
  </div>
</template>
```

Что проверяется:

- `/user/:id` — **динамический** маршрут;
- `route.params.id` — чтение параметра (в `UserProfile` через `this.$route` — Options-стиль для краткости; в `<script setup>` — `useRoute`);
- `router.back()` — **программная** навигация;
- `<router-link :to="'/user/' + u.id">` — динамический `to`.

## Частые ошибки

WARN: **забываешь** `:to` (двоеточие) при **динамическом** пути. `<router-link to="/user/1">` — **строка** `/user/1`. Для **переменной** — `:to="'/user/' + id"`.

WARN: **параметр** — **строка**, а ты ожидаешь **число**. `route.params.id` — `"42"`, а не `42`. Приводи: `Number(route.params.id)`.

WARN: **вложенный** маршрут **без** `<router-view>` в **родителе**. Тогда «вложенный» компонент **не встанет**. Родительский компонент **должен** содержать `<router-view>`.

WARN: **`watch`** на `route` **целиком** (а не на `route.params.id`). Тогда сработает при **любом** изменении маршрута (включая `query`). Следи за **конкретным** свойством.

## Практическое задание

В `App.vue` сделай «Список задач + страница задачи»:

1. Создай **2** компонента:
   - `TaskList` — список задач (каждая — `<router-link :to="'/task/' + t.id">`);
   - `TaskDetail` — показывает **одну** задачу (по `route.params.id`).
2. Маршруты:
   - `/` → `TaskList`;
   - `/task/:id` → `TaskDetail`.
3. В `TaskDetail`:
   - `const route = useRoute()`;
   - `const task = computed(() => tasks.find(t => t.id === Number(route.params.id)))`;
   - кнопка «← Назад» (`useRouter().back()`).
4. Добавь **вложенный** маршрут: `/task/:id/comments` → `TaskComments` (комментарии к задаче). В `TaskDetail` — `<router-view>` и `<router-link to="…/comments">`.
5. Запусти **Run**: перейди на задачу, затем на «Комментарии», затем «Назад».
