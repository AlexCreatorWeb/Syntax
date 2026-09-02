<script setup>
import { ref } from "vue";

const tab = ref("home");
const expanded = ref(false);
const heavy = ref(false);
const heavyItems = Array.from({ length: 100 }, (_, i) => "Строка " + (i + 1));
</script>

<template>
  <div class="demo">
    <!-- Навигация -->
    <button v-for="t in ['home', 'about', 'contact']" :key="t" @click="tab = t">{{ t }}</button>

    <!-- TODO: v-if / v-else-if / v-else для трёх вкладок (home/about/contact) -->
    <div v-if="tab === 'home'">Домашняя</div>

    <!-- TODO: блок "Детали" через v-show (expanded) -->
    <button @click="expanded = !expanded">Детали</button>
    <p v-show="expanded">Эти детали всегда в DOM (скрыты через display: none).</p>

    <!-- TODO: тяжёлая ветка через v-if (heavy) — список из 100 строк -->
    <button @click="heavy = !heavy">Тяжёлый блок</button>
    <div v-if="heavy">
      <p v-for="s in heavyItems" :key="s">{{ s }}</p>
    </div>
  </div>
</template>
