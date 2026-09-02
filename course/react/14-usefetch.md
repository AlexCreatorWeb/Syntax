# Урок 14. Кастомный хук useFetch: работа с API

## Цель
После урока студент сможет: написать переиспользуемый хук `useFetch`, который грузит данные и возвращает `data / loading / error`; использовать его в **нескольких** компонентах; понимать, как отмена запроса встроена в хук.

## Теория
### Зачем «упаковывать» fetch в хук
В уроке 10 вы писали `useEffect` + `fetch` + три состояния **прямо в компоненте**. Если нужно такое же в **двух** компонентах — **копипаст**. **Кастомный хук** (урок 13) решает: **логика** одна, **компоненты** просто её **вызывают**.

### Анатомия `useFetch`
Хук принимает **`url`** (и опционально параметры `fetch`) и **возвращает** тройку `{ data, loading, error }`. Внутри — `useEffect` с `fetch`, `AbortController` и cleanup (как в уроке 10).
```jsx
import { useState, useEffect } from "react";

function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    fetch(url, { signal: ctrl.signal })
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then((d) => setData(d))
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [url]); // при смене url — новый запрос

  return { data, loading, error };
}
```
**`deps = [url]`** — эффект **перезапускается** при смене URL. **`AbortController`** в cleanup — отменяет «старый» запрос. **`r.ok`** — проверяем статус. Всё это **вы уже** делали в уроке 10 — теперь оно **переиспользуется**.

### Как компонент использует `useFetch`
```jsx
function UserList() {
  const { data, loading, error } = useFetch("https://jsonplaceholder.typicode.com/users?_limit=5");
  if (loading) return <p>Загрузка…</p>;
  if (error) return <p style={{ color: "red" }}>Ошибка: {error}</p>;
  return <ul>{data.map((u) => <li key={u.id}>{u.name}</li>)}</ul>;
}
```
Компонент **не знает**, **как** грузятся данные — он **принимает** `data/loading/error` и **рисует**. Логика сети **вынесена**. Это и есть **преимущество** хука.

### Почему `useFetch` — «правильное» место
- **Сетевая логика** — **вне** UI (компонент отвечает только за **вид**).
- **Отмена запроса** — **один** раз в хуке, а не в каждом компоненте.
- **Тестируемость**: хук можно **проверить** отдельно от разметки.
- **Расширяемость**: легко добавить **кэш**, **повторы** (retry), **заголовок** авторизации — **в одном** месте.

TIP: Не делайте **один** `useFetch` на **всё** (с кэшем, ретраями, мутом) сразу. Начните с **минимума** (`url` → `{data, loading, error}`) и **добавляйте** опции по мере надобности. Хук — **инструмент**, а не «архитектура на весь проект».

## Пример
Два компонента, **один** `useFetch`:
```jsx
import { useState, useEffect } from "react";

function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    fetch(url, { signal: ctrl.signal })
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(setData)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [url]);
  return { data, loading, error };
}

function Users() {
  const { data, loading, error } = useFetch("https://jsonplaceholder.typicode.com/users?_limit=3");
  if (loading) return <p>Пользователи: загрузка…</p>;
  if (error) return <p style={{ color: "red" }}>Ошибка: {error}</p>;
  return (
    <ul>
      {data.map((u) => (
        <li key={u.id}>{u.name}</li>
      ))}
    </ul>
  );
}

function Posts() {
  const { data, loading, error } = useFetch("https://jsonplaceholder.typicode.com/posts?_limit=3");
  if (loading) return <p>Посты: загрузка…</p>;
  if (error) return <p style={{ color: "red" }}>Ошибка: {error}</p>;
  return (
    <ul>
      {data.map((p) => (
        <li key={p.id}>{p.title}</li>
      ))}
    </ul>
  );
}

export default function App() {
  return (
    <div>
      <h2>Users</h2>
      <Users />
      <h2>Posts</h2>
      <Posts />
    </div>
  );
}
```
Разбор: `useFetch` **один**, а **вызовов** — **два** (`Users`, `Posts`). Каждый компонент **независимо** грузит **свои** данные. Никакого дублирования `fetch`/`loading`/`error`/`AbortController`. Добавьте **третий** раздел — просто **ещё** один компонент с `useFetch`.

## Частые ошибки
WARN: **Забыли `deps = [url]`** (или положили `[]`) — при смене URL данные **не** обновятся. URL, который **использует** запрос, — **обязательно** в `deps`.
WARN: **Не отменяете запрос** (нет `AbortController`/cleanup) — при быстрой смене URL **«гонка»**: старый запрос отвечает **позже** нового и **затирает** свежие данные.
WARN: **Не проверили `r.ok`** — `fetch` **не** бросает на **404/500**; без проверки «ошибка» станет **`data`** (JSON ответа). Всегда `if (!r.ok) throw`.
WARN: **Хук возвращает «новый» объект** `{ data, loading, error }` **каждый** рендер — это **нормально** для **простого** использования, но если передаёте этот объект в `useMemo`/`useEffect` как **зависимость** — **мемоизируйте** (или возвращайте **отдельные** значения/массив).

## Практическое задание
1. Напишите `useFetch(url)` (как в Примере): `data/loading/error`, `AbortController`, `r.ok`, `deps = [url]`.
2. Создайте `Todos`: `useFetch("…/todos?_limit=5")`, отрендерите `title` + `completed`.
3. Создайте `Comments`: `useFetch("…/comments?_limit=5")`, отрендерите `body` (обрежьте до 60 символов).
4. В `App` покажите **оба** раздела. Убедитесь, что **оба** грузятся **независимо**.
5. Бонус: добавьте **кнопку «Перезагрузить»** — она меняет `url` (например, `?_limit=5&_cb=` + `Date.now()`), и `useFetch` **повторяет** запрос.
