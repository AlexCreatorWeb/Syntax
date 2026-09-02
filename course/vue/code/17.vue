<script setup>
import { ref, onMounted, onUnmounted, onUpdated } from "vue";

const seconds = ref(0);
const showTimer = ref(true);
let timer = null;

onMounted(() => {
  console.log("[lifecycle] App mounted");
  // TODO: стартуй setInterval (инкремент seconds каждую секунду)
  // и верни cleanup-функцию (clearInterval)
});

onUpdated(() => {
  // TODO: логируй "App updated"
});

onUnmounted(() => {
  console.log("[lifecycle] App unmounted");
});

// TODO: inline-компонент TimerBlock:
//   onMounted — старт своего таймера (count) + console.log("[block] mounted")
//   onUnmounted — console.log("[block] unmounted")
//   cleanup (return из onMounted) — остановка таймера
const TimerBlock = {
  setup() {
    const count = ref(0);
    onMounted(() => {
      console.log("[block] mounted");
      const id = setInterval(() => { count.value++; }, 1000);
      // TODO: return () => clearInterval(id);
      return () => clearInterval(id);
    });
    onUnmounted(() => console.log("[block] unmounted"));
    return { count };
  },
  template: `<div class="block"><p>TimerBlock: {{ count }} c</p></div>`,
};
</script>

<template>
  <div class="demo">
    <h3>Таймер App: {{ seconds }} c</h3>
    <label>
      <input type="checkbox" v-model="showTimer" /> Показать TimerBlock
    </label>
    <TimerBlock v-if="showTimer" />
  </div>
</template>
