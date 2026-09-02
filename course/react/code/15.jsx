import { useState, useRef, useEffect } from "react";

// Урок 15. useRef: DOM и неразмечные значения. Напишите App.

// TODO 1: FocusInput — useRef на <input>, кнопка «Сфокусировать» → .focus()
function FocusInput() {
  return null;
}

// TODO 2: счётчик Enter в useRef (console, без перерендера)
function EnterCounter() {
  return null;
}

// TODO 3: PrevValue — useState value, useRef prev, useEffect [value] → prev.current = value
function PrevValue() {
  return null;
}

export default function App() {
  // TODO 4: счётчик рендеров в useRef, лог каждого 2-го рендера
  return (
    <div>
      <h2>useRef</h2>
      <FocusInput />
      <EnterCounter />
      <PrevValue />
    </div>
  );
}
