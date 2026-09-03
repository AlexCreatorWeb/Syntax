---
id: react-rules
track: react
type: reference
section: reference
order: 4
title:
  en: "Rules of Hooks"
  ru: "Правила хуков"
excerpt:
  en: "The two rules, the reason behind them, the wrong and right patterns, and a checklist for the situations where they bite."
  ru: "Два правила, причина, стоящая за ними, неверные и верные паттерны и чек-лист ситуаций, где они кусаются."
version: "react 19"
updated: 2026-09-03
---

Two rules, one reason: React must call the same hooks, in the same order, on every render of a component. Break that and state shifts between hooks, and the component renders garbage without a single error.

## Rule 1: call hooks at the top level

Hooks must run on every render, before any early return, and not inside conditionals, loops, or nested functions. The component's body is a straight line of hook calls, and only then — logic.

```jsx
import { useState, useEffect } from "react";

function Search({ query }) {
  // BAD — hook inside a conditional:
  // if (query) {
  //   const [results, setResults] = useState([]);
  // }

  // GOOD — every hook runs on every render:
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query) return; // the logic is conditional, the hook is not
    load(query).then(setResults).catch(setError);
  }, [query]);

  if (!query) return null; // early return comes after all hooks
  return <ul>{results.map((r) => <li key={r}>{r}</li>)}</ul>;
}
```

The pattern is: the hook is unconditional, the behavior is conditional. Move the `if` inside the effect body or the render return, never around the hook call itself.

## Rule 2: only in React functions

Hooks can be called only from a React function component or from another custom hook — a function whose name starts with `use`. Calling a hook from a plain function, an event handler, or a class method either crashes or, worse, silently reads someone else's state.

```jsx
import { useState, useEffect } from "react";

// A custom hook: the name starts with use, it calls hooks
function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

function Layout() {
  const isDark = useMediaQuery("(prefers-color-scheme: dark)");
  return <div className={isDark ? "dark" : "light"}>App</div>;
}
```

The naming convention is not bureaucracy: the linter and your future self use the `use` prefix to tell which functions are allowed to call hooks. A helper called `handleClick` that calls `useState` inside is a rule violation even if it is defined next to a component.

## Why the rules exist

React keeps hooks in a per-instance list, indexed by their call order: the first `useState` always owns slot one, the second `useEffect` always owns its slot. State is attached to the slot, not to the variable name.

```jsx
import { useState } from "react";

function Flaky({ enabled }) {
  const [a, setA] = useState(0);
  if (enabled) {
    const [b, setB] = useState(1); // appears only from the second render
  }
  return null;
}
```

On the first render one hook registers. On the second, when `enabled` flips, the second `useState` takes slot one — and what it reads is the state that `a` owned. From that moment `a` is off by one slot forever, and the bug has no error message, only wrong values.

The same mechanism explains why a hook inside a `for` loop is a violation: the number of slots depends on the loop length, so it changes between renders.

## Checklist

| Situation | What to do |
| --- | --- |
| You want a hook conditionally | keep the hook unconditional and branch inside it |
| An early `return` comes before hooks | move the return below all hook calls |
| Logic is shared by several components | extract a `use*` custom hook |
| One item needs per-item state | the state belongs in a child component, one instance per item |
| A hook call inside a timer or callback | move it into the component, or pass the value as a parameter |

> **TIP**
> Enable `eslint-plugin-react-hooks` with `react-hooks/rules-of-hooks` and `react-hooks/exhaustive-deps`. The plugin catches the vast majority of violations at lint time, with a message that points at the exact line.

> **WARNING**
> Calling a hook inside `setTimeout` or any callback is a rule-2 violation in disguise: by the time the callback runs, the render is over and there is no hook slot to read from.

<!-- RU -->

Два правила, одна причина: React обязан вызывать одни и те же хуки, в том же порядке, на каждом рендере компонента. Нарушите это — и state сдвинется между хуками, и компонент будет рендерить мусор без единой ошибки.

## Правило 1: хуки — на верхнем уровне

Хуки должны выполняться на каждом рендере, до любого раннего return, и не внутри условий, циклов или вложенных функций. Тело компонента — прямая линия вызовов хуков, и только потом — логика.

```jsx
import { useState, useEffect } from "react";

function Search({ query }) {
  // ПЛОХО — хук внутри условия:
  // if (query) {
  //   const [results, setResults] = useState([]);
  // }

  // ХОРОШО — каждый хук выполняется на каждом рендере:
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query) return; // условна логика, а не хук
    load(query).then(setResults).catch(setError);
  }, [query]);

  if (!query) return null; // ранний return — после всех хуков
  return <ul>{results.map((r) => <li key={r}>{r}</li>)}</ul>;
}
```

Паттерн такой: хук — без условий, поведение — с условиями. Перенесите `if` в тело эффекта или в return рендера, но не вокруг самого вызова хука.

## Правило 2: только в React-функциях

Хуки можно вызывать только из функционального компонента React или из другого custom hook — функции, имя которой начинается с `use`. Вызов хука из обычной функции, обработчика события или метода класса либо роняет приложение, либо, что хуже, молча читает чужой state.

```jsx
import { useState, useEffect } from "react";

// Custom hook: имя начинается с use, вызывает хуки
function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

function Layout() {
  const isDark = useMediaQuery("(prefers-color-scheme: dark)");
  return <div className={isDark ? "dark" : "light"}>App</div>;
}
```

Конвенция с именем — не бюрократия: линтер и ваш будущий я по префиксу `use` понимают, какие функции имеют право вызывать хуки. Хелпер `handleClick`, внутри которого вызывается `useState`, — нарушение правил, даже если он определён прямо рядом с компонентом.

## Почему правила существуют

React хранит хуки в списке на инстанс, по индексу порядка вызова: первый `useState` всегда владеет слотом один, второй `useEffect` — всегда своим слотом. State привязан к слоту, а не к имени переменной.

```jsx
import { useState } from "react";

function Flaky({ enabled }) {
  const [a, setA] = useState(0);
  if (enabled) {
    const [b, setB] = useState(1); // появляется только со второго рендера
  }
  return null;
}
```

На первом рендере регистрируется один хук. На втором, когда `enabled` переключился, второй `useState` занимает слот один — и читает state, который вёл `a`. С этого момента `a` сдвинут на слот навсегда, и у бага нет сообщения об ошибке — только неверные значения.

Тот же механизм объясняет, почему хук внутри `for`-цикла — нарушение: число слотов зависит от длины цикла, значит, меняется между рендерами.

## Чек-лист

| Ситуация | Что делать |
| --- | --- |
| Нужен хук условно | хук — без условий, условие — внутри него |
| Ранний `return` до хуков | перенести return ниже всех вызовов хуков |
| Логика общая для нескольких компонентов | вынести `use*` custom hook |
| Элементу нужен per-item state | state живёт в дочернем компоненте, по инстансу на элемент |
| Вызов хука в таймере или callback | перенести в компонент или передать значение параметром |

> **TIP**
> Включите `eslint-plugin-react-hooks` с `react-hooks/rules-of-hooks` и `react-hooks/exhaustive-deps`. Плагин ловит подавляющее большинство нарушений на этапе линта, с сообщением, указывающим точную строку.

> **WARNING**
> Вызов хука внутри `setTimeout` или любого callback — нарушение правила 2 в камуфляже: к моменту, когда callback исполняется, рендер уже закончен, и слота для чтения хука больше нет.
