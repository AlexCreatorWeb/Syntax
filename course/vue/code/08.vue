<script setup>
import { reactive, computed, ref } from "vue";

const form = reactive({ username: "", email: "", age: 0 });
const submitted = ref(false);

// TODO: computed usernameValid — длина 3..20
// TODO: computed emailValid — regex на email
// TODO: computed ageValid — число от 18 до 99
// TODO: computed formValid — все три

function onSubmit() {
  if (!formValid.value) return; // TODO: formValid.value (в JS — с .value)
  submitted.value = true;
  console.log("Сохранено:", { ...form });
}
</script>

<template>
  <form class="signup" @submit.prevent="onSubmit">
    <h3>Анкета</h3>

    <label>Имя пользователя
      <input v-model.trim="form.username" />
    </label>
    <p v-if="form.username && !usernameValid" class="err">Длина 3..20</p>

    <label>Email
      <input v-model="form.email" />
    </label>
    <p v-if="form.email && !emailValid" class="err">Некорректный email</p>

    <label>Возраст
      <input type="number" v-model.number="form.age" />
    </label>
    <p v-if="form.age && !ageValid" class="err">От 18 до 99</p>

    <button type="submit" :disabled="!formValid">Сохранить</button>
    <p v-if="submitted" class="ok">Готово: {{ form.username }}</p>
  </form>
</template>
