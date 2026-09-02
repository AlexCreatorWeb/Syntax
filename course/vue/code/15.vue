<script setup>
import { ref } from "vue";

// TODO: inline-компонент GuestRow:
//   props: guest (Object)
//   emits: ["promote", "leave"]
//   кнопки: "Вверх" -> emit("promote", guest.id), "Ушёл" -> emit("leave", guest.id)
const GuestRow = {
  props: { guest: Object },
  emits: ["promote", "leave"],
  setup(props, { emit }) {
    // TODO: функции, которые emit-ят с props.guest.id
    function promote() { emit("promote", props.guest.id); }
    function leave() { emit("leave", props.guest.id); }
    return { promote, leave };
  },
  template: `
    <li class="guest">
      <span>{{ guest.name }} (уровень {{ guest.level }})</span>
      <button @click="promote">Вверх</button>
      <button @click="leave">Ушёл</button>
    </li>
  `,
};

const guests = ref([
  { id: 1, name: "Анна", level: 1 },
  { id: 2, name: "Борис", level: 1 },
  { id: 3, name: "Вера", level: 1 },
]);

function promote(id) {
  // TODO: найти гостя по id и увеличить level
}
function leave(id) {
  // TODO: удалить гостя по id (фильтр)
}
</script>

<template>
  <div class="demo">
    <h3>Гости</h3>
    <ul>
      <GuestRow v-for="g in guests" :key="g.id" :guest="g" @promote="promote" @leave="leave" />
    </ul>
  </div>
</template>
