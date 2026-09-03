---
id: css-selectors
track: css
type: guide
section: core
order: 1
title:
  en: "Selectors & Specificity"
  ru: "Селекторы и специфичность"
excerpt:
  en: "How selectors pick elements, how the cascade resolves conflicts, and how to win with specificity without reaching for !important."
  ru: "Как селекторы выбирают элементы, как каскад разрешает конфликты и как выигрывать по специфичности без !important."
version: "css3"
updated: 2026-09-03
---

Selectors decide which rules apply to which elements, and specificity decides which declaration wins when several rules fight over the same property. This page collects the selector syntax you will use daily, explains the cascade, and shows how to keep specificity low so your stylesheets stay predictable.

## What a selector is

A selector is the left-hand part of a CSS rule. It matches elements in the document, and every property in the right-hand block is applied to each matched element.

```css
h1 { color: navy; }          /* all <h1> elements */
.card { padding: 16px; }     /* every element with class="card" */
#header { height: 64px; }    /* the element with id="header" */
a:hover { color: red; }      /* links while the pointer is over them */
```

The basic forms you will use every day:

| Form | Example | Matches |
| --- | --- | --- |
| Element | `p` | All paragraph elements |
| Class | `.card` | Elements with `class="card"` |
| Id | `#main` | The element with `id="main"` |
| Attribute | `input[type="email"]` | Email inputs |
| Universal | `*` | Every element (use sparingly) |
| Pseudo-class | `li:first-child` | The first list item in a group |
| Pseudo-element | `p::first-line` | The first line of a paragraph |

An element can carry several classes at once — `class="card is-open"` — and both `.card` and `.is-open` match it. Space-separated values inside `class` are simply a list of tokens, and a class name is not tied to any HTML tag: the same `.btn` can style a button, a link, or a div.

## Combinators: selecting by position in the tree

A single simple selector describes one element. Combinators connect several simple selectors and describe a relationship in the DOM tree:

```css
/* Descendant (a space): any <li> inside <nav>, at any depth */
nav li { color: white; }

/* Child (>): only direct children */
ul > li { font-weight: bold; }

/* Next sibling (+): the element right after */
h2 + p { margin-top: 4px; }

/* Subsequent siblings (~): every sibling after */
h2 ~ p { color: gray; }
```

The descendant combinator is a space — the most common one in everyday CSS. Prefer `ul > li` when you want to stop matching deeply nested lists; otherwise nested menus inherit your styles forever, and a rule you wrote "for the top menu" quietly restyles the dropdown inside it.

### Chaining selectors

You can chain several simple selectors on one element without spaces — every part must match the same element:

```css
/* <a> with class="logo" inside <header>, in :hover state */
header a.logo:hover { transform: scale(1.05); }

/* the element that has BOTH classes at the same time */
.btn.btn--primary { background: blue; }
```

Each part of the chain adds to the selector's weight, which brings us to the heart of this page.

## How the cascade picks a value

When several rules set the same property on one element, the browser walks a small decision tree before rendering:

| Step | Rule |
| --- | --- |
| 1. Origin and importance | author `!important` beats author normal, which beats user styles, which beat browser defaults |
| 2. Specificity | the more specific selector wins the conflict |
| 3. Source order | if everything is equal, the later declaration in the stylesheet wins |

> **WARNING**
> "Last one wins" is only true when specificity is equal. A `.card` rule written later in the file still loses to a `#hero .card` rule written earlier — specificity beats source order every single time.

### Specificity is a weight, not a feeling

Every selector gets a four-part weight: inline styles, ids, classes, element names — compared left to right. Pseudo-classes (`:hover`, `:focus`, `:nth-child`) count as classes. Pseudo-elements (`::before`, `::after`) count as element names. Attribute selectors like `[type="email"]` count as classes.

| Selector | Weight | Why |
| --- | --- | --- |
| `div` | 0-0-0-1 | one element name |
| `.card` | 0-0-1-0 | one class |
| `#hero` | 0-1-0-0 | one id |
| `.card:hover` | 0-0-2-0 | class + pseudo-class |
| `ul li` | 0-0-0-2 | two element names |
| `.list .item:hover` | 0-0-3-0 | two classes + pseudo-class |
| `*` | 0-0-0-0 | matches anything, adds nothing |

The weight is additive, never multiplicative: `.a.b` is 0-0-2-0, not "a power of two".

> **TIP**
> DevTools prints the exact specificity next to every matching rule and strikes out the ones that lost. When a declaration "mysteriously does not apply", open the Styles pane and read the weights — it removes most of the guessing.

## Keeping specificity flat

A small set of habits keeps any stylesheet predictable. Use one class per element for its main styling, and reserve element selectors for a short base/reset block at the top of the file. Avoid ids for styling altogether — `#hero .card .title:hover` is a 0-1-4-0 bullet that overrides anything you write later, and it cannot be overridden by any class rule you might add.

Save `!important` for overrides of third-party scripts and browser default quirks, not for internal refactoring. When you find yourself adding `!important` inside your own component, the real problem is a specificity structure that is already out of control.

A common pattern for components keeps every rule at the same weight:

```css
/* base: one class, weight 0-0-1-0 */
.btn { padding: 10px 18px; border-radius: 8px; }

/* variant: still one class level */
.btn--primary { background: blue; color: white; }

/* state: the pseudo-class adds one class weight */
.btn--primary:hover { background: darkblue; }
```

No ids, no chained element selectors — any rule can be overridden by moving it later in the file, and nobody has to reach for `!important` to make an exception.

## Common mistakes

Several mistakes come back in every codebase. Styling by id "because it is one element" — ids make rules hard to override and are not reusable across the page. Nesting element selectors four levels deep, where specificity grows with every level and the rule becomes sticky. Forgetting that `.card p` and `p.card` select completely different things: the first matches paragraphs inside a card, the second matches paragraphs that themselves have the class.

Finally, remember the full picture before debugging: properties like `color` and `font-size` are inherited down the tree, while `width` and `margin` are not. A style you "never wrote" may be the browser default from the user-agent stylesheet, or a value inherited from an ancestor. Check the Inherited and User agent panes in DevTools before concluding that a rule is missing.

<!-- RU -->

Селекторы решают, к каким элементам применяются правила, а специфичность — какая декларация побеждает, когда несколько правил борются за одно свойство. На этой странице — синтаксис селекторов, которые вы используете каждый день, разбор каскада и способ держать специфичность низкой, чтобы стайлшиты оставались предсказуемыми.

## Что такое селектор

Селектор — левая часть CSS-правила. Он матчит элементы в документе, и каждое свойство из правой части блока применяется к каждому совпавшему элементу.

```css
h1 { color: navy; }          /* все <h1> */
.card { padding: 16px; }     /* все элементы с class="card" */
#header { height: 64px; }    /* элемент с id="header" */
a:hover { color: red; }      /* ссылки, пока курсор над ними */
```

Базовые формы, которые вы используете каждый день:

| Форма | Пример | Матчит |
| --- | --- | --- |
| Элемент | `p` | Все абзацы |
| Класс | `.card` | Элементы с `class="card"` |
| Id | `#main` | Элемент с `id="main"` |
| Атрибут | `input[type="email"]` | Email-инпуты |
| Универсальный | `*` | Все элементы (использовать редко) |
| Псевдокласс | `li:first-child` | Первый пункт списка в группе |
| Псевдоэлемент | `p::first-line` | Первая строка абзаца |

У одного элемента может быть несколько классов — `class="card is-open"` — и матчат и `.card`, и `.is-open`. Раздельные пробелом значения внутри `class` — это просто список токенов, а имя класса не привязано к HTML-тегу: тот же `.btn` может стилизовать кнопку, ссылку или div.

## Комбинаторы: выбор по позиции в дереве

Один простой селектор описывает один элемент. Комбинаторы соединяют несколько простых селекторов и описывают отношения в дереве DOM:

```css
/* Потомок (пробел): любой <li> внутри <nav>, на любой глубине */
nav li { color: white; }

/* Ребёнок (>): только непосредственные дети */
ul > li { font-weight: bold; }

/* Следующий сосед (+): элемент сразу после */
h2 + p { margin-top: 4px; }

/* Последующие соседи (~): все соседи после */
h2 ~ p { color: gray; }
```

Комбинатор потомков — это пробел, самый частый в повседневном CSS. Используйте `ul > li`, когда хотите перестать матчить глубоко вложенные списки; иначе вложенные меню навсегда наследуют ваши стили, и правило, написанное «для верхнего меню», незаметно перекрашивает выпадающий список внутри него.

### Цепочки селекторов

Несколько простых селекторов можно написать для одного элемента без пробелов — каждая часть должна матчить один и тот же элемент:

```css
/* <a> с class="logo" внутри <header> в состоянии :hover */
header a.logo:hover { transform: scale(1.05); }

/* элемент, у которого ОБА класса одновременно */
.btn.btn--primary { background: blue; }
```

Каждая часть цепочки прибавляет к весу селектора — и вот мы пришли к главному.

## Как каскад выбирает значение

Когда несколько правил задают одно свойство одному элементу, браузер проходит маленькое дерево решений:

| Шаг | Правило |
| --- | --- |
| 1. Происхождение и важность | author `!important` сильнее author normal, тот сильнее user-стилей, те сильнее браузерных дефолтов |
| 2. Специфичность | в конфликте побеждает более специфичный селектор |
| 3. Порядок в коде | если всё равно — побеждает более поздняя декларация в стайлшите |

> **WARNING**
> «Последний выиграл» — правда только при равной специфичности. Правило `.card`, написанное позже в файле, всё равно проиграет правилу `#hero .card`, написанному раньше — специфичность побеждает порядок всегда.

### Специфичность — это вес, а не ощущение

Каждый селектор получает четырёхчастный вес: инлайн-стили, id, классы, имена элементов — сравнение идёт слева направо. Псевдоклассы (`:hover`, `:focus`, `:nth-child`) считаются классами. Псевдоэлементы (`::before`, `::after`) — именами элементов. Селекторы атрибутов вроде `[type="email"]` считаются классами.

| Селектор | Вес | Почему |
| --- | --- | --- |
| `div` | 0-0-0-1 | одно имя элемента |
| `.card` | 0-0-1-0 | один класс |
| `#hero` | 0-1-0-0 | один id |
| `.card:hover` | 0-0-2-0 | класс + псевдокласс |
| `ul li` | 0-0-0-2 | два имени элементов |
| `.list .item:hover` | 0-0-3-0 | два класса + псевдокласс |
| `*` | 0-0-0-0 | матчит всё, ничего не добавляет |

Вес складывается, а не умножается: `.a.b` — это 0-0-2-0, а не «степень двойки».

> **TIP**
> DevTools печатает точную специфичность рядом с каждым совпавшим правилом и зачёркивает проигравшие. Когда декларация «мистическим образом не применяется», откройте панель Styles и прочитайте веса — это снимает большую часть гадания.

## Держать специфичность плоской

Небольшой набор привычек держит любой стайлшит предсказуемым. Используйте один класс на элемент для основного стилирования, а селекторы элементов оставьте для короткого базового/сбросного блока в начале файла. Избегайте id в стилизации вовсе — `#hero .card .title:hover` — это снаряд 0-1-4-0, который перебивает всё, что вы напишете позже, и его нельзя перебить никаким класс-правилом.

`!important` оставьте для переопределения сторонних скриптов и браузерных дефолтов, а не для внутренней доработки. Если вы ловите себя на том, что добавляете `!important` внутри собственного компонента, проблема уже не в `!important`, а в структуре специфичности, которая вышла из-под контроля.

Типичный паттерн для компонентов держит все правила на одном весе:

```css
/* база: один класс, вес 0-0-1-0 */
.btn { padding: 10px 18px; border-radius: 8px; }

/* вариант: всё на уровне одного класса */
.btn--primary { background: blue; color: white; }

/* состояние: псевдокласс добавляет один вес класса */
.btn--primary:hover { background: darkblue; }
```

Без id и цепочек элементов — любое правило перебивается переносом ниже по файлу, и никому не приходится лезть в `!important`.

## Частые ошибки

Несколько ошибок возвращаются в каждом проекте. Стилизация по id «потому что элемент один» — id делает правила трудными для переопределения и не переиспользуются по странице. Глубокое вложение селекторов элементов на четыре уровня, где специфичность растёт с каждым уровнем и правило становится «липким». И путаница: `.card p` и `p.card` матчат совершенно разные вещи — первый — абзацы внутри карточки, второй — абзацы, у которых сам класс.

И наконец, перед отладкой помните полную картину: свойства вроде `color` и `font-size` наследуются вниз по дереву, а `width` и `margin` — нет. Стил, который вы «не писали», может быть браузерным дефолтом из user-agent-тайлшита или унаследованным значением от предка. Проверьте панели Inherited и User agent в DevTools, прежде чем решать, что правило пропало.
