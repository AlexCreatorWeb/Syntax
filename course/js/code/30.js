// Урок 30. DOM-дерево и выборка.
// Создайте index.html рядом (каркас «из** «Примера** «в** «материале**).
// Запустите (Run) — превью + «консоль**.

// TODO 1: «найдите** #title — console.log(title.textContent)
const title = document.getElementById("title");
console.log(title?.textContent);

// TODO 2: «все** .item — querySelectorAll + forEach (текст «каждого**)
const items = document.querySelectorAll(".item");
console.log(items.length);

// TODO 3: «навигация**: «от** .item--active** → parentElement, next/previousElementSibling
const active = document.querySelector(".item--active");
console.log(active?.parentElement?.tagName);

// TODO 4: countItems(list) — children.length
// TODO 5 (бонус): active.closest(".list") — «ближайший** «предок** «с** «классом** list
