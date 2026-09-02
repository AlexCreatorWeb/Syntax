<script setup>
import { ref, computed, watch, provide, inject } from "vue";

// TODO: композабл useLocalStorage(key, initial):
//   ref с начальным значением из localStorage (или initial)
//   watch — запись обратно в localStorage
function useLocalStorage(key, initial) {
  const value = ref(typeof localStorage !== "undefined" ? localStorage.getItem(key) ?? initial : initial);
  // TODO: watch(value, v => localStorage.setItem(key, v))
  return value;
}

// "Глубокий" потомок, который injects тему
const ThemeDot = {
  setup() {
    // TODO: const theme = inject("theme", "light");
    const theme = inject("theme", "light");
    return { theme };
  },
  template: `<span class="dot" :style="{ background: theme === 'dark' ? '#222' : '#eee' }">Тема: {{ theme }}</span>`,
};

// TODO: const theme = useLocalStorage("syntax-theme", "dark");
const theme = useLocalStorage("syntax-theme", "dark");
// TODO: provide("theme", theme.value)  (для раннера — provide строкой или ref)
provide("theme", theme);

function toggleTheme() {
  theme.value = theme.value === "dark" ? "light" : "dark";
}
</script>

<template>
  <div class="demo">
    <h3>Тема и композаблы</h3>
    <button @click="toggleTheme">Сменить тему</button>
    <ThemeDot />
    <p>Текущая тема: {{ theme }} (сохраняется в localStorage)</p>
  </div>
</template>
