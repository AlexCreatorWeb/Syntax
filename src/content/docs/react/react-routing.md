---
id: react-routing
track: react
type: guide
section: patterns
order: 6
title:
  en: "Routing & Composition"
  ru: "Роутинг и композиция"
excerpt:
  en: "How an SPA switches screens: a working hash-based router from scratch, dynamic routes with params, and layout composition."
  ru: "Как SPA переключает экраны: рабочий hash-роутер с нуля, динамические роуты с параметрами и композиция layout'а."
version: "react 19"
updated: 2026-09-03
---

An SPA switches what the user sees without a full page reload. This guide builds a working router from scratch — hash-based, with zero dependencies — so you can see how routing works under the hood, and then shows the same ideas in the react-router vocabulary.

## Why a router

In a multi-page app the server decides which HTML file to send; in a single-page app one bundle is loaded once and JavaScript decides what to show. The URL is still the contract: the user expects the back button to work, refresh to keep the current screen, and a link to the lesson page to open the lesson page.

A router is just state derived from the URL plus the logic that swaps subtrees. Three parts:

1. A source of truth — the current URL (the hash, in our version).
2. A table of routes — which name or component each URL maps to.
3. A render branch — the tree that shows the matched component inside a persistent layout.

Everything else — nested routes, lazy loading, transitions — is elaboration of these three parts.

## A minimal hash router

The browser fires a `hashchange` event whenever the part of the URL after `#` changes. Listening to that event inside an effect gives you a reactive URL with no library.

```jsx
import { useState, useEffect } from "react";

function useHashRoute() {
  const [hash, setHash] = useState(window.location.hash || "#/");

  useEffect(() => {
    const onChange = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return hash;
}
```

The hash is the right choice for a learning sandbox: it works on any static host with zero server configuration, and it is exactly what this platform's own navigation uses. For production you would use the real path with the History API — react-router does this for you.

## Routes as data

With the URL in state, a route table is just an object, and the matched page is a lookup. The layout stays mounted; only the content branch changes.

```jsx
import { useHashRoute } from "./useHashRoute";

const PAGES = {
  "#/": "home",
  "#/lessons": "lessons",
  "#/settings": "settings",
};

function App() {
  const hash = useHashRoute();
  const page = PAGES[hash] || "home";

  return (
    <Layout>
      <nav>
        <a href="#/">Home</a>
        <a href="#/lessons">Lessons</a>
        <a href="#/settings">Settings</a>
      </nav>
      {page === "home" && <Home />}
      {page === "lessons" && <Lessons />}
      {page === "settings" && <Settings />}
    </Layout>
  );
}
```

`<a href="#/lessons">` does all the navigation work: the browser updates the hash, the event fires, the state updates, and the tree re-renders. No `pushState`, no manual URL writing — the anchors are the API.

The `|| "home"` fallback is your 404: any unknown hash renders a default page instead of a blank screen.

## Dynamic routes and params

A route like `#/lessons/42` is matched with a regex that extracts the param. The param becomes a prop, so the page component is just a component with an input.

```jsx
import { useHashRoute } from "./useHashRoute";

function lessonIdFrom(hash) {
  const m = hash.match(/^#\/lessons\/(\d+)$/);
  return m ? Number(m[1]) : null;
}

function App() {
  const hash = useHashRoute();
  const lessonId = lessonIdFrom(hash);

  if (lessonId !== null) return <Layout><Lesson id={lessonId} /></Layout>;
  if (hash === "#/lessons") return <Layout><Lessons /></Layout>;
  return <Layout><Home /></Layout>;
}
```

The order of matching matters: the most specific pattern first (`#/lessons/:id`), then the list, then the default. When the param arrives as a prop, fetching the lesson data is exactly the pattern from the data-fetching guide — an effect that depends on `id`.

> **WARNING**
> A route component that holds local state must reset when the route changes — give the current page `key={hash}` or a route-specific key. Without a key, React reuses the component instance and the stale state survives the navigation.

## Layout, composition, and react-router

The layout is the persistent part: header, nav, footer render once and never unmount. The outlet is the part that swaps. This is the same idea as `children` from the components guide, applied at the route level.

```jsx
function Layout({ children }) {
  return (
    <>
      <header>Syntax</header>
      <nav>
        <a href="#/">Home</a>
        <a href="#/lessons">Lessons</a>
      </nav>
      <main>{children}</main>
      <footer>© Syntax</footer>
    </>
  );
}
```

In production you will reach for react-router, which packages the same ideas behind `Routes`, `Route`, and `useParams`:

```jsx
import { Routes, Route, useParams } from "react-router-dom";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/lessons" element={<Lessons />} />
      <Route path="/lessons/:id" element={<Lesson />} />
    </Routes>
  );
}

function Lesson() {
  const { id } = useParams();
  return <p>Lesson {id}</p>;
}
```

Notice how little changed: the table became `Route` components, the regex became the `:id` pattern, and the prop became a hook. The hand-rolled router above exists so that when you read that code, you are not seeing magic.

> **TIP**
> Keep route components thin: the route matches, a named page component renders, and data fetching lives in the page or in a hook. The router file should read like a sitemap.

<!-- RU -->

SPA переключает то, что видит пользователь, без полной перезагрузки страницы. Этот гайд собирает рабочий роутер с нуля — hash-based, без зависимостей — чтобы вы видели, как роутинг работает под капотом, а затем показывает те же идеи в лексике react-router.

## Зачем роутер

В multi-page приложении сервер решает, какой HTML-файл отправить; в single-page приложении один бандл загружается один раз, и JavaScript решает, что показывать. URL при этом остаётся контрактом: пользователь ждёт, что кнопка «назад» будет работать, refresh сохранит текущий экран, а ссылка на страницу урока открывала страницу урока.

Роутер — это просто state, производный от URL, плюс логика, которая меняет поддеревья. Три части:

```jsx
// 1. Источник правды — текущий URL (у нас — hash)
// 2. Таблица роутов — какому имени или компоненту соответствует URL
// 3. Рендер-ветка — дерево, показывающее соотвествующий компонент в персистируемом layout
```

Всё остальное — вложенные роуты, lazy loading, переходы — это развитие этих трёх частей.

## Минимальный hash-роутер

Браузер стреляет событие `hashchange`, когда меняется часть URL после `#`. Слушание этого события внутри эффекта даёт реактивный URL без библиотеки.

```jsx
import { useState, useEffect } from "react";

function useHashRoute() {
  const [hash, setHash] = useState(window.location.hash || "#/");

  useEffect(() => {
    const onChange = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return hash;
}
```

Hash — правильный выбор для учебной песочницы: он работает на любом статическом хостинге без настроек сервера, и это ровно то, что использует собственная навигация этой платформы. Для продакшена вы бы использовали реальный путь с History API — это делает за вас react-router.

## Роуты как данные

Когда URL в state, таблица роутов — просто объект, а соотвествующая страница — обращение по ключу. Layout остаётся смонтированным; меняется только контентная ветка.

```jsx
import { useHashRoute } from "./useHashRoute";

const PAGES = {
  "#/": "home",
  "#/lessons": "lessons",
  "#/settings": "settings",
};

function App() {
  const hash = useHashRoute();
  const page = PAGES[hash] || "home";

  return (
    <Layout>
      <nav>
        <a href="#/">Home</a>
        <a href="#/lessons">Lessons</a>
        <a href="#/settings">Settings</a>
      </nav>
      {page === "home" && <Home />}
      {page === "lessons" && <Lessons />}
      {page === "settings" && <Settings />}
    </Layout>
  );
}
```

`<a href="#/lessons">` делает всю навигационную работу: браузер обновляет hash, срабатывает событие, state обновляется, дерево перерисовывается. Ни `pushState`, ни ручная запись URL — якоря и есть API.

Фолбэк `|| "home"` — ваш 404: любой неизвестный hash рендерит страницу по умолчанию, а не пустой экран.

## Динамические роуты и параметры

Роут вида `#/lessons/42` матчится regex'ом, который извлекает параметр. Параметр становится prop'ом, поэтому компонент страницы — обычный компонент с входом.

```jsx
import { useHashRoute } from "./useHashRoute";

function lessonIdFrom(hash) {
  const m = hash.match(/^#\/lessons\/(\d+)$/);
  return m ? Number(m[1]) : null;
}

function App() {
  const hash = useHashRoute();
  const lessonId = lessonIdFrom(hash);

  if (lessonId !== null) return <Layout><Lesson id={lessonId} /></Layout>;
  if (hash === "#/lessons") return <Layout><Lessons /></Layout>;
  return <Layout><Home /></Layout>;
}
```

Порядок матчинга важен: сначала самый специфичный паттерн (`#/lessons/:id`), затем список, затем дефолт. Когда параметр приходит как prop, загрузка данных урока — это ровно паттерн из гайда по загрузке данных: эффект, зависящий от `id`.

> **WARNING**
> Компонент роута, держащий локальный state, должен сбрасываться при смене роута — дайте текущей странице `key={hash}` или route-specific key. Без key React переиспользует инстанс компонента, и устаревший state переживает навигацию.

## Layout, композиция и react-router

Layout — персистируемая часть: шапка, навигация и футер рендерятся один раз и никогда не unmount'ятся. Outlet — та часть, которая меняется. Это та же идея, что `children` из гайда по компонентам, применённая на уровне роутов.

```jsx
function Layout({ children }) {
  return (
    <>
      <header>Syntax</header>
      <nav>
        <a href="#/">Home</a>
        <a href="#/lessons">Lessons</a>
      </nav>
      <main>{children}</main>
      <footer>© Syntax</footer>
    </>
  );
}
```

В проде вы упрётесь в react-router, который упаковывает те же идеи под `Routes`, `Route` и `useParams`:

```jsx
import { Routes, Route, useParams } from "react-router-dom";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/lessons" element={<Lessons />} />
      <Route path="/lessons/:id" element={<Lesson />} />
    </Routes>
  );
}

function Lesson() {
  const { id } = useParams();
  return <p>Lesson {id}</p>;
}
```

Заметьте, как мало изменилось: таблица стала компонентами `Route`, regex стал паттерном `:id`, а prop стал хуком. Собственный роутер выше существует для того, чтобы когда вы читаете этот код, вы видели не магию.

> **TIP**
> Держите route-компоненты тонкими: роут матчит, именованный компонент страницы рендерит, а загрузка данных живёт в странице или в хуке. Файл роутера должен читаться как карта сайта.
