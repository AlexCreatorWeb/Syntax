# Курс «Vue 3 с нуля» (Composition API + <script setup>) — дорожная карта (22 урока)

Целевая аудитория: студент, прошедший курсы HTML, CSS и JavaScript (знает DOM-базу, функции, замыкания, массивы/объекты, async/await, fetch). Результат: студент пишет современный Vue 3 (Composition API, `<script setup>`, SFC) — от первого `createApp` до SPA-приложения с Vue Router и Pinia. Без Options API, без классических `this`-паттернов.

Источники: vuejs.org (официальная документация, «Getting Started», «Guide: Essentials / Components / Composition API / Built-in Features», vue-router, pinia), Vue SFC-спецификация, лучшие практики (реактивность, однонаправленный поток данных, композабли).

## Структура

M1. Знакомство с Vue (01-04)
01 — Vue: первое приложение и структура SFC
02 — Шаблон: мустачи, выражения, v-text
03 — v-bind: атрибуты, class и style
04 — v-on: события, $event, модификаторы

M2. Реактивность (05-08)
05 — ref: реактивные переменные
06 — reactive и computed
07 — watch и watchEffect
08 — Практика: интерактивная форма с валидацией

M3. Директивы и условность (09-12)
09 — v-if / v-else-if / v-show
10 — v-for: списки и ключи
11 — v-model: input, checkbox, select
12 — v-model с компонентами: props + emits

M4. Компоненты (13-16)
13 — Создание и регистрация компонентов
14 — props: однонаправленный поток данных
15 — emits: события от child к parent
16 — slots: default, named, scoped

M5. Жизненный цикл и Composition (17-18)
17 — Lifecycle hooks: onMounted, onUpdated, onUnmounted
18 — Композабли: переиспользование логики, provide/inject

M6. Маршрутизация и глобальное состояние (19-22)
19 — Vue Router: маршруты, router-link, router-view
20 — Динамические маршруты, параметры, навигация
21 — Pinia: стейт, геттеры, экшены
22 — Финальный проект: SPA с Router + Pinia

## Логическая цепочка

1. **Vue и SFC** (01): что такое SPA-фреймворк, createApp, из чего состоит .vue-файл — фундамент, без которого не работает раннер платформы.
2. **Шаблон** (02): мустачи и выражения — язык описания UI.
3. **v-bind** (03): атрибуты, зависящие от данных.
4. **v-on** (04): пользователь → логика, модификаторы.
5. **ref** (05): сердце Vue — реактивные переменные.
6. **reactive + computed** (06): объекты и производные значения.
7. **watch** (07): реакция на изменения.
8. **Практика реactivity** (08): всё вместе в форме с валидацией.
9. **Условный рендер** (09): v-if vs v-show.
10. **Списки** (10): v-for, ключи — главная ошибка новичков.
11. **v-model** (11): двух-way binding форм.
12. **v-model + компоненты** (12): паттерн modelValue + update:modelValue.
13. **Компоненты** (13): разбивка UI на части.
14. **props** (14): данные «вниз».
15. **emits** (15): данные «вверх».
16. **slots** (16): композиция.
17. **Жизненный цикл** (17): когда код выполняется относительно DOM.
18. **Композабли** (18): переиспользование логики + provide/inject.
19. **Vue Router** (19): маршруты, базовый роутер.
20. **Динамические маршруты** (20): параметры, программная навигация.
21. **Pinia** (21): глобальное состояние.
22. **Финальный проект** (22): SPA-приложение «Задачи» (CRUD + Router + Pinia).

## Контракт урока (фиксированный, QC в сидере)

5 разделов в строгом порядке:
1. `## Цель` — «После урока студент сможет: …»
2. `## Теория` — простые объяснения, `###`-подзаголовки
3. `## Пример` — рабочий код в ```vue-блоке (полный SFC — воспроизводим в Vite и в раннере платформы)
4. `## Частые ошибки` — минимум 1 `WARN:` (по одной на ловушку)
5. `## Практическое задание` — нумерованный список с TODO

Правила контента:
- минимум 1 `TIP:` и 1 `WARN:`-callout; `NOTE:` — для «как это работает в платформе Syntax»
- без таблиц, без markdown-ссылок `[t](u)` (ссылки — прозой)
- объём content 4000–7000 зн.
- **кодовое задание `code/NN.vue` = скелет ЗАДАНИЯ** (НЕ решение): исполняемый `App.vue` с `<script setup>` и `// TODO`-комментариями; компонент называется **App** (раннер платформы маунтит его в превью); синтаксис `<script setup>` + `import … from "vue"` — современный, работает и в Vite (npm create vue@latest) и в раннере платформы
- Vue 3 только: Composition API, `<script setup>`; Options API (data/methods/mounted в объекте) НЕ используем

## Механика платформы

- Файл задания Vue-трека = `App.vue` (taskFileMap в MainContent).
- **Vue-раннер** (CodeEditor): `App.vue` → `@vue/compiler-sfc` (parse + compileScript + compileTemplate) → единый blob-module → `createApp` в превью-iframe. Vue 3.4.38 с unpkg (esm-bundler-сборки + import map — одна копия для приложения, vue-router и pinia), `@vue/compiler-sfc` — esm.sh. Опционально `export const router` / `export const pinia` в обычном `<script>`-блоке SFC. Консоль перехватывается, ошибки с номерами строк файла.
- Материал урока (markdown-lite): `##`/`###`, **жирный**, *курсив*, `код`, ```vue-блоки (Copy), TIP:/NOTE:/WARN:-callout'ы.
- Сидер `seed-vue-course.mjs`: IDEMPOTENT (удаляет ВСЕ tech='vue', вставляет 22, id `50000000-…00NN`), встроенный QC (5 разделов, TIP/WARN, ```vue, объём, ссылки) — падает до БД при нарушении; `DRY=1 node …` — только проверка.

## Источники (первичные)

- vuejs.org/guide/introduction — что такое Vue, SFC
- vuejs.org/guide/essentials — template syntax, v-bind, v-on, v-if, v-for, v-model, reactivity (ref/reactive/computed/watch), components, props/emits, slots
- vuejs.org/guide/references — component lifecycle hooks
- vuejs.org/guide/extras/composition-api — композабли, provide/inject
- router.vuejs.org/guide — создание роутера, динамические маршруты
- pinia.vuejs.org/guide/essentials — стейт, геттеры, экшены
- Vite + create-vue: `npm create vue@latest` (шаблон с <script setup>)
