# Урок 11. position и z-index: от relative до sticky

## Цель
После урока студент сможет: объяснить, «от кого» позиционируется absolute/fixed; собрать классические схемы (бейдж в углу карточки, fixed-кнопка, sticky-шапка) и предсказать порядок наложения через z-index и stacking context.

## Теория
### Пять значений position

- **static** (по умолчанию) — элемент в потоке, top/right/bottom/left на него НЕ действуют;

- **relative** — элемент в потоке (место за ним сохраняется), но «сдвигается» относительно СЕБЯ: top: 10px — на 10px вниз, left: -5px — на 5px влево. Самое частое применение — **якорь для absolute-детей** (сам relative может не иметь ни одного сдвига);

- **absolute** — элемент ВЫБЫВАЕТ из потока (соседи «закрывают» щель, место не сохраняется) и позиционируется относительно **ближайшего ПОЗИЦИОННОГО** предка (relative/absolute/fixed/sticky). Если таких нет — от initial containing block (по сути, viewport-координаты);

- **fixed** — как absolute, но относительно **viewport**: элемент «приклеен» к окну и не двигается при скролле (шапки, «всплывашки»);

- **sticky** — гибрид: элемент в потоке, «прилипает» к границе (top: 0) после достижения порола скроллом, но не дальше своего родителя. Шапка секции: пока секция в кадре — шапка «приклеена» к верху окна.

Схема «якоря»: parent { position: relative } + child { position: absolute; top: 0; right: 0 } — бейдж в углу карточки, не вылезая наружу.

### z-index и stacking context
z-index работает **только** на позиционированных элементах (relative/absolute/fixed/sticky ≠ static) и на flex/grid-детях. Числа: чем больше — тем «выше»; negative (z-index: -1) — «под» контент (фон-декорации).

Но главное — **stacking context** (контекст наложения): свойство создаёт «коробку», и z-index детей считается ВНУТРИ неё. Создаёт контекст: position + z-index ≠ auto, opacity < 1, transform ≠ none, filter, will-change, isolation: isolate. Последствие: z-index: 100 ВНУТРИ контекста с z-index: 1 не «пробьёт» z-index: 2 вне его — сначала сравниваются контексты.

Практика: не «гоняйте» z-index (999, 9999). Задавайте маленькие значения слоям (1 — декор, 10 — dropdown, 100 — модалка) и при конфликтах ищите, КТО создаёт контекст (DevTools → вкладка «Layers»/computed isolation).

TIP: «absolute-бейдж» — ваш главный инструмент: карточка (relative) + бейдж (absolute, top/right 8px) — без flex-хаков и без влияния на layout. Аналогично «крестик» закрытия и «счётчики» на иконках.

NOTE: sticky «не прилипает», если: у какого-то предка overflow: hidden/auto/scroll (создаётся свой скролл-контейнер — sticky прилипает к НЕМУ, а не к окну); у sticky-элемента задан height и нет «свободного» пространства для сдвига; top задан, но родитель слишком короткий.

## Пример
Каркас:
```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Урок 11. position</title>
</head>
<body>
  <header class="topbar">Sticky-шапка</header>
  <div class="card">
    <span class="badge">NEW</span>
    <h2>Карточка</h2>
    <p>Текст карточки. Бейдж лежит в углу, не влияя на поток.</p>
  </div>
  <button class="fab">+</button>
  <div class="filler">Прокрутите: шапка прилипнет, а кнопка «+»</div>
  <div class="filler">приклеена к углу окна.</div>
</body>
</html>
```
CSS:
```css
.topbar {
  position: sticky;
  top: 0;
  background: #fff;
  border-bottom: 1px solid #dee2e6;
  padding: 0.75rem 1rem;
  z-index: 10;
}

.card {
  position: relative; /* якорь для бейджа */
  max-width: 420px;
  margin: 1rem auto;
  padding: 1.5rem;
  border: 1px solid #dee2e6;
  border-radius: 12px;
}

.badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #e8590c;
  color: #fff;
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 999px;
}

.fab {
  position: fixed;
  right: 20px;
  bottom: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: #1971c2;
  color: #fff;
  font-size: 1.5rem;
  z-index: 100;
}

.filler {
  height: 50vh;
  margin-top: 2rem;
}
```
Разбор: .topbar «прилипает» к верху при скролле (sticky + top: 0) и лежит ПО карточками (z-index: 10 — иначе карточка с position: relative «накроет» её при пересечении). .badge — absolute-бейдж в relative-карточке: вынесен из потока, лежит в углу. .fab — fixed: не двигается при скролле, z-index: 100 выше шапки.

## Частые ошибки
WARN: absolute без позиционированного предка — элемент «уехал» в верх-лево окна (позиционируется от viewport-координат); добавьте position: relative ближайшему «якорному» родителю.
WARN: z-index у static-элемента — молча игнорируется; z-index работает только на positioned (и flex/grid-детях).
WARN: z-index: 9999 «на всё» — война слоёв: новая модалка = 99999; задавайте слоями (10/100/1000) и создавайте stacking context осознанно (isolation: isolate у компонентов).
WARN: sticky «не работает» — у родителя overflow: hidden (частый «сброс» body) — sticky прилипает к родителю, а не к окну; проверьте цепочку overflow.
WARN: relative «сдвинул» элемент и «сломал» layout — relative сохраняет МЕСТО в потоке (соседи не сдвигаются), но визуально элемент «наехал»; если нужно «забрать место» — absolute.

## Практическое задание

1. Соберите каркас из Примера и реализуйте position-правила со скелета задания.

2. Уберите position: relative у .card — куда «уедет» бейдж и почему? Верните.

3. Добавьте в .card второй absolute-элемент (например, иконку слева внизу: bottom: 10px; left: 10px) — и объясните, почему он не влияет на поток текста.

4. Задайте .topbar z-index: -1 и проскролльте — что произошло (подсказка: stacking context и порядок)? Верните 10.

5. Бонус: оберните .fab в div с opacity: 0.99 — z-index кнопки «обнулится» относительно мира (новый stacking context). Объясните это одной фразой и уберите обёртку.
