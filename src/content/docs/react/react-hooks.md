---
id: react-hooks
track: react
type: guide
section: hooks
order: 3
title:
  en: "Hooks: useState & useEffect"
  ru: "Хуки: useState и useEffect"
excerpt:
  en: "The two hooks you use daily: declaring state with useState, running side effects with useEffect, plus cleanup, dependencies, and your first custom hook."
  ru: "Два хука, которые вы используете каждый день: объявление state через useState, side effects через useEffect, плюс cleanup, зависимости и первый собственный хук."
version: "react 19"
updated: 2026-09-03
relatedTask: react-005
---

Hooks let function components keep state and run side effects. This guide covers the two hooks you will use every day — `useState` and `useEffect` — plus cleanup functions, dependency arrays, and extracting your first custom hook.

## useState in detail

Each `useState` call declares one independent piece of state, and a component can declare as many as it needs. React tracks the pieces by their position in the function body, which is why the calls must stay in the same order on every render — the rules of hooks exist for that reason.

```jsx
import { useState } from "react";

function Settings() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState("dark");

  const toggleTheme = () =>
    setTheme(theme === "dark" ? "light" : "dark");

  return (
    <section>
      <button onClick={() => setOpen(!open)}>
        {open ? "Hide" : "Show"}
      </button>
      <button onClick={toggleTheme}>Theme: {theme}</button>
    </section>
  );
}
```

The first argument is the initial value, read once on the first render. If computing it is expensive, pass a function instead of a value — lazy initialization: `useState(() => loadExpensive())`. The function form runs exactly once; the plain form runs the expression on every render and then discards the result.

There is no way to read the current state from outside a render or a callback — and that is by design. If you need the value in a timer or a handler that outlives the render, capture it in the effect that created them, or use the functional setter form, which always sees the latest value.

## useEffect: side effects after render

`useEffect` runs your code after React has committed the render to the screen. It is the bridge between the React world (state, props) and everything else: the network, timers, the DOM, subscriptions. The first argument is the effect function; the optional second argument is the dependency array that controls when the effect re-runs.

```jsx
import { useState, useEffect } from "react";

function Status() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // runs after the first render
    setReady(true);
  }, []);

  return <p>{ready ? "mounted" : "loading"}</p>;
}
```

An empty array means "run once, after mount". No array at all means "after every render" — rarely what you want. A list of values means "re-run when any of them changes". The correct answer is mechanical: list exactly the state and props the effect reads.

Effects run after paint, so the user may briefly see the old screen before the effect fires. That is why you do not use effects for derived data or for mirroring props into state — do both in the render body. Effects are for the outside world.

> **WARNING**
> Setting state in an effect with no dependency array re-runs the effect after every render, which sets state again — an infinite loop. If a page spins forever in devtools, check the dependency array first.

## Cleanup: the return function

When an effect subscribes to something — an event, a timer, a websocket — the function it returns runs before the effect runs again and on unmount. It is how you release what you grabbed.

```jsx
import { useState, useEffect } from "react";

function Countdown({ seconds }) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    const id = setInterval(() => setLeft((s) => s - 1), 1000);
    // cleanup: before the next run and on unmount
    return () => clearInterval(id);
  }, [seconds]);

  return <span>{left}</span>;
}
```

Without the cleanup you get duplicate subscriptions: the timer from the first run keeps ticking, the event listener fires twice, and memory is never released. The rule is symmetric — every `addEventListener` gets a `removeEventListener`, every `setTimeout` gets a `clearTimeout`, every subscription gets a cancel.

StrictMode makes the cleanup behavior visible: in development it mounts, unmounts, and remounts every component. An effect whose setup and cleanup are not perfectly paired will show its duplicate subscriptions immediately, while the code is still small enough to fix cheaply.

## Dependencies and stale closures

An effect captures the values it reads from the render in which it was created. If those values change but the dependency array does not, the effect keeps seeing the old ones — a stale closure. The cure is to list every reactive value the effect reads in the dependency array.

```jsx
import { useState, useEffect } from "react";

function Search({ query }) {
  const [results, setResults] = useState([]);

  useEffect(() => {
    let alive = true;
    searchApi(query).then((items) => {
      if (alive) setResults(items);
    });
    return () => {
      alive = false; // discard results from the previous query
    };
  }, [query]); // without [query] the effect sees the first query forever

  return (
    <ul>
      {results.map((r) => (
        <li key={r}>{r}</li>
      ))}
    </ul>
  );
}
```

The `alive` flag is the companion to dependencies: it discards results that arrive too late, after the query has already changed. Together they make async effects predictable.

> **TIP**
> When an effect misbehaves, read it out loud: "this effect re-runs when X changes, and cleans up right before". If you cannot say it in one sentence, the dependency array is lying.

## Custom hooks

When the same state-plus-effect pair appears in several components, extract it into a custom hook — a function whose name starts with `use` and which calls other hooks. The hook owns the logic; the components consume a clean API.

```jsx
import { useState } from "react";

function useCounter(initial) {
  const [value, setValue] = useState(initial);
  return {
    value,
    increment: () => setValue((v) => v + 1),
    decrement: () => setValue((v) => v - 1),
    reset: () => setValue(initial),
  };
}

function App() {
  const { value, increment, decrement, reset } = useCounter(0);
  return (
    <>
      <span>{value}</span>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
      <button onClick={reset}>reset</button>
    </>
  );
}
```

A custom hook is not a new kind of hook — it is a recurring code shape that became a convention. If two components share a `useState` + `useEffect` block, extract it; the third copy confirms the pattern.

<!-- RU -->

Хуки позволяют функциональным компонентам хранить state и выполнять side effects. Этот гайд разбирает два хука, которые вы будете использовать каждый день, — `useState` и `useEffect` — плюс функции cleanup, массивы зависимостей и выделение первого собственного хука.

## useState в деталях

Каждый вызов `useState` объявляет один независимый кусок state, а компонент может объявить сколько угодно таких кусков. React отслеживает их по позиции в теле функции, поэтому вызовы обязаны оставаться в одном порядке на каждом рендере — правила хуков существуют именно из-за этого.

```jsx
import { useState } from "react";

function Settings() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState("dark");

  const toggleTheme = () =>
    setTheme(theme === "dark" ? "light" : "dark");

  return (
    <section>
      <button onClick={() => setOpen(!open)}>
        {open ? "Hide" : "Show"}
      </button>
      <button onClick={toggleTheme}>Theme: {theme}</button>
    </section>
  );
}
```

Первый аргумент — начальное значение, считывается один раз на первом рендере. Если вычислить его дорого, передайте функцию вместо значения — lazy-инициализация: `useState(() => loadExpensive())`. Функциональная форма выполняется ровно один раз; обычная — выражение считается на каждом рендере, а результат выкидывается.

Считать текущий state извне рендера или callback'а нельзя — и это осознанное решение. Если значение нужно в таймере или обработчике, которые переживают рендер, захватите их в эффекте, который создал таймеры, или используйте функциональную форму setter'а — она всегда видит последнее значение.

## useEffect: side effects после рендера

`useEffect` выполняет ваш код после того, как React закоммитил рендер на экран. Это мост между миром React (state, props) и всем остальным: сетью, таймерами, DOM, подписками. Первый аргумент — функция эффекта; опциональный второй — массив зависимостей, который управляет повторным запуском эффекта.

```jsx
import { useState, useEffect } from "react";

function Status() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // выполняется после первого рендера
    setReady(true);
  }, []);

  return <p>{ready ? "mounted" : "loading"}</p>;
}
```

Пустой массив означает «один раз, после mount». Нет массива вовсе — «после каждого рендера», что почти никогда не нужно. Список значений — «перезапустить, когда изменится хотя бы одно». Правильный ответ механический: перечислите ровно тот state и props, которые читает эффект.

Эффекты выполняются после paint, поэтому пользователь может коротко увидеть старый экран до срабатывания эффекта. Поэтому эффекты не используются для производных данных и для копирования props в state — и то и другое делается в теле рендера. Эффекты — для внешнего мира.

> **WARNING**
> Установка state в эффекте без массива зависимостей перезапускает эффект после каждого рендера, что снова устанавливает state — бесконечный цикл. Если страница крутится бесконечно в devtools, сначала проверьте массив зависимостей.

## Cleanup: функция возврата

Когда эффект подписывается на что-то — событие, таймер, websocket — возвращаемая им функция выполняется перед следующим запуском эффекта и при unmount. Так вы отпускаете то, что взяли.

```jsx
import { useState, useEffect } from "react";

function Countdown({ seconds }) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    const id = setInterval(() => setLeft((s) => s - 1), 1000);
    // cleanup: перед следующим запуском и при unmount
    return () => clearInterval(id);
  }, [seconds]);

  return <span>{left}</span>;
}
```

Без cleanup вы получаете дублированные подписки: таймер первого запуска продолжает тикать, event listener срабатывает дважды, память так и не освобождается. Правило симметричное: на каждый `addEventListener` — `removeEventListener`, на каждый `setTimeout` — `clearTimeout`, на каждую подписку — отмена.

StrictMode делает поведение cleanup видимым: в dev он монтирует, размонтирует и снова монтирует каждый компонент. Эффект, чья setup и cleanup не сбалансированы, покажет дублированные подписки сразу, пока код ещё достаточно мал, чтобы починить это дёшево.

## Зависимости и устаревшие замыкания

Эффект захватывает значения, которые он читает, из рендера, в котором был создан. Если эти значения меняются, а массив зависимостей — нет, эффект видит старые — stale closure. Лечение: перечислить в массиве зависимостей каждое реактивное значение, которое эффект читает.

```jsx
import { useState, useEffect } from "react";

function Search({ query }) {
  const [results, setResults] = useState([]);

  useEffect(() => {
    let alive = true;
    searchApi(query).then((items) => {
      if (alive) setResults(items);
    });
    return () => {
      alive = false; // отбрасываем результаты предыдущего запроса
    };
  }, [query]); // без [query] эффект вечно видит первый query

  return (
    <ul>
      {results.map((r) => (
        <li key={r}>{r}</li>
      ))}
    </ul>
  );
}
```

Флаг `alive` — спутник зависимостей: он отбрасывает результаты, пришедшие слишком поздно, после того как запрос уже сменился. Вместе они делают асинхронные эффекты предсказуемыми.

> **TIP**
> Если эффект ведёт себя странно, прочитайте его вслух: «этот эффект перезапускается, когда меняется X, и до этого делает cleanup». Если не удалось сказать одним предложением — массив зависимостей врёт.

## Собственные хуки

Когда одна и та же связка state плюс эффект появляется в нескольких компонентах, вынесите её в custom hook — функцию, имя которой начинается с `use` и которая вызывает другие хуки. Логика живёт в хуке, компоненты потребляют чистый API.

```jsx
import { useState } from "react";

function useCounter(initial) {
  const [value, setValue] = useState(initial);
  return {
    value,
    increment: () => setValue((v) => v + 1),
    decrement: () => setValue((v) => v - 1),
    reset: () => setValue(initial),
  };
}

function App() {
  const { value, increment, decrement, reset } = useCounter(0);
  return (
    <>
      <span>{value}</span>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
      <button onClick={reset}>reset</button>
    </>
  );
}
```

Custom hook — это не новый вид хука, а повторяющаяся форма кода, ставшая конвенцией. Если два компонента делят блок `useState` + `useEffect` — выносите; третий экземпляр подтверждает паттерн.
