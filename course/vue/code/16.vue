<script setup>
import { ref } from "vue";

// TODO: inline-компонент Panel:
//   props: title (String)
//   слоты: #header (дефолт — title), default, #actions
const Panel = {
  props: { title: String },
  template: `
    <div class="panel">
      <header><slot name="header">{{ title }}</slot></header>
      <main><slot></slot></main>
      <footer><slot name="actions"></slot></footer>
    </div>
  `,
};

// TODO: компонент TagList со scoped slot:
//   props: tags (Array)
//   template: <ul><li v-for="tag in tags"><slot :tag="tag"></slot></li></ul>
const TagList = {
  props: { tags: Array },
  template: `
    <ul class="tags">
      <li v-for="tag in tags" :key="tag"><slot :tag="tag"></slot></li>
    </ul>
  `,
};

const tags = ["vue", "reactivity", "sfc", "router"];
</script>

<template>
  <div class="demo">
    <!-- TODO: первый Panel с кастомным #header и #actions (кнопка) -->
    <Panel title="Простая панель">
      <p>Контент (default slot).</p>
    </Panel>

    <!-- TODO: TagList со scoped slot — отрендерь тег с цветным бейджем { tag } -->
    <TagList :tags="tags">
      <template #default="{ tag }">
        <span class="tag">{{ tag }}</span>
      </template>
    </TagList>
  </div>
</template>
