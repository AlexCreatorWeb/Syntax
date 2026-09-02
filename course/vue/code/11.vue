<script setup>
import { reactive } from "vue";

const profile = reactive({
  name: "",
  age: 0,
  hobbies: [],
  city: "",
  notify: false,
});

const allHobbies = ["чтение", "спорт", "музыка"];
const cities = ["Москва", "Казань", "Санкт-Петербург"];
</script>

<template>
  <div class="demo">
    <h3>Анкета</h3>

    <label>Имя
      <!-- TODO: v-model.trim -->
      <input v-model.trim="profile.name" />
    </label>

    <label>Возраст
      <!-- TODO: type="number" + .number -->
      <input v-model="profile.age" />
    </label>

    <p>Хобби:</p>
    <!-- TODO: группа чекбоксов с v-model="profile.hobbies" и :value -->
    <label v-for="h in allHobbies" :key="h">
      <input type="checkbox" :value="h" /> {{ h }}
    </label>

    <label>Город
      <!-- TODO: select с v-model="profile.city" -->
      <select v-model="profile.city">
        <option value="">—</option>
        <option v-for="c in cities" :key="c" :value="c">{{ c }}</option>
      </select>
    </label>

    <label>
      <input type="checkbox" v-model="profile.notify" /> Уведомления
    </label>

    <p class="summary">
      Имя: {{ profile.name || "—" }}, возраст: {{ profile.age || "—" }},
      хобби: {{ profile.hobbies.join(", ") || "—" }}, город: {{ profile.city || "—" }},
      уведомления: {{ profile.notify ? "да" : "нет" }}
    </p>
  </div>
</template>
