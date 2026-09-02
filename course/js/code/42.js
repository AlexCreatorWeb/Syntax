// Урок 42. Финальный проект: «Задачи + Поиск» (состояние + «отрисовка** «+** «события**).
// Создайте index.html рядом (каркас «из** «Примера** «в** «материале**).
// Запустите (Run) — превью + «консоль**.

// «Состояние** «(«источник** «правды**):
const KEY = "app.todos";
let todos = (() => {
  try { return JSON.parse(localStorage.getItem(KEY)) ?? [{ id: 1, text: "«научиться** «JS", done: false }]; }
  catch { return [{ id: 1, text: "«научиться** «JS", done: false }]; }
})();
let nextId = todos.length ? Math.max(...todos.map((t) => t.id)) + 1 : 1;
let filter = "all"; // "all" | "active" | "done"
let query = "";

const list = document.querySelector("#list");
const input = document.querySelector("#input");
const addBtn = document.querySelector("#add");
const search = document.querySelector("#search");
const stats = document.querySelector("#stats");

// «Персистентность** «(36**):
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(todos)); } catch { console.warn("квота"); }
}

// «Фильтр** «+** «поиск** (17/4**):
function visibleTodos() {
  return todos.filter((t) => {
    const byStatus = filter === "all" || (filter === "active" ? !t.done : t.done);
    const byQuery = t.text.toLowerCase().includes(query.toLowerCase());
    return byStatus && byQuery;
  });
}

// TODO 1: «отрисовка**: render() — «очистить** list** (innerHTML = "") «и** «создать** «li** «для** ««каждого** «visibleTodos()**:
//         li.className = "todo" + (t.done ? " done" : ""); li.dataset.id = t.id;
//         li.innerHTML = `<span class="txt">${t.text}</span><button class="toggle">✓</button><button class="del">×</button>`;
//         + «статистика**: stats.textContent = `«всего** ${todos.length} · «активные** ${...} · «готово** ${...}`;
function render() {
  list.innerHTML = "";
  for (const t of visibleTodos()) {
    // TODO: «создать** «li** «(createElement + innerHTML) «и** «append**
  }
  // TODO: stats «(«счётчики**)
}
render();

// TODO 2: «добавление**: #add «клик** «и** Enter «в** #input →
//         todos = [...todos, { id: nextId++, text: input.value.trim(), done: false }];
//         input.value = ""; save(); render();

// TODO 3: «делегирование**: #list click →
//         const li = e.target.closest(".todo"); if (!li) return;
//         const id = Number(li.dataset.id);
//         «если** .toggle → todos = todos.map(t => t.id === id ? { ...t, done: !t.done } : t);
//         «если** .del → todos = todos.filter(t => t.id !== id);
//         save(); render();

// TODO 4: «фильтр**: .tabs click → dataset.f «→** filter «→** render
// TODO 5: «поиск**: #search «input** → debounce 300ms «(37** «→** query «→** render
//         function debounce(fn, ms) { let id; return (...a) => { clearTimeout(id); id = setTimeout(() => fn(...a), ms); }; }

// TODO 6 (бонус): fetch POST «на** JSONPlaceholder «(41** «—» ««облачный** «синк** «(демо** «(«отправка** ««созданной** «задачи**
