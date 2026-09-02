<script setup>
import { ref } from "vue";

const score = ref(0);
const multiplier = ref(1);
// TODO: объект stats с best и tries (ref)
const stats = ref({ best: 0, tries: 0 });

function addScore() {
  // TODO: score += 10 * multiplier
  // TODO: stats.tries++, и если score > stats.best — обновить best
}

function upMultiplier() { multiplier.value++; }
</script>

<template>
  <div class="demo">
    <p>Очки: {{ score }}, множитель ×{{ multiplier }}, рекорд: {{ stats.best }}, попыток: {{ stats.tries }}</p>
    <button @click="addScore">Очки +10 × multiplier</button>
    <button @click="upMultiplier">Множитель +1</button>
  </div>
</template>
