# Урок 33. События: addEventListener и bubbling

## Цель
После урока студент сможет: «присоединить** «обработчик** (addEventListener) «и** ««отвязать** (removeEventListener); «использовать** «объект** «события** (e.target, e.preventDefault, e.key); «понять** «bubbling** «(событие** ««идёт** «вверх** «по** «дереву**); «выбрать** «фаза** «(capture/bubble**).

## Теория
### Событие: «действие** «→** «обработчик**
**Событие** — «действие** «(клик**, «наведение**, «нажатие** «кнопки**, «отправка** «формы**). «Присоединяем** «обработчик**:
```js
const btn = document.querySelector("#btn");
btn.addEventListener("click", (e) => {
  console.log("клик!", e.target); // e — «объект** «события**
});
```
**removeEventListener** — «отвязать** («та же** «функция** «(ссылка** «на** «ту же** «функцию** «(не «анонимная** «повторно**)).

«Основные** «события**: click, dblclick, mouseenter/mouseleave, input («ввод** «в** «поле**), change («потеря** «фокуса** «с** «изменением**), keydown/keyup, submit («форма**), scroll, resize.

### Объект** «события** (e)
- **e.target** — «элемент**, «где** ««случилось** «(могут** «быть** ««вложенные** «дети** «(клик** «по** «иконке** «в** «кнопке** → e.target — «иконка**);
- **e.currentTarget** — «элемент**, «к** «которому** «присоединён** «обработчик** («надёжнее** «в** «делегировании**);
- **e.preventDefault()** — «отменить** ««дефолт** (ссылка** «не** «перейдёт**, «форма** «не** «отправится** «с** ««перезагрузкой**);
- **e.key / e.code** — «клавиши** (keydown: e.key === "Enter");
- **e.stopPropagation()** — «остановить** «bubbling** («не** ««поднимать** «вверх**).

### Bubbling: «событие** ««поднимается** «вверх**
«Клик** «по** «элементу** ««проходит** «по** «цепочке**: «сначала** «target** (capture «сверху** «вниз** «до** «target** «— фаза** «захвата** «(capture)), «потом** ««поднимается** «вверх** «(bubble** «(target → «родитель** → «дедушка** → ... → document). «Обработчики** «на** «всех** «уровнях** «вызываются** «(bubble** «— «по** «умолчанию**).

«Зачем**: «делегирование** (урок 34) — «один** «обработчик** «на** «родителе** «для** «всех** «детей** («включая** ««созданные** «позже**).

```js
list.addEventListener("click", (e) => {
  const li = e.target.closest("li"); // «какой** «item** «клик** «(деlegation)
  if (li) li.classList.toggle("done");
});
```

### «Фазы** «и** ««порядок**
«addEventListener(type, handler, { once: true }) — «однократный** «обработчик**. «addEventListener(type, handler, true) — «capture** «фаза** («сверху** «вниз** «(до** «bubble**). «По** «умолчанию** — bubble** («вверх**).

TIP: «используйте** e.currentTarget «в** «обработчике** («присоединён** «к** «нему**), «не** e.target (может** «быть** ««вложенный** «дочерний**). «Для** ««клик** «по** «кнопке** «с** «иконкой** — e.target.closest("button").

NOTE: «события** ««создаются** «и** ««отправляются** «вручную**: const ev = new CustomEvent("refresh"); el.dispatchEvent(ev) (««свои** «события** «(модули** «общаются** «через** «CustomEvent** «—» «как** «в** «нашей** «платформе** «(TOC** «в** «Docs**).

## Пример
HTML (index.html):
```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Урок 33. События</title>
  <style>
    .item { padding: 8px; background: #eee; margin: 4px 0; cursor: pointer; }
    .item.done { text-decoration: line-through; }
  </style>
</head>
<body>
  <button id="btn">Счётчик: <span id="count">0</span></button>
  <input id="name" placeholder="введите имя">
  <ul id="list">
    <li class="item">Один</li>
    <li class="item">Два</li>
  </ul>
</body>
</html>
```
JS (index.js «с** «TODO**):
```js
// «Счётчик**:
const btn = document.querySelector("#btn");
const count = document.querySelector("#count");
let n = 0;
btn.addEventListener("click", () => {
  n++;
  count.textContent = String(n);
});

// «Ввод**:
const input = document.querySelector("#name");
input.addEventListener("input", (e) => {
  console.log("ввод:", e.target.value); // «каждый** «символ**
});

// «Bubbling** «+** «деlegation** («урок** 34** «подробнее**):
const list = document.querySelector("#list");
list.addEventListener("click", (e) => {
  const li = e.target.closest(".item");
  if (li) li.classList.toggle("done");
});

// «Кнопка** «Enter**:
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") console.log("Enter!");
});
```
Разбор: addEventListener — «обработчик**, e — «объект** «события** (target/currentTarget/preventDefault). Bubbling — «клик** ««поднимается** «вверх** (делегирование** «работает**).

## Частые ошибки
WARN: onclick «вместо** addEventListener — «перезапишет** «предыдущий** «обработчик** («один** «на** «событие**); addEventListener («несколько** «на** «событие**).
WARN: removeEventListener «с** «анонимной** «функцией** (btn.removeEventListener("click", () => {})) — «не** «отвяжется** («другая** «ссылка**); «ссылка** «на** ««ту же** «функцию** «в** «переменной**.
WARN: e.target «в** «кнопке** «с** «иконкой** — «иконка** («не** «кнопка**); e.target.closest("button") «или** e.currentTarget.
WARN: «забыли** e.preventDefault() «на** «ссылке** «(клик** «по** «<a> «—» «переход** «по** «href** «с** ««перезагрузкой**); «отмените** «дефолт**.
WARN: «обработчик** «на** ««каждом** «элементе** «списка** (10К «→** 10К «обработчиков**); «делегирование** «на** «родителе** (один** «обработчик** «для** «всех**).

## Практическое задание
1. Создайте index.html «с** «каркасом** «и** index.js «с** «TODO**.
2. «Счётчик**: «клик** «по** «#btn** → «увеличить** «#count** «(addEventListener**).
3. «Ввод**: «input** «на** «#name** → console.log «каждый** «символ** (e.target.value).
4. «Bubbling**: «клик** «по** «#list** «(родитель**) — «найдите** «какой** «li** «(e.target.closest) «и** ««зачеркните**.
5. Бонус: «кнопка** «Enter**: document.addEventListener("keydown") «—» «обработка** «e.key === "Enter".
