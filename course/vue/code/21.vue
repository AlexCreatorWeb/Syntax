<script>
import { createPinia, defineStore } from "pinia";
import { ref, computed } from "vue";

// TODO: store useCart:
//   state: items (ref массив)
//   getters: count (длина), total (сумма price * qty)
//   actions: add(name, price) — инкремент qty если есть, иначе пуш; clear()
export const useCart = defineStore("cart", () => {
  const items = ref([]);
  // TODO: computed count и total
  const count = computed(() => 0);
  const total = computed(() => 0);
  function add(name, price) {
    // TODO: логика добавления
  }
  function clear() { items.value = []; }
  return { items, count, total, add, clear };
});

// TODO: export const pinia = createPinia();
export const pinia = createPinia();

// Бейдж-компонент (использует тот же store — доказательство «общего» состояния)
export const CartBadge = {
  setup() {
    const cart = useCart();
    return { cart };
  },
  template: `<p class="badge">Бейдж: {{ cart.count }} шт. в корзине</p>`,
};
</script>

<script setup>
// Store объявлен в <script>-блоке выше — в раннере они мержатся в один модуль.
const cart = useCart();
</script>

<template>
  <div class="demo">
    <h3>Корзина: {{ cart.count }} шт. на {{ cart.total }} ₽</h3>
    <ul>
      <li v-for="i in cart.items" :key="i.name">{{ i.name }} × {{ i.qty }} — {{ i.price * i.qty }} ₽</li>
    </ul>
    <p v-if="!cart.items.length" class="empty">Корзина пуста</p>

    <button @click="cart.add('Курс Vue', 1000)">Добавить «Курс Vue»</button>
    <button @click="cart.add('Курс React', 1200)">Добавить «Курс React»</button>
    <button @click="cart.clear()">Очистить</button>

    <CartBadge />
  </div>
</template>
