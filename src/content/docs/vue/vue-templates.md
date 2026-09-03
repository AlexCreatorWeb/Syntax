---
id: vue-templates
track: vue
type: guide
section: basics
order: 1
title:
  en: "Templates & Binding"
  ru: "Шаблоны и связывание"
excerpt:
  en: "How Vue turns your <template> into a live UI: text interpolation, v-bind, conditionals and v-for lists."
  ru: "Как Vue превращает ваш <template> в живой интерфейс: интерполяция, v-bind, условия и списки v-for."
version: "vue 3.5"
updated: 2026-09-03
relatedTask: vue-003
---

A template is plain HTML that Vue compiles into a render function. You write the structure once, bind it to reactive state, and Vue re-renders exactly the parts that changed. This guide covers the binding syntax you will use in every component: interpolation, `v-bind`, conditional rendering and `v-for` lists.

## Text interpolation and expressions

The mustache syntax `{{ }}` inserts the result of a JavaScript expression into the markup. Inside `<script setup>` every top-level declaration is automatically available in the template — no exports, no `return` statement:

```vue
<script setup>
const title = "My first template";
const score = 7;
</script>

<template>
  <h1>{{ title }}</h1>
  <p>Score: {{ score }} / 10</p>
  <p>{{ score * 2 }} points doubled</p>
  <p>{{ score > 5 ? "pass" : "fail" }}</p>
</template>
```

You can use any expression inside the braces: arithmetic, property access, ternaries, method calls. What you cannot use is statements — `if` blocks, `for` loops and plain assignments do not belong in a template, because the compiler must be able to turn the expression into a pure function of state.

Interpolation always escapes HTML. If your state contains `<b>bold</b>`, the user sees the literal angle brackets. That is the safe default; when you genuinely need raw markup you opt in with `v-html`, and you own the escaping.

> **TIP**
> If an interpolation grows longer than one readable line, extract it into a `computed` or a function in `<script setup>`. The template stays a layout, the logic stays in code.

## The v-bind directive

A plain attribute is a string; a bound attribute is evaluated as code. `v-bind` and its shorthand `:` make that switch:

```vue
<script setup>
const avatarUrl = "https://example.com/me.png";
const userId = 42;
const isActive = true;
const hasError = false;
const themeColor = "#22c55e";
const fontSize = 14;
</script>

<template>
  <img v-bind:src="avatarUrl" alt="avatar" />
  <img :src="avatarUrl" alt="avatar" />
  <a :href="'/user/' + userId">Profile</a>

  <div :class="{ active: isActive, 'text-red': hasError }">Class binding</div>
  <div :style="{ color: themeColor, fontSize: fontSize + 'px' }">Style binding</div>
</template>
```

For `class` and `style` the binding accepts richer forms. The object form maps a class name to a truthy test, so you can stack conditional classes in one attribute; the array form merges several class lists, including values that come from a function or a computed. The object form for `style` maps a camelCase CSS property to a value.

When the attribute name itself is dynamic, Vue evaluates it too: `:[attributeName]="value"` reads the name from an expression. On component tags, `v-bind` stops being an attribute binding entirely and becomes a prop — `<Box :title="myTitle" />` passes `myTitle` as the `title` prop of the child.

## Conditional rendering

Two built-in directives control visibility, and they work differently. `v-if` is lazy: while the value is false the branch is not rendered at all, and Vue re-evaluates the expression whenever its dependencies change. A `v-if` / `v-else-if` / `v-else` chain must consist of adjacent sibling elements:

```vue
<script setup>
const items = [];
const debug = false;
</script>

<template>
  <div v-if="items.length === 0">Nothing here yet</div>
  <ul v-else>
    <li v-for="item in items" :key="item.id">{{ item.title }}</li>
  </ul>

  <p v-show="debug">Debug mode is on</p>
</template>
```

`v-show` does the opposite trade: the element is rendered once and stays in the DOM, and the directive just toggles the CSS `display` property. Toggling is therefore instant, at the cost of keeping hidden nodes alive.

When a branch contains several siblings, wrap them in a `<template v-if="…">` tag. The template tag renders no element of its own, so you get a multi-node branch without an extra wrapper `div` cluttering the DOM.

> **TIP**
> Use `v-if` for conditions that rarely switch or where rendering is expensive (fetch data only when a panel opens), and `v-show` for frequent toggling such as tabs, drawers and dropdowns.

## List rendering with v-for

`v-for` clones a piece of the template for every item in a collection. It works on arrays, on objects (iterating entries), on numbers (producing `1..n`) and even on strings:

```vue
<script setup>
const todos = [
  { id: 1, title: "Learn templates" },
  { id: 2, title: "Bind some state" },
];
</script>

<template>
  <ul>
    <li v-for="(todo, index) in todos" :key="todo.id">
      {{ index + 1 }}. {{ todo.title }}
    </li>
  </ul>

  <p v-for="n in 3" :key="n">Row {{ n }}</p>
</template>
```

The second binding gives you the index, and a third one the original collection. When you iterate an object you receive value, key and index in that order.

Every `v-for` element needs a `:key` — a stable identifier for each item, almost always an `id` from your data. The key is how Vue matches old and new lists during an update: with unique stable keys it can move, insert and remove the minimal number of DOM nodes instead of rebuilding the list.

> **WARNING**
> Using the array index as `:key` breaks updates when items are inserted or removed: Vue patches by key, so with index keys the wrong DOM node can be reused and values jump to the wrong rows — most visibly in inputs inside a sorted list.

## Common mistakes

The templates of broken Vue apps usually share the same few sins. Catching them early saves hours of debugging:

> **WARNING**
> `{{ count = count + 1 }}` is tempting, but assignments are statements, not expressions, and the template compiler rejects them. Mutate state in a method or write `@click="count++"`.

> **WARNING**
> `v-for` and `v-if` on the same element is a code smell: in that combination `v-for` is evaluated first, so the `v-if` filters inside the render loop. Wrap the element in `<template v-for>` and put `v-if` on the inner node, or pre-filter the list in a `computed`.

> **TIP**
> Keep templates declarative. If you find yourself writing nested ternaries or boolean arithmetic in `{{ }}`, the logic belongs in `<script setup>` — the template should read like a wireframe.

<!-- RU -->

Темплейт — это обычный HTML, который Vue компилирует в render-функцию. Вы описываете структуру один раз, связываете её с реактивным state, и Vue перерисовывает ровно те части, которые изменились. Гайд покрывает синтаксис связывания, который вы будете использовать в каждом компоненте: интерполяция, `v-bind`, условный рендер и списки `v-for`.

## Интерполяция текста и выражения

Синтаксис «усов» `{{ }}` подставляет результат JavaScript-выражения в разметку. Внутри `<script setup>` каждая top-level декларация автоматически доступна в template — без exports и `return`:

```vue
<script setup>
const title = "My first template";
const score = 7;
</script>

<template>
  <h1>{{ title }}</h1>
  <p>Score: {{ score }} / 10</p>
  <p>{{ score * 2 }} points doubled</p>
  <p>{{ score > 5 ? "pass" : "fail" }}</p>
</template>
```

Внутри фигурных скобок можно использовать любые выражения: арифметику, доступ к свойствам, тернарные операторы, вызовы функций. Нельзя использовать statements — блоки `if`, циклы `for` и обычные присваивания в template не живут, потому что компилятор должен превращать выражение в чистую функцию от state.

Интерполяция всегда экранирует HTML. Если в state лежит `<b>bold</b>`, пользователь увидит угловые скобки как есть. Это безопасное поведение по умолчанию; когда нужна настоящая разметка, вы явно включаете её через `v-html` — и сами отвечаете за экранирование.

> **TIP**
> Если интерполяция выросла длиннее одной читаемой строки — вынесите её в `computed` или функцию в `<script setup>`. Template остаётся вёрсткой, логика остаётся в коде.

## Директива v-bind

Обычный атрибут — это строка; связанный атрибут вычисляется как код. `v-bind` и её сокращение `:` делают именно этот переход:

```vue
<script setup>
const avatarUrl = "https://example.com/me.png";
const userId = 42;
const isActive = true;
const hasError = false;
const themeColor = "#22c55e";
const fontSize = 14;
</script>

<template>
  <img v-bind:src="avatarUrl" alt="avatar" />
  <img :src="avatarUrl" alt="avatar" />
  <a :href="'/user/' + userId">Profile</a>

  <div :class="{ active: isActive, 'text-red': hasError }">Class binding</div>
  <div :style="{ color: themeColor, fontSize: fontSize + 'px' }">Style binding</div>
</template>
```

Для `class` и `style` связывание принимает более богатые формы. Объектная форма сопоставляет имя класса с truthy-проверкой, так что условные классы складываются в один атрибут; массивная форма склеивает несколько списков классов, включая значения из функции или computed. Объектная форма для `style` сопоставляет camelCase-CSS-свойство со значением.

Когда само имя атрибута динамическое, Vue вычисляет и его: `:[attributeName]="value"` читает имя из выражения. У тегов компонентов `v-bind` перестаёт быть привязкой атрибута и становится пропсом — `<Box :title="myTitle" />` передаёт `myTitle` как проп `title` в дочерний компонент.

## Условный рендер

Две встроенные директивы управляют видимостью, и работают они по-разному. `v-if` — ленивая: пока значение false, ветка вообще не рендерится, и Vue вычисляет выражение заново при каждом изменении зависимостей. Цепочка `v-if` / `v-else-if` / `v-else` должна состоять из соседних элементов-братьев:

```vue
<script setup>
const items = [];
const debug = false;
</script>

<template>
  <div v-if="items.length === 0">Nothing here yet</div>
  <ul v-else>
    <li v-for="item in items" :key="item.id">{{ item.title }}</li>
  </ul>

  <p v-show="debug">Debug mode is on</p>
</template>
```

`v-show` делает противоположную ставку: элемент рендерится один раз и остаётся в DOM, а директива просто переключает CSS-свойство `display`. Переключение поэтому мгновенное, но цена — живые скрытые узлы.

Если в ветке несколько элементов-братьев, оберните их в тег `<template v-if="…">`. Он не рендерит собственного элемента, так что вы получаете ветку из нескольких узлов без лишнего обёртывающего `div` в DOM.

> **TIP**
> Используйте `v-if` для условий, которые редко переключаются или дороги в рендере (загружать данные только когда панель открыта), и `v-show` для частых переключений — табы, панели, выпадающие списки.

## Списки: v-for

`v-for` клонирует кусок template для каждого элемента коллекции. Работает с массивами, с объектами (по парам), с числами (генерирует `1..n`) и даже со строками:

```vue
<script setup>
const todos = [
  { id: 1, title: "Learn templates" },
  { id: 2, title: "Bind some state" },
];
</script>

<template>
  <ul>
    <li v-for="(todo, index) in todos" :key="todo.id">
      {{ index + 1 }}. {{ todo.title }}
    </li>
  </ul>

  <p v-for="n in 3" :key="n">Row {{ n }}</p>
</template>
```

Вторая переменная связывания — это индекс, третья — исходная коллекция. При итерации объекта получаете значение, ключ и индекс в этом порядке.

Каждому элементу `v-for` нужен `:key` — стабильный идентификатор элемента, почти всегда `id` из ваших данных. По ключу Vue сверяет старый и новый список при обновлении: с уникальными стабильными ключами он двигает, вставляет и удаляет минимальное число DOM-узлов, а не пересобирает список целиком.

> **WARNING**
> Индекс массива как `:key` ломает обновления при вставке или удалении элементов: Vue патчит DOM по ключам, поэтому с index-ключами может переиспользоваться неправильный узел, и значения скачут по строкам — лучше всего заметно в input внутри отсортированного списка.

## Частые ошибки

В template сломанных Vue-приложений обычно одни и те же грехи. Ловить их стоит рано — это экономит часы отладки:

> **WARNING**
> `{{ count = count + 1 }}` — соблазнительно, но присваивание — это statement, а не expression, и template-компилятор его отвергает. Меняйте state в функции или пишите `@click="count++"`.

> **WARNING**
> `v-for` и `v-if` в одном элементе — код-запах: в такой связке `v-for` вычисляется первым, и `v-if` фильтрует прямо в цикле рендера. Оберните элемент в `<template v-for>` и поставьте `v-if` на внутренний узел, или отфильтруйте список заранее в `computed`.

> **TIP**
> Держите template декларативным. Если вы пишете вложенные тернарники или булеву арифметику в `{{ }}` — логика должна жить в `<script setup>`: template должен читаться как вайрфрейм.
