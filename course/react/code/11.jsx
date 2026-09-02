import { useState, useEffect } from "react";

// Урок 11. Подводные камни: бесконечные циклы, deps, stale closure. Напишите App.

// TODO 1: воспроизвести бесконечный цикл (useEffect меняет n, deps [n]), затем починить deps []
function CycleDemo() {
  const [n, setN] = useState(0);
  // TODO: useEffect(() => { setN(n + 1); }, [n]);  → зациклит!
  // Затем: deps [] (или remove) — один раз
  return <p>Цикл: {n}</p>;
}

// TODO 2: воспроизвести stale closure (setInterval + setCount(count + 1), deps []),
//         затем починить функциональной формой setCount(prev => prev + 1)
function StaleDemo() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    // TODO: setInterval(() => setCount(count + 1), 1000); → всегда 0
    // Затем: setCount((prev) => prev + 1)
    return () => {};
  }, []);
  return <p>Счётчик: {count}</p>;
}

// TODO 3: Greet({ name }) — useEffect(log "Привет, {name}", deps [name])
function Greet() {
  return null;
}

// TODO 4: Timer({ interval }) — setInterval с deps [interval] + cleanup
function Timer() {
  return null;
}

export default function App() {
  const [name, setName] = useState("Анна");
  return (
    <div>
      <h2>Ловушки useEffect</h2>
      <CycleDemo />
      <StaleDemo />
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <Greet name={name} />
    </div>
  );
}
