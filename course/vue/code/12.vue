<script setup>
import { ref } from "vue";

// TODO: компонент CounterInput:
//   defineProps({ modelValue: { type: Number, default: 0 } })
//   defineEmits(["update:modelValue"])
//   кнопки "-1", "+1", "Сброс" -> emit("update:modelValue", newValue)
const CounterInput = {
  props: { modelValue: { type: Number, default: 0 } },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    // TODO: функции dec / inc / reset, которые emit-ят новое значение
    function dec() { emit("update:modelValue", props.modelValue - 1); }
    function inc() { /* TODO */ }
    function reset() { /* TODO */ }
    return { dec, inc, reset };
  },
  template: `
    <div class="counter">
      <button @click="dec">−1</button>
      <span>{{ modelValue }}</span>
      <button @click="inc">+1</button>
      <button @click="reset">Сброс</button>
    </div>
  `,
};

const count = ref(0);
</script>

<template>
  <div class="demo">
    <!-- TODO: v-model="count" на CounterInput -->
    <CounterInput :modelValue="count" @update:modelValue="count = $event" />
    <p>Родитель видит: {{ count }}</p>
    <div class="bar" :style="{ width: Math.min(100, count * 10) + '%' }"></div>
  </div>
</template>
