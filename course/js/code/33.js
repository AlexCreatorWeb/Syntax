// Урок 33. События: addEventListener и bubbling.
// Создайте index.html рядом (каркас «из** «Примера** «в** «материале**).
// Запустите (Run) — превью + «консоль**.

// TODO 1: «счётчик**: #btn «клик** → #count «увеличить**
const btn = document.querySelector("#btn");
const count = document.querySelector("#count");
let n = 0;
btn.addEventListener("click", () => { n++; count.textContent = String(n); });

// TODO 2: «ввод**: #name «input** → console.log(e.target.value)
const input = document.querySelector("#name");
input.addEventListener("input", (e) => console.log("ввод:", e.target.value));

// TODO 3: «bubbling**: #list «клик** → e.target.closest(".item") → classList.toggle("done")
const list = document.querySelector("#list");
list.addEventListener("click", (e) => {
  const li = e.target.closest(".item");
  if (li) li.classList.toggle("done");
});

// TODO 4 (бонус): document keydown «—** e.key === "Enter" → console.log("Enter!")
