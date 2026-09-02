// Урок 2. JSX: HTML внутри JavaScript. Напишите компонент App.

const price = 1990;
const inStock = true;

// TODO 1: компонент Badge({ label, count }) → <span className="badge">{label}: {count}</span>
function Badge() {
  return null;
}

export default function App() {
  // TODO 2: переменные title = "Задачи", total = 7 → <Badge label={title} count={total} />
  // TODO 3: <p>Всего задач: {total}, в день: {Math.ceil(total / 7)}</p>
  // TODO 4: <button onClick={() => alert("Нажато!")} style={{ padding: "8px 16px" }}>Купить</button>
  // TODO 5 (бонус): data-id и aria-label на кнопку
  return (
    <div className="card" style={{ padding: 12 }}>
      <h2>{/* TODO: подставьте title */}</h2>
      <p>Цена: {price.toLocaleString("ru-RU")} ₽</p>
      <p>{inStock ? "В наличии" : "Под заказ"}</p>
    </div>
  );
}
