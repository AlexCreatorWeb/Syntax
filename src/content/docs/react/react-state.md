---
id: react-state
track: react
type: guide
section: basics
order: 2
title:
  en: "Props & State"
  ru: "Props и State"
excerpt:
  en: "How data moves in React: props for read-only input, useState for values that change, and lifting shared state to the common ancestor."
  ru: "Как данные движутся в React: props для входных данных, useState для изменяемых значений и подъём общего состояния к ближайшему предку."
version: "react 19"
updated: 2026-09-03
relatedTask: react-002
---

Props flow down, state changes in place. This guide covers the two data channels of React: props for read-only input from the parent, `useState` for values the component owns, and the pattern that connects them — lifting shared state up.

## Props

A component's props are its inputs. The parent renders the component with data; the child just reads it. Props are read-only from the child's perspective — the child never writes to them, it asks the parent to change them.

```jsx
function Stat({ label, value }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function App() {
  return (
    <>
      <Stat label="Lessons" value={16} />
      <Stat label="Streak" value={7} />
    </>
  );
}
```

Props can be anything: strings, numbers, booleans, arrays, objects, functions, even other components. Destructure what you need in the parameter, and give optional props defaults in the destructuring pattern — `function Card({ size = "md" })` — so the component keeps working when the parent forgets the attribute.

Because props are just arguments, passing a component as a prop is legal: `<Layout sidebar={<Sidebar />}>`. This is how "named slots" work in larger design systems: the layout component does not know which sidebar it will get, it only knows it will render whatever was passed.

## State with useState

State is data the component owns and that changes over time. `useState` declares one piece of it: it returns a pair — the current value and a setter that schedules a re-render.

```jsx
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <>
      <span>{count}</span>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </>
  );
}
```

The first argument is the initial value, used exactly once, on the first render. The setter is the only door into the value: call it with the new value, and React re-renders the component with the updated state. Until you call the setter, the variable you destructured holds exactly what it had on this render.

A component can declare as many `useState` calls as it needs; each is independent and React tracks them by their position in the function. That is why hooks must be called unconditionally — the same order on every render — a topic you will expand on in the hooks guide.

Each setter is stable for the lifetime of the component — you can pass `setCount` into a child, store it in a closure, or call it from a timer without worrying that the reference will change. This is also why a child wrapped in `React.memo` that receives a setter does not need `useCallback` around it: the reference the child compares is the same on every render.

> **TIP**
> Name setters after the value: `setCount`, `setName`, `setItems`. Consistent names keep event handlers readable and make refactors mechanical.

## Updating state correctly

Two rules keep state honest. First, never mutate: `todos.push(x)` or `user.name = "Ada"` change the value in place and do not trigger a re-render, because the reference is the same. Second, build the new value with copy semantics — the spread operator for arrays and objects.

```jsx
function TodoList() {
  const [todos, setTodos] = useState([]);

  const addTodo = (text) => setTodos([...todos, text]);
  const removeTodo = (i) => setTodos(todos.filter((_, j) => j !== i));

  return (
    <ul>
      {todos.map((t, i) => (
        <li key={i} onClick={() => removeTodo(i)}>
          {t}
        </li>
      ))}
    </ul>
  );
}
```

When the new value depends on the previous one, pass a function to the setter: `setCount((c) => c + 1)`. This form is immune to stale values inside handlers and timers, and it is the only safe way to update state twice in one handler — two plain `setCount(count + 1)` calls both read the same old `count` and add only one.

## Lifting state up

When two components need the same value, the state belongs to their closest common ancestor. The parent holds it and passes it down as props; a child that must change it calls a callback prop. This "lifting state up" pattern is the workhorse of all data flow in React.

```jsx
import { useState } from "react";

function RenameForm({ onRename }) {
  const [text, setText] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onRename(text);
      }}
    >
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <button>Save</button>
    </form>
  );
}

function App() {
  const [name, setName] = useState("world");
  return (
    <>
      <RenameForm onRename={setName} />
      <p>Hello, {name}</p>
    </>
  );
}
```

The child keeps a private draft (the input text), the parent keeps the truth. Data flows down as props, events flow up as callbacks — once you see this shape everywhere, reading a React codebase becomes mechanical.

There is no limit to how far you lift: in a real screen the entire form's state often lives in one top component, and everything below it is pure presentation.

A practical heuristic for deciding where state lives: take the two components and the value they share, then walk up the tree until you reach the first component that renders both — that component declares the state. If you cannot find such a component because the two live in unrelated branches, the common ancestor is higher than you think, and the right move is often a context, not a longer props chain.

## Pitfalls

> **WARNING**
> `count = count + 1` or `todos.push(x)` is mutation, not an update. React compares the state by reference; the same reference means "nothing changed" and the screen stays frozen.

> **WARNING**
> Calling `setCount(count + 1)` twice in one handler adds only one — both calls read the stale `count`. Use the functional form `setCount((c) => c + 1)` whenever the new value depends on the old one.

> **TIP**
> Before adding a `useState`, ask whether the value is derivable. Anything you can compute from props or other state — a filtered list, a sum, an uppercased name — should be computed during render, not stored. Duplicated state drifts apart.

<!-- RU -->

Props текут вниз, state меняется на месте. Этот гайд разбирает два канала данных в React: props для входных данных от родителя, `useState` для значений, которыми компонент владеет, и паттерн, который их соединяет — подъём общего состояния вверх.

## Props

Props компонента — его вход. Родитель рендерит компонент с данными, ребёнок только читает их. Для ребёнка props неизменяемы: он никогда не пишет в них — он просит родителя их изменить.

```jsx
function Stat({ label, value }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function App() {
  return (
    <>
      <Stat label="Lessons" value={16} />
      <Stat label="Streak" value={7} />
    </>
  );
}
```

Props могут быть чем угодно: строки, числа, булевы, массивы, объекты, функции, даже другие компоненты. Деструктурируйте в параметре то, что нужно, а опциональным props давайте дефолты прямо в паттерне — `function Card({ size = "md" })` — чтобы компонент работал, даже если родитель забыл атрибут.

Так как props — просто аргументы, передавать компонент как prop легально: `<Layout sidebar={<Sidebar />}>`. Так работают «именованные слоты» в крупных дизайн-системах: layout-компонент не знает, какой sidebar к нему придёт, он рендерит то, что передали.

## State с useState

State — это данные, которыми компонент владеет и которые меняются со временем. `useState` объявляет один такой кусок: возвращает пару — текущее значение и setter, который выставляет перерисовку.

```jsx
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <>
      <span>{count}</span>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </>
  );
}
```

Первый аргумент — начальное значение, используется ровно один раз, на первом рендере. Setter — единственная дверь к значению: вызовите его с новым значением, и React перерисует компонент с обновлённым state. Пока вы не вызовете setter, деструктурированная переменная держит ровно то, что было на этом рендере.

Компонент может объявить сколько угодно `useState`; каждый независим, и React отслеживает их по позиции в функции. Поэтому хуки нужно вызывать без условий — в одном порядке на каждом рендере — об этом подробнее в гайде по хукам.

Каждый setter стабилен за время жизни компонента: `setCount` можно передать в ребёнка, положить в замыкание или вызвать из таймера, не волнуясь, что ссылка поменяется. Из-за этого ребёнок, обёрнутый в `React.memo` и получающий setter, не требует `useCallback` вокруг него: ссылка, которую ребёнок сравнивает, одинакова на каждом рендере.

> **TIP**
> Называйте setter'ы по значению: `setCount`, `setName`, `setItems`. Последовательные имена держат обработчики событий читаемыми, а рефакторинг — механическим.

## Правильное обновление state

Два правила держат state честным. Первое: не мутировать — `todos.push(x)` или `user.name = "Ada"` меняют значение на месте и не вызывают перерисовки, потому что ссылка та же. Второе: новое значение собирается с семантикой копирования — spread-оператор для массивов и объектов.

```jsx
function TodoList() {
  const [todos, setTodos] = useState([]);

  const addTodo = (text) => setTodos([...todos, text]);
  const removeTodo = (i) => setTodos(todos.filter((_, j) => j !== i));

  return (
    <ul>
      {todos.map((t, i) => (
        <li key={i} onClick={() => removeTodo(i)}>
          {t}
        </li>
      ))}
    </ul>
  );
}
```

Когда новое значение зависит от прежнего, передайте setter'у функцию: `setCount((c) => c + 1)`. Эта форма невосприимчива к устаревшим значениям в обработчиках и таймерах, и это единственный безопасный способ обновить state дважды за один обработчик — два обычных `setCount(count + 1)` читают одно и то же старое `count` и прибавят только один.

## Подъём состояния вверх (Lifting state up)

Когда двум компонентам нужно одно и то же значение, state живёт в их ближайшем общем предке. Родитель хранит его и передаёт вниз через props; ребёнок, которому нужно его менять, вызывает callback-prop. Паттерн «lifting state up» — рабочий конь всего потока данных в React.

```jsx
import { useState } from "react";

function RenameForm({ onRename }) {
  const [text, setText] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onRename(text);
      }}
    >
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <button>Save</button>
    </form>
  );
}

function App() {
  const [name, setName] = useState("world");
  return (
    <>
      <RenameForm onRename={setName} />
      <p>Hello, {name}</p>
    </>
  );
}
```

Ребёнок держит частный черновик (текст инпута), родитель — правду. Данные текут вниз как props, события — вверх как callback'и: увидев эту форму везде, чтение React-кодовой базы становится механикой.

Поднимать можно на любую высоту: в реальном экране state всей формы часто живёт в одном верхнем компоненте, а всё, что ниже, — чистая презентация.

Практический эвристический приём, чтобы решить, где жить state: возьмите два компонента и их общее значение, поднимитесь по дереву до первого компонента, который рендерит обоих, — этот компонент объявляет state. Если такого компонента нет, потому что они живут в несвязанных ветвях, общий предок выше, чем кажется, и чаще верный ход — context, а не более длинная цепочка пропсов.

## Ловушки

> **WARNING**
> `count = count + 1` или `todos.push(x)` — это мутация, а не обновление. React сравнивает state по ссылке; та же ссылка означает «ничего не изменилось», и экран остаётся замороженным.

> **WARNING**
> Два `setCount(count + 1)` в одном обработчике прибавят только один — оба вызова читают устаревшее `count`. Если новое значение зависит от старого, используйте функциональную форму `setCount((c) => c + 1)`.

> **TIP**
> Прежде чем добавлять `useState`, спросите, не вычисляется ли значение. Всё, что можно посчитать из props или другого state — отфильтрованный список, сумма, заглавный вариант имени — вычисляется при рендере, а не хранится. Дублированный state расходится.
