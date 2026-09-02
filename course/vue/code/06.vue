<script setup>
import { ref, reactive, computed } from "vue";

const cart = reactive({
  items: [{ name: "Курс Vue", price: 1000, qty: 1 }],
  discount: 0.1,
  discountPercent: 10,
});

// TODO: computed total — сумма price * qty
const total = computed(() => 0);

// TODO: computed discounted — total * (1 - discount), округлено
const discounted = computed(() => 0);

function addItem() {
  // TODO: пуш { name: "Курс React", price: 1200, qty: 1 }
}
</script>

<template>
  <div class="demo">
    <h3>Корзина</h3>
    <ul>
      <li v-for="i in cart.items" :key="i.name">{{ i.name }} × {{ i.qty }} — {{ i.price * i.qty }} ₽</li>
    </ul>
    <p>Скидка: {{ cart.discount * 100 }}%</p>
    <input type="range" min="0" max="50" :value="cart.discountPercent" @input="cart.discountPercent = Number($event.target.value)" />
    <!-- TODO: свяжи слайдер с cart.discount (discount = discountPercent / 100) через computed с setter или watch -->
    <p>Итого: {{ total }} ₽, со скидкой: {{ discounted }} ₽</p>
    <button @click="addItem">Добавить элемент</button>
  </div>
</template>
