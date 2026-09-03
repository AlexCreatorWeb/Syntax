---
id: react-fetch
track: react
type: guide
section: patterns
order: 4
title:
  en: "Data Fetching"
  ru: "Загрузка данных"
excerpt:
  en: "The canonical React pattern for loading data from an API: the three states, aborting stale requests, and a reusable useFetch hook."
  ru: "Канонический паттерн React для загрузки данных из API: три состояния, отмена устаревших запросов и переиспользуемый хук useFetch."
version: "react 19"
updated: 2026-09-03
relatedTask: react-008
---

Loading data from an API is one of the most common effects in a React app. This guide covers the canonical pattern: state for loading, error, and data; an effect that fetches on mount or when a parameter changes; and cleanup that keeps the flow safe under fast navigation.

## The three states

Every screen that fetches data has three faces: loading, error, and data. Model all three explicitly in state and the render becomes three plain branches.

```jsx
import { useState, useEffect } from "react";

async function fetchUsers() {
  const res = await fetch("/api/users");
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}

function UserList() {
  const [users, setUsers] = useState(null); // null = loading
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    fetchUsers()
      .then((data) => {
        if (alive) setUsers(data);
      })
      .catch((e) => {
        if (alive) setError(e);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (error) return <p role="alert">{error.message}</p>;
  if (!users) return <p>Loading…</p>;
  return (
    <ul>
      {users.map((u) => (
        <li key={u.id}>{u.name}</li>
      ))}
    </ul>
  );
}
```

The `null` initial value is a deliberate sentinel: it means "not loaded yet" without an extra boolean. Keeping the error in a separate state means the error screen can carry a message and a retry action, not just a boolean flag.

Modeling the three states up front is what separates a calm screen from a nervous one. If a fetch can fail, plan the error face before you write the success face — the code below is easier, and the UI never shows a half-state.

> **WARNING**
> In StrictMode (the default in Vite templates) effects run twice on mount in development. If your effect starts a request without an idempotency guard you will see two network calls — that is expected, not a bug.

## Fetching when a parameter changes

When the data depends on a prop — a route param, a filter, a page number — put that prop in the dependency array and the effect refetches on every change. An `AbortController` makes sure an old response never overwrites fresh data.

```jsx
import { useState, useEffect } from "react";

function UserPage({ id }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setUser(null);
    fetch("/api/users/" + id, { signal: ctrl.signal })
      .then((res) => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then((data) => setUser(data))
      .catch((e) => {
        if (e.name !== "AbortError") setError(e);
      });
    return () => ctrl.abort();
  }, [id]);

  if (error) return <p role="alert">{error.message}</p>;
  if (!user) return <p>Loading…</p>;
  return <h1>{user.name}</h1>;
}
```

`AbortController` cancels the actual network request, not just the state update: the browser stops downloading, and the promise rejects with a special `AbortError` that you filter out in the catch. This is the difference between "we ignore the old answer" and "we stop asking the old question".

## A reusable useFetch hook

The same three-state shape appears on every data screen, so extract it into a custom hook. The hook owns fetching, aborting, and the state machine; components consume a two-value object.

```jsx
import { useState, useEffect } from "react";

function useFetch(url) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setData(null);
    fetch(url, { signal: ctrl.signal })
      .then((res) => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(setData)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e);
      });
    return () => ctrl.abort();
  }, [url]);

  return { data, error };
}

function Profile({ id }) {
  const { data, error } = useFetch("/api/users/" + id);
  if (error) return <p role="alert">{error.message}</p>;
  if (!data) return <p>Loading…</p>;
  return <h1>{data.name}</h1>;
}
```

Notice what the component lost: no effect, no abort logic, no `alive` flag. The hook is the unit of reuse — the same fetching logic now powers ten screens, and a bug fix in the hook fixes every screen at once.

> **TIP**
> Keep the API function outside the component, in its own module. A component that names its data source as a function is easier to test in isolation and to move to a different screen.

## Loading, empty, and retry

The three states deserve their own render passes. A loading state should be a skeleton that matches the final layout, not a bare spinner — the screen should not jump when data arrives. An empty list is not an error; render it as its own face with a hint.

```jsx
function List({ data, error, onRetry }) {
  if (error) {
    return (
      <div>
        <p role="alert">{error.message}</p>
        <button onClick={onRetry}>Retry</button>
      </div>
    );
  }
  if (!data) return <Skeleton />;
  if (data.length === 0) return <p>Nothing here yet.</p>;
  return <ul>{data.map((x) => <li key={x.id}>{x.name}</li>)}</ul>;
}
```

Retry is a state value: a `nonce` number that sits in the dependency array, bumped by the button.

```jsx
const [retry, setRetry] = useState(0);
// effect dependency array: [url, retry]
const onRetry = () => setRetry((n) => n + 1);
```

Bumping the nonce re-runs the effect with the same URL — the effect is the only code that knows how to fetch, so the retry button is three lines.

## Pitfalls

> **WARNING**
> Forgetting `if (!res.ok) throw` means a 404 silently resolves to `null` and you render an empty list instead of an error. `fetch` rejects only on network failure — HTTP errors are your responsibility.

> **WARNING**
> A fetch without an abort guard can call setState after the component is gone. Modern React no longer warns about this, but the request keeps running and can still overwrite the next page's data.

> **TIP**
> Put the URL string in the dependency array, not the parsed options object — objects get a new identity every render and the effect would re-run forever.

<!-- RU -->

Загрузка данных из API — один из самых частых эффектов в React-приложении. Этот гайд разбирает канонический паттерн: state для loading, error и data; эффект, который грузит при mount или при смене параметра; и cleanup, который держит поток безопасным при быстрой навигации.

## Три состояния

У любого экрана, который грузит данные, три лица: loading, error и data. Явно смоделируйте все три в state — и рендер превращается в три простые ветки.

```jsx
import { useState, useEffect } from "react";

async function fetchUsers() {
  const res = await fetch("/api/users");
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}

function UserList() {
  const [users, setUsers] = useState(null); // null = загрузка
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    fetchUsers()
      .then((data) => {
        if (alive) setUsers(data);
      })
      .catch((e) => {
        if (alive) setError(e);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (error) return <p role="alert">{error.message}</p>;
  if (!users) return <p>Loading…</p>;
  return (
    <ul>
      {users.map((u) => (
        <li key={u.id}>{u.name}</li>
      ))}
    </ul>
  );
}
```

Начальное значение `null` — сознательный sentinel: оно значит «ещё не загружено», без лишнего булевого флага. Ошибка в отдельном state — значит error-экран может нести сообщение и действие retry, а не просто булев флаг.

Моделирование трёх состояний сразу — то, что отличает спокойный экран от нервного. Если fetch может упасть, спланируйте error-лицо до success-лица: код ниже пишется легче, а UI никогда не показывает полусостояние.

> **WARNING**
> В StrictMode (дефолт в Vite-шаблонах) эффекты в dev запускаются дважды при mount. Если ваш эффект начинает запрос без idempotency-защиты, вы увидите два сетевых вызова — это ожидаемо, а не баг.

## Загрузка при смене параметра

Когда данные зависят от prop'а — route-параметра, фильтра, номера страницы — положите этот prop в массив зависимостей, и эффект будет перегружать данные при каждом изменении. `AbortController` гарантирует, что старый ответ никогда не перекроет свежие данные.

```jsx
import { useState, useEffect } from "react";

function UserPage({ id }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setUser(null);
    fetch("/api/users/" + id, { signal: ctrl.signal })
      .then((res) => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then((data) => setUser(data))
      .catch((e) => {
        if (e.name !== "AbortError") setError(e);
      });
    return () => ctrl.abort();
  }, [id]);

  if (error) return <p role="alert">{error.message}</p>;
  if (!user) return <p>Loading…</p>;
  return <h1>{user.name}</h1>;
}
```

`AbortController` отменяет настоящий сетевой запрос, а не только обновление state: браузер перестаёт скачивать, а promise rejects специальным `AbortError`, который вы отфильтровываете в catch. Это разница между «мы игнорируем старый ответ» и «мы перестаём задавать старый вопрос».

## Переиспользуемый хук useFetch

Та же связка из трёх состояний появляется на каждом экране с данными, поэтому вынесите её в custom hook. Хук владеет загрузкой, отменой и состоянием-машиной; компоненты потребляют объект из двух значений.

```jsx
import { useState, useEffect } from "react";

function useFetch(url) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setData(null);
    fetch(url, { signal: ctrl.signal })
      .then((res) => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(setData)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e);
      });
    return () => ctrl.abort();
  }, [url]);

  return { data, error };
}

function Profile({ id }) {
  const { data, error } = useFetch("/api/users/" + id);
  if (error) return <p role="alert">{error.message}</p>;
  if (!data) return <p>Loading…</p>;
  return <h1>{data.name}</h1>;
}
```

Посмотрите, что потерял компонент: ни эффекта, ни логики отмены, ни флага `alive`. Хук — единица переиспользования: одна и та же логика загрузки теперь питает десять экранов, а фикс бага в хуке чинит все экраны разом.

> **TIP**
> Держите функцию API вне компонента, в отдельном модуле. Компонент, который называет свой источник данных функцией, легче тестировать отдельно и переносить на другой экран.

## Loading, пустой список и retry

Три состояния заслуживают отдельных рендер-проходов. Loading-состояние — это скелетон, повторяющий финальную раскладку, а не голое кружение: экран не должен прыгать, когда данные arrive. Пустой список — не ошибка; отрендерите его отдельным лицом с подсказкой.

```jsx
function List({ data, error, onRetry }) {
  if (error) {
    return (
      <div>
        <p role="alert">{error.message}</p>
        <button onClick={onRetry}>Retry</button>
      </div>
    );
  }
  if (!data) return <Skeleton />;
  if (data.length === 0) return <p>Nothing here yet.</p>;
  return <ul>{data.map((x) => <li key={x.id}>{x.name}</li>)}</ul>;
}
```

Retry — это значение state: число `nonce` в массиве зависимостей, которое кнопка инкрементирует.

```jsx
const [retry, setRetry] = useState(0);
// массив зависимостей эффекта: [url, retry]
const onRetry = () => setRetry((n) => n + 1);
```

Инкремент nonce перезапускает эффект с тем же URL — эффект — единственный код, который знает, как грузить, поэтому кнопка retry — три строки.

## Ловушки

> **WARNING**
> Забытое `if (!res.ok) throw` означает, что 404 тихо резолвится в `null`, и вы рендерите пустой список вместо ошибки. `fetch` rejects только при сетевом сбое — HTTP-ошибки ваша ответственность.

> **WARNING**
> Fetch без отмены может вызвать setState после того, как компонента уже нет. Современный React больше не ворчит, но запрос продолжает жить и всё ещё может перекрыть данные следующей страницы.

> **TIP**
> В массиве зависимостей — строка URL, а не объект распарсенных опций: объект получает новую идентичность каждый рендер, и эффект бы перезапускался вечно.
