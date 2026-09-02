import { useState } from "react";

// Урок 6. Состояние: useState. Напишите компонент App.

// TODO 1: Counter — useState(0), кнопки +1 / −1 / Сброс
function Counter() {
  return null;
}

// TODO 2: Toggle — useState(false), кнопка prev => !prev, показывает Вкл/Выкл
function Toggle() {
  return null;
}

// TODO 3: Notes — useState([]), input + «Добавить» (функционально), список .map() с key
// TODO 4: кнопка «Очистить» setNotes([])
// TODO 5 (бонус): счётчик заметок
function Notes() {
  return null;
}

export default function App() {
  return (
    <div>
      <h2>Состояние</h2>
      <Counter />
      <Toggle />
      <Notes />
    </div>
  );
}
