// Урок 35. Todo-компонент (практика).
// Создайте index.html рядом (каркас «из** «Примера** «в** «материале**).
// Запустите (Run) — превью + «консоль**.

let todos = [{ id: 1, text: "научиться** «JS", done: false }];
let nextId = 2;

const list = document.querySelector("#list");
const input = document.querySelector("#input");
const addBtn = document.querySelector("#add");

// TODO 1: render() — «очистить** «list** (innerHTML = "") «и** «создать** «li** «для** «каждого** «todo**:
//         li.className = "todo" + (t.done ? " done" : "")
//         li.dataset.id = t.id
//         li.innerHTML = `<span class="txt">${t.text}</span><button class="toggle">✓</button><button class="del">×</button>`
function render() {
  list.innerHTML = "";
  for (const t of todos) {
    // TODO: «создать** «li** «(createElement + innerHTML) «и** «append**
  }
}
render();

// TODO 2: «добавление**: #add «клик** «и** Enter «в** #input → todos = [...todos, { id: nextId++, text, done: false }]; render()

// TODO 3: «делегирование**: #list click →
//         const li = e.target.closest(".todo"); if (!li) return;
//         const id = Number(li.dataset.id);
//         «если** .toggle → todos = todos.map(t => t.id === id ? { ...t, done: !t.done } : t);
//         «если** .del → todos = todos.filter(t => t.id !== id);
//         render();

// TODO 4 (бонус): «счётчик** «оставшихся** «(заголовок** «или** «консоль**)
