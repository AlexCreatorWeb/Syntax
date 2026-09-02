// Урок 32. Создание и удаление элементов.
// Создайте index.html рядом (каркас «из** «Примера** «в** «материале**).
// Запустите (Run) — превью + «консоль**.

const list = document.querySelector("#list");
const items = ["яблоко", "груша", "слива"];

// TODO 1: «список** «из** «данных**: createElement + textContent + «фрагмент** «(append)
const frag = document.createDocumentFragment();
for (const name of items) {
  const li = document.createElement("li");
  li.textContent = name;
  frag.append(li);
}
list.append(frag);

// TODO 2: «карточки**: #cards — div.card «с** innerHTML «(h3 + p) «из** «массива** «данных**
const data = [{ title: "A", desc: "первый" }, { title: "B", desc: "второй" }];
// for (const d of data) { ... }

// TODO 3: «кнопка** ««Удалить** «в** «карточке** (innerHTML «с** <button>) + «обработчик** «(remove)
// TODO 4: «очистите** #list «(innerHTML = "") «и** «пересоберите** «(«пересборка**)
// TODO 5 (бонус): «объясните** «в** «комментарии**, «зачем** DocumentFragment «быстрее**
