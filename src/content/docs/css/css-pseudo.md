---
id: css-pseudo
track: css
type: reference
section: reference
order: 3
title:
  en: "Pseudo-classes & Pseudo-elements"
  ru: "Псевдоклассы и псевдоэлементы"
excerpt:
  en: "Every :state and ::box you will meet in practice — what they match, when they fire, and the order rules that keep multi-state selectors correct."
  ru: "Все :state и ::box, с которыми вы столкнётесь на практике — что они матчат, когда срабатывают и правила порядка, которые делают мультисостояние-селекторы корректными."
version: "css3"
updated: 2026-09-03
---

Pseudo-classes select elements by state — hovered, focused, the nth child. Pseudo-elements select a sub-box of an element that does not exist in the HTML — `::before`, `::first-line`. One colon for states, two for sub-boxes: the browser parses them as different things, and a single colon in the wrong place is a silent style break.

## Pseudo-classes: states

| Pseudo-class | Matches | Typical use |
| --- | --- | --- |
| `:hover` | under the pointer | Hover effects on buttons, cards, rows |
| `:focus` | has keyboard or click focus | Focus rings (style it, do not remove without a replacement) |
| `:focus-visible` | focus that would show a ring | Modern focus styles: ring for keyboard, none for mouse |
| `:active` | being pressed | The "pressed" button state |
| `:link` / `:visited` | unvisited / visited links | Link base and history states |
| `:disabled` / `:enabled` | form control disabled / enabled | Grayed-out inputs and buttons |
| `:checked` | checked radio or checkbox | Custom form controls |
| `:placeholder-shown` | input showing its placeholder | Styling the placeholder state |
| `:valid` / `:invalid` | constraint validation passed / failed | Live form feedback |
| `:first-child` / `:last-child` | first / last in its parent | List and card edges |
| `:nth-child(n)` | the n-th child (`2n` = even) | Zebra rows, every-Nth styling |
| `:nth-last-child(n)` | n-th from the end | Same, counted from the other side |
| `:only-child` | the parent's only child | Single-item layouts |
| `:empty` | no children at all (not even text) | Styling empty containers |
| `:not(selector)` | elements that do NOT match | Negation, e.g. `p:not(:first-child)` |
| `:has(selector)` | elements that HAVE a matching relative | "Parent of" without JS, e.g. `li:has(> :checked)` |

The `:nth-child` formulas: `2n+1` = odd positions, `2n` = even, `3n` = every third, `3n+1` = 1st, 4th, 7th and so on, `-n+3` = the last three. The selector inside applies to the child itself — `li:nth-child(2)` styles 2nd children that are `<li>` elements.

> **WARNING**
> `:nth-child(2)` and `li:nth-child(2)` are different selectors. The first styles the second child of each parent, whatever it is; the second requires that child to be an `<li>`. This mismatch is the top source of "my zebra stripes are off by one" bugs.

## Pseudo-elements: sub-boxes

| Pseudo-element | Box | Typical use |
| --- | --- | --- |
| `::before` / `::after` | generated box before / after the content | Icons (with `content`), decorations |
| `::first-line` | first line of a block | Highlighted lead-ins |
| `::first-letter` | first letter | Drop caps |
| `::selection` | user-selected text | Highlight color of the selection |
| `::placeholder` | the placeholder text | Styling placeholder text |
| `::marker` | the list marker | Custom bullets: color, content, font |
| `::backdrop` | the backdrop of an open dialog | Dimming the page behind a dialog |

`::before` and `::after` are the workhorses. They require a `content` property (even an empty string) to exist at all, and they behave like inline-level boxes inside the element:

```css
.badge::before {
  content: "";
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: green;
  display: inline-block;
  margin-right: 6px;
}
```

`::first-line` and `::first-letter` work only on block containers and cannot take margins; `::first-letter` must be the first child of its block. `::selection` is a global rule — it styles selection anywhere on the page, or inside the elements you scope it to.

> **TIP**
> The two-colon form is the only one that is still fully valid: `::before`, `::selection`, `::placeholder`. The one-colon `:before` survives as a legacy alias, but new code should always write two — it keeps the selector parseable and matches what DevTools shows.

## Order rules and combinations

A selector can stack several pseudo-classes; their order rarely matters, because they all describe the same element's state. Pseudo-elements, however, always come last in the chain:

```css
/* all valid */
a:hover:focus { color: red; }
li:nth-child(2n):hover { background: #f3f4f6; }
a::before, a:hover::after { content: "*"; }

/* invalid: pseudo-element before a pseudo-class */
a::before:hover { content: "*"; }
```

The classic link state order is E-L-H-A (Element, Link, Hover, Active):

```css
a { color: navy; }
a:link { color: navy; }
a:visited { color: purple; }
a:hover { color: red; }
a:active { color: orange; }
a:focus-visible { outline: 2px solid blue; }
```

Each rule has equal specificity — one element plus one pseudo-class — so the later rule wins on conflict: hover beats visited, active beats hover. With modern `:focus-visible`, the keyboard ring stops fighting the mouse styles.

> **WARNING**
> Never write `*:focus { outline: none }` without a replacement. The outline is the default accessibility affordance for keyboard users. Replace it with a visible custom ring — `outline` or `box-shadow` — not with nothing.

<!-- RU -->

Псевдоклассы выбирают элементы по состоянию — наведён, сфокусирован, n-й ребёнок. Псевдоэлементы выбирают под-бокс элемента, которого нет в HTML — `::before`, `::first-line`. Одна двоеточие для состояний, две для под-боксов: браузер парсит их как разные вещи, и одна двоеточие на неверном месте — это молчаливый обрыв стилей.

## Псевдоклассы: состояния

| Псевдокласс | Матчит | Типичное применение |
| --- | --- | --- |
| `:hover` | под курсором | Hover-эффекты кнопок, карточек, строк |
| `:focus` | имеет клавиатурный или клик-focus | Focus-кольца (стилизируйте, не убирайте без замены) |
| `:focus-visible` | focus, при котором было бы кольцо | Современные focus-стили: кольцо для клавиатуры, ничего для мыши |
| `:active` | нажат | «Нажатое» состояние кнопки |
| `:link` / `:visited` | непосещённые / посещённые ссылки | Базовое и history-состояния ссылок |
| `:disabled` / `:enabled` | form-контроль disabled / enabled | Заглохшие инпуты и кнопки |
| `:checked` | отмеченный radio или checkbox | Кастомные form-контроли |
| `:placeholder-shown` | инпут показывает placeholder | Стилизация состояния с placeholder |
| `:valid` / `:invalid` | constraint-валидация прошла / упала | Живая обратная связь форм |
| `:first-child` / `:last-child` | первый / последний в родителе | Края списков и карточек |
| `:nth-child(n)` | n-й ребёнок (`2n` = чётные) | Зебра-строки, каждый N-й элемент |
| `:nth-last-child(n)` | n-й с конца | То же, но с другой стороны |
| `:only-child` | единственный ребёнок родителя | Layout с одним элементом |
| `:empty` | вообще без детей (даже текста) | Стилизация пустых контейнеров |
| `:not(selector)` | элементы, которые НЕ матчат | Отрицание, например `p:not(:first-child)` |
| `:has(selector)` | элементы, у КОТОРЫХ есть подходящий relative | «Родитель» без JS, например `li:has(> :checked)` |

Формулы `:nth-child`: `2n+1` = нечётные позиции, `2n` = чётные, `3n` = каждый третий, `3n+1` = первый, четвёртый, седьмой и так далее, `-n+3` = последние три. Селектор внутри применяется к самому ребёнку — `li:nth-child(2)` стилизует вторых детей, которые являются `<li>`.

> **WARNING**
> `:nth-child(2)` и `li:nth-child(2)` — разные селекторы. Первый стилизует второго ребёнка каждого родителя, каким бы он ни был; второй требует, чтобы этот ребёнок был `<li>`. Именно это рассогласование — главная причина багов «моя зебра сдвинута на одну».

## Псевдоэлементы: под-боксы

| Псевдоэлемент | Бокс | Типичное применение |
| --- | --- | --- |
| `::before` / `::after` | сгенерированный бокс до / после контента | Иконки (с `content`), декорации |
| `::first-line` | первая строка блока | Подчёркнутые лид-строки |
| `::first-letter` | первая буква | Буквицы |
| `::selection` | выделенный пользователем текст | Цвет выделения |
| `::placeholder` | текст placeholder | Стилизация placeholder |
| `::marker` | маркер списка | Кастомные буллеты: цвет, контент, шрифт |
| `::backdrop` | backdrop открытого диалога | Затемнение страницы за диалогом |

`::before` и `::after` — рабочие лошади. Для существования им обязательно свойство `content` (хотя бы пустая строка), и они ведут себя как inline-level боксы внутри элемента:

```css
.badge::before {
  content: "";
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: green;
  display: inline-block;
  margin-right: 6px;
}
```

`::first-line` и `::first-letter` работают только в блочных контейнерах и не могут принимать margin; `::first-letter` должен быть первым ребёнком своего блока. `::selection` — глобальное правило: оно стилизует выделение в любом месте страницы, либо внутри элементов, для которых вы его scoped.

> **TIP**
> Форма с двумя двоеточиями — единственная полностью валидная: `::before`, `::selection`, `::placeholder`. Одно двоеточие `:before` выживает как legacy-алиас, но в новом коде всегда пишите два — это держит селектор парсируемым и совпадает с тем, что показывает DevTools.

## Правила порядка и комбинации

В одном селекторе можно складывать несколько псевдоклассов; их порядок почти не важен, потому что все они описывают состояние одного элемента. Псевдоэлементы же всегда стоят в конце цепочки:

```css
/* всё валидно */
a:hover:focus { color: red; }
li:nth-child(2n):hover { background: #f3f4f6; }
a::before, a:hover::after { content: "*"; }

/* невалидно: псевдоэлемент раньше псевдокласса */
a::before:hover { content: "*"; }
```

Классический порядок состояний ссылки — E-L-H-A (Element, Link, Hover, Active):

```css
a { color: navy; }
a:link { color: navy; }
a:visited { color: purple; }
a:hover { color: red; }
a:active { color: orange; }
a:focus-visible { outline: 2px solid blue; }
```

У каждого правила равная специфичность — один элемент плюс один псевдокласс — поэтому при конфликте побеждает более позднее: hover бьёт visited, active бьёт hover. С современным `:focus-visible` клавиатурное кольцо перестаёт воевать с мышиными стилями.

> **WARNING**
> Никогда не пишите `*:focus { outline: none }` без замены. Outline — дефолтный accessibility-инструмент для клавиатурных пользователей. Заменяйте его видимым кастомным кольцом — `outline` или `box-shadow` — а не пустотой.
