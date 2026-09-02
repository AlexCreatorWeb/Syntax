<script setup>
import { ref } from "vue";

// TODO: inline-компонент ProfileCard:
//   defineProps: name (String, required), role (String, default "student"),
//                skills (Array, default () => []), active (Boolean, default false)
//   template: инициалы, name, role, список skills (v-for), бейдж "Активен" (v-if="active")
const ProfileCard = {
  props: {
    name: { type: String, required: true },
    // TODO: role / skills / active
  },
  template: `
    <div class="profile">
      <div class="mono">{{ name.slice(0, 1) }}</div>
      <div>
        <h4>{{ name }}</h4>
        <p>{{ role }}</p>
        <ul><li v-for="s in skills" :key="s">{{ s }}</li></ul>
        <span v-if="active" class="badge">Активен</span>
      </div>
    </div>
  `,
};

const users = [
  { name: "Анна", role: "mentor", skills: ["vue", "node"], active: true },
  { name: "Борис" }, // без role и skills — сработают дефолты
  { name: "Вера", role: "student", active: false },
];
</script>

<template>
  <div class="demo">
    <h3>Профили</h3>
    <ProfileCard
      v-for="u in users"
      :key="u.name"
      :name="u.name"
      :role="u.role"
      :skills="u.skills"
      :active="u.active"
    />
  </div>
</template>
