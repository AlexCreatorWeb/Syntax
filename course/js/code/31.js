// Урок 31. Текст, классы, атрибуты, стили.
// Создайте index.html рядом (каркас «из** «Примера** «в** «материале**).
// Запустите (Run) — превью + «консоль**.

const output = document.getElementById("output");
// TODO 1: output.textContent = "готово" — «чистый** «текст**
// TODO 1б: output.innerHTML = "<b>готово</b>" — «сравните** «с** «тегами**

const first = document.querySelector("#list .item");
// TODO 2: first.classList.toggle("active") — «превью** «поменяет** «фон**
console.log(first?.classList?.contains("active"));

// TODO 3: «создайте** «<a> «и** «задайте** «href** (setAttribute) — «прочитайте** «getAttribute**
const link = document.createElement("a");
link.setAttribute("href", "https://example.com");
console.log(link.getAttribute("href"));

// TODO 4: «найдите** #name (input) — «прочитайте** .value «и** «измените** «(= "A")

// TODO 5 (бонус): «все** .item «→** «.done** (forEach + classList)
