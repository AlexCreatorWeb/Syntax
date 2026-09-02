# Урок 16. slots: default, named, scoped

## Цель

После урока студент сможет: использовать **default slot** (контент «внутри» компонента), **именованные слоты** (несколько точек вставки через `#slot-name`), **scoped slots** (передача данных из дочернего компонента в слот), и понимать, что слоты — это способ **композиции** (родитель «заполняет» дочерний).

## Теория

### Что такое slot

**Slot** — это **точка вставки** в разметке дочернего компонента, которую **родитель** заполняет своим контентом. Это **композиция**: дочерний компонент задаёт **структуру**, а родитель — **содержимое**.

Простейший пример — default slot:

```vue
<!-- Button.vue -->
<template>
  <button class="btn"><slot></slot></button>
</template>
```

```html
<!-- Родитель -->
<Button>Нажми меня</Button>
<!-- Отрендерится: <button class="btn">Нажми меня</button> -->
```

Всё, что между тегами `<Button>…</Button>`, «встаёт» в `<slot></slot>`.

### Iменнованные слоты

Несколько точек вставки — через `name`:

```vue
<!-- Card.vue -->
<template>
  <div class="card">
    <header><slot name="header"></slot></header>
    <main><slot></slot></main>
    <footer><slot name="footer"></slot></footer>
  </div>
</template>
```

```html
<Card>
  <template #header><h3>Заголовок</h3></template>
  Основной контент
  <template #footer><small>© 2026</small></template>
</Card>
```

- `#header` / `v-slot:header` — именованный слот;
- без `#name` — **default** slot.

### Scoped slots

**Scoped slot** — это слот, который **получает данные** из **дочернего** компонента. Дочерний передаёт props в `<slot :data="…">`, а родитель «ловит» их через `#slot-name="props"`.

```vue
<!-- List.vue (дочерний) -->
<template>
  <ul>
    <li v-for="item in items" :key="item.id">
      <slot :item="item"></slot>
    </li>
  </ul>
</template>
```

```html
<!-- Родитель -->
<List :items="todos">
  <template #default="{ item }">
    {{ item.text }} — {{ item.done ? "готово" : "в работе" }}
  </template>
</List>
```

Здесь **дочерний** владеет списком (`items`), а **родитель** решает, **как** отрендерить каждый элемент (через scoped slot). Это мощный паттерн: «компонент-обёртка» (структура) + «контент» (внешний).

TIP: слоты — **композиция без props/emits**. Если «родитель хочет вставить своё», а «дочерний задаёт где» — это слот. Если «дочерний просит родителя сделать» — это emit.

NOTE: в раннере Syntax слоты работают так же, как в Vite. Проверь: контент из родителя действительно «встаёт» в нужное место дочернего.

## Пример

`Modal` (дочерний) с default + именованными слотами:

```vue
<script setup>
import { ref } from "vue";

const Modal = {
  props: { title: String, open: Boolean },
  emits: ["close"],
  setup(props, { emit }) {
    function onClose() { emit("close"); }
    return { onClose };
  },
  template: `
    <div v-if="open" class="modal" @click.self="onClose">
      <div class="modal__box">
        <header class="modal__head">
          <slot name="header">{{ title }}</slot>
          <button @click="onClose">×</button>
        </header>
        <main class="modal__body"><slot></slot></main>
        <footer class="modal__foot"><slot name="footer"></slot></footer>
      </div>
    </div>
  `,
};

const showModal = ref(false);
</script>

<template>
  <div class="demo">
    <button @click="showModal = true">Открыть модалку</button>

    <Modal v-if="showModal" title="Уведомление" :open="showModal" @close="showModal = false">
      <template #header><strong>Важное</strong></template>
      <p>Контент модалки (default slot).</p>
      <template #footer>
        <button @click="showModal = false">Закрыть</button>
      </template>
    </Modal>
  </div>
</template>
```

Что проверить:

- `#header` переопределяет заголовок (если не передать — будет `title`);
- default slot — основной контент;
- `#footer` — кнопки;
- `@close` — emit (урок 15) закрывает модалку.

## Частые ошибки

WARN: **забываешь** `<slot></slot>` в дочернем — контент родителя «некуда вставаться» и просто пропадает.

WARN: путаешь **имя** слота. `<slot name="header">` ↔ `<template #header>`. Не `#head`.

WARN: в **scoped slot** ожидаешь данные, но дочерний **не передаёт** их в `<slot :data="…">`. Тогда `{ item }` в родителе будет `undefined`.

WARN: **смешиваешь** «данные через props» и «контент через слот». Данные (значения) — **props**. Контент (разметка) — **слоты**. Scoped slot — компромисс: «дочерний даёт данные, родитель — разметку».

## Практическое задание

В `App.vue` сделай «Карточку-шаблон»:

1. Inline-компонент `Panel`:
   - `props: { title: String }`;
   - слоты: `#header` (дефолт — `title`), default (контент), `#actions` (кнопки).
2. В `App.vue` используй `Panel` **дважды**:
   - первый — с кастомным `#header` и `#actions` (кнопка «Сброс»);
   - второй — только default (без `#header` — будет `title`).
3. Сделай **scoped slot**: компонент `TagList`, который рендерит `<li v-for="tag in tags">` с `<slot :tag="tag">`, а родитель определяет, как выглядит тег (например, с цветом).
4. Запусти **Run** и проверь: слоты «встают» в нужные места, scoped slot получает `tag`.
