---
id: react-hooksref
track: react
type: reference
section: reference
order: 1
title:
  en: "Hooks Quick Reference"
  ru: "Хуки: шпаргалка"
excerpt:
  en: "Every built-in React hook on one page: signature, return value, and when to reach for it. A bookmark-worthy cheat sheet."
  ru: "Все встроенные хуки React на одной странице: сигнатура, возвращаемое значение и когда применять. Шпаргалка для закладки."
version: "react 19"
updated: 2026-09-03
---

Every built-in hook in one screen: the signature, what comes back, and the job it is for. Keep this page open while you code and look up the shape instead of the docs.

## Core hooks

| Hook | Signature | Returns | Use for |
| --- | --- | --- | --- |
| `useState` | `useState(initial)` | `[value, setValue]` | any piece of UI state |
| `useEffect` | `useEffect(fn, deps?)` | void; `fn` may return a cleanup | side effects: network, timers, subscriptions |
| `useReducer` | `useReducer(reducer, initial)` | `[state, dispatch]` | complex or multi-field state transitions |
| `useMemo` | `useMemo(fn, deps)` | the computed value | expensive computation between renders |
| `useCallback` | `useCallback(fn, deps)` | a stable function reference | passing handlers to memoized children |
| `useRef` | `useRef(initial)` | `{ current }`, stable across renders | DOM nodes, mutable values without re-render |

Choosing between `useState` and `useReducer`: if you can express every update as "set this value to that", stay with `useState`. Reach for `useReducer` when updates depend on the previous state in several fields at once, or when the transition logic deserves its own name and tests.

```jsx
import { useReducer } from "react";

function reducer(state, action) {
  switch (action.type) {
    case "inc":
      return { ...state, count: state.count + 1 };
    case "reset":
      return { ...state, count: 0 };
    default:
      return state;
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });
  return (
    <>
      <span>{state.count}</span>
      <button onClick={() => dispatch({ type: "inc" })}>+1</button>
      <button onClick={() => dispatch({ type: "reset" })}>reset</button>
    </>
  );
}
```

The reducer is a pure function — `(state, action) => next state` — which means you can unit-test it without rendering anything. `dispatch` is stable for the lifetime of the component, so it is safe to pass deep into the tree.

## Memoization and refs

`useMemo` and `useCallback` are about identity, not speed: they make the result (or the function) keep the same reference between renders as long as the dependencies do not change. You need them when a child is wrapped in `React.memo` or when an effect depends on a function reference.

```jsx
import { useState, useMemo, useCallback } from "react";

function SortList() {
  const items = [3, 1, 2];
  const [sort, setSort] = useState("asc");

  const sorted = useMemo(
    () => [...items].sort((a, b) => (sort === "asc" ? a - b : b - a)),
    [items, sort]
  );

  const toggle = useCallback(
    () => setSort((s) => (s === "asc" ? "desc" : "asc")),
    []
  );

  return (
    <>
      <ul>
        {sorted.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
      <button onClick={toggle}>Sort: {sort}</button>
    </>
  );
}
```

`useRef` is the escape hatch from the re-render loop: the `current` property survives re-renders and writing to it does not schedule one. Use it for DOM nodes, timers, or the last value a callback saw.

```jsx
import { useRef } from "react";

function FocusCounter() {
  const inputRef = useRef(null);
  const clicks = useRef(0); // survives renders, no re-render on change

  return (
    <>
      <input ref={inputRef} />
      <button
        onClick={() => {
          clicks.current += 1;
          inputRef.current.focus();
        }}
      >
        Focus (clicked {clicks.current} times)
      </button>
    </>
  );
}
```

> **TIP**
> The dependency array should contain every reactive value the function reads. Enable `exhaustive-deps` from `eslint-plugin-react-hooks` and let the linter argue with you before the runtime does.

> **WARNING**
> `useEffect(fn, [x])` with a missing `x` reads a stale `x` forever. If an effect "works on the first render and then dies", suspect the dependency array before anything else.

## Context and the rest

| Hook | What it does |
| --- | --- |
| `useContext(Ctx)` | read the value from the nearest provider |
| `useId()` | a stable unique string for `id` and `aria-*` attributes |
| `useTransition()` | mark an update as non-urgent so the UI stays responsive |
| `useDeferredValue(value)` | a lagging copy of a value, for expensive re-renders |
| `useSyncExternalStore(sub, get)` | subscribe to an external store (the foundation of Zustand and Redux) |
| `useDebugValue(value)` | label your custom hook in React DevTools |

Context pairs with `createContext` and a provider: the provider sets the value, `useContext` reads the nearest one. Reach for context when five-plus components at different depths need the same value — for one or two levels, props are cheaper and more honest.

```jsx
import { createContext, useContext, useId } from "react";

const ThemeContext = createContext("dark");

function ThemedButton({ children }) {
  const theme = useContext(ThemeContext);
  const id = useId();

  return (
    <button id={id} className={"btn " + theme}>
      {children}
    </button>
  );
}

function App() {
  return (
    <ThemeContext.Provider value="light">
      <ThemedButton>OK</ThemedButton>
    </ThemeContext.Provider>
  );
}
```

`useId` matters for accessible widgets: a `useId()` value can be wired between a label and its input without colliding with duplicated ids on the page, which is exactly the situation you get when the same component renders twice.

<!-- RU -->

Все встроенные хуки на одном экране: сигнатура, что возвращается и для какой задачи хук. Держите эту страницу открытой во время кодинга и смотрите форму, а не гуглите.

## Основные хуки

| Хук | Сигнатура | Возвращает | Для чего |
| --- | --- | --- | --- |
| `useState` | `useState(initial)` | `[value, setValue]` | любой кусок UI state |
| `useEffect` | `useEffect(fn, deps?)` | void; `fn` может вернуть cleanup | side effects: сеть, таймеры, подписки |
| `useReducer` | `useReducer(reducer, initial)` | `[state, dispatch]` | сложные переходы состояния, несколько полей |
| `useMemo` | `useMemo(fn, deps)` | вычисленное значение | дорогое вычисление между рендерами |
| `useCallback` | `useCallback(fn, deps)` | стабильная ссылка на функцию | передача handlers в мемоизированные children |
| `useRef` | `useRef(initial)` | `{ current }`, стабилен между рендерами | DOM-узлы, изменяемые значения без перерисовки |

Выбор между `useState` и `useReducer`: если каждое обновление можно выразить как «поставь это значение в то», оставайтесь на `useState`. Переходите на `useReducer`, когда обновления зависят от прежнего state сразу в нескольких полях, или когда логика переходов заслуживает собственного имени и тестов.

```jsx
import { useReducer } from "react";

function reducer(state, action) {
  switch (action.type) {
    case "inc":
      return { ...state, count: state.count + 1 };
    case "reset":
      return { ...state, count: 0 };
    default:
      return state;
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });
  return (
    <>
      <span>{state.count}</span>
      <button onClick={() => dispatch({ type: "inc" })}>+1</button>
      <button onClick={() => dispatch({ type: "reset" })}>reset</button>
    </>
  );
}
```

Reducer — чистая функция `(state, action) => next state`, поэтому её можно юнит-тестировать без рендеринга. `dispatch` стабилен за время жизни компонента, поэтому его безопасно передавать глубоко в дерево.

## Мемоизация и refs

`useMemo` и `useCallback` — про идентичность, а не про скорость: они держат результат (или функцию) с той же ссылкой между рендерами, пока зависимости не меняются. Они нужны, когда ребёнок обёрнут в `React.memo` или когда эффект зависит от ссылки на функцию.

```jsx
import { useState, useMemo, useCallback } from "react";

function SortList() {
  const items = [3, 1, 2];
  const [sort, setSort] = useState("asc");

  const sorted = useMemo(
    () => [...items].sort((a, b) => (sort === "asc" ? a - b : b - a)),
    [items, sort]
  );

  const toggle = useCallback(
    () => setSort((s) => (s === "asc" ? "desc" : "asc")),
    []
  );

  return (
    <>
      <ul>
        {sorted.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
      <button onClick={toggle}>Sort: {sort}</button>
    </>
  );
}
```

`useRef` — выход из петли перерисовок: свойство `current` переживает ре-рендеры, и запись в него не выставляет перерисовку. Используйте для DOM-узлов, таймеров и последнего значения, которое видел callback.

```jsx
import { useRef } from "react";

function FocusCounter() {
  const inputRef = useRef(null);
  const clicks = useRef(0); // переживает рендеры, без перерисовки

  return (
    <>
      <input ref={inputRef} />
      <button
        onClick={() => {
          clicks.current += 1;
          inputRef.current.focus();
        }}
      >
        Focus (clicked {clicks.current} times)
      </button>
    </>
  );
}
```

> **TIP**
> В массиве зависимостей — каждое реактивное значение, которое читает функция. Включите `exhaustive-deps` из `eslint-plugin-react-hooks` и пусть линтер поспорит с вами до того, как начнёт спорить рантайм.

> **WARNING**
> `useEffect(fn, [x])` без `x` вечно читает устаревший `x`. Если эффект «работает на первом рендере, потом умирает» — сначала подозревайте массив зависимостей.

## Context и остальные

| Хук | Что делает |
| --- | --- |
| `useContext(Ctx)` | читает значение из ближайшего провайдера |
| `useId()` | стабильная уникальная строка для `id` и `aria-*` атрибутов |
| `useTransition()` | помечает обновление как не срочное, UI остаётся отзывчивым |
| `useDeferredValue(value)` | «догоняющая» копия значения для дорогих ре-рендеров |
| `useSyncExternalStore(sub, get)` | подписка на внешний стор (фундамент Zustand и Redux) |
| `useDebugValue(value)` | подпись вашего custom hook в React DevTools |

Context работает в паре с `createContext` и провайдером: провайдер задаёт значение, `useContext` читает ближайшее. Упирайтесь в context, когда пять и более компонентов на разной глубине нужны с одним и тем же значением; для одного-двух уровней props дешевле и честнее.

```jsx
import { createContext, useContext, useId } from "react";

const ThemeContext = createContext("dark");

function ThemedButton({ children }) {
  const theme = useContext(ThemeContext);
  const id = useId();

  return (
    <button id={id} className={"btn " + theme}>
      {children}
    </button>
  );
}

function App() {
  return (
    <ThemeContext.Provider value="light">
      <ThemedButton>OK</ThemedButton>
    </ThemeContext.Provider>
  );
}
```

`useId` важен для доступных виджетов: значение `useId()` можно связать между label и его input без коллизий с продублированными id на странице — ровно та ситуация, когда один и тот же компонент рендерится дважды.
