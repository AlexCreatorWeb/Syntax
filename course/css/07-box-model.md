# Урок 7. Box Model и box-sizing: border-box

## Цель
После урока студент сможет: нарисовать box model любого элемента (content, padding, border, margin); предсказать итоговый размер элемента при заданных значениях; применить border-box по умолчанию и объяснить, зачем.

## Теория
### Из чего состоит «ящик» элемента
Каждый элемент в CSS — прямоугольник из четырёх слоёв (от центра наружу):

1. **content** — содержимое: ширина и высота (width/height) относятся именно к этому слою по умолчанию;

2. **padding** — отступ ВНУТРИ элемента, между контентом и бордером (фон элемента закрашивает и padding);

3. **border** — рамка: border-width + border-style + border-color (style обязателен: без border-style рамки не будет, border-width: 5px сам по себе ничего не рисует);

4. **margin** — отступ СНАРУЖИ: прозрачная зона, отделяющая элемент от соседей (фон на margin не закрашивается).

Краткая запись: `border: 2px solid #333` и `margin: 1rem 2rem 1rem 2rem` (по часовой: верх право низ лево; два значения — вертикаль горизонталь; одно — всё).

### content-box и border-box: два режима расчёта
По умолчанию **box-sizing: content-box**: width задаёт ТОЛЬКО content, а итоговая ширина = width + padding + border (+ margin уже не в элементе, но «забирает» место в layout). Элемент с width: 300px, padding: 20px, border: 2px занимает 344px.

**box-sizing: border-box** разворачивает логику: width — это ИТОГОВЯ ширина «коробки» (content + padding + border), content сжимается под неё. width: 300px с теми же padding/border занимает ровно 300px — и всё, что вы видите на экране, совпадает с тем, что вы написали.

Почему border-box — стандарт: при content-box любой padding «уводит» расчёт от написанного числа, и сетки/карточки не складываются (300 + 40 padding + 4 border = 344, а в ряд не влезает). В border-box — «написал 300, получил 300».

### Глобальный сброс box-sizing
Практика — один раз в начале файла:
```css
*, *::before, *::after {
  box-sizing: border-box;
}
```
Это «сброс» (reset): все элементы и псевдоэлементы считают размеры «честно». После него width: 50% у двух соседей = ровно 100% родителя без переполнения.

TIP: чтобы «увидеть» box model — в DevTools у элемента вкладка Computed → панель Box Model (внизу): четыре слоя с числами. Ставьте hover по слоям — браузер подсветит соответствующую зону на странице (padding — жёлтым, margin — зелёным).

NOTE: margin — часть box model, но НЕ часть «размера» элемента: margin-transparent, на него не действует фон, и в border-box его тоже не «включают» в width. Элемент width: 100% + margin: 10px — «переполнит» родителя на 20px (по 10 с боков) — классический источник горизонтального скролла.

## Пример
Каркас:
```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Урок 7. Box Model</title>
</head>
<body>
  <div class="demo">content-box (по умолчанию)</div>
  <div class="demo demo--bb">border-box</div>
  <div class="half">50%</div>
  <div class="half half--bb">50% + border-box</div>
</body>
</html>
```
CSS:
```css
*, *::before, *::after {
  box-sizing: border-box; /* ГЛОБАЛЬНЫЙ сброс — всегда первым */
}

.demo {
  width: 300px;
  padding: 20px;
  border: 2px solid #1971c2;
  margin-bottom: 1rem;
}

.demo--bb {
  box-sizing: border-box;
}

.half {
  width: 50%;
  border: 2px solid #e8590c;
  float: none;
}
```
Разбор: первый .demo при content-box занимает 344px (300 + 40 + 4), второй — ровно 300px при том же width. Два `.half` по 50% с border-ом: при content-box суммарно 100% + 8px — переполнение (скролл); при border-box (глобальный сброс уже применён) — ровно 100%. В превью проверьте горизонтальный скролл, если уберёте глобальный сброс.

## Частые ошибки
WARN: width: 100% + margin/padding по бокам — переполнение и «призрак» горизонтального скролла; лечится border-box или calc(100% - 2rem).
WARN: border без border-style — border: 5px сам по себе невидим (нужен solid/dashed/...); частый «почему нет рамки».
WARN: content-box «в голове» при border-box-сбросе — начинаешь «вычитать» padding из width вручную, а браузер и так уже это сделал; при border-box пишите итоговые размеры.
WARN: margin-transparent «не считается размером» — width: 100% + margin-left: 10px уводит элемент за правый край; для отступов внутри родителя — padding родителя, не margin детей.
WARN: padding-top: 100% — «квадрат» считается от ШИРИНЫ родителя (урок 6): в узком контейнере «100%» по вертикали даст не квадрат, а прямоугольник; для «квадрата» — aspect-ratio (урок 9).

## Практическое задание

1. Соберите каркас из Примера и в styles.css: глобальный box-sizing-сброс + правила для .demo и .half по скелету задания.

2. В DevTools → Computed у .demo посмотрите Box Model: наведите курсор на padding — браузер подсветит зону жёлтым на странице.

3. Задайте .demo--bb width: 250px и объясните (комментарием в CSS), сколько px займёт content-зона (формула: width − padding − border).

4. Уберите глобальный сброс (закомментируйте) и найдите в превью элемент, который «вылез» — объясните, почему именно он.

5. Бонус: реализуйте «центрирование по горизонтали» блока шириной 300px через margin: 0 auto — и объясните, почему это работает только у элементов с заданной шириной.
