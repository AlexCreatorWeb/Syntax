<script setup>
import { ref } from "vue";

const text = ref("");
const clicks = ref(0);
const lastKey = ref("—");

// TODO: напиши обработчик onKey(e), который пишет e.key в lastKey
function onKey(e) { lastKey.value = e.key; }

function addBy(n) { clicks.value += n; }
</script>

<template>
  <div class="demo">
    <input :value="text" @input="text = $event.target.value" placeholder="Печатай…" />
    <p>Введено: {{ text || "ничего" }}</p>

    <button @click="clicks++">+1</button>
    <!-- TODO: кнопка "+10" через addBy(10) -->
    <button @click="addBy(10)">+10</button>
    <p>Кликов: {{ clicks }}</p>

    <input :value="lastKey" @keydown="onKey" readonly placeholder="Нажми клавишу" />
    <p>Последняя клавиша: {{ lastKey }}</p>

    <!-- TODO: форма с @submit.prevent, которая логирует text -->
    <form>
      <input :value="text" @input="text = $event.target.value" />
      <button type="submit">Отправить</button>
    </form>
  </div>
</template>
