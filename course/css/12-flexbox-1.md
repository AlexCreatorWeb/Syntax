# Урок 12. Flexbox I: оси, выравнивание, gap

## Цель
После урока студент сможет: включить flex-контейнер и объяснить две оси (главную и поперечную); выровнять элементы по осям (justify-content, align-items, align-content); задать промежутки через gap; собрать классические схемы (центрирование, «кнопки вправо», колонка).

## Теория
### Flex-контейнер и две оси
display: flex превращает **дети** контейнера в flex-элементы, выстроенные в строку (по умолчанию). Появляются ДВЕ оси:

- **главная ось (main axis)** — направление выстраивания (по умолчанию горизонталь, left→right); управляется **justify-content**;

- **поперечная ось (cross axis)** — перпендикуляр (по умолчанию вертикаль); управляется **align-items** (выравнивание элементов поперёк) и **align-content** (выравнивание РЯДОВ, когда flex-wrap: wrap).

flex-direction задаёт главную ось: row (по умолчанию, строка), row-reverse, column (колонка, главная ось — вертикаль), column-reverse. С column «роли» justify/align **меняются местами**: justify-content выравнивает по вертикали.

### Значения justify-content (по главной оси)

- **flex-start** (по умолчанию) — «в начало»; **flex-end** — «в конец»; **center** — по центру;

- **space-between** — первый и последний «в края», промежуток между остальными РАВЕН (популярно: логотип слева, меню справа);

- **space-around** — «вокруг» каждого элемента равный отступ (вдвое больше между, чем в краях);

- **space-evenly** — все промежутки (включая края) равны.

### align-items (поперёк) и align-content
**align-items** выравнивает каждый элемент по поперечной оси:

- **stretch** (по умолчанию) — элементы «растягиваются» на всю поперечную высоту (поэтому flex-карточки в строке **равной высоты** — это не магия, а stretch);

- **flex-start/flex-end/center** — «в начало/конец/центр» поперечной оси.

**align-content** работает, только когда есть НЕСКОЛЬКО РЯДОВ (flex-wrap: wrap): space-between по вертикали и т.д. У одного ряда — не действует.

### gap и отключение «пробелов»
**gap: 1rem** (или row-gap/column-gap) — промежутки МЕЖДУ flex-элементами. Это замена «margin-right на всех, кроме последнего»: gap не добавляет отступ у краёв, не схлопывается, работает и в Grid (уроки 14–15).

Классика центрирования «одного элемента по центру контейнера» (которая 20-лет ломала верстальщиков):
```css
.parent { display: flex; justify-content: center; align-items: center; }
```

TIP: flexbox — для **однмерных** раскладок (строка ИЛИ колонка, «распределить по оси»). Для 2D-сетки (ряды и столбцы одновременно) — Grid. Навигация, тулбар, «карточки в ряд» — flex; страница целиком — Grid.

NOTE: flex-контейнер **не схлопывает** margin детей (в отличие от block-потока, урок 8) — и gap предпочтительнее margin «на всех». margin: 0 auto у flex-элемента — «жирный» приём: элемент «съедает» свободное место и центрируется/сдвигается (например, margin-left: auto у «правой» кнопки).

## Пример
Каркас:
```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Урок 12. Flexbox I</title>
</head>
<body>
  <nav class="nav">
    <span class="logo">Logo</span>
    <a href="#">Один</a>
    <a href="#">Два</a>
    <a href="#">Три</a>
    <a class="btn" href="#">Вход</a>
  </nav>
  <div class="center-box">
    <div class="center-item">По центру</div>
  </div>
  <div class="cards">
    <div class="card">А</div>
    <div class="card">ББ</div>
    <div class="card">ВВВ</div>
  </div>
</body>
</html>
```
CSS:
```css
.nav {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: #f1f3f5;
}

.nav .logo {
  font-weight: 700;
}

.nav .btn {
  margin-left: auto; /* "уходит вправо" */
  background: #1971c2;
  color: #fff;
  padding: 0.4rem 0.9rem;
  border-radius: 8px;
}

.center-box {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 160px;
  border: 1px dashed #adb5bd;
  margin: 1rem;
}

.cards {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
}

.card {
  padding: 1rem;
  background: #e7f5ff;
  border-radius: 8px;
}
```
Разбор: .nav — строка с align-items: center (кнопка и логотип «выровнены по центру по высоте», а не «по верху»). margin-left: auto у .btn «съедает» всё свободное пространство слева от себя — кнопка у правого края. .center-box — классическое центрирование двумя свойствами. .cards — строка карточек с gap: карточки РАЗНОЙ ширины (текст), но РАВНОЙ высоты (stretch).

## Частые ошибки
WARN: margin-right «на всех, кроме последнего» (:last-child { margin: 0 }) — хрупко: сортировка/условный рендер ломает «последний»; используйте gap: 1rem.
WARN: align-items и justify-content перепутаны (особенно с flex-direction: column) — с column главная ось вертикальная: justify-content — «по вертикали», align-items — «по горизонтали». Сначала мысленно нарисуйте оси.
WARN: gap у старых Safari — поддерживается с 14.1 (2021); для поддержки 14 и младше — margin-фолбэк, но в новых проектах gap безопасно.
WARN: «карточки разной высоты» — align-items: stretch (по умолчанию) их РОВНЯЕТ; если высоты разные — проверьте, что вы не задали align-items: flex-start (тогда каждая «по своему росту»).
WARN: flex у одного элемента «не работает» — display: flex задаётся РОДИТЕЛЬСКОМУ, а стилизуются ДЕТИ; «flex: 1» на родителе — это уже другое (grow, урок 13).

## Практическое задание

1. Соберите каркас из Примера и реализуйте flex-правила со скелета задания.

2. Замените у .nav justify-content последовательно на space-between, space-around, space-evenly — опишите разницу в трёх словах для каждого.

3. Уберите margin-left: auto у .btn и добейтесь того же («кнопка вправо») через justify-content: space-between на .nav — что сломалось в выравнивании остальных ссылок?

4. Задайте .cards flex-wrap: wrap и сузьте окно — карточки «обернутся»; теперь выставите align-content: space-between (высота .cards: 300px) — что изменилось?

5. Бонус: соберите «тулбар»: иконки слева, поиск по центру, кнопка справа — одним flex-контейнером (подсказка: margin: 0 auto с двух сторон у «центрального» элемента).
