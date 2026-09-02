# Урок 8. display: потоки и схлопывание маржинов

## Цель
После урока студент сможет: объяснить, чем block, inline и inline-block отличаются в layout; предсказать, куда «уйдут» вертикальные margin при схлопывании; выбрать display под задачу без хаков.

## Теория
### Три «режима» элемента
Свойство display определяет, КАК элемент участвует в layout:

- **block** — «блок»: каждый элемент на новой строке, ширина по умолчанию 100% родителя, принимает width/height и ВСЕ четыре стороны margin/padding. Стандартные block: div, section, h1–h6, p, ul, form;

- **inline** — «строка»: элементы стоят в строку друг за другом (как слова), width/height игнорируются, margin/padding работают ТОЛЬКО по горизонтали, вертикальные margin/padding «видны», но не двигают соседей. Стандартные inline: span, a, strong, em, code;

- **inline-block** — гибрид: стоит в строку (как inline), но принимает width/height и все стороны margin/padding. Классика: кнопки, бейджи, иконки-чипы.

Важно: display — **CSS-свойство, а не свойство тега**: `<span>` можно сделать display: block, а `<div>` — inline. Теги лишь задают значение по умолчанию (и семантику для a11y — тег остаётся тем же в DOM).

### Схлопывание маржинов (margin collapsing)
У двух СЛОЖНЫХ (block) элементов, стоящих друг за другом, вертикальные margin **не складываются, а схлопываются** до большего:

- `.a { margin-bottom: 10px }` + `.b { margin-top: 30px }` между ними → расстояние 30px, а не 40;

- **parent-child collapsing**: если у родителя нет padding/border сверху, margin первого ребёнка «выходит» наружу — верхний margin родителя = 0, но ребёнок «вытягивает» его вниз.

Когда схлопывания НЕТ: между элементами есть что-то (padding, border, min-height), элементы — inline-block/flex-item/grid-item, или у родителя overflow ≠ visible. Flexbox и Grid **не схлопывают** margin своих детей — ещё одно преимущество раскладок.

Практика: не «боритесь» со схлопыванием, а **проектируйте margin в одну сторону** — например, только margin-bottom у блоков контента (никогда не «и сверху, и снизу» у соседей). Тогда схлопывание становится предсказуемым: расстояние между любыми двумя блоками = их общий margin.

### display: none, contents и другие режимы

- **none** — элемент полностью исключён из layout (нет места, нет событий); отличается от visibility: hidden (место остаётся, просто невидимо) и opacity: 0 (место есть, невидим, но кликабелен);

- **contents** — сам элемент исчезает из layout, дети остаются (пригодится для обёрток-«прозрачных» контейнеров; осторожно с a11y — обёртка исчезает и из дерева доступности);

- **flex/grid** — элементы-контейнеры включают раскладку (уроки 12–15), сами при этом остаются block-внешне.

TIP: отладка «элемент не там, где должен» — первый вопрос: какой у него display? Если вы задаёте height span-у и он «не слушается» — это inline. Быстрая проверка: в DevTools посмотрите display в Computed и попробуйте переключить inline ↔ inline-block.

NOTE: float НЕ умирает, но не для раскладок: его современная задача — «обтекание текстом» (картинка слева, текст вокруг). Для сеток-расположений — flex/grid; float-хаки 2010-х (« clearfix-контейнеры») не нужны.

## Пример
Каркас:
```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Урок 8. display</title>
</head>
<body>
  <p class="text">Внутри абзаца: <span class="tag">span по умолчанию</span> и <span class="tag tag--ib">span inline-block</span> стоят в строку.</p>
  <div class="stack">
    <div class="block">A (margin-bottom: 20px)</div>
    <div class="block">B (margin-top: 40px)</div>
    <div class="block">C</div>
  </div>
  <button class="btn">Кнопка inline-block</button>
  <button class="btn">Вторая</button>
</body>
</html>
```
CSS:
```css
.tag {
  background: #dee2e6;
  padding: 4px 8px;
}

.tag--ib {
  display: inline-block;
  margin: 4px 0;
}

.block {
  background: #e7f5ff;
  padding: 12px;
  margin-bottom: 20px;
}

.block + .block {
  margin-top: 40px;
}

.btn {
  display: inline-block;
  padding: 8px 16px;
  margin-right: 8px;
}
```
Разбор: первый span — inline: padding виден, но margin: 4px 0 его не отделяет (у tag--ib display: inline-block — он «приподнят»). Между A и B расстояние 40px, а НЕ 60px — схлопывание: margin-bottom: 20 (A) и margin-top: 40 (B) → max = 40. Кнопки стоят в строку, потому что inline-block.

## Частые ошибки
WARN: height/width у span — «не работают», потому что inline; нужен display: inline-block (или block) — проверьте Computed → display первым.
WARN: «margin схлопывается» как баг — верхний margin первого ребёнка «уходит» сквозь родителя без padding/border; если хотите «сохранить» — поставьте родителю padding-top: 1px или overflow: hidden (лучше — переработать margin в padding родителя).
WARN: margin: 0 auto у inline-элемента — не центрирует (у inline нет «свободного» горизонтального пространства для auto); центрируется block с заданной шириной.
WARN: display: contents «просто убирает рамку» — элемент исчезает и из layout, и из a11y-дерева: screen reader не увидит обёртку; для «невидимой рамки» — border: 0 / background: none.
WARN: float для раскладки «карточек в ряд» — legacy-подход: нет gap, нет wrap-контроля, нет выравнивания; для раскладок — flex/grid (уроки 12–15).

## Практическое задание

1. Соберите каркас из Примера и реализуйте правила со скелета задания.

2. Поменяйте у .tag--ib display на block — что произошло с потоком текста? Верните и объясните разницу в одной фразе.

3. Удалите margin-bottom у .block, оставив только margin-top у .block + .block — сравните отступы (между A/B и «до» A) и объясните parent-child collapsing.

4. Задайте .stack display: flex; flex-direction: column — схлопывание исчезнет: отступ A→B станет 60px. Верните обычный block.

5. Бонус: центрируйте блок шириной 300px через margin: 0 auto и добавьте внутри кнопку inline-block с margin: 0 auto — почему кнопка НЕ отцентрировалась (подсказка: у inline-block auto не считает «свободное»)?
