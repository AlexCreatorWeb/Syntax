<script>
import { createRouter, createWebHashHistory } from "vue-router";

const tasks = [
  { id: 1, title: "Выучить Vue Router" },
  { id: 2, title: "Понять параметры" },
  { id: 3, title: "Сделать SPA" },
];

// TODO: TaskList — список задач, каждая — <router-link :to="'/task/' + t.id">
const TaskList = {
  template: `
    <section>
      <h2>Задачи</h2>
      <ul>
        <li v-for="t in tasks" :key="t.id">
          <router-link :to="'/task/' + t.id">{{ t.title }}</router-link>
        </li>
      </ul>
    </section>
  `,
  data() { return { tasks }; },
};

// TODO: TaskDetail — читает route.params.id, показывает задачу, кнопка "Назад"
const TaskDetail = {
  computed: {
    id() { return Number(this.$route.params.id); },
    task() { return tasks.find(t => t.id === this.id); },
  },
  methods: { back() { this.$router.back(); } },
  template: `
    <section>
      <h2 v-if="task">{{ task.title }}</h2>
      <p v-else>Задача не найдена (id = {{ id }})</p>
      <button @click="back">← Назад</button>
    </section>
  `,
};

const routes = [
  { path: "/", component: TaskList },
  // TODO: /task/:id -> TaskDetail
  { path: "/task/:id", component: TaskDetail },
];

export const router = createRouter({ history: createWebHashHistory(), routes });
</script>

<script setup>
// TODO: const route = useRoute(); const router = useRouter();
//      watch(() => route.params.id, newId => console.log("новый id:", newId))
import { useRoute, useRouter } from "vue-router";
import { watch } from "vue";
const route = useRoute();
const router = useRouter();
// TODO: добавь watch(() => route.params.id, newId => console.log("новый id:", newId))
</script>

<template>
  <div class="demo">
    <router-view />
  </div>
</template>
