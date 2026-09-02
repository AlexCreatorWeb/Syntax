<script setup>
import { ref } from "vue";

const count = ref(0);
const status = ref("ok"); // ok | warn | error
const colors = { ok: "#2e7d32", warn: "#e65100", error: "#c62828" };

function inc() { count.value++; }
function cycleStatus() {
  // TODO: переключай status по кругу ok -> warn -> error -> ok
  status.value = "warn";
}
</script>

<template>
  <div class="demo">
    <!-- TODO: добавь :href на ссылку, использующую count -->
    <a href="#">Ссылка</a>

    <p :class="{ zero: count === 0, many: count > 5 }">Счётчик: {{ count }}</p>
    <button @click="inc">+1</button>

    <!-- TODO: закрась текст через :style, цвет из colors[status] -->
    <p>Статус: {{ status }}</p>
    <button @click="cycleStatus">Сменить статус</button>
  </div>
</template>
