<script>
import { createRouter, createWebHashHistory } from "vue-router";
import { createPinia, defineStore } from "pinia";
import { ref, computed, watch } from "vue";

// === 1) Store задач ===
// TODO: state tasks (3 стартовые), getters doneCount/remaining,
//      actions add(title)/remove(id)/toggle(id)
export const useTasks = defineStore("tasks", () => {
  const tasks = ref([
    { id: 1, title: "Выучить Vue", done: true },
    { id: 2, title: "Сделать SPA", done: false },
    { id: 3, title: "Опубликовать проект", done: false },
  ]);
  // TODO: computed doneCount, remaining
  const doneCount = computed(() => 0);
  const remaining = computed(() => 0);
  function add(title) {
    // TODO: пуш { id: Date.now(), title, done: false }
  }
  function remove(id) {
    // TODO: фильтр по id
  }
  function toggle(id) {
    // TODO: инвертировать done
  }
  return { tasks, doneCount, remaining, add, remove, toggle };
});
export const pinia = createPinia();

// === 2) Компоненты-маршруты ===
const TaskList = {
  setup() {
    // TODO: import useTasks (см. ниже), draft (ref), submit()
    const tasks = useTasks();
    const draft = ref("");
    function submit() {
      // TODO: tasks.add(draft.value); draft.value = "";
    }
    return { tasks, draft, submit };
  },
  template: `
    <section>
      <h2>Задачи (готово: {{ tasks.doneCount }}/{{ tasks.tasks.length }})</h2>
      <form @submit.prevent="submit">
        <input v-model="draft" placeholder="Новая задача" />
        <button type="submit">Добавить</button>
      </form>
      <ul>
        <li v-for="t in tasks.tasks" :key="t.id" :class="{ done: t.done }">
          <label><input type="checkbox" :checked="t.done" @change="tasks.toggle(t.id)" /> {{ t.title }}</label>
          <router-link :to="'/task/' + t.id">Открыть</router-link>
          <button @click="tasks.remove(t.id)">Удалить</button>
        </li>
      </ul>
    </section>
  `,
};

const TaskDetail = {
  setup() {
    // TODO: useRoute, computed task по route.params.id, back()
    const route = useRoute();
    const tasks = useTasks();
    const task = computed(() => tasks.tasks.find(t => t.id === Number(route.params.id)));
    function back() { router.back(); }
    // TODO: watch(() => route.params.id, () => console.log("id изменился"))
    return { task, back };
  },
  template: `
    <section>
      <h2 v-if="task">{{ task.title }}</h2>
      <p v-else>Задача не найдена</p>
      <label v-if="task"><input type="checkbox" :checked="task.done" @change="tasks.toggle(task.id)" /> Выполнено</label>
      <button @click="back">← Назад</button>
    </section>
  `,
};

const About = { template: "<section><h2>О приложении</h2><p>SPA «Задачи» на Vue 3 + Router + Pinia.</p></section>" };

// === 3) Роутер ===
const routes = [
  { path: "/", component: TaskList },
  // TODO: /task/:id -> TaskDetail, /about -> About
  { path: "/about", component: About },
];
export const router = createRouter({ history: createWebHashHistory(), routes });

// Хелпер для setup-компонентов (раннер: один файл)
import { useRoute, useRouter } from "vue-router";
</script>

<script setup>
// Store объявлен в <script>-блоке выше — в раннере они мержатся в один модуль.
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
