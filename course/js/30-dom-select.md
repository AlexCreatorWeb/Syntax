# Урок 30. DOM-дерево и выборка элементов

## Цель
После урока студент сможет: объяснить «что** такое** DOM** (дерево «узлов**, «от** «документа** «до** «листа**); «найти** «элементы** (getElementById, querySelector(All)); «навести** «курсор** «на** «дерево** «(родитель/дети/соседи**); «понять**, «когда** «выборка** «одна** «и** «когда** «все**.

## Теория
### DOM: «дерево** «из** «HTML**
**DOM** (Document Object Model) — «внутреннее** «представление** «страницы** «в** «браузере**: «дерево** «узлов** «(элементы, «атрибуты**, «текст**). Корень** — «документ** (document), «дети** — <html> → <head>/<body> → «элементы** «в** «вложенности**.

«Каждый** «элемент** HTML — «узел** «DOM** «(объект** «в** «JS**). «JavaScript** «может**: «найти** «узлы**, «изменить** «(текст/атрибуты/стили**, «урок** 31), «создать** «и** «удалить** «(32), «слушать** «события** (33).

### «Выборка**: «один** «и** «все**
- **document.getElementById("id")** → «один** «элемент** (по** «id** «(или** null);
- **document.querySelector("selector")** → «первый** «по** «CSS-селектору** («или** null);
- **document.querySelectorAll("selector")** → «все** «(NodeList** «(похоже** «на** «массив**, «есть** .forEach**);
- **document.getElementsByClassName("class")** → «все** «с** «классом** (HTMLCollection**);
- **document.getElementsByTagName("tag")** → «все** «по** «тегу** (HTMLCollection**).

«Правило**: «по** «id** → getElementById (быстрее** «и** «короче**), «по** «CSS-селектору** → querySelector(All) (гибче** «(.btn, #menu .item, li:nth-child(2n))).

### «Навигация** «по** «дереву**
«От** «элемента** «можно**:
- **parentElement** — «родитель** («или** null);
- **children** — «дети** (только** «элементы**);
- **firstElementChild / lastElementChild** — «первый/последний** «ребёнок**;
- **nextElementSibling / previousElementSibling** — «сосед** «справа/слева**;
- **closest("selector")** — «ближайший** «предок** «по** «селектору** («включая** «себя**).

«Паттерн**: «клик** «на** «кнопке** «в** «карточке** → «найти** «карточку**: event.target.closest(".card") (урок 33).

TIP: «выберите** «элемент** «ОДИН** «раз** «в** «переменную** «(const btn = document.querySelector(...)) «и** «используйте** «ссылку** «(querySelector «каждый** «раз** «—» «медленнее** «и** «гуще**). «После** «изменений** «DOM** «ссылка** «остаётся** «валидной** (пока «элемент** «в** «дереве**).

NOTE: «выборка** «выполняется** ««после** «парсинга** «(script «в** «конце** «body «или** «defer** «в** «head**). «Скрипт** «в** «head** «без** defer** — «элементы** «ещё** «нет** (null**). «В** «редакторе** Syntax: «ваш** «JS** «выполняется** «после** «HTML** «(раннер** «в** «конце** «body**).

## Пример
HTML-каркас (создайте index.html рядом «с** «вашим** index.js — превью «живое**):
```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Урок 30. DOM</title>
</head>
<body>
  <h1 id="title">DOM-дерево</h1>
  <ul class="list">
    <li class="item item--active">Один</li>
    <li class="item">Два</li>
    <li class="item item--last">Три</li>
  </ul>
  <button id="btn">Кнопка</button>
</body>
</html>
```
JS (index.js «с** «TODO**):
```js
// «Один**:
const title = document.getElementById("title");
console.log(title.textContent); // "DOM-дерево"

// «Все**:
const items = document.querySelectorAll(".item");
console.log(items.length); // 3
items.forEach((li) => console.log(li.textContent));

// «Навигация**:
const first = document.querySelector(".list");
console.log(first.children.length); // 3
console.log(first.firstElementChild.textContent); // "Один"
const active = document.querySelector(".item--active");
console.log(active.parentElement.tagName); // "UL"
console.log(active.nextElementSibling.textContent); // "Два"
```
Разбор: getElementById — «по** «id**, querySelector(All) — «по** «CSS». «Навигация** — «родитель/дети/соседи**. «Один** «ссылка** «на** «элемент** «в** «переменной».

## Частые ошибки
WARN: script «в** «head** «без** defer** — «выборка** «даст** null («DOM** «ещё** «не** «собран**); script «в** «конец** «body «или** «defer**.
WARN: «перезапрос** «элемента** «каждый** «раз** «в** «цикле/событии** (querySelector «в** «обработчике**) — «медленнее** «и** «гуще**; «один** «раз** «в** «переменной».
WARN: querySelector «ожидаете** «массив** — «один** «(или** null); «все** — querySelectorAll (NodeList** «с** .forEach**).
WARN: children «включает** «текстовые** «узлы** «(пробелы/переносы**) — «нет**: children — «только** «элементы** («childNodes** «—» «все** «узлы**, «включая** «текст**).
WARN: «изменили** «DOM** «и** ««забыли** «об** «старой** «ссылке** — «если** «элемент** «удалён**, «ссылка** ««мёртвая** («нет** «в** «дереве**); «проверьте** «(el.isConnected).

## Практическое задание
1. Создайте index.html «с** «каркасом** «из** «Примера** «и** «index.js «с** «выборкой** (TODO).
2. «Найдите** «все** «элементы** «с** «классом** «item** «и** «выведите** «текст** «каждого**.
3. «Начиная** «с** «.item--active**, «найдите** «родителя** «и** «соседей** (parentElement, next/previous).
4. Напишите countItems(list): «количество** «детей** (children.length).
5. Бонус: «найдите** «ближайший** «предок** «с** «классом** «list** «от** «.item--active** «(closest**).
