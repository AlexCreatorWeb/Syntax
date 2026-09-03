---
id: react-api19
track: react
type: reference
section: reference
order: 3
title:
  en: "React 19 API"
  ru: "React 19: API"
excerpt:
  en: "What React 19 adds — useActionState, useFormStatus, useOptimistic, use(), refs as props, form actions — and what it removes."
  ru: "Что добавляет React 19 — useActionState, useFormStatus, useOptimistic, use(), ref как prop, form actions — и что он убирает."
version: "react 19"
updated: 2026-09-03
---

React 19 (the stable release of December 2024) is the version this track is written against. This page collects what is new and what is gone, so you can read React 19 code without guessing.

## New hooks for actions and state

| Hook | Signature | What it does |
| --- | --- | --- |
| `useActionState` | `useActionState(action, pending)` | runs a form action, tracks its state and a pending flag |
| `useFormStatus` | `useFormStatus()` | `{ pending, method, action }` of the nearest enclosing form |
| `useOptimistic` | `useOptimistic(state, reduce)` | shows an optimistic update before the action settles |
| `use()` | `use(promise / context)` | read a promise or context directly; suspends until it resolves |

The first three close the loop around forms without a single `useEffect`: the action, the pending state, and the display all live in hooks.

```jsx
import { useActionState, useFormStatus } from "react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending}>
      {pending ? "Saving…" : "Save"}
    </button>
  );
}

function ProfileForm() {
  const [state, formAction, pending] = useActionState(
    async (prev, formData) => {
      const email = formData.get("email");
      await saveEmail(email);
      return { ok: true, email };
    },
    null
  );

  return (
    <form action={formAction}>
      <input name="email" />
      <SubmitButton />
      {state && state.ok && <p>Saved {state.email}</p>}
    </form>
  );
}
```

`useFormStatus` can live in a deeply nested button: it reads the status of the nearest form without any prop drilling. `useOptimistic` is the companion for "optimistic UI": render the intended state immediately, and React rolls it back if the action fails.

## Refs are props now

`ref` is a regular prop on function components, so `forwardRef` is no longer needed. You can also pass a ref to any component and take a cleanup function as the second ref argument.

```jsx
function Avatar({ src, alt, ref }) {
  return <img src={src} alt={alt} ref={ref} />;
}

function App() {
  const imgRef = null; // in real code: useRef(null)
  return <Avatar src="me.png" alt="Me" ref={imgRef} />;
}
```

`forwardRef` still works in React 19, but new code should just declare `ref` in the props. The change is mechanical: remove the wrapper, add the prop, and the consumers do not change at all.

## Forms, actions, and metadata

React 19 treats the form as a first-class citizen. `form action={fn}` submits through JavaScript when it is available and still works as a plain POST when it is not — progressive enhancement without an extra library.

```jsx
function Login() {
  async function login(formData) {
    const email = formData.get("email");
    const password = formData.get("password");
    await signIn(email, password);
    // redirect or update state here
  }

  return (
    <form action={login}>
      <input name="email" />
      <input name="password" type="password" />
      <button type="submit">Log in</button>
    </form>
  );
}
```

Document metadata is another new citizen: `title`, `meta`, `link`, and `script` elements written in the tree are hoisted to `head` automatically, so a component can carry its own title.

```jsx
function LessonPage() {
  return (
    <>
      <title>Syntax — Lesson 5</title>
      <meta name="description" content="Functions and callbacks" />
      <main>Lesson content…</main>
    </>
  );
}
```

The asset-loading helpers on `react` (`preconnect`, `preload`, `preinit`, `prestore`, `migrate`) preload fonts, scripts, and styles from the server side, so the first paint is not blocked on a CDN round-trip.

## Removed and deprecated

| API | Status in React 19 |
| --- | --- |
| `forwardRef` | works, but `ref` is a prop now — no wrapper needed |
| string refs (`ref="img"`) | removed |
| legacy context (`childContextTypes`) | removed |
| `defaultProps` on function components | removed — use default parameter values |
| `ReactDOM.render` / `ReactDOM.hydrate` | removed — use `createRoot` / `hydrateRoot` |
| `react-test-renderer` | deprecated — test against the DOM or Testing Library |
| `useContext` inside a component's render with a new context object | still works, but the context object must stay stable |

The `defaultProps` removal is the one that bites during migration: move the defaults into the destructuring pattern (`function Card({ size = "md" })`) and the codemod will do the rest.

> **TIP**
> Upgrade path: run the official React 19 codemods before bumping the dependency. They rewrite `forwardRef` wrappers and `defaultProps` mechanically, so the diff stays reviewable.

> **WARNING**
> `use()` suspends: reading a pending promise inside it makes the nearest `Suspense` boundary wait. Wrap the component in `<Suspense>` or the whole subtree will freeze.

<!-- RU -->

React 19 (стабильный релиз декабря 2024) — версия, под которую написан этот трек. Эта страница собирает, что нового и чего больше нет, чтобы вы читали код на React 19 без гаданий.

## Новые хуки для actions и state

| Хук | Сигнатура | Что делает |
| --- | --- | --- |
| `useActionState` | `useActionState(action, pending)` | запускает form action, отслеживает его state и pending-флаг |
| `useFormStatus` | `useFormStatus()` | `{ pending, method, action }` ближайшей окружающей формы |
| `useOptimistic` | `useOptimistic(state, reduce)` | показывает optimistic-обновление до того, как action завершится |
| `use()` | `use(promise / context)` | читать promise или context напрямую; suspend до резолва |

Три первых замыкают цикл вокруг форм без единого `useEffect`: action, pending-состояние и отображение живут в хуках.

```jsx
import { useActionState, useFormStatus } from "react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending}>
      {pending ? "Saving…" : "Save"}
    </button>
  );
}

function ProfileForm() {
  const [state, formAction, pending] = useActionState(
    async (prev, formData) => {
      const email = formData.get("email");
      await saveEmail(email);
      return { ok: true, email };
    },
    null
  );

  return (
    <form action={formAction}>
      <input name="email" />
      <SubmitButton />
      {state && state.ok && <p>Saved {state.email}</p>}
    </form>
  );
}
```

`useFormStatus` может жить в глубоко вложенной кнопке: он читает статус ближайшей формы без всякого проп-дриллинга. `useOptimistic` — компаньон для «optimistic UI»: мгновенно отрисуйте intended-состояние, а React откатит его, если action упадёт.

## Ref теперь — обычный prop

`ref` — обычный prop функциональных компонентов, поэтому `forwardRef` больше не нужен. Ref можно передать любому компоненту, а вторым аргументом ref'а — cleanup-функцию.

```jsx
function Avatar({ src, alt, ref }) {
  return <img src={src} alt={alt} ref={ref} />;
}

function App() {
  const imgRef = null; // в настоящем коде: useRef(null)
  return <Avatar src="me.png" alt="Me" ref={imgRef} />;
}
```

`forwardRef` в React 19 ещё работает, но новый код просто объявляет `ref` в props. Изменение механическое: уберите обёртку, добавьте prop — потребители вообще не меняются.

## Формы, actions и метаданные

React 19 относит форму к первоклассным гражданам. `form action={fn}` сабмитится через JavaScript, когда он доступен, и работает как обычный POST, когда нет — progressive enhancement без отдельной библиотеки.

```jsx
function Login() {
  async function login(formData) {
    const email = formData.get("email");
    const password = formData.get("password");
    await signIn(email, password);
    // здесь редирект или обновление state
  }

  return (
    <form action={login}>
      <input name="email" />
      <input name="password" type="password" />
      <button type="submit">Log in</button>
    </form>
  );
}
```

Документные метаданные — ещё один новый гражданин: элементы `title`, `meta`, `link` и `script`, написанные в дереве, автоматически поднимаются в `head`, поэтому компонент может нести собственный заголовок.

```jsx
function LessonPage() {
  return (
    <>
      <title>Syntax — Lesson 5</title>
      <meta name="description" content="Functions and callbacks" />
      <main>Lesson content…</main>
    </>
  );
}
```

Хелперы загрузки ассетов на `react` (`preconnect`, `preload`, `preinit`, `prestore`, `migrate`) досрочно подгружают шрифты, скрипты и стили со стороны сервера, чтобы первый paint не блокировался на round-trip до CDN.

## Убрано и deprecated

| API | Статус в React 19 |
| --- | --- |
| `forwardRef` | работает, но `ref` теперь prop — обёртка не нужна |
| string refs (`ref="img"`) | убраны |
| legacy context (`childContextTypes`) | убран |
| `defaultProps` у функциональных компонентов | убраны — используйте дефолты в параметрах |
| `ReactDOM.render` / `ReactDOM.hydrate` | убраны — используйте `createRoot` / `hydrateRoot` |
| `react-test-renderer` | deprecated — тестируйте против DOM или Testing Library |
| нестабильный context-объект в `useContext` | по-прежнему работает, но объект context обязан быть стабильным |

Удаление `defaultProps` — единственное, что больно при миграции: перенесите дефолты в деструктурирующий паттерн (`function Card({ size = "md" })`), и codemod сделает остальное.

> **TIP**
> Путь апгрейда: прогоните официальные React 19 codemod'ы до повышения зависимости. Они механически переписывают обёртки `forwardRef` и `defaultProps`, поэтому diff остаётся ревьюабельным.

> **WARNING**
> `use()` suspend'ит: чтение pending-promise внутри него заставляет ближайшую `Suspense`-границу ждать. Оберните компонент в `<Suspense>`, иначе замрзнет всё поддерево.
