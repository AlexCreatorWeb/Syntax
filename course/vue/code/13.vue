<script setup>
import { ref } from "vue";

// TODO: inline-компонент Avatar:
//   props: name (String), color (String)
//   свой size (ref, старт 48) и кнопка "+" (size += 8)
//   template: кружок (border-radius, background: color) с инициалами + подпись name
const Avatar = {
  props: { name: String, color: String },
  setup() {
    const size = ref(48);
    // TODO: function grow() { size.value += 8; }
    return { size, grow };
  },
  template: `
    <div class="avatar-wrap">
      <div class="avatar" :style="{ width: size + 'px', height: size + 'px', background: color }">
        {{ name.slice(0, 1) }}
      </div>
      <p>{{ name }}</p>
      <button @click="grow">+</button>
    </div>
  `,
};

const users = [
  { name: "Анна", color: "#e91e63" },
  { name: "Борис", color: "#3f51b5" },
  { name: "Вера", color: "#43a047" },
];
</script>

<template>
  <div class="demo">
    <h3>Галерея аватаров</h3>
    <!-- TODO: v-for по users, :key="u.name", передай name и color -->
    <Avatar v-for="u in users" :key="u.name" :name="u.name" :color="u.color" />
  </div>
</template>
