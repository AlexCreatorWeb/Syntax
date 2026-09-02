import { useState } from "react";

// Урок 7. События и контролируемые формы. Напишите компонент App.

// TODO 1: InputDemo — useState(""), контролируемый input, <p>Вы ввели: {text}</p>
function InputDemo() {
  return null;
}

// TODO 2: TodoForm — input + button type="submit", onSubmit + preventDefault,
//         добавляет в useState([]) и очищает поле
// TODO 3: список задач .map() с key
// TODO 4: button type="button" «Очистить всё»
// TODO 5 (бонус): контролируемый <select> со статусами
function TodoForm() {
  return null;
}

export default function App() {
  return (
    <div>
      <h2>События и формы</h2>
      <InputDemo />
      <TodoForm />
    </div>
  );
}
