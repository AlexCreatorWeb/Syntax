# Урок 31. Текст, классы, атрибуты и стили

## Цель
После урока студент сможет: «изменять** «текст** (textContent) «безопасно** «и** «HTML** (innerHTML) «с** ««пониманием** «разницы**); «управлять** «классами** (classList); «читать/писать** «атрибуты** (getAttribute/setAttribute); «менять** «инлайн-стили** (el.style) «и** «понимать**, «когда** «что**.

## Теория
### Текст: textContent «vs** innerHTML
- **el.textContent** = "текст" — «заменить** «весь** «текст** «элемента** («безопасно**: «HTML-теги** «—» «литеральный** «текст** «(не «разметка**); «читать**: el.textContent — «весь** «текст** «(без** «тегов**);
- **el.innerHTML** = "<b>текст</b>" — «заменить** «содержимое** ««HTML-разметкой** («теги** «разберутся** «в** «DOM**). «Опасно**: «вставка** ««пользовательского** «текста** «через** innerHTML — «вмешательство** «(XSS) (скрипт** «из** ««страницы** «выполнится**).

«Правило**: «вставляем** ««чистый** «текст** → textContent («безопасно**); «вставляем** ««готовый** «HTML** (свой** «шаблон** «без** «пользовательских** «данных**) → innerHTML. «С** «пользовательскими** «данными** «—» «через** textContent «или** «эскейп**.

### Классы: classList
```js
el.classList.add("active");          // «добавить**
el.classList.remove("active");       // «удалить**
el.classList.toggle("active");       // «переключить** (add «если** «нет**, remove «если** «есть**)
el.classList.contains("active");     // true/false
el.classList.replace("old", "new");  // «заменить**
```
«Классы** «—** «главный** «способ** ««переключать** «вид** (CSS «реагирует** «на** «классы**). «Лучше** «чем** «ручное** «manipulation** «строки** el.className.

### Атрибуты: get/set/remove
```js
el.getAttribute("href");     // «значение** (строка** «или** null)
el.setAttribute("href", "url");
el.removeAttribute("href");
el.hasAttribute("href");
el.disabled = true;          // ««специальные** «атрибуты** «—» «свойства** (boolean)
el.value = "текст";          // «ввод** «(input) — «свойство** .value
```
«Разница** «атрибут** «vs** «свойство**: «атрибут** — «HTML** («начальное** «значение**), «свойство** — «DOM** («текущее** «состояние**). «Для** «ввода** (input.value) — «свойство** («атрибут** «—» ««дефолт**).

### Стили: el.style
```js
el.style.color = "red";            // «инлайн** («перекрывает** «все** «CSS**)
el.style.backgroundColor = "#fff"; // «camelCase** (не "background-color")
el.style.cssText = "color: red; font-size: 20px"; // «весь** «строкой**
```
«Правило**: el.style — «быстрые** ««правки** «(демо**, «динамические** «значения** «(позиция** «элемента** «в** «drag)**. «Для** ««состояний** «(активен/выключен**) — «классы** (CSS «чистее** «и** «переиспользуемее**).

TIP: «переключение** ««состояний** «через** «классы** (.active, .hidden) «—» ««паттерн** «всего** «UI**. «el.style «—» «только** ««динамические** «значения** («числа** «позиции** «для** «анимации**).

NOTE: innerHTML «при** ««чтении** «—» ««HTML** «содержимого** («с** «тегами**). «textContent «при** ««чтении** «—» ««плоский** «текст** («без** «тегов**). «Для** ««поиска** «текста** «—» textContent.

## Пример
HTML-каркас (index.html):
```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Урок 31. DOM-модификация</title>
  <style>
    .item { padding: 8px; background: #eee; margin: 4px 0; }
    .item.active { background: #b2df8a; font-weight: bold; }
    .item.done { text-decoration: line-through; color: #888; }
  </style>
</head>
<body>
  <div id="output">кликните «кнопку»</div>
  <ul id="list">
    <li class="item">Один</li>
    <li class="item">Два</li>
    <li class="item">Три</li>
  </ul>
  <button id="btn">Переключить «первый</button>
  <input id="name" value="гость">
</body>
</html>
```
JS (index.js «с** «TODO**):
```js
const output = document.getElementById("output");
output.textContent = "готово"; // «чистый** «текст** (безопасно**)
// output.innerHTML = "<b>готово</b>"; // «HTML** («свой** «шаблон**)

const first = document.querySelector("#list .item");
first.classList.toggle("active"); // «переключить** «класс**
console.log(first.classList.contains("active")); // true

const link = document.createElement("a");
link.setAttribute("href", "https://example.com");
console.log(link.getAttribute("href"));

const input = document.getElementById("name");
console.log(input.value); // "гость" («свойство**)

first.style.color = "red"; // «инлайн** («быстрая** «правка**)
```
Разбор: textContent — «текст**, innerHTML — «HTML**, classList — «состояния**, get/setAttribute — «атрибуты**, .value — «свойство** «ввода**, style — «быстрые** ««правки**.

## Частые ошибки
WARN: innerHTML «с** «пользовательским** «вводом** (el.innerHTML = userInput) — «XSS** («скрипт** «из** ««ввода** «выполнится**); «чистый** «текст** → textContent.
WARN: el.className = "active" «вместо** classList.add — «перезапишет** «все** «классы** («остальные** «потеряны**); classList («только** «один**).
WARN: el.style.background-color = ... — «не** «сработает** («дефис** «в** «JS** «—» «оператор** «минус**); camelCase: el.style.backgroundColor.
WARN: input.value «ожидаете** «атрибут** — «свойство** («текущее** «состояние** «ввода**); «атрибут** «value «—» ««дефолт** (начальное**).
WARN: «изменение** «className «каждый** «тик** «анимации** — «медленнее** «classList/style** «и** ««мерцает** «(CSS «пересчёт**); «классы** «—» «состояния**, «style** «—» ««динамические**.

## Практическое задание
1. Создайте index.html «с** «каркасом** «и** index.js «с** «TODO** (материал** «Примера**).
2. «Переключите** «класс** «active «на** «первом** «.item** (classList.toggle) — «превью** «поменяет** «фон**.
3. «Измените** «текст** #output «через** textContent «и** «сравните** «с** innerHTML (теги** «<b>**).
4. «Найдите** «значение** «input** (.value) «и** «измените** «(input.value = "A").
5. Бонус: «переключите** «все** «.item** «на** «.done** «(forEach + classList) — ««зачеркнёте** «список**.
