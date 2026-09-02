// Урок 34. Делегирование событий и формы.
// Создайте index.html рядом (каркас «из** «Примера** «в** «материале**).
// Запустите (Run) — превью + «консоль**.

// TODO 1: «делегирование**: #cards «клик** → closest(".del") → closest(".card") → remove()
const cards = document.querySelector("#cards");
cards.addEventListener("click", (e) => {
  const btn = e.target.closest(".del");
  if (!btn) return;
  btn.closest(".card").remove();
});

// TODO 2: «кнопка** ««Добавить** «—» «создать** «новую** «карточку** (createElement + append) — «удаление** «работает** «автоматически**

// TODO 3: «форма**: submit + e.preventDefault() + FormData(form) — console.log «данных**
const form = document.querySelector("#form");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  console.log("форма:", Object.fromEntries(new FormData(form).entries()));
  form.reset();
});

// TODO 4 (бонус): «валидация** «email** (includes("@")) «—» «фокус** «на** «поле** «при** «ошибке**
