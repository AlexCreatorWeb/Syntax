<script setup>
import { ref } from "vue";

// TODO: добавь переменную message со своим приветствием
const message = ref("Hello, Vue!");
</script>

<template>
  <div class="card">
    <h1>Моё первое Vue-приложение</h1>
    <!-- TODO: выведи message через мустачи -->
    <p>{{ message }}</p>
  </div>
</template>

<style scoped>
.card { font-family: sans-serif; padding: 24px; border: 1px solid #ccc; border-radius: 8px; }
</style>
