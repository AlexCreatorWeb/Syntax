<script setup>
import { ref } from "vue";

const user = ref({ name: "Студент", level: 5 });
const skills = ref(["vue", "reactivity"]);

// TODO: добавь свойство pro (true/false) в user
// TODO: выведи выражение "следующий уровень" (level + 1)

function who() {
  return "Привет, " + user.value.name + "!";
}
</script>

<template>
  <div class="demo">
    <p>{{ who() }}</p>
    <p>Уровень: {{ user.level }} <!-- TODO: добавь выражение level + 1 --></p>
    <p>{{ user.level > 10 ? "Мастер" : "Учусь" }}</p>
    <!-- TODO: выведи skills через v-text (join через ", ") -->
    <p>Навыки: {{ skills.join(", ") }}</p>
  </div>
</template>
