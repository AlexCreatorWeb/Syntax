import { useState, useEffect } from "react";

// Урок 13. Правила хуков и кастомные хуки. Напишите App.

// TODO 1: useCount() → useState(0) + increment/decrement/reset, вернуть [count, inc, dec, reset]
function useCount() {
  return [0, () => {}, () => {}, () => {}];
}

// TODO 3: useInterval(callback, delay) → setInterval + cleanup, deps [callback, delay]
function useInterval() {
  return null;
}

function CounterA() {
  // TODO 2: const [count, inc, dec, reset] = useCount();
  return null;
}

function CounterB() {
  // TODO 2: тоже useCount() — счётчики НЕзависимы
  return null;
}

function Ticker() {
  // TODO 4: useInterval(() => setSeconds(s => s + 1), 1000)
  const [seconds, setSeconds] = useState(0);
  return <p>Тиков: {seconds}</p>;
}

export default function App() {
  return (
    <div>
      <h2>Кастомные хуки</h2>
      <CounterA />
      <CounterB />
      <Ticker />
    </div>
  );
}
