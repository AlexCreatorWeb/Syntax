# Урок 15. Grid II: области, auto-fill/auto-fit, имплицитная сетка

## Цель
После урока студент сможет: набросать макет страницы «картинкой» через grid-template-areas; собрать адаптивную галерею карточек без единого media query (auto-fit + minmax); управлять имплицитной сеткой (grid-auto-rows, grid-auto-flow).

## Теория
### grid-template-areas: макет «картинкой»
**grid-template-areas** описывает раскладку **буквально как картинку**: строками-«строками» из именованных ячеек:
```css
.page {
  display: grid;
  grid-template-columns: 250px 1fr 250px;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "header header header"
    "sidebar main aside"
    "footer footer footer";
}
.header { grid-area: header; }
.sidebar { grid-area: sidebar; }
```
Каждая «строка» в кавычках — ряд; имена совпадают по столбцам. НУЛЕВАЯ ячейка — . (пусто). Элемент «привязывается» одной строкой: grid-area: name. Преимущества: макет читается как ASCII-арт, «переставить» блоки — переписать «картинку» (и в media query — другую картинку, урок 17).

### auto-fit vs auto-fill: «резиновая» галерея
**repeat(auto-fit, minmax(250px, 1fr))** — «столько столбцов по 250px+, сколько ВЛЕЗЕТ, растянуть доли на всю ширину»:

- **auto-fit** — пустые (не занятые) треки **схлопываются** в 0: 6 карточек в широком окне = 4 столбца, при сужении — 3, 2, 1 — **адаптив БЕЗ media queries**;

- **auto-fill** — пустые треки **сохраняются** (невидимые «слоты»): 2 карточки в 4-колоночной сетке займут первые 2 «слота», не «растянувшись» на всю ширину.

Для галереи карточек — почти всегда **auto-fit** (карточки «доползают» до края). Для «слотов» (форма, дашборд с фиксированными местами) — auto-fill.

### Имплицитная сетка: grid-auto-rows и flow
Когда детей БОЛЬШЕ, чем явных рядов, Grid создаёт **имплицитные** ряды (страница «растёт» вниз). Их параметры:

- **grid-auto-rows: 100px** — высота имплицитных рядов (100px каждый);

- **grid-auto-rows: minmax(120px, auto)** — «от 120, но под контент»;

- **grid-auto-flow: row** (по умолчанию) — заполнять «по строкам»; **column** — «по столбцам»; **dense** — «заполнять дырки» (элементы «встраиваются» в свободные ячейки, порядок DOM при этом «нарушается» визуально).

Приём «равные карточки в 2D»: grid-auto-rows: 1fr на контейнере с РОВНО одним рядом имплицитных рядов — все карточки РОВНОЙ высоты (частая замена flex-wrap-«хакам»).

TIP: **place-items: center** — сокращение от align-items + justify-items: центрирует ВСЕ grid-элементы в своих ячейках одним свойством. Для «одного элемента по центру сетки» — display: grid; place-items: center; min-height: 100dvh (альтернатива flex-центрированию).

NOTE: auto-fit/auto-fill работают только в **repeat()**: grid-template-columns: auto-fit, minmax(250px, 1fr) — синтаксическая ошибка (нет repeat). И минимальная ширина 250px должна «влезать» в контейнер хотя бы ОДИН раз (иначе — переполнение).

## Пример
Каркас:
```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Урок 15. Grid II</title>
</head>
<body>
  <div class="page">
    <header class="header">Шапка</header>
    <aside class="sidebar">Sidebar</aside>
    <main class="main">
      <div class="gallery">
        <div class="g-card">1</div>
        <div class="g-card">2</div>
        <div class="g-card">3</div>
        <div class="g-card">4</div>
        <div class="g-card">5</div>
      </div>
    </main>
    <footer class="footer">Подвал</footer>
  </div>
</body>
</html>
```
CSS:
```css
.page {
  display: grid;
  grid-template-columns: 220px 1fr;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
  min-height: 100dvh;
  gap: 1rem;
  padding: 1rem;
}

.header { grid-area: header; background: #f1f3f5; padding: 1rem; }
.sidebar { grid-area: sidebar; background: #e7f5ff; padding: 1rem; }
.main { grid-area: main; }
.footer { grid-area: footer; background: #f1f3f5; padding: 1rem; }

.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.75rem;
}

.g-card {
  padding: 1.5rem 1rem;
  background: #fff;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  text-align: center;
}
```
Разбор: .page — «картинка» из трёх рядов: шапка на всю ширину, sidebar+main, подвал на всю ширину. .gallery — «резиновая» сетка: при широком окне 5 карточек распределятся по 3–4 в ряд, при сужении — 2, затем 1 — БЕЗ единого media query. Сузьте окно в DevTools (device toolbar) и проследите за перестроением.

## Частые ошибки
WARN: auto-fit «не сжимает» карточки — проверьте, что minmax(250px, 1fr) внутри repeat(): без repeat auto-fit не работает. И что 250px «влезает» в контейнер (иначе переполнение).
WARN: auto-fit vs auto-fill перепутаны — 2 карточки в auto-fill-4-колонке НЕ «растянутся» (пустые слоты сохранились); для «доползти до края» — auto-fit.
WARN: grid-template-areas «не работает» — в каждой «строке» одинаковое ЧИСЛО ячеек, имена совпадают по столбцам, строка в кавычках; одно «лишнее» слово — и весь макет «падает» в имплицит.
WARN: grid-auto-flow: dense «ломает» порядок — элементы «встраиваются» в дырки: DOM-порядок ≠ визуальный (tab-навигация идёт по DOM); для «красивых дырок» — ок, для «логического» списка — нет.
WARN: «равные карточки» через grid-auto-rows: 1fr — работает только для ОДНОГО ряда; для нескольких рядов равной высоты — subgrid (урок 16) или фиксированные grid-auto-rows.

## Практическое задание

1. Соберите каркас из Примера и реализуйте .page (areas) и .gallery (auto-fit) со скелета задания.

2. Добавьте 4 карточки в .gallery (всего 9) — объясните, как распределились «лишние» (имплицитные ряды). Задайте .gallery grid-auto-rows: 80px — что изменилось?

3. Замените auto-fit на auto-fill и оставьте 2 карточки (комментируйте остальные) — сравните «растяжение» с auto-fit.

4. Переделайте .page на mobile-раскладку (ОДНА колонка) — новой «картинкой» в media query (подготовительный шаг к уроку 17): "header" / "main" / "footer".

5. Бонус: соберите «одиночный элемент по центру экрана» — body { display: grid; place-items: center; min-height: 100dvh } + div — и сравните с flex-вариантом из урока 12: что проще?
