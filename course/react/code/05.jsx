// Урок 5. Условный рендеринг: &&, тернарник, early return. Напишите компонент App.

// TODO 1: TrafficLight({ color }) → круг (div с border-radius) цвета color
//         используйте early return для "red" / "yellow" / "green"
function TrafficLight() {
  return null;
}

// TODO 2: Notification({ type, message }) → тернарник: error=red, success=green, иначе gray
function Notification() {
  return null;
}

export default function App() {
  // TODO 3: три <Notification> с разными type и текстами
  // TODO 4: const count = 0 → {count && <p>Есть элементы</p>} (увидите 0), затем поправьте тернарником
  const count = 0;
  return (
    <div>
      {/* TODO 1: <TrafficLight color="red" /> и т.д. */}
      {/* TODO 3: уведомления */}
      <p>{count && "Есть элементы"}</p>
    </div>
  );
}
