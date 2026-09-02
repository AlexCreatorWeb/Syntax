# Урок 32. Создание и удаление элементов

## Цель
После урока студент сможет: «создать** «элемент** (document.createElement) «и** ««поместить** «его** «в** «DOM** (append/insertBefore/prepend); «удалить** «элемент** (remove); «собрать** ««список** «из** «данных** «(цикл** «+** «создание**); «создать** ««фрагмент** «(DocumentFragment) «для** ««быстрой** «вставки** «нескольких**.

## Теория
### «Создание**: createElement «и** ««помещение**
```js
const el = document.createElement("div"); // «новый** «элемент** («вне** «DOM** «пока**)
el.className = "item";
el.textContent = "новый";
const list = document.querySelector("#list");
list.append(el);        // «добавить** «в** «конец**
list.prepend(el);       // «добавить** «в** «начало**
list.insertAdjacentElement("afterend", el); // «после** «сезона**
```
**append/prepend** — «добавить** «(несколько** «аргументов**). «По** «отношению** «к** «соседу**: insertBefore(el, ref) («старый** «API**), insertAdjacentElement("position", el) (««список** «позиций**: "beforebegin", "afterbegin", "beforeend", "afterend").

«Важно**: «созданный** «элемент** ««живёт** «вне** «DOM** «пока** «append** («изменения** «видны** «только** «после** «вставки**).

### «Удаление**: remove
```js
el.remove(); // «удалить** «из** «DOM** («ссылка** «остаётся**, «но** ««вне** «дерева**)
```
«Один** «элемент** «за** «раз** (children «—» forEach «→** remove**). «Очистка** «родителя**: parent.innerHTML = "" «или** [...parent.children].forEach(el => el.remove()).

### «Сборка** «списка** «из** «данных**
```js
const items = ["яблоко", "груша", "слива"];
const ul = document.querySelector("#fruits");
ul.innerHTML = ""; // «очистить**
for (const name of items) {
  const li = document.createElement("li");
  li.textContent = name; // «безопасно** («textContent**, «не** innerHTML)
  ul.append(li);
}
```
«DocumentFragment**: ««виртуальный** «родитель** «(не «в** «DOM**): «собираем** «дети** «в** «фрагмент**, «одна** «вставка** «(быстрее** «для** «многих** «элементов** — «одна** «перестройка** «DOM**):
```js
const frag = document.createDocumentFragment();
for (const name of items) {
  const li = document.createElement("li");
  li.textContent = name;
  frag.append(li);
}
ul.append(frag); // «все** «сразу** («фрагмент** «распаковывается**)
```

### «Шаблоны**: innerHTML «с** ««своим** «HTML**
«Для** ««сложных** «карточек** «(несколько** «тегов** «внутри**): «собрать** «HTML-строку** «и** «вставить** «через** innerHTML («только** «свой** «шаблон** «без** «пользовательских** «данных** — «иначе** «XSS**):
```js
card.innerHTML = `
  <h3>${title}</h3>
  <p>${desc}</p>
  <button>Подробнее</button>
`;
```
«После** «—» «найти** «кнопку** «внутри** «(card.querySelector("button")) «и** «поставить** «обработчик**.

TIP: «создавайте** «элементы** «текстом** «(textContent** «для** ««чистых** «данных**), «классами** («состояния**), «атрибутами** («href/src**). «innerHTML «—» ««шаблоны** «(свой** «HTML**), «не** ««пользовательский** «ввод**.

NOTE: «порядок** «вставки** «важен**: «сначала** «создайте** «и** ««настройте** «(классы/текст/атрибуты**), «потом** «append** («одна** «перестройка** «DOM** «вместо** «многих**).

## Пример
HTML (index.html):
```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Урок 32. DOM: создание</title>
  <style>
    .card { border: 1px solid #ccc; border-radius: 8px; padding: 12px; margin: 8px 0; }
  </style>
</head>
<body>
  <h2>Список</h2>
  <ul id="list"></ul>
  <h2>Карточки</h2>
  <div id="cards"></div>
</body>
</html>
```
JS (index.js «с** «TODO**):
```js
const list = document.querySelector("#list");
const items = ["яблоко", "груша", "слива"];

// «Список** «из** «данных**:
const frag = document.createDocumentFragment();
for (const name of items) {
  const li = document.createElement("li");
  li.textContent = name;
  frag.append(li);
}
list.append(frag);

// «Карточки**:
const cards = document.querySelector("#cards");
const data = [
  { title: "A", desc: "первый" },
  { title: "B", desc: "второй" },
];
for (const d of data) {
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `<h3>${d.title}</h3><p>${d.desc}</p>`;
  cards.append(card);
}

// «Удаление**:
// cards.lastElementChild.remove(); // «последняя** «карточка** «ушла**
```
Разбор: createElement + «настройка** «→» append. «Фрагмент** — «быстро** «для** «многих**. innerHTML «—» ««шаблоны** «карточек**. remove — «удаление**.

## Частые ошибки
WARN: «append** «до** «настройки** (класс/текст** «после** «вставки**) — ««мерцает** «(DOM «перестройка** «каждый** «раз**); «сначала** «настройте**, «потом** «вставьте**.
WARN: innerHTML «для** ««списка** «из** ««пользовательских** «данных** — XSS; «чистые** «данные** → textContent «(createElement** «на** «элемент**).
WARN: «очистка** «родителя** «через** children.forEach — ««живой** «NodeList** «(изменяется** «при** «удалении**); «копия**: [...parent.children].forEach(el => el.remove()).
WARN: «забыли** «очистить** «контейнер** «перед** ««пересборкой** (append «добавляет** «к** «старому**); innerHTML = "" «сначала** (или** «удалить** «дети**).
WARN: «создаёте** «элемент** «и** ««ссылка** «на** «него** «после** «удаления** «родителя** — ««мёртвая** «ссылка** («нет** «в** «DOM**); «проверьте** el.isConnected.

## Практическое задание
1. Создайте index.html «с** «каркасом** «и** index.js «с** «TODO** (список** «+** «карточки**).
2. «Соберите** «список** «из** «массива** «(createElement + textContent + «фрагмент**).
3. «Соберите** «карточки** «(innerHTML «с** ««шаблоном**).
4. «Добавьте** «кнопку** ««Удалить** «в** «карточку** «(innerHTML «с** «<button> «+** «обработчик** «через** card.querySelector) — «удаление** «карточки** (remove).
5. Бонус: «пересоберите** «список** «с** ««очисткой** «(innerHTML = "" «перед** «append**).
