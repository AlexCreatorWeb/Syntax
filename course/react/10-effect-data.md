# Урок 10. useEffect и данные: loading / error / data

## Цель
После урока студент сможет: грузить данные из API в `useEffect`; строить UI по паттерну **loading → error → data**; обрабатывать **отмену** запроса (AbortController) и «гонки» запросов.

## Теория
### Запрос в `useEffect`
Сетевой запрос — **побочный эффект** (взаимодействие с внешним миром), поэтому живёт в `useEffect`. Классическая схема «три состояния»:
```jsx
import { useState, useEffect } from "react";

function Users() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("https://jsonplaceholder.typicode.com/users")
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then((users) => setData(users))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Загрузка…</p>;
  if (error) return <p style={{ color: "red" }}>Ошибка: {error}</p>;
  return <ul>{data.map((u) => <li key={u.id}>{u.name}</li>)}</ul>;
}
```
Три состояния — `loading` (идёт запрос), `error` (упал), `data` (пришли). UI — **early return** (урок 5) по текущему состоянию.

### `async/await` — чище
Тот же запрос, но **асинхронный** синтаксис:
```jsx
useEffect(() => {
  let active = true; // флаг «компонент ещё жив»
  (async () => {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error("HTTP " + r.status);
      const users = await r.json();
      if (active) setData(users);
    } catch (e) {
      if (active) setError(e.message);
    } finally {
      if (active) setLoading(false);
    }
  })();
  return () => { active = false; }; // cleanup
}, []);
```
**`active`-флаг** в cleanup защищает от обновления состояния **после** размонтирования (React выдал бы предупреждение). Это базовый способ «отмены» без AbortController.

### AbortController — настоящая отмена
Если компонент **размонтировался** (или зависимости изменились), **запрос можно физически отменить**:
```jsx
useEffect(() => {
  const ctrl = new AbortController();
  fetch(url, { signal: ctrl.signal })
    .then((r) => r.json())
    .then(setData)
    .catch((e) => {
      if (e.name !== "AbortError") setError(e.message);
    });
  return () => ctrl.abort(); // отменить запрос
}, [url]);
```
`ctrl.abort()` **рвёт** запрос; в `catch` нужно **проигнорировать** `AbortError` (это не «ошибка», а наша отмена).

### Зависимости `[url]`
Если `url` **меняется** (например, по поиску), эффект **перезапустится**: старый запрос отменится (cleanup), новый — начнётся. Это **правильно** и защищает от **«гонки»** (race condition), когда **старый** запрос отвечает **позже** **нового** и «затирает» свежие данные.

TIP: Начальное значение `loading` — **`true`** (сразу показываем «загружаем»). `data` — **`null`**, `error` — **`null`**. Не храните «флаг успеха» отдельно — **наличие** `data` и **отсутствие** `error` уже говорят о успехе.

## Пример
Загрузка пользователей с переключением «страницы» (зависимость):
```jsx
import { useState, useEffect } from "react";

function App() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    fetch(`https://jsonplaceholder.typicode.com/users?_page=${page}&_limit=5`, { signal: ctrl.signal })
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then((users) => setData(users))
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [page]); // зависимость: при смене страницы — новый запрос

  return (
    <div>
      <button onClick={() => setPage((p) => p + 1)}>Следующие</button>
      {loading && <p>Загрузка…</p>}
      {error && <p style={{ color: "red" }}>Ошибка: {error}</p>}
      <ul>
        {data.map((u) => (
          <li key={u.id}>{u.name} — {u.email}</li>
        ))}
      </ul>
    </div>
  );
}
export default App;
```
Разбор: `page` — **зависимость** эффекта. При клике `page` меняется → **cleanup** отменяет старый запрос → **новый** эффект с новым `url`. `loading` показывается на время запроса. Это **готовый** паттерн для любой «подгрузки данных».

## Частые ошибки
WARN: **Забыли `if (!r.ok) throw`** — `fetch` **не** бросает ошибку на **404/500** (только на **сбой сети**). Без проверки `r.ok` «ошибка» тихо пройдёт в `data` как JSON ошибки. Проверяйте **статус**.
WARN: **Обновление состояния после размонтирования** (без `active`-флага / `AbortController`) — предупреждение в консоли и «гонки» данных. Всегда **отменяйте** запрос в cleanup.
WARN: **`finally` в цепочке, где есть `AbortError`** — `setLoading(false)` выполнится даже при отмене (ок), но `setError` не должен ловить `AbortError`. Разделяйте «настоящую» ошибку и «отмену».
WARN: **Не указали `url` в `deps`** — эффект выполнится **один раз**, и при смене `url` данные **не обновятся**. Все изменяемые значения, используемые в эффекте, — **в `deps`**.

## Практическое задание
1. Создайте `TodoList`: в `useEffect` (с `deps = []`) загрузите `https://jsonplaceholder.typicode.com/todos?_limit=8`, строка `loading/error/data`.
2. Отрендерите задачи через `.map()` с `key`, показывая `title` и `completed`.
3. Добавьте `AbortController` и cleanup.
4. Добавьте **поисковое поле**: `useState` `query`, эффект с `deps = [query]`, фильтруйте **на клиенте** (через `filter`) уже загруженные данные.
5. Бонус: показывайте «Найдено: N» (через `filter`/`length`).
