<script>
// TODO: создай 3 компонента (inline с template): Home, Products, Contact
import { createRouter, createWebHashHistory } from "vue-router";

const Home = { template: "<section><h2>Главная</h2><p>Добро пожаловать!</p></section>" };
const Products = { template: "<section><h2>Товары</h2><p>Список товаров.</p></section>" };
const Contact = { template: "<section><h2>Контакты</h2><p>Мы на связи.</p></section>" };

// TODO: массив routes (path -> component)
const routes = [
  { path: "/", component: Home },
  // TODO: добавь /products и /contact
  { path: "/about", component: Contact },
];

// TODO: export const router = createRouter({ history: createWebHashHistory(), routes })
export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});
</script>

<script setup>
// Логика App (общая для всех маршрутов)
</script>

<template>
  <div class="demo">
    <nav>
      <router-link to="/">Главная</router-link>
      <!-- TODO: router-link на /products и /contact -->
      <router-link to="/about">Контакты</router-link>
    </nav>
    <router-view />
  </div>
</template>
