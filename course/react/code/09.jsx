import { useState, useEffect } from "react";

// Урок 9. useEffect: побочные эффекты и cleanup. Напишите компонент App.

// TODO 1: Clock — useState(new Date()) + useEffect(setInterval + cleanup), deps []
function Clock() {
  return null;
}

// TODO 2: WindowSize — useEffect: addEventListener("resize") + cleanup
function WindowSize() {
  return null;
}

// TODO 3: CopyLog({ message }) — useEffect с deps [message], console.log("копия:", message)
function CopyLog() {
  return null;
}

export default function App() {
  return (
    <div>
      <h2>useEffect</h2>
      <Clock />
      <WindowSize />
      <CopyLog message="привет" />
    </div>
  );
}
