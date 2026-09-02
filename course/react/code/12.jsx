import { useState, useMemo, useCallback } from "react";

// Урок 12. Производное состояние: useMemo и useCallback. Напишите App.

const ITEMS = Array.from({ length: 1000 }, (_, i) => `элемент-${i}`);

// TODO: дочерний Item (опционально React.memo)
function Item({ text, onPick }) {
  return (
    <li>
      {text} <button onClick={() => onPick(text)}>выбрать</button>
    </li>
  );
}

export default function App() {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState(null);

  // TODO: useMemo для фильтра ITEMS по query (deps [query])
  //       (добавьте console.log("пересчёт") внутрь — увидите, когда считается)
  const filtered = ITEMS;

  // TODO: useCallback для onPick (deps [])
  const handlePick = (text) => setPicked(text);

  return (
    <div>
      <h2>useMemo / useCallback</h2>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск" />
      <p>Найдено: {filtered.length}. Выбрано: {picked ?? "—"}</p>
      <ul>
        {filtered.slice(0, 100).map((t) => (
          <Item key={t} text={t} onPick={handlePick} />
        ))}
      </ul>
    </div>
  );
}
