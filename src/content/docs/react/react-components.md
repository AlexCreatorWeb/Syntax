---
id: react-components
track: react
type: guide
section: basics
order: 1
title:
  en: "Components & JSX"
  ru: "Компоненты и JSX"
excerpt:
  en: "What a React component really is, how JSX differs from plain HTML, and how to compose small pieces into a whole interface."
  ru: "Что такое компонент в React, чем JSX отличается от обычного HTML и как собирать из маленьких кусков целый интерфейс."
version: "react 19"
updated: 2026-09-03
relatedTask: react-001
---

React builds every interface out of components: small, reusable functions that describe what the screen should look like. This guide covers what a component is, how JSX differs from plain HTML, and how to compose many small pieces into a working UI.

## What a component is

A React component is a plain JavaScript function that returns JSX — a description of the UI it renders. The function can take data as an argument (props) and can be named almost anything, as long as the first letter is uppercase. That capital letter is how React tells a component apart from a native HTML tag like `div` or `input`.

```jsx
function Greeter({ name }) {
  return <h1>Hello, {name}!</h1>;
}

function App() {
  return (
    <>
      <Greeter name="Syntax" />
      <Greeter name="World" />
    </>
  );
}
```

React calls `Greeter` twice with different data and glues the results together. You never instantiate a component by hand — you write `<Greeter name="Syntax" />` in JSX and the renderer does the rest. Because a component is just a function, it must stay pure on the render path: same input, same output, no side effects in the function body itself.

By convention each component lives in its own file named after the component (`Greeter.jsx`), and a file exports exactly one component. This keeps imports predictable: reading a component's JSX tells you which files to open, and renaming a component becomes a mechanical search-and-replace.

## JSX: HTML with superpowers

JSX looks like HTML, but it is JavaScript. Three rules to remember. First, attributes that clash with JavaScript keywords change their name: `class` becomes `className`, `for` becomes `htmlFor`. Second, every attribute is an expression — strings in quotes, everything else in braces: `id="box"`, `count={items.length}`. Third, self-closing tags close themselves: `<input type="text" />`, `<Avatar />`.

```jsx
function Card({ title, likes, onOpen }) {
  return (
    <article className="card" data-likes={likes} onClick={onOpen}>
      <h2>{title}</h2>
      {/* comments live inside braces */}
      <button type="button">Open</button>
    </article>
  );
}
```

Inside curly braces you can put any JavaScript: variables, ternaries, function calls, even whole arrow functions. To return several elements at once, wrap them in a fragment `<>…</>` — it renders the children without creating an extra `div` in the DOM.

Event handlers take a function, not a call: `onClick={onOpen}`, never `onClick={onOpen()}`. The second form calls the handler during render and passes its result (usually `undefined`) as the handler — a classic source of "my button does nothing".

> **TIP**
> Read JSX as a function call: `<Card title="Docs" likes={4} />` is sugar for `createElement(Card, { title: "Docs", likes: 4 })`. When an expression looks mysterious, expand it to the function-call form and the bug usually becomes obvious.

## Composition: children and fragments

Components are designed to be composed. The special `children` prop carries everything written between the opening and closing tags, so one component can describe the frame and the parent decides what goes inside.

```jsx
function Page({ title, children }) {
  return (
    <main>
      <h1>{title}</h1>
      {children}
    </main>
  );
}

function App() {
  return (
    <Page title="React docs">
      <p>The frame is fixed, the content is injected.</p>
    </Page>
  );
}
```

Composition is the main power of React: you build a library of dumb shells — buttons, cards, pages — and combine them differently on each screen. If you find yourself cloning a component with a boolean flag like `variant="danger"`, that is usually a sign to split it into two components and compose those instead.

`children` is just a prop, so it can carry anything, including a function: `{renderItem(item)}`. That is the render-props pattern in its purest form, and you will meet it on the reference pages.

Fragments come in two flavors: the anonymous shorthand `<>…</>` for 99% of cases, and the named `<Fragment key={k}>…</Fragment>` when the wrapper itself needs a key, which only happens inside a list.

## Lists and keys

To render a collection you loop with `map` and give every item a `key` — a stable, unique string or number. The key is how React matches the old and the new list when data changes, so it updates the minimum number of DOM nodes instead of tearing the whole list down.

```jsx
const TECHS = ["HTML", "CSS", "JavaScript", "React"];

function TechList() {
  return (
    <ul>
      {TECHS.map((tech) => (
        <li key={tech}>{tech}</li>
      ))}
    </ul>
  );
}
```

Use an id from your data whenever possible — it survives reordering, filtering, and deletions. The array index is a last resort: it is stable only while the list never changes shape, and the moment you add, remove, or sort items, index keys make React reuse the wrong components.

For complex items the key belongs on the outermost element of the item, and the item itself is usually its own component:

```jsx
function TaskRow({ task }) {
  return (
    <li className="row">
      <strong>{task.title}</strong>
      <span>{task.done ? "done" : "open"}</span>
    </li>
  );
}

function TaskList({ tasks }) {
  return (
    <ul>
      {tasks.map((t) => (
        <TaskRow key={t.id} task={t} />
      ))}
    </ul>
  );
}
```

> **WARNING**
> `key` is not the `id` attribute — it is a render-time hint for the reconciler and never ends up in the DOM. Duplicated or missing keys do not throw; they silently corrupt updates: inputs keep the wrong text, cards swap data.

## Common mistakes

> **WARNING**
> Writing `class="card"` in JSX instead of `className` is the classic first-day bug: the browser never sees the class. Grep your code for `class=` outside plain HTML files and it will show up instantly.

> **WARNING**
> Forgetting the slash in a self-closing tag — `<input type="text">` — makes JSX swallow the next element as a child and usually fails with a confusing parse error two lines later.

> **TIP**
> If a component grows past about 100 lines, extract a piece. A screen should read like a table of contents of smaller components, each with one job and a name that says what it is.

<!-- RU -->

React собирает любой интерфейс из компонентов — маленьких переиспользуемых функций, которые описывают, как должен выглядеть экран. Этот гайд разбирает, что такое компонент, чем JSX отличается от обычного HTML и как собирать из многих мелких кусков работающий UI.

## Что такое компонент

Компонент в React — обычная JavaScript-функция, которая возвращает JSX — описание UI, которое она рендерит. Функция может принимать данные как аргумент (props) и называться почти чем угодно, если первая буква заглавная. Именно заглавная буква позволяет React отличать компонент от нативного HTML-тега вроде `div` или `input`.

```jsx
function Greeter({ name }) {
  return <h1>Hello, {name}!</h1>;
}

function App() {
  return (
    <>
      <Greeter name="Syntax" />
      <Greeter name="World" />
    </>
  );
}
```

React вызывает `Greeter` дважды с разными данными и склеивает результаты. Компонент не «инстансируют» вручную — в JSX пишут `<Greeter name="Syntax" />`, и рендерер делает остальное. Так как компонент — просто функция, он обязан оставаться чистым на пути рендера: тот же вход, тот же выход, без side effects в теле самой функции.

По конвенции каждый компонент живёт в своём файле с именем компонента (`Greeter.jsx`), и файл экспортирует ровно один компонент. Импорт становится предсказуемым: читая JSX компонента, вы понимаете, какие файлы открыть, а переименование — это механический поиск-замена.

## JSX: HTML с суперсилами

JSX выглядит как HTML, но это JavaScript. Три правила. Первое: атрибуты, конфликтующие с ключевыми словами JavaScript, меняют имя: `class` → `className`, `for` → `htmlFor`. Второе: каждый атрибут — выражение, строки в кавычках, остальное в фигурных скобках: `id="box"`, `count={items.length}`. Третье: self-closing-теги закрывают сами себя: `<input type="text" />`, `<Avatar />`.

```jsx
function Card({ title, likes, onOpen }) {
  return (
    <article className="card" data-likes={likes} onClick={onOpen}>
      <h2>{title}</h2>
      {/* комментарии живут внутри скобок */}
      <button type="button">Open</button>
    </article>
  );
}
```

Внутри фигурных скобок — любой JavaScript: переменные, тернарники, вызовы функций, даже целые стрелочные функции. Чтобы вернуть сразу несколько элементов, оберните их во фрагмент `<>…</>` — он рендерит детей без создания лишнего `div` в DOM.

Обработчики событий принимают функцию, а не вызов: `onClick={onOpen}`, никогда не `onClick={onOpen()}`. Вторая форма вызывает обработчик во время рендера и передаёт его результат (обычно `undefined`) как обработчик — классическая причина «кнопка ничего не делает».

> **TIP**
> Читайте JSX как вызов функции: `<Card title="Docs" likes={4} />` — это синтаксический сахар для `createElement(Card, { title: "Docs", likes: 4 })`. Если выражение выглядит загадочно, разверните его в форму вызова функции — баг обычно становится очевидным.

## Композиция: children и фрагменты

Компоненты спроектированы для композиции. Специальный prop `children` несёт всё, что написано между открывающим и закрывающим тегами: один компонент описывает рамку, а родитель решает, что положить внутрь.

```jsx
function Page({ title, children }) {
  return (
    <main>
      <h1>{title}</h1>
      {children}
    </main>
  );
}

function App() {
  return (
    <Page title="React docs">
      <p>The frame is fixed, the content is injected.</p>
    </Page>
  );
}
```

Композиция — главная сила React: вы строите библиотеку «глупых» рамок — кнопки, карточки, страницы — и собираете их по-разному на каждом экране. Если ловите себя на том, что клонируете компонент с булевым флагом вроде `variant="danger"`, это почти всегда знак разделить его на два компонента и компоновать их.

`children` — обычный prop, поэтому может нести что угодно, включая функцию: `{renderItem(item)}`. Это render-props-паттерн в чистом виде — вы встретите его на страницах справочника.

Фрагменты бывают двух видов: анонимный шортхенд `<>…</>` для 99% случаев и именованный `<Fragment key={k}>…</Fragment>`, когда сам обёртке нужен key — это случается только внутри списка.

## Списки и ключи

Чтобы отрендерить коллекцию, проходятся `map` и дают каждому элементу `key` — стабильную уникальную строку или число. Key — это то, как React сопоставляет старый и новый список при изменении данных, поэтому обновляется минимум DOM-узлов, а не весь список целиком.

```jsx
const TECHS = ["HTML", "CSS", "JavaScript", "React"];

function TechList() {
  return (
    <ul>
      {TECHS.map((tech) => (
        <li key={tech}>{tech}</li>
      ))}
    </ul>
  );
}
```

Используйте id из данных, когда он есть, — он переживает переупорядочивание, фильтрацию и удаление. Индекс массива — последний выход: он стабилен, только пока список не меняет форму, а как только вы добавляете, удаляете или сортируете элементы, индексные key заставляют React переиспользовать не те компоненты.

Для сложных элементов key — на самом внешнем элементе пункта, а сам пункт, как правило, — отдельный компонент:

```jsx
function TaskRow({ task }) {
  return (
    <li className="row">
      <strong>{task.title}</strong>
      <span>{task.done ? "done" : "open"}</span>
    </li>
  );
}

function TaskList({ tasks }) {
  return (
    <ul>
      {tasks.map((t) => (
        <TaskRow key={t.id} task={t} />
      ))}
    </ul>
  );
}
```

> **WARNING**
> `key` — это не атрибут `id`, а подсказка reconciler'у на время рендера, в DOM он не попадает. Дубли или пропущенные key не роняют приложение — они незаметно ломают обновления: инпуты держат чужой текст, карточки меняются данными.

## Частые ошибки

> **WARNING**
> `class="card"` в JSX вместо `className` — баг первого дня: браузер так и не видит класс. Введите в коде `class=` вне обычных HTML-файлов — он сразу найдётся.

> **WARNING**
> Забытый слэш в self-closing-теге — `<input type="text">` — заставляет JSX глотать следующий элемент как ребёнка и обычно падает с непонятной ошибкой парсинга на две строки позже.

> **TIP**
> Если компонент растёт дальше ~100 строк — выносите кусок. Экран должен читаться как оглавление из маленьких компонентов, у каждого одно занятие и имя, говорящее, что оно делает.
