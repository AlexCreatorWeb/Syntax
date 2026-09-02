# Урок 20. Кастомные свойства: переменные и темы

## Цель
После урока студент сможет: объявить кастомные свойства и использовать их через var() с fallback; выстроить «токены» дизайна (цвета, отступы, радиусы) в :root; собрать тёмную/светлую тему через [data-theme] и объяснить отличия кастомных свойств от preprocessor-переменных.

## Теория
### Кастомные свойства: переменные в «чистом» CSS
**Кастомное свойство** (custom property) — «переменная» CSS, объявляется с двойным дефисом: --name: value; и используется через var():
```css
:root {
  --accent: #1971c2;
  --radius: 8px;
  --space-2: 1rem;
}
.btn {
  background: var(--accent);
  border-radius: var(--radius);
  padding: var(--space-2);
}
```
**var(имя, fallback)**: var(--accent, #000) — если --accent «не определена» (в этой части дерева), подставится fallback. Fallback может быть «вложенным»: var(--a, var(--b, #000)).

### Где объявлять: :root, селекторы, cascade

- **:root** (или html) — «глобальные» токены: доступны ВСЕМ элементам (наследуется);

- **селектор** — «локальные»: .card { --card-bg: #fff; } — доступен .card и её детям;

- **атрибут-селектор** — «контекстные»: [data-theme="dark"] { --bg: #212529; } — «переопределение» под условием.

Кастомные свойства **наследуются** (как color): дочерний элемент «видит» --accent родителя. И **участвуют в каскаде**: более «специфичное» объявление «перебивает» (урок 5).

### Темы: [data-theme] и prefers-color-scheme
«Классическая» схема двух тем:
```css
:root {
  --bg: #fff; --text: #212529; --accent: #1971c2;
}
[data-theme="dark"] {
  --bg: #212529; --text: #f8f9fa; --accent: #74c0fc;
}
body { background: var(--bg); color: var(--text); }
```
JS «переключает» data-theme на <html>, и ВСЕ правила с var() «пересчитываются». «Системная» тема: @media (prefers-color-scheme: dark) { :root { --bg: #212529; ... } } (без JS). «Смешанная» (система + переключатель): :root[data-theme="light"] / :root[data-theme="dark"] «перебивают» media query.

### Кастомные свойства vs preprocessor (SCSS/Less)

- **CSS-переменные** — «в runtime»: могут «меняться» (hover, media query, JS), «наследуются», «участвуют» в каскаде;

- **SCSS-переменные** — «в build-time»: подставляются при компиляции, «не видны» в runtime, «не меняются» без пере-билда.

CSS-переменными «делают» **темы** (runtime-переключение), SCSS-переменными — **константы сборки** (версии, пути).

### Ограничения (и обходы)

- **тип не проверяется**: --w: 50% и width: var(--w) — ок; --c: red и width: var(--c) — «молча» ломается (width: red — invalid → width: auto);

- **в keyframes** — var() «не работает» (анимации «не видят» переменных, урок 21): значения «дублируются» в from/to;

- **в @import** — условия @import «не видят» var();

- **выражения** — var() «не вычисляет»: width: calc(var(--w) * 2) — calc ОБЯЗАТЕЛЕН (var — «подстановка», не «число»).

TIP: **именование токенов** — «по роли», не по «значению»: --color-accent (роль), а не --blue-500 (значение). «Значение» — «внутренность»: --accent: var(--blue-600) — и «смена» палитры = правка ОДНОГО места (урок 10: «палитра» + «роли»).

NOTE: кастомные свойства — «не magic»: --accent «без» var() в правиле — «молча» игнорируется (unknown property). var(--accent) «без» объявления — invalid → свойство «откатывается» к fallback (если есть) или к наследуемому.

## Пример
Каркас:
```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Урок 20. Переменные</title>
</head>
<body>
  <button class="theme-toggle" onclick="document.documentElement.dataset.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'">Тема</button>
  <div class="card">
    <h2>Карточка</h2>
    <p>Текст карточки. Переключите тему — цвета «пересчитаются».</p>
    <button class="btn">Кнопка</button>
  </div>
</body>
</html>
```
CSS:
```css
:root {
  --bg: #f8f9fa;
  --surface: #fff;
  --text: #212529;
  --text-muted: rgb(33 37 41 / 0.6);
  --accent: #1971c2;
  --accent-text: #fff;
  --radius: 12px;
  --space-1: 0.5rem;
  --space-2: 1rem;
  --space-3: 1.5rem;
}

[data-theme="dark"] {
  --bg: #212529;
  --surface: #343a40;
  --text: #f8f9fa;
  --text-muted: rgb(248 249 250 / 0.6);
  --accent: #74c0fc;
  --accent-text: #212529;
}

body {
  font-family: system-ui, sans-serif;
  background: var(--bg);
  color: var(--text);
  padding: var(--space-3);
}

.card {
  background: var(--surface);
  border-radius: var(--radius);
  padding: var(--space-3);
  max-width: 420px;
}

.card h2 { margin-top: 0; }
.card p { color: var(--text-muted); }

.btn {
  background: var(--accent);
  color: var(--accent-text);
  border: none;
  border-radius: var(--radius);
  padding: var(--space-1) var(--space-2);
}

.theme-toggle {
  margin-bottom: var(--space-2);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius);
  border: 1px solid var(--text-muted);
  background: var(--surface);
  color: var(--text);
}
```
Разбор: :root — «светлые» токены, [data-theme="dark"] — «тёмные» (переопределение тех же имён). body/.card/.btn — var() «везде»: переключение data-theme «пересчитывает» ВСЕ цвета/отступы/радиусы. Кнопка «Тема» (инлайн-JS) «переключает» data-theme на <html> — попробуйте в превью.

## Частые ошибки
WARN: var(--accent) «без» объявления и «без» fallback — свойство «откатывается» к наследуемому/initial: background: var(--accent) «без» --accent → background: transparent (initial) — «прозрачный» фон «молча».
WARN: calc «не нужен» (var — «число») — var() «подставляет» ЗНАЧЕНИЕ (строку), не «число»: width: var(--w) * 2 — синтаксическая ошибка; calc(var(--w) * 2) — ОБЯЗАТЕЛЕН.
WARN: «локальная» переменная «в родителе» «не видна» — кастомные свойства наследуются «вниз» (родитель → дети), но НЕ «вверх» и НЕ «в siblings»: --accent в .card «не виден» в .header (сосед).
WARN: var() «в keyframes» — «не работает» (animation «не видит» переменных, урок 21): значения «дублируются» в from/to (или «анимируются» через CSS-токены @property — продвинутый уровень).
WARN: «имена» по «значению» (--blue-500, --gray-100) — «смена» палитры = правка «десятков» мест; «имена» по «роли» (--accent, --text-muted) + «один» слой «значений» (--accent: var(--blue-600)).

## Практическое задание

1. Соберите каркас из Примера и реализуйте тему со скелета задания (токены в :root, [data-theme="dark"]-переопределения, var() в правилах).

2. Переключите тему в превью — и в DevTools → Computed у .btn проверьте, что background «пересчитался» (var «подставил» другое значение).

3. Уберите --radius из [data-theme="dark"] (оставьте в :root) — радиус «сохранится» (наследование). Уберите из :root «тоже» — что произошло? (fallback/initial).

4. Задайте .card --card-accent: #e8590c (локально) и .btn «внутри» .card background: var(--card-accent) — «локальная» переменная «перебила» глобальную. Объясните каскад.

5. Бонус: соберите «масштаб» отступов: --space-1: 0.5rem, --space-2: 1rem, --space-3: 1.5rem, --space-4: 2rem — и замените ВСЕ padding/margin в проекте на var(--space-N).
