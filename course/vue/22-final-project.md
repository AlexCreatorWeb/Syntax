# Урок 22. Финальный проект: SPA с Router + Pinia

## Цель

После урока студент сможет: собрать **SPA-приложение** «Задачи» (CRUD), объединяя **все** инструменты курса: `<script setup>`, реактивность (`ref`/`computed`), **Pinia** (store задач), **Vue Router** (маршруты: список + детальная страница), **props/emits** (компонент-форма), **slots** (обёртка), **watch** (реакция на смену маршрута). Это «итоговая работа» по всему курсу.

## Теория

### Что «склеиваем»

Финальный проект — это **не новые концепции**, а **композиция** того, что ты уже знаешь:

- **Состояние** — **Pinia** (store `tasks`: `state`/`getters`/`actions`).
- **Маршруты** — **Vue Router** (`/` — список, `/task/:id` — детальная, `/about` — «о приложении»).
- **Компоненты** — `TaskForm` (props + emits), `TaskItem` (emit «открыть/удалить»), `Layout` (slots).
- **Реактивность** — `ref`/`computed` в компонентах, `watch` на `route.params.id`.
- **Директивы** — `v-for` (список), `v-if` (условия), `v-model` (форма).

### Архитектура (структура)

Держи **одно источник истины** (Pinia-store) и **разделяй** ответственность:

1. **Store** — данные и «бизнес-логика» (добавить/удалить/изменить задачу).
2. **Компоненты** — **только** UI (отображают state, эмитят события).
3. **Маршруты** — «какой компонент на каком пути».

Так приложение **масштабируется**: добавить «фильтры» — это `computed`/`getters`; «сохранение» — `action` + `localStorage`; «поиск» — `watch` + debounce.

### Паттерн «список → деталь»

Классический SPA-паттерн:

- `/` — **список** (задачи);
- клик по задаче — **`router.push('/task/' + id)`**;
- `/task/:id` — **детальная** страница (читает `id` из `route.params`, находит задачу в store);
- **«Назад»** — `router.back()`.

`watch` на `route.params.id` — чтобы **обновить** детальную, если `id` меняется **без** пересоздания компонента.

TIP: **не** держи «данные» в **компонентах** (кроме «временных» для формы). Всё **общее** — в **Pinia**. Компонент — «тонкий» (UI + события).

NOTE: в раннере Syntax всё это работает **в одном** `App.vue` (stores и router — в **обычном** `<script>`-блоке, компоненты — **inline**). В **реальном** проекте — **отдельные** файлы.

## Пример (скелет для задания)

Структура `App.vue` (решение — в `code/22.vue`, здесь — **каркас**):

```vue
<script>
import { createRouter, createWebHashHistory } from "vue-router";
import { createPinia, defineStore } from "pinia";
import { ref, computed } from "vue";

// 1) Store задач
export const useTasks = defineStore("tasks", () => {
  const tasks = ref([ /* … */ ]);
  const doneCount = computed(() => tasks.value.filter(t => t.done).length);
  function add(title) { /* … */ }
  function remove(id) { /* … */ }
  function toggle(id) { /* … */ }
  return { tasks, doneCount, add, remove, toggle };
});
export const pinia = createPinia();

// 2) Компоненты-маршруты (inline для раннера)
const TaskList = { /* template: список + router-link */ };
const TaskDetail = { /* template: одна задача + back */ };
const About = { template: "<p>О приложении «Задачи».</p>" };

// 3) Роутер
const routes = [
  { path: "/", component: TaskList },
  { path: "/task/:id", component: TaskDetail },
  { path: "/about", component: About },
];
export const router = createRouter({ history: createWebHashHistory(), routes });
</script>

<script setup>
// Общая логика App (навигация, store)
import { useTasks } from "…"; // (в раннере — см. решение)
const tasks = useTasks();
</script>

<template>
  <div class="app">
    <nav>
      <router-link to="/">Задачи</router-link>
      <router-link to="/about">О нас</router-link>
      <span>Готово: {{ tasks.doneCount }}/{{ tasks.tasks.length }}</span>
    </nav>
    <router-view />
  </div>
</template>
```

## Частые ошибки

WARN: **дублируешь** данные: store **и** локальный `ref` в компоненте. Тогда «несинхронизация» (изменил в одном — другое «не узнало»). **Одно** источник — **store**.

WARN: **забываешь** `app.use(pinia)` / `app.use(router)` (в раннере — `export const pinia`/`router`). Тогда store/router **не работают**.

WARN: **`watch`** на `route.params.id` **нет**, а ты ждёшь «обновления» детальной при смене `id`. Компонент **перезаиспользуется** (тот же `TaskDetail`), и `id` «протечет» из предыдущей. Добавь **`watch`** (или **`key`** на `<router-view>`).

WARN: **меняешь** state **вне** actions (напрямую из компонента). Для **простоты** допустимо, но **actions** — «одна точка входа» (легче **отлаживать**).

## Практическое задание

В `App.vue` (скелет `code/22.vue` с `TODO`) собери **полное** приложение «Задачи»:

1. **Store** `useTasks`:
   - `state`: `tasks` (ref массив, 3 стартовые задачи: `{ id, title, done }`);
   - `getters`: `doneCount`, `remaining`;
   - `actions`: `add(title)`, `remove(id)`, `toggle(id)`.
2. **Компонент** `TaskList` (маршрут `/`):
   - форма (input + кнопка «Добавить») → `tasks.add(title)`;
   - список `v-for` → каждая задача: чекбокс (`toggle`), название (`<router-link :to="'/task/' + t.id">`), кнопка «Удалить» (`remove`);
   - бейдж «Готово: {doneCount}/{tasks.length}».
3. **Компонент** `TaskDetail` (маршрут `/task/:id`):
   - `const route = useRoute()`;
   - `const task = computed(() => tasks.tasks.find(t => t.id === Number(route.params.id)))`;
   - показ: `title`, `done` (чекбокс), кнопки «Удалить» и «← Назад» (`router.back()`);
   - `watch(() => route.params.id, …)` — «пере-найти» задачу при смене `id`.
4. **Маршрут** `/about` — «О приложении».
5. **`export const pinia`** и **`export const router`**.
6. Запусти **Run**: добавь задачу, отметь, перейди на детальную, удали — убедись, что всё **синхронизировано** (store — одно источник).

**Бонус** (если закончишь): добавь **`localStorage`** persistence (через `watch` на `tasks` в store) — «задачи» переживут перезагрузку.
