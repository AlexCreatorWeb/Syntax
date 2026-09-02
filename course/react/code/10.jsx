import { useState, useEffect } from "react";

// Урок 10. useEffect и данные: loading / error / data. Напишите компонент App.

// TODO 1: в useEffect (deps []) загрузить
//         https://jsonplaceholder.typicode.com/todos?_limit=8,
//         состояния loading / error / data
// TODO 2: отрендерить задачи .map() с key (title, completed)
// TODO 3: AbortController + cleanup
// TODO 4: поисковое поле (deps [query]), фильтр на клиенте
// TODO 5 (бонус): «Найдено: N»
export default function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");

  // TODO 1, 3: useEffect с fetch + AbortController
  useEffect(() => {
    return () => {};
  }, []);

  return (
    <div>
      <h2>Данные из API</h2>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск" />
      {loading && <p>Загрузка…</p>}
      {error && <p style={{ color: "red" }}>Ошибка: {error}</p>}
      <ul>
        {/* TODO 2: {data.map(...)} */}
      </ul>
    </div>
  );
}
