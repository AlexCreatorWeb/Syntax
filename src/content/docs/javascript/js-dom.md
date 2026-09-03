---
id: js-dom
track: javascript
type: guide
section: dom
order: 4
title:
  en: "DOM & Events"
  ru: "DOM и события"
excerpt:
  en: "Selecting elements, reading and updating the page, creating nodes, and handling events — including the event object, delegation, and the mistakes that make pages feel broken."
  ru: "Выбор элементов, чтение и обновление страницы, создание узлов, обработка событий — включая event-объект, делегирование и ошибки, из-за которых страница кажется сломанной."
version: "es2023"
updated: 2026-09-03
relatedTask: js-012
---

The DOM is the live, tree-shaped version of your HTML. JavaScript reads it, mutates it, and listens to events on it. This page covers selection, reading and writing, creating nodes, and the event model — with event delegation as the advanced pattern that keeps big pages fast and clean.

## The DOM as a tree

Your HTML becomes a tree of nodes: elements, text nodes, comments, attributes. The `document` object is your entry point, and every element exposes its children, parent and siblings.

```js
const body = document.body;               // the <body> element
const h1 = document.querySelector("h1");  // first match, in document order

h1.textContent;    // the text inside the element
h1.parentElement;  // the node above
h1.children;       // Element children (live HTMLCollection)
h1.id;             // the id attribute as a string
```

A few terms pay off immediately. The whole document is a tree with `document` at the top; `document.documentElement` is the `<html>` element, `document.body` the `<body>` one. A node's position in that tree — its parent, children, next sibling — is all navigation you will ever need.

The three node kinds you actually touch: Element nodes (`div`, `a`, `input`), Text nodes (the raw characters between tags), and Document fragments — lightweight containers you build nodes in before attaching them.

## Selecting elements

`querySelector` returns the first element matching a CSS selector; `querySelectorAll` returns all of them as a static list. There are also the legacy shortcuts: `getElementById` and `getElementsByClassName`.

```js
document.querySelector("#nav .item.active"); // one element or null
document.querySelectorAll("a");               // NodeList of all links
document.getElementById("main");             // by id
```

Selectors work exactly like CSS: ids, classes, tags, combinators and pseudo-classes are all available. `:not()`, `[data-x]` and attribute selectors make targeted lookups trivial.

```js
// counting external links: check the protocol and the hostname
const links = document.querySelectorAll("#content a");
const external = [...links].filter((a) => {
  const href = a.getAttribute("href") || "";
  return href.startsWith("https://") && new URL(href).hostname !== location.hostname;
});
console.log(external.length);
```

> **TIP**
> `querySelectorAll` returns a static NodeList — it does not update when the page changes. Re-query after you mutate the tree if you need the fresh state.

## Reading and updating

Text goes through `textContent` (safe, no parsing), HTML through `innerHTML` (parses markup — beware of user input). Classes are managed with `classList`, styles with `style`, attributes with `getAttribute`/`setAttribute`.

```html
<button id="save" class="btn" data-id="7">Save</button>
<p id="status">Ready</p>
```

```js
const btn = document.querySelector("#save");
const status = document.querySelector("#status");

btn.textContent;                   // "Save"
btn.classList.add("is-loading");
btn.classList.toggle("is-busy");
btn.classList.contains("btn");     // true

btn.setAttribute("data-id", "42");
btn.getAttribute("data-id");       // "42"
btn.dataset.id;                    // "42" — the same, without the prefix

status.textContent = "Saving…";
status.style.color = "green";
```

`dataset` is a bonus: every `data-*` attribute is available as a camelCased property on it, so `data-item-price` becomes `el.dataset.itemPrice` and the value is always a string.

> **WARNING**
> Assigning user-provided text to `innerHTML` invites injection bugs. Use `textContent` for text and reserve `innerHTML` for trusted markup you build yourself.

## Creating and inserting nodes

`document.createElement` makes a node, you set its properties, then you attach it with `append` or `insertBefore`. Removal is `remove()` on the node itself, or `replaceWith` when you are swapping nodes.

```js
const li = document.createElement("li");
li.textContent = "New task";
li.className = "task";

const list = document.querySelector("#tasks");
list.append(li);
list.insertAdjacentHTML("afterbegin", "<li class='first'>First</li>");

li.replaceWith(document.createElement("div"));
li.remove(); // li is detached from the document
```

For repeated builds, create a `document.createDocumentFragment()` first, append children to it, and attach the fragment once — the browser does one reflow instead of N.

```js
const frag = document.createDocumentFragment();
for (const task of tasks) {
  const li = document.createElement("li");
  li.textContent = task.title;
  frag.append(li);
}
list.append(frag); // single reflow, all items in
```

## Events

`addEventListener` attaches a handler; the handler receives an event object describing what happened. The third argument is an options bag — `capture`, `once`, `passive`.

```js
const btn = document.querySelector("#save");

btn.addEventListener("click", (event) => {
  console.log(event.type);          // "click"
  console.log(event.target);        // what was actually clicked
  console.log(event.currentTarget); // the element the handler is on
});

// stop a link from navigating
document.querySelector("a.no-nav")
  ?.addEventListener("click", (e) => e.preventDefault());
```

`event.target` is where the event happened; `event.currentTarget` is where the listener lives. They are the same for simple elements and different when a child inside the listened element is clicked — which is exactly what delegation exploits. The common event types you will meet first: `click`, `input` and `change` on forms, `submit` on the form itself, `keydown`/`keyup`, `scroll`, and `DOMContentLoaded` for "the page is ready".

### Event delegation

Instead of attaching a handler to every row of a table, attach one handler to the table and read `event.target` to find out which row was hit. New rows work automatically, and you manage one listener instead of hundreds.

```js
const table = document.querySelector("#log");

table.addEventListener("click", (event) => {
  const row = event.target.closest("tr");
  if (!row) return;
  console.log("row clicked:", row.dataset.id);
});
```

Delegation is also the only reliable way to handle elements that do not exist yet — there is nothing to attach a listener to until the node is created. The trade-off: every click on the table runs the handler, so keep it cheap — `closest` one or two levels deep and get out.

### Removing listeners and one-shot handlers

Pass the same function reference to `removeEventListener` to detach. For work that must happen exactly once — a "got it" dialog, a first-visit tip — use the `once: true` option and skip manual bookkeeping.

```js
const onKey = (e) => console.log(e.key);
document.addEventListener("keydown", onKey);
document.removeEventListener("keydown", onKey); // works: same reference

document.addEventListener("click", () => console.log("only once"), { once: true });
```

> **WARNING**
> `removeEventListener` fails silently when you pass a new anonymous function — the listener was registered under a different reference. Keep handlers in named variables.

## Common mistakes

> **WARNING**
> `querySelector` returns `null` (not an exception) when nothing matches — dereferencing it throws a TypeError one line later, in a confusing place. Guard with `if (el) { ... }` or optional chaining.

> **WARNING**
> `document.write` after the page has loaded wipes the entire document. It exists for legacy reasons; use `append` instead.

> **TIP**
> Read values with `element.value` for form fields, `getAttribute` for attributes, `textContent` for text. Mixing them up is a subtle source of "the value is empty" bugs.

The DOM guide ends here. The next one moves from the page to time: promises, async/await and everything asynchronous.

<!-- RU -->

DOM — это живая, древовидная версия вашего HTML. JavaScript читает его, мутирует и слушает на нём события. На этой странице: выбор элементов, чтение и запись, создание узлов и событийная модель — с делегированием событий как продвинутым паттерном, который держит большие страницы быстрыми и чистыми.

## DOM как дерево

Ваш HTML становится деревом узлов: элементы, текстовые узлы, комментарии, атрибуты. Объект `document` — ваша точка входа, и каждый элемент открыт его детьми, родителем и соседями.

```js
const body = document.body;               // элемент <body>
const h1 = document.querySelector("h1");  // первое совпадение, в порядке документа

h1.textContent;    // текст внутри элемента
h1.parentElement;  // узел выше
h1.children;       // дочерние Element (живая HTMLCollection)
h1.id;             // атрибут id строкой
```

Несколько терминов окупаются сразу. Весь документ — это дерево с `document` наверху; `document.documentElement` — элемент `<html>`, `document.body` — `<body>`. Позиция узла в этом дереве — родитель, дети, следующий сосед — всё, что вам когда-либо понадобится для навигации.

Три вида узлов, с которыми вы реально работаете: Element-узлы (`div`, `a`, `input`), Text-узлы (сырые символы между тегами) и Document-фрагменты — лёгкие контейнеры, в которых вы собираете узлы, прежде чем прикрепить их.

## Выбор элементов

`querySelector` возвращает первый элемент, подходящий CSS-селектору; `querySelectorAll` — все, статическим списком. Есть и legacy-шорткаты: `getElementById` и `getElementsByClassName`.

```js
document.querySelector("#nav .item.active"); // один элемент или null
document.querySelectorAll("a");               // NodeList всех ссылок
document.getElementById("main");             // по id
```

Селекторы работают ровно как CSS: id, классы, теги, комбинаторы и псевдоклассы — всё доступно. `:not()`, `[data-x]` и селекторы атрибутов делают точечный поиск тривиальным.

```js
// считаем внешние ссылки: проверяем протокол и hostname
const links = document.querySelectorAll("#content a");
const external = [...links].filter((a) => {
  const href = a.getAttribute("href") || "";
  return href.startsWith("https://") && new URL(href).hostname !== location.hostname;
});
console.log(external.length);
```

> **TIP**
> `querySelectorAll` возвращает статический NodeList — он не обновляется, когда страница меняется. Перезапросите после мутации дерева, если нужно свежее состояние.

## Чтение и обновление

Текст идёт через `textContent` (безопасно, без парсинга), HTML — через `innerHTML` (парсит разметку — осторожно с пользовательским вводом). Классы управляются через `classList`, стили — через `style`, атрибуты — через `getAttribute`/`setAttribute`.

```html
<button id="save" class="btn" data-id="7">Save</button>
<p id="status">Ready</p>
```

```js
const btn = document.querySelector("#save");
const status = document.querySelector("#status");

btn.textContent;                   // "Save"
btn.classList.add("is-loading");
btn.classList.toggle("is-busy");
btn.classList.contains("btn");     // true

btn.setAttribute("data-id", "42");
btn.getAttribute("data-id");       // "42"
btn.dataset.id;                    // "42" — то же самое, без префикса

status.textContent = "Сохраняем…";
status.style.color = "green";
```

`dataset` — бонус: каждый атрибут `data-*` доступен как свойство в camelCase, то есть `data-item-price` становится `el.dataset.itemPrice`, а значение всегда строка.

> **WARNING**
> Назначение пользовательского текста в `innerHTML` зовёт баги инъекций. Для текста используйте `textContent` и reserve `innerHTML` для доверенной разметки, которую собрали сами.

## Создание и вставка узлов

`document.createElement` создаёт узел, вы задаёте его свойства, потом прикрепляете через `append` или `insertBefore`. Удаление — `remove()` на самом узле, или `replaceWith`, когда вы меняете узлы местами.

```js
const li = document.createElement("li");
li.textContent = "Новая задача";
li.className = "task";

const list = document.querySelector("#tasks");
list.append(li);
list.insertAdjacentHTML("afterbegin", "<li class='first'>First</li>");

li.replaceWith(document.createElement("div"));
li.remove(); // li отцеплено от документа
```

Для повторяющейся сборки создайте сначала `document.createDocumentFragment()`, прикрепите к нему детей и приложите фрагмент один раз — браузер сделает один reflow вместо N.

```js
const frag = document.createDocumentFragment();
for (const task of tasks) {
  const li = document.createElement("li");
  li.textContent = task.title;
  frag.append(li);
}
list.append(frag); // один reflow, все элементы на месте
```

## События

`addEventListener` прикрепляет хендлер; хендлер получает event-объект, описывающий, что случилось. Третий аргумент — пакет опций: `capture`, `once`, `passive`.

```js
const btn = document.querySelector("#save");

btn.addEventListener("click", (event) => {
  console.log(event.type);          // "click"
  console.log(event.target);        // что именно кликнули
  console.log(event.currentTarget); // элемент, на котором висит хендлер
});

// не даём ссылке перейти по умолчанию
document.querySelector("a.no-nav")
  ?.addEventListener("click", (e) => e.preventDefault());
```

`event.target` — где событие произошло; `event.currentTarget` — где живёт слушатель. Для простых элементов они совпадают, а отличаются, когда кликнули на ребёнка внутри слушаемого элемента, — ровно то, на чём работает делегирование. Типовые события, которые вы встретите первыми: `click`, `input` и `change` на формах, `submit` на самой форме, `keydown`/`keyup`, `scroll` и `DOMContentLoaded` для «страница готова».

### Делегирование событий

Вместо того чтобы вешать хендлер на каждую строку таблицы, повесьте один хендлер на таблицу и читайте `event.target`, чтобы узнать, какая строка была задета. Новые строки работают автоматически, и вы управляете одним слушателем вместо сотен.

```js
const table = document.querySelector("#log");

table.addEventListener("click", (event) => {
  const row = event.target.closest("tr");
  if (!row) return;
  console.log("row clicked:", row.dataset.id);
});
```

Делегирование — ещё и единственный надёжный способ обработать элементы, которых пока не существует: пока узел не создан, слушатель некем прикрепить. Цена: каждый клик по таблице запускает хендлер, так что держите его дешёвым — `closest` на одно-два уровня глубже и выход.

### Удаление слушателей и одноразовые хендлеры

Передайте ту же ссылку на функцию в `removeEventListener`, чтобы отцепить. Для работы, которая должна случиться ровно один раз — диалог «понятно», подсказка при первом визите, — используйте опцию `once: true` и забудьте про ручную уборку.

```js
const onKey = (e) => console.log(e.key);
document.addEventListener("keydown", onKey);
document.removeEventListener("keydown", onKey); // работает: та же ссылка

document.addEventListener("click", () => console.log("только один раз"), { once: true });
```

> **WARNING**
> `removeEventListener` молча не срабатывает, если передать новую анонимную функцию — слушатель зарегистрирован под другой ссылкой. Держите хендлеры в именованных переменных.

## Частые ошибки

> **WARNING**
> `querySelector` возвращает `null` (не исключение), когда ничего не нашлось — обращение к нему бросает TypeError строкой ниже, в запутанном месте. Берегитесь через `if (el) { ... }` или опциональную цепочку.

> **WARNING**
> `document.write` после загрузки страницы стирает весь документ. Он существует по legacy-причинам; используйте `append`.

> **TIP**
> Читайте значения через `element.value` для полей форм, `getAttribute` для атрибутов, `textContent` для текста. Путать их — тихий источник багов «значение пустое».

Гайд про DOM заканчивается здесь. Следующий переходит со страницы на время: промисы, async/await и вся асинхронность.
