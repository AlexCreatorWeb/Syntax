<script setup>
import { ref, computed } from "vue";

const tasks = ref([
  { id: 1, text: "Выучить v-for", done: true },
  { id: 2, text: "Понять :key", done: false },
  { id: 3, text: "Сделать список", done: false },
]);

// TODO: computed remaining — количество невыполненных
const remaining = computed(() => 0);

function toggle(task) { task.done = !task.done; }

function remove(id) {
  // TODO: удалить задачу по id (фильтр)
}

function addTask() {
  // TODO: пуш { id: Date.now(), text: "Новая задача", done: false }
}
</script>

<template>
  <div class="demo">
    <p>Осталось: {{ remaining }}</p>
    <ul>
      <!-- TODO: v-for с :key="task.id" -->
      <li v-for="task in tasks" :key="task.id">
        <label>
          <input type="checkbox" :checked="task.done" @change="toggle(task)" />
          {{ task.text }}
        </label>
        <button @click="remove(task.id)">Удалить</button>
      </li>
    </ul>
    <button @click="addTask">Добавить</button>
  </div>
</template>
