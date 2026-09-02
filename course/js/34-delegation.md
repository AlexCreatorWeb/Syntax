# Урок 34. Делегирование событий и формы

## Цель
После урока студент сможет: «написать** «делегирование** «один** «обработчик** «на** «родителе** «для** «всех** «детей** (включая** ««созданные** «позде**); «обработать** «форму** (submit, «preventDefault**, «чтение** «полей**); «выбрать** ««правильный** «уровень** «для** «обработчика**.

## Теория
### Делегирование: «один** «обработчик** «на** «родителе**
**Делегирование** — «присоединить** «обработчик** «на** «родителе** «и** «определить** ««конкретный** «элемент** «по** e.target:
```js
list.addEventListener("click", (e) => {
  const btn = e.target.closest(".delete-btn");
  if (!btn) return; // «клик** «не** «по** «кнопке** — «игнор**
  const card = btn.closest(".card");
  card.remove();
});
```
«Плюсы**:
- «один** «обработчик** «для** «всех** «детей** («10К «элементов** «—» «один** «обработчик**);
- ««новые** «дети** «(добавленные** «позже**) «работают** «автоматически** («без** ««повторного** «присоединения**);
- «меньше** «памяти** «и** ««перестроек**.

«Паттерн**: «найдите** ««конкретный** «элемент** «(e.target.closest(".selector")), «проверьте** «(if (!el) return), «действуйте**.

«Ограничение**: «события** ««не** ««делегируются** «для** «mousewheel/scroll** «(не «bubble** «(кроме** «capture**)); «для** «ввода** (input) — «делегирование** «работает** («bubble**).

### Формы: submit «и** ««поля**
```js
const form = document.querySelector("form");
form.addEventListener("submit", (e) => {
  e.preventDefault(); // «отменить** ««перезагрузку** «страницы**
  const name = form.elements.name.value; // «поле** «по** «имени**
  const email = form.elements.email.value;
  console.log({ name, email });
  // fetch(«отправка** «на** «сервер** «(урок** 41**)
});
```
**e.preventDefault()** — «обязателен** «без** ««перезагрузки** (иначе** «форма** ««уходит** «на** «сервер** «с** «GET/POST** «и** ««перезагружает** «страницу**). «Поля**: form.elements.name.value «или** document.querySelector("[name=name]").value.

«Валидация** «(«базовая**):
```js
if (!name.trim()) { nameInput.focus(); return; }
if (!email.includes("@")) { emailInput.focus(); return; }
```
«HTML-валидация**: required, type="email", minlength («браузер** ««проверит** «до** «submit** «(без** «JS**).

### «Уровни** «обработчиков**
- «один** «элемент** → «на** «нём** (btn.addEventListener);
- «много** «однотипных** «(список** «кнопок**) → «делегирование** «на** «родителе**;
- «глобальные** (клавиши** «на** «странице** → document.addEventListener.

TIP: «delегирование** «—** «для** ««повторяющихся** «элементов** «(списки**, «карточки** «с** «кнопками**). «Для** ««одиночных** «(одна** «кнопка** «отправить** → «на** «нём**. «Не** «делегировать** ««всё** «на** document (шум** «и** ««лишние** «проверки**).

NOTE: «форма** «без** «action** «(или** «action="#"**) «с** «preventDefault** — «остаётся** «на** «странице** (SPA-паттерн**). «Для** ««настоящей** «отправки** «— fetch «(41**) «и** «action** «не** «нужен**.

## Пример
HTML (index.html):
```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Урок 34. Делегирование и формы</title>
  <style>
    .card { border: 1px solid #ccc; border-radius: 8px; padding: 12px; margin: 8px 0; }
    .card button { margin-top: 8px; }
  </style>
</head>
<body>
  <form id="form">
    <input name="name" placeholder="имя" required>
    <input name="email" type="email" placeholder="email" required>
    <button type="submit">Отправить</button>
  </form>
  <div id="cards">
    <div class="card"><h3>A</h3><button class="del">Удалить</button></div>
    <div class="card"><h3>B</h3><button class="del">Удалить</button></div>
  </div>
</body>
</html>
```
JS (index.js «с** «TODO**):
```js
// «Делегирование**:
const cards = document.querySelector("#cards");
cards.addEventListener("click", (e) => {
  const btn = e.target.closest(".del");
  if (!btn) return;
  const card = btn.closest(".card");
  card.remove(); // «карточка** «ушла** («обработчик** ««живёт** «на** «родителе**
});

// «Форма**:
const form = document.querySelector("#form");
form.addEventListener("submit", (e) => {
  e.preventDefault(); // «без** ««перезагрузки**
  const data = Object.fromEntries(new FormData(form).entries());
  console.log("форма:", data); // { name: "A", email: "a@b.c" }
  form.reset();
});
```
Разбор: «делегирование** «— один** «обработчик** «на** «#cards** «для** «всех** «.del** («новые** «карточки** «работают** «автоматически**). «Форма** «—» submit + preventDefault + FormData.

## Частые ошибки
WARN: «обработчик** «на** ««каждом** «элементе** «списка** (10К «→** 10К) «и** ««повторное** «присоединение** «при** ««добавлении** «(новые** «—» «не** «работают**); «делегирование** «на** «родителе**.
WARN: «форма** «без** preventDefault** — ««перезагрузка** «страницы** «по** «submit** «(потеря** «состояния**); «обязателен** e.preventDefault().
WARN: «чтение** «поля** «по** «id** «(document.getElementById("name").value) «вместо** form.elements.name.value — «хрупко** («id** «должен** «совпадать** «с** «name**); «используйте** name.
WARN: e.target.closest(".del") «вернул** null (клик** «не** «по** «кнопке**) — «нет** «проверки** if (!btn) return — «падение** «на** null.closest.
WARN: «delегирование** «на** document «для** ««всего** «—» «шум** «и** ««лишние** «проверки** «(«всё** «событие** ««идёт** «до** «document**); ««правильный** «уровень** «(родитель** «списка**).

## Практическое задание
1. Создайте index.html «с** «каркасом** «и** index.js «с** «TODO**.
2. «Делегирование**: #cards «клик** → «удалить** «карточку** «(closest(".del") + closest(".card") + remove).
3. «Добавьте** «кнопку** ««Добавить** «—» «создать** «новую** «карточку** (append) — «удаление** «работает** «автоматически** («делегирование**).
4. «Форма**: submit + preventDefault + FormData — «вывести** «данные**.
5. Бонус: «валидация**: «проверьте** «email** «содержит** «"@" «(иначе** «фокус** «на** «поле**).
