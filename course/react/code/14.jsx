import { useState, useEffect } from "react";

// Урок 14. Кастомный хук useFetch: работа с API. Напишите App.

// TODO 1: useFetch(url) → data/loading/error + AbortController + r.ok + deps [url]
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // TODO: useEffect с fetch
  return { data, loading, error };
}

// TODO 2: Todos — useFetch("…/todos?_limit=5"), title + completed
function Todos() {
  return null;
}

// TODO 3: Comments — useFetch("…/comments?_limit=5"), body (до 60 символов)
function Comments() {
  return null;
}

export default function App() {
  return (
    <div>
      <h2>Todos</h2>
      <Todos />
      <h2>Comments</h2>
      <Comments />
    </div>
  );
}
