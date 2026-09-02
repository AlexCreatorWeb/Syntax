# Урок 17. Асинхронные данные: поиск, abort, паттерны

## Цель
После урока студент сможет: реализовать **живой поиск** с **debounce**; отменять запросы через **AbortController**; понимать **гонку запросов** (race condition) и **защититься** от неё; собрать «взрослый» асинхронный компонент.

## Теория
### Живой поиск и debounce
«Живой поиск» — запрос **на каждый** введённый символ. Это **дорого** (сотни запросов) и **бесполезно** (пользователь ещё не закончил). **Debounce** — **отложить** действие до **паузы** в событиях: ждём, пока пользователь **перестанет** печатать (например, **300 мс**), и **тогда** делаем запрос.

В React — это **`useState`** + **`useEffect`** с **`setTimeout`** и **cleanup**:
```jsx
function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id); // «перезапуск» таймера
  }, [value, delay]);
  return debounced;
}
```
Каждое изменение `value` **перезапускает** таймер (cleanup **чистит** старый). Только после **паузы** `debounced` **догоняет** `value`. Затем **запрос** зависит от **`debounced`**, а **не** от «сырого» вклада.

### Гонка запросов (race condition)
Если запросы **быстрые** и **меняются** (поиск), **старый** запрос может **ответить** **позже** **нового** и **затереть** свежие данные:
```
ввод "j"  → запрос A (долгий)
ввод "js" → запрос B (быстрый) ← ответил ПЕРВЫМ
A ответил ПОЗЖЕ и показал результаты для "j"   ← БАГ
```
**Решение** — **отменять** «просроченные» запросы: **AbortController** (уроки 10/14) или **проверка** «актуальности» (флаг/`id` запроса). **`AbortController`** — **надёжнее** (физически **рвёт** запрос).

### Паттерн «актуальности» без AbortController
Если не хотите `AbortController`, **помечайте** каждый запрос и **принимайте** ответ только **последнего**:
```jsx
useEffect(() => {
  let stale = false;
  fetch(url).then((r) => r.json()).then((d) => {
    if (!stale) setData(d); // принять только если запрос «ещё свой»
  });
  return () => { stale = true; };
}, [url]);
```
**`stale`** становится **true** в cleanup (когда зависимость изменилась) — **старый** ответ **игнорируется**.

### Полный цикл «живого поиска»
**Ввод** → `setQuery` → **debounce** → `debouncedQuery` → **`useEffect`** (зависит от `debouncedQuery`) → **fetch** + **abort** → `setData`. Каждый шаг **отвязан** от следующего — **чистая** цепочка.

TIP: Для **поиска** **на клиенте** (маленький массив) **не нужен** запрос вообще — просто **`filter`** по **debounced** вводу (урок 12). **Debounce** нужен, когда **каждое** изменение **дорогое** (запрос к API, тяжёлый расчёт).

## Пример
«Живой поиск» пользователей с debounce + abort:
```jsx
import { useState, useEffect } from "react";

function useDebounce(value, delay = 300) {
  const [d, setD] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setD(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return d;
}

function useUsers(query) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!query) {
      setData([]);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    fetch(`https://jsonplaceholder.typicode.com/users?_limit=100`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((all) =>
        setData(all.filter((u) => u.name.toLowerCase().includes(query.toLowerCase())))
      )
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [query]);
  return { data, loading, error };
}

export default function App() {
  const [raw, setRaw] = useState("");
  const query = useDebounce(raw, 400);
  const { data, loading, error } = useUsers(query);

  return (
    <div>
      <input value={raw} onChange={(e) => setRaw(e.target.value)} placeholder="Поиск…" />
      <p>Поиск по: «{query || "—"}»</p>
      {loading && <p>Ищем…</p>}
      {error && <p style={{ color: "red" }}>Ошибка: {error}</p>}
      <ul>
        {data.map((u) => (
          <li key={u.id}>{u.name}</li>
        ))}
      </ul>
    </div>
  );
}
```
Разбор: `raw` — «сырой» ввод (мгновенный, **UI** не «лагает»). `query` — **debounce** (догоняет через **400 мс** паузы). `useUsers(query)` — **запрос** только по **стабильному** `query`, с **abort** в cleanup. **Гонки** исключены: при быстрой смене `query` **старый** запрос **отменяется**.

## Частые ошибки
WARN: **Запрос на каждый символ** (без debounce) — «шторм» запросов, «затянутый» UI, **гонки**. Для **живого** ввода **обязателен** **debounce**.
WARN: **Делегируете `useEffect` от «сырого» вклада**, но **запрашиваете** по нему — **гонка** и **лишние** запросы. Зависите от **debounced** значения.
WARN: **Забраковали cleanup** в debounce (`clearTimeout`) — таймеры **накапливаются**, `debounced` **скачет**. **Всегда** чистите таймер.
WARN: **Игнорируете `AbortError`** как «ошибку» (показываете пользователю «Сбой!» при **отмене**). В `catch` **проверяйте** `e.name === "AbortError"` и **молчите**.

## Практическое задание
1. Напишите `useDebounce(value, delay)` (как в Примере).
2. Напишите `useSearchPosts(query)`: загрузите **все** посты **один** раз и **фильтруйте** **на клиенте** по `query` (демонстрация «поиска без запроса»).
3. В `App`: `input` → `raw` → `useDebounce` → `useSearchPosts`; показывайте `title` найденных.
4. Добавьте **вторую** версию `useSearchPostsRemote(query)`, которая **каждый** раз **запрашивает** API с **AbortController**.
5. Бонус: переключайтесь **кнопкой** между «локальный» и «удалённый» поиск и **наблюдайте** за разницей в **запросах** (вкладка Network).
