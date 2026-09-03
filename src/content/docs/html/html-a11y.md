---
id: html-a11y
track: html
type: guide
section: a11y
order: 6
title:
  en: "Accessibility"
  ru: "Доступность (a11y)"
excerpt:
  en: "The habits that make pages work with screen readers and keyboards: alt text, real labels, focus management, skip links, and ARIA as the last resort, not the first."
  ru: "Привычки, которые делают страницы рабочими со скринридерами и клавиатурой: alt-текст, настоящие лейблы, управление фокусом, skip-ссылки и ARIA как последний, а не первый аргумент."
version: "html5"
updated: 2026-09-03
relatedTask: html-011
---

Accessibility is the practice of building pages that work for everyone: with a screen reader, with a keyboard only, with low vision, with a slow connection. Most of it is not a special technique — it is marking up content correctly in the first place. This page covers the habits that matter most, in order of impact.

## Who accessibility is for

The obvious audience is people with permanent disabilities — but the overlap is bigger. A broken arm, a noisy street, a phone held in one hand, bright sunshine on the screen, and simple aging all land on the same requirements. Build for the edge cases and the whole audience gets better software.

## Text alternatives

Every non-text element needs a text equivalent. For images that is the `alt` attribute:

```html
<img src="chart.png" alt="Signups doubled from January to June 2026" width="400" height="250" />
```

For icons and buttons, the accessible name comes from the text content — or from `aria-label` when there is no text at all:

```html
<button aria-label="Close dialog">×</button>
```

The test: if you stripped every image, icon, and video from the page, would the remaining text still tell the whole story? If not, write the missing words into `alt` or `aria-label`.

## Labels: name every control

A form control without an accessible name is an anonymous box. The proper label connects with `for` and `id`:

```html
<label for="email">Email</label>
<input id="email" type="email" />
```

The connection is what lets a screen reader announce "Email, edit text" and lets a click on the word "Email" focus the field. Placeholders are not labels: they disappear on input and only describe the field in its empty state.

## Keyboard access and focus

Every interactive element must be reachable and operable by keyboard: Tab moves forward, Shift+Tab moves back, Enter or Space activates. Native elements — `a` with an `href`, `button`, `input`, `select`, `details` — come with this for free. The moment you make a `div` clickable with JavaScript, you owe the user `tabindex="0"` and a keydown handler yourself.

Two practices make long pages survivable. First, a skip link as the very first focusable element lets keyboard users jump past the navigation:

```html
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <nav aria-label="Main">
    <a href="/">Home</a>
    <a href="/docs">Docs</a>
  </nav>
  <main id="main" tabindex="-1">
    <h1>Content</h1>
  </main>
</body>
```

Second, `tabindex="-1"` on a region — like `#main` above — makes it a target for programmatic focus, the destination of the skip link, without putting it in the tab order. Never use positive `tabindex` values to reorder focus; they break the natural order and almost every audit flags them.

## Headings and landmarks are navigation

Screen-reader users rarely read linearly; they jump between headings and landmarks, the way you would jump between chapters of a book. That turns the "boring" rules from the structure and semantics pages into accessibility features: a sane heading hierarchy, one `h1`, and landmarks named with `aria-label` when several of the same kind exist:

```html
<nav aria-label="Main">
  <a href="/">Home</a>
</nav>
<footer>
  <nav aria-label="Footer">
    <a href="/privacy">Privacy</a>
  </nav>
</footer>
```

Without the labels, a screen reader announces two identical "navigation" landmarks and the user cannot tell them apart.

## Color and contrast

Color must never be the only carrier of meaning: no red "error" text without the word error, no distinction between links and text that relies on underline alone. A contrast ratio of at least 4.5:1 for body text (3:1 for large text) is the WCAG AA floor — any contrast checker will tell you if you are above it.

## ARIA: the last resort

ARIA attributes — `role`, `aria-label`, `aria-expanded`, and friends — describe widgets to assistive tech when native elements cannot. The first rule of ARIA: if a native element does the job, use the native element. A `button` is a button, a `dialog` is a dialog, a `details` is a collapsible — adding `role="button"` to a styled `div` re-creates a button and immediately forgets the keyboard handling. Use ARIA to fill gaps: labeling an icon-only control, marking a live region. The "ARIA Quick Reference" page in this set lists the attributes you will actually meet.

## Common mistakes

> **WARNING**
> An icon button with `aria-label=""` is worse than no attribute at all — you explicitly told assistive tech there is no name. Either give it a real label or remove the attribute.

> **WARNING**
> Positive `tabindex` values — tabindex="5" — hijack the focus order and are the most common keyboard regression in codebases. If a control is not natively focusable, the fix is to make it one, not to number it.

> **TIP**
> Test every page with the sound off: navigate by Tab only, jump by headings only, and check the tab order. Twenty minutes of a keyboard pass catches most of what a visual review misses.

<!-- RU -->

Доступность (accessibility) — практика создания страниц, которые работают для всех: со скринридером, только с клавиатурой, при слабом зрении, при медленном соединении. Большая часть — это не специальные техники, а корректная разметка контента с самого начала. В этой странице — привычки, которые дают наибольший эффект, в порядке их влияния.

## Для кого нужна доступность

Очевидная аудитория — люди с постоянными ограничениями, но пересечение шире. Сломанная рука, шумная улица, телефон в одной руке, яркое солнце на экране и простое старение — всё это упирается в те же требования. Делайте для граничных случаев, и вся аудитория получит лучший продукт.

## Текстовые эквиваленты

У каждого не текстового элемента должен быть текстовый эквивалент. Для изображений это атрибут `alt`:

```html
<img src="chart.png" alt="Signups doubled from January to June 2026" width="400" height="250" />
```

Для иконок и кнопок доступное имя берётся из текстового содержимого — или из `aria-label`, когда текста нет совсем:

```html
<button aria-label="Close dialog">×</button>
```

Проверка: если вы убрать все изображения, иконки и видео со страницы, оставшийся текст всё ещё расскажет всю историю? Если нет — недостающие слова пишутся в `alt` или `aria-label`.

## Лейблы: каждое контрольное поле — с именем

Форменный контрол без доступного имени — анонимный бокс. Правильный лейбл связывается через `for` и `id`:

```html
<label for="email">Email</label>
<input id="email" type="email" />
```

Именно эта связь позволяет скринридеру озвучить «Email, текстовое поле» и позволяет клику по слову «Email» сфокусировать поле. Placeholder — не лейбл: он исчезает при вводе и описывает поле только в пустом состоянии.

## Клавиатурный доступ и фокус

Каждый интерактивный элемент должен быть достижимым и управляемым с клавиатуры: Tab двигает вперёд, Shift+Tab назад, Enter или Space активируют. Нативные элементы — `a` с `href`, `button`, `input`, `select`, `details` — получают это бесплатно. В момент, когда вы делаете `div` кликабельным через JavaScript, вы сами должны дать пользователю `tabindex="0"` и keydown-обработчик.

Две практики делают длинные страницы переносимыми. Первая — skip-ссылка первым фокусируемым элементом: она позволяет клавиатурным пользователям перескочить навигацию:

```html
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <nav aria-label="Main">
    <a href="/">Home</a>
    <a href="/docs">Docs</a>
  </nav>
  <main id="main" tabindex="-1">
    <h1>Content</h1>
  </main>
</body>
```

Вторая — `tabindex="-1"` на регионе, например на `#main` выше: он становится целью программного фокуса, адресом skip-ссылки, не попадая в tab-порядок. Никогда не используйте положительные значения `tabindex`, чтобы переупорядочить фокус: они ломают естественный порядок, и почти любой аудит их пометит.

## Заголовки и лендмарки — это навигация

Пользователи скринридеров редко читают линейно: они прыгают по заголовкам и лендмаркам, как вы прыгаете по главам книги. Из-за этого «скучные» правила из страниц о структуре и семантике превращаются в функции доступности: вменяемая иерархия заголовков, один `h1` и лендмарки, названные через `aria-label`, когда одного вида несколько:

```html
<nav aria-label="Main">
  <a href="/">Home</a>
</nav>
<footer>
  <nav aria-label="Footer">
    <a href="/privacy">Privacy</a>
  </nav>
</footer>
```

Без подписей скринридер озвучит два одинаковых лендмарка «навигация», и пользователь не сможет их различить.

## Цвет и контраст

Цвет никогда не должен быть единственным носителем смысла: нет красного текста «ошибка» без слова «ошибка», нет различия ссылок, основанного только на подчёркивании. Контраст минимум 4.5:1 для основного текста (3:1 для крупного) — нижняя граница WCAG AA; любой contrast-чекер покажет, проходите ли вы её.

## ARIA: последний аргумент

Атрибуты ARIA — `role`, `aria-label`, `aria-expanded` и компания — описывают виджеты вспомогательным технологиям, когда нативных элементов не хватает. Первое правило ARIA: если нативный элемент справляется — используйте нативный. `button` — это кнопка, `dialog` — это диалог, `details` — это сворачиваемый блок; добавить `role="button"` в стилизованный `div` — значит пересоздать кнопку и сразу забыть об обработке клавиатуры. ARIA — для заполнения пробелов: подпись для кнопки-только-иконка, отметка live-региона. Страница «ARIA: шпаргалка» из этого набора перечисляет атрибуты, с которыми вы реально столкнётесь.

## Частые ошибки

> **WARNING**
> Кнопка-иконка с `aria-label=""` хуже, чем без атрибута: вы явно сказали вспомогательным технологиям, что имени нет. Либо дайте реальное имя, либо уберите атрибут.

> **WARNING**
> Положительные значения `tabindex` — tabindex="5" — перехватывают порядок фокуса и являются самой частой клавиатурной регрессией в кодовой базе. Если контрол не фокусируется нативно — лечите его, а не нумеруйте.

> **TIP**
> Проверяйте каждую страницу со звуком выключенным: навигация только по Tab, прыжки только по заголовкам, проверка tab-порядка. Двадцать минут клавиатурного прохода ловят большинство того, что пропускает визуальный ревью.
