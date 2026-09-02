// Урок 4. Пропсы (Props): передача данных вниз. Напишите компонент App.

// TODO 1: Price({ value, currency = "₽" }) → <strong>{value.toLocaleString("ru-RU")} {currency}</strong>
function Price() {
  return null;
}

// TODO 2: ProductCard({ name, price, inStock }) → название, <Price value={price} />, статус
// TODO:  пропс onOrder (функция) + кнопка «Заказать», вызывающая onOrder(name)
function ProductCard() {
  return null;
}

export default function App() {
  // TODO 3: массив из трёх товаров → <ProductCard … key={…} /> через .map()
  // TODO 5 (бонус): onOrder = (name) => console.log("заказ:", name)
  const products = [
    { id: 1, name: "Клавиатура", price: 8990, inStock: true },
    { id: 2, name: "Мышь", price: 2490, inStock: true },
    { id: 3, name: "Монитор", price: 34990, inStock: false },
  ];
  return (
    <div>
      {/* TODO 3: {products.map((p) => <ProductCard key={p.id} … />)} */}
    </div>
  );
}
