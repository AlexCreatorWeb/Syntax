---
id: react-patterns
track: react
type: reference
section: reference
order: 2
title:
  en: "Component Patterns"
  ru: "Паттерны компонентов"
excerpt:
  en: "Lifting state up, compound components, render props, higher-order components, and custom hooks — when each pattern is the right tool."
  ru: "Lifting state up, compound-компоненты, render props, higher-order компоненты и custom hooks — когда какой паттерн уместен."
version: "react 19"
updated: 2026-09-03
relatedTask: react-009
---

Component patterns are the vocabulary for keeping a tree readable and reusable: where state should live, how a family of related parts should share it, and how logic moves between components. This page is the decision sheet with minimal working code for each pattern.

## Lifting state up

When two components need the same value, the state lives in their closest common ancestor: data flows down as props, events flow up as callbacks.

```jsx
import { useState } from "react";

function Counter({ value, onInc }) {
  return <button onClick={onInc}>{value}</button>;
}

function App() {
  const [count, setCount] = useState(0);
  return (
    <>
      <Counter value={count} onInc={() => setCount(count + 1)} />
      <p>Total: {count}</p>
    </>
  );
}
```

Signs you need it: a child renders something and a sibling must react to it, or a parent and a child both display the same number. The parent becomes the source of truth, the children become presenters. If you find the same state declared in two siblings, you are one level too low.

## Compound components

A family of related parts (tabs, toggles, accordions) shares state through a parent that renders the children. The parent knows the rules; the children stay passive.

```jsx
import { createContext, useContext, useState } from "react";

const ToggleContext = createContext(null);

function ToggleGroup({ children, onChange }) {
  const [value, setValue] = useState(null);
  const select = (v) => {
    setValue(v);
    if (onChange) onChange(v);
  };
  return (
    <ToggleContext.Provider value={{ value, select }}>
      <div role="group">{children}</div>
    </ToggleContext.Provider>
  );
}

function ToggleOption({ value, children }) {
  const group = useContext(ToggleContext);
  return (
    <label>
      <input
        type="radio"
        checked={group.value === value}
        onChange={() => group.select(value)}
      />
      {children}
    </label>
  );
}

function App() {
  return (
    <ToggleGroup>
      <ToggleOption value="a">First</ToggleOption>
      <ToggleOption value="b">Second</ToggleOption>
    </ToggleGroup>
  );
}
```

The API reads like markup: the parent declares the group, the children declare themselves. You never pass `checked` or `onChange` by hand, which removes a whole class of prop-drilling bugs.

## Render props

A component receives a function instead of children and calls it with data it owns. The consumer decides the shape; the provider owns the state.

```jsx
import { useState } from "react";

function MouseTracker({ render }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  return (
    <div onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}>
      {render(pos)}
    </div>
  );
}

function App() {
  return (
    <MouseTracker
      render={({ x, y }) => (
        <p>
          Cursor at {x}, {y}
        </p>
      )}
    />
  );
}
```

Render props predate context and remain useful when the shared data is dynamic per instance. If you catch yourself drilling the same value through three layers, a context or a custom hook is usually the cleaner move.

## Higher-order components

An HOC is a function that takes a component and returns a new one with extra behavior wrapped around it.

```jsx
import { useState } from "react";

function withLoading(Comp) {
  return function WithLoading({ loading, ...rest }) {
    const [mounted, setMounted] = useState(false);
    // side effect on mount goes here in a real effect
    if (!mounted) {
      queueMicrotask(() => setMounted(true));
    }
    if (loading) return <p>Loading…</p>;
    return <Comp {...rest} />;
  };
}

function UserCard({ name }) {
  return <strong>{name}</strong>;
}

const SafeCard = withLoading(UserCard);

function App() {
  return <SafeCard loading={false} name="Ada" />;
}
```

HOCs shine for cross-cutting concerns applied to many components at once (auth, analytics, loading states). They stack, they hide props, and they complicate TypeScript — which is why modern code reaches for a custom hook first and an HOC only when wrapping is truly the shape.

## How to choose

| Pattern | When to reach for it | Smell it removes |
| --- | --- | --- |
| Lifting state up | two components need one value | duplicated state in siblings |
| Compound components | a family of related parts (tabs, toggles) | boolean `variant` props, manual prop wiring |
| Render props | share dynamic data without context | prop drilling of the same value |
| HOC | cross-cutting wrapper on many components | copy-pasted wrapper logic |
| Custom hook | reusable state-plus-effect logic | duplicated `useState` + `useEffect` blocks |

> **TIP**
> When in doubt, choose the custom hook: it is the only pattern that never forces the tree to be restructured, and it composes with all the others.

> **WARNING**
> A chain of three HOCs is a readability wall. If `connect(withAuth(withLoading(Component)))` appears, the logic probably wants to be one custom hook that the component calls directly.

<!-- RU -->

Паттерны компонентов — лексика, которая держит дерево читаемым и переиспользуемым: где должен жить state, как семья связанных частей делит его и как логика перемещается между компонентами. Эта страница — таблица решений с минимальным рабочим кодом под каждый паттерн.

## Lifting state up (подъём состояния вверх)

Когда двум компонентам нужно одно и то же значение, state живёт в их ближайшем общем предке: данные текут вниз как props, события — вверх как callback'и.

```jsx
import { useState } from "react";

function Counter({ value, onInc }) {
  return <button onClick={onInc}>{value}</button>;
}

function App() {
  const [count, setCount] = useState(0);
  return (
    <>
      <Counter value={count} onInc={() => setCount(count + 1)} />
      <p>Total: {count}</p>
    </>
  );
}
```

Признаки, что он нужен: ребёнок рендерит что-то, а сосед должен отреагировать; или родитель и ребёнок оба показывают одно и то же число. Родитель становится источником правды, дети — презентерами. Если вы находите один и тот же state, объявленный в двух siblings, — вы на один уровень слишком низко.

## Compound-компоненты

Семья связанных частей (табы, тумблеры, аккордеоны) делит state через родителя, который рендерит детей. Родитель знает правила, дети остаются пассивными.

```jsx
import { createContext, useContext, useState } from "react";

const ToggleContext = createContext(null);

function ToggleGroup({ children, onChange }) {
  const [value, setValue] = useState(null);
  const select = (v) => {
    setValue(v);
    if (onChange) onChange(v);
  };
  return (
    <ToggleContext.Provider value={{ value, select }}>
      <div role="group">{children}</div>
    </ToggleContext.Provider>
  );
}

function ToggleOption({ value, children }) {
  const group = useContext(ToggleContext);
  return (
    <label>
      <input
        type="radio"
        checked={group.value === value}
        onChange={() => group.select(value)}
      />
      {children}
    </label>
  );
}

function App() {
  return (
    <ToggleGroup>
      <ToggleOption value="a">First</ToggleOption>
      <ToggleOption value="b">Second</ToggleOption>
    </ToggleGroup>
  );
}
```

API читается как разметка: родитель объявляет группу, дети объявляют сами себя. Вам не нужно вручную передавать `checked` и `onChange` — это убирает целый класс багов проп-дриллинга.

## Render props

Компонент принимает функцию вместо children и вызывает её с данными, которыми владеет. Потребитель решает форму, провайдер владеет state.

```jsx
import { useState } from "react";

function MouseTracker({ render }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  return (
    <div onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}>
      {render(pos)}
    </div>
  );
}

function App() {
  return (
    <MouseTracker
      render={({ x, y }) => (
        <p>
          Cursor at {x}, {y}
        </p>
      )}
    />
  );
}
```

Render props старше context и остаются полезны, когда общие данные динамические на инстанс. Если ловите себя на том, что просовываете одно и то же значение через три слоя, context или custom hook обычно — более чистый ход.

## Higher-order компоненты

HOC — функция, которая принимает компонент и возвращает новый, с дополнительной логикой, обёрнутой вокруг него.

```jsx
import { useState } from "react";

function withLoading(Comp) {
  return function WithLoading({ loading, ...rest }) {
    const [mounted, setMounted] = useState(false);
    // в настоящем эффекте здесь был бы side effect на mount
    if (!mounted) {
      queueMicrotask(() => setMounted(true));
    }
    if (loading) return <p>Loading…</p>;
    return <Comp {...rest} />;
  };
}

function UserCard({ name }) {
  return <strong>{name}</strong>;
}

const SafeCard = withLoading(UserCard);

function App() {
  return <SafeCard loading={false} name="Ada" />;
}
```

HOC'и хороши для сквозных забот, применяемых ко многим компонентам разом (auth, аналитика, loading-состояния). Они складываются в цепочки, скрывают props и усложняют TypeScript — поэтому современный код сначала тянется к custom hook, а к HOC — только когда обёртка и есть форма.

## Как выбрать

| Паттерн | Когда применять | Какой симптом лечит |
| --- | --- | --- |
| Lifting state up | двум компонентам нужно одно значение | продублированный state в siblings |
| Compound-компоненты | семья связанных частей (табы, тумблеры) | булевы `variant`-props, ручная провязка пропсов |
| Render props | общие динамические данные без context | проп-дриллинг одного и того же значения |
| HOC | сквозная обёртка на многих компонентах | копипаст обёртывающей логики |
| Custom hook | переиспользуемая логика state плюс эффект | продублированные блоки `useState` + `useEffect` |

> **TIP**
> В сомнении выбирайте custom hook: это единственный паттерн, который никогда не заставляет перестраивать дерево, и он комбинируется со всеми остальными.

> **WARNING**
> Цепочка из трёх HOC — стена для читаемости. Если появляется `connect(withAuth(withLoading(Component)))`, логике, скорее всего, пора стать одним custom hook, который компонент вызывает напрямую.
