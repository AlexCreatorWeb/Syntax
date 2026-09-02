## Цель

После урока студент сможет: создать **роутер** через `createRouter`/`createWebHistory`, определить **маршруты** (путь → компонент), рендерить текущий маршрут через `<router-view>`, делать навигацию через `<router-link>` и понимать механику SPA-навигации (страница не перезагружается при смене маршрута).

## Теория

### Зачем роутер

SPA-приложение — это **одна** HTML-страница, но **много** «экранов». **Роутер** связывает **URL** (путь) с **компонентом**: при смене пути Vue **перерисовывает** нужный компонент **без** перезагрузки страницы.

Vue Router — **официальный** роутер для Vue. Он работает «из коробки» с Vue 3.

### Базовая структура

1. **Маршруты** — массив объектов `{ path, component }`:
   ```js
   const routes = [
     { path: "/", component: Home },
     { path: "/about", component: About },
   ];
   ```
2. **Роутер** — `createRouter({ history, routes })`:
   - `createWebHistory()` — **HTML5** History API (красивые URL, без `#`);
   - `createWebHashHistory()` — **hash** (с `#`, проще для статического хостинга).
3. **Монтаж** — `app.use(router)` (подключаем к приложению).

### <router-view> и <router-link>

- `<router-view>` — **заглушка**, куда Vue Router **вставляет** компонент **текущего** маршрута.
- `<router-link to="/about">` — **ссылка**, которая меняет маршрут (не перезагружает страницу).

Типичный `App.vue`:

```html
<template>
  <nav>
    <router-link to="/">Главная</router-link>
    <router-link to="/about">О нас</router-link>
  </nav>
  <router-view />
</template>
```

### «Активная» ссылка

`<router-link>` **автоматически** добавляет класс `router-link-active` (и `router-link-exact-active` для точного совпадения) на **текущий** маршрут — можно **подсветить** активный пункт навигации.

TIP: для **простого** приложения (несколько экранов) — достаточно `path → component`. Для **вложенных** (страница с «вкладками» внутри) — **вложенные маршруты** (урок 20).

NOTE: в раннере Syntax роутер работает **внутри** превью (iframe). URL **не меняется** (iframe-изоляция), но **навигация** (смена компонента) — работает. Для «реального» URL — используй `createWebHashHistory`.

## Пример

В раннере Syntax роутер объявляется в **обычном** `<script>`-блоке SFC (рядом с `<script setup>`) как `export const router`:

```vue
<script>
import { createRouter, createWebHashHistory } from "vue-router";

const Home = { template: "<section><h2>Главная</h2><p>Добро пожаловать!</p></section>" };
const About = { template: "<section><h2>О нас</h2><p>Обучающая платформа.</p></section>" };

const routes = [
  { path: "/", component: Home },
  { path: "/about", component: About },
];

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
      <router-link to="/about">О нас</router-link>
    </nav>
    <router-view />
  </div>
</template>
```

Что происходит:

- `export const router` — раннер **подхватит** его и вызовет `app.use(router)`;
- `<router-view>` — отрендерит `Home` (при `/`) или `About` (при `/about`);
- `<router-link>` — смена маршрута **без** перезагрузки;
- активная ссылка подсвечена (`router-link-active`).

## Частые ошибки

WARN: **забываешь** `app.use(router)` (в раннере — `export const router`). Тогда `<router-view>` **пустой**, а `<router-link>` не работает.

WARN: путаешь **`createWebHistory`** и **`createWebHashHistory`**. Для **раннера** (iframe) — **hash** (URL изолирован). Для **реального** хостинга — **history** (красивые URL, но нужен **rewrite** на сервере).

WARN: `<router-view>` **внутри** `<router-link>` (или наоборот). Они **разные** компоненты: `router-view` — **заглушка** (рендер), `router-link` — **ссылка** (навигация).

WARN: **один** маршрут на **несколько** путей. Каждый `path` — **отдельный** элемент `routes`. Для «несколько путей → один компонент» — **вложенные** (урок 20).

## Практическое задание

В `App.vue` сделай «Мини-сайт» с роутером:

1. Создай **3** компонента (inline-объекты с `template`): `Home`, `Products`, `Contact`.
2. Объяви `routes`:
   - `/` → `Home`;
   - `/products` → `Products`;
   - `/contact` → `Contact`.
3. Создай `router` через `createRouter({ history: createWebHashHistory(), routes })` и **`export const router`**.
4. В `<template>`: `<nav>` с `<router-link>` на каждый маршрут + `<router-view>`.
5. Добавь **стили**: подсвети `.router-link-active` (например, жирный/подчёркнутый).
6. Запусти **Run**: кликай по ссылкам — компонент меняется, активная ссылка подсвечена.
