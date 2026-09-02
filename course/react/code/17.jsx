import { useState, useEffect } from "react";

// Урок 17. Асинхронные данные: поиск, abort, паттерны. Напишите App.

// TODO 1: useDebounce(value, delay)
function useDebounce(value, delay) {
  return value;
}

// TODO 2: useSearchPosts(query) — все посты ОДИН раз + filter на клиенте
function useSearchPosts(query) {
  const [data, setData] = useState([]);
  return { data, loading: false, error: null };
}

// TODO 4: useSearchPostsRemote(query) — запрос КАЖДЫЙ раз + AbortController
function useSearchPostsRemote(query) {
  return { data: [], loading: false, error: null };
}

export default function App() {
  const [raw, setRaw] = useState("");
  // TODO 3: query = useDebounce(raw, 400); const { data } = useSearchPosts(query);
  return (
    <div>
      <h2>Живой поиск</h2>
      <input value={raw} onChange={(e) => setRaw(e.target.value)} placeholder="Поиск постов…" />
      <p>Поиск по: «{raw}»</p>
      <ul>
        {/* TODO 3: отрендерите найденные title */}
      </ul>
    </div>
  );
}
