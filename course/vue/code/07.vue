<script setup>
import { ref, watch, watchEffect, computed } from "vue";

const query = ref("");
const fruits = ref(["яблоко", "груша", "апельсин", "банан", "мандарин"]);

// TODO: computed filtered — элементы, содержащие query (в нижнем регистре)
const filtered = computed(() => fruits.value);

// TODO: watch(query, cb) — логируй "Ищем: {query}, найдено: {N}"
// TODO: watchEffect — логируй "Поиск активен: {query.length > 0}"
// TODO: watch(query, cb, { immediate: true }) — логируй начальное состояние
</script>

<template>
  <div class="demo">
    <input v-model="query" placeholder="Поиск…" />
    <p>Найдено: {{ filtered.length }} из {{ fruits.length }}</p>
    <ul>
      <li v-for="f in filtered" :key="f">{{ f }}</li>
    </ul>
  </div>
</template>
