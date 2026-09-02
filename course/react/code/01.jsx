// Урок 1. React: компонентный подход и первое приложение.
// Напишите компонент App (раннер сам его отрендерит в превью).

function Title() {
  // TODO 1: верните <h1>Мой трек в React</h1>
  return null;
}

function Info({ text }) {
  // TODO 2: верните <p>{text}</p>
  return null;
}

function App() {
  // TODO 3: используйте <Title /> и ДВА <Info text="…" /> с разными текстами
  // TODO 4: массив skills = ["JSX", "Компоненты", "Props"],
  //          отрендерите через .map() по одному <Info text={…} key={…} /> на элемент
  return (
    <div>
      {/* TODO 5 (бонус): оберните корневые элементы в Fragment <>...</> */}
    </div>
  );
}
