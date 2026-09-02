# Урок 17. Media Queries: mobile-first

## Цель
После урока студент сможет: написать media query по ширине (min-width/max-width); выстроить mobile-first-стили («база — мобильный, расширения — desktop»); выбрать брейкпоинты по контенту, а не по устройствам; применить prefers-color-scheme и prefers-reduced-motion.

## Теория
### Media query: «если экран такой — применй эти правила»
**@media** оборачивает правила в условие по характеристикам вьюпорта (или устройства):
```css
@media (min-width: 768px) {
  .layout { grid-template-columns: 250px 1fr; }
}
```
Ключевые условия:

- **(min-width: N)** — «если ширина ≥ N» (mobile-first-направление);

- **(max-width: N)** — «если ширина ≤ N» (desktop-first);

- **(orientation: portrait/landscape)**, **(aspect-ratio: 16/9)**;

- несколько условий через **and**: @media (min-width: 768px) and (max-width: 1023px);

- **NOT** и несколько блоков: @media not all and (orientation: landscape).

### Mobile-first: пишите «мобильный» сначала
**Mobile-first** — стратегия, при которой **базовые** стили (вне @media) описывают **узкий** экран, а @media (min-width: N) — **расширяют** раскладку для широких:
```css
.cards { display: grid; gap: 1rem; } /* база: 1 колонка (мобильный) */
@media (min-width: 600px) { .cards { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 900px) { .cards { grid-template-columns: repeat(3, 1fr); } }
```
Почему так лучше «desktop-first» (макс-width-«отнимать»):

1. **мобильные — большинство** трафика, и им достаётся «чистый» CSS без переопределений;

2. min-width-правила **накладываются** (600px-правило действует и на 1200px) — «коллега» max-width-правил, где «широкие» условия «затирают» узкие;

3. рост функциональности (от 1 колонки к 3) — более естественный «рост», чем «отнимать» колонки.

### Брейкпоинты: по контенту, не по устройствам
Классическая ошибка — брейкпоинты «под устройства» (375, 768, 1024, 1440). Правильно: **брейкпоинты — там, где контент «ломается»**:

- сузьте окно в DevTools (device toolbar) и смотрите, ГДЕ заголовок «ломается» в 4 строки, где карточки «стесняются» — это и есть ваши брейкпоинты;

- типовой набор для «обычных» страниц: 480px (маленький телефон → телефон), 768px (портрет планшета), 1024px (ландшафт/ноутбук), 1280px+ (широкий desktop) — как **опора**, а не догма;

- в проекте 3–5 брейкпоинтов достаточно: больше — «шедевр» media queries, а не раскладка.

### Media features «не про ширину»

- **prefers-color-scheme: dark/light** — тема пользователя (OS): @media (prefers-color-scheme: dark) { :root { --bg: #212529; } } (и переключатель-перекрытие, урок 20);

- **prefers-reduced-motion: reduce** — «меньше анимаций» (a11y): отключаем/укорачиваем transition-ы;

- **hover: none** — «устройства без ховера» (тач): ховер-эффекты «не мешают».

TIP: в DevTools → вкладка «Rendering» (три точки → More tools) включите «Emulate prefers-reduced-motion» и «Emulate vision deficiencies» — проверьте, как ваш CSS ведёт себя при a11y-настройках.

NOTE: media query — про **вьюпорт**, а не про «устройство». Планшет в landscape = «широкий» вьюпорт (1024px+), телефон в landscape — тоже «широкий» (800px+). Не пишите «если телефон — так», пишите «если вьюпорт такой-то».

## Пример
Каркас:
```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Урок 17. Media Queries</title>
</head>
<body>
  <header class="topbar">
    <span>Logo</span>
    <nav class="menu">
      <a href="#">Один</a>
      <a href="#">Два</a>
      <a href="#">Три</a>
    </nav>
  </header>
  <main class="content">
    <h1>Заголовок</h1>
    <p>Адаптивная сетка: 1 → 2 → 3 колонки.</p>
    <div class="cards">
      <div class="card">1</div>
      <div class="card">2</div>
      <div class="card">3</div>
      <div class="card">4</div>
      <div class="card">5</div>
      <div class="card">6</div>
    </div>
  </main>
</body>
</html>
```
CSS:
```css
/* БАЗА = мобильный (1 колонка, компактные отступы) */
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
}

.menu {
  display: flex;
  gap: 0.5rem;
  font-size: 0.875rem; /* мобильный: меньше шрифт меню */
}

.cards {
  display: grid;
  gap: 0.75rem; /* база: 1 колонка */
  padding: 1rem;
}

.card {
  padding: 1.5rem;
  background: #e7f5ff;
  border-radius: 8px;
  text-align: center;
}

/* 600px+: 2 колонки */
@media (min-width: 600px) {
  .cards { grid-template-columns: repeat(2, 1fr); }
  .menu { font-size: 1rem; }
}

/* 900px+: 3 колонки + широкие отступы */
@media (min-width: 900px) {
  .cards { grid-template-columns: repeat(3, 1fr); }
  .content { max-width: 1000px; margin: 0 auto; }
}
```
Разбор: база (мобильный) — 1 колонка, compact. На 600px+ — 2 колонки (правило «накладывается» на базу: gap/padding/фон из базы «сохраняются»). На 900px+ — 3 колонки и «центрирование» контента. Сузьте/расширьте окно — сетка перестраивается без единого max-width.

## Частые ошибки
WARN: desktop-first (max-width «отнимать») — мобильный «платит» переопределениями, и «широкие» правила «забываются»; mobile-first (min-width) — «наращивать».
WARN: брейкпоинты «под пиксели устройств» (375/768/1024) — контент «ломается» на 700px, а брейкпоинт «на 768»: между 700 и 768 — «кривой»; ставьте брейкпоинты «по перелому» контента.
WARN: meta viewport «забыт» — мобильный браузер «сжимает» страницу под 980px, и media queries «не сработают» (вьюпорт = 980 всегда); <meta name="viewport" content="width=device-width, initial-scale=1"> ОБЯЗАТЕЛЕН (урок HTML).
WARN: «копипаст» max-width-правил в mobile-first — «смешанная» стратегия: min-width «наращивает», max-width «отнимает» — правила «переезжаются»; держитесь ОДНОГО направления.
WARN: prefers-reduced-motion «не учтён» — анимации «крутятся» у пользователей с а11y-настройкой «меньше движения»; @media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } } — базовый «сброс».

## Практическое задание

1. Соберите каркас из Примера и реализуйте mobile-first CSS со скелета задания.

2. В DevTools (device toolbar) прогнайте ширину от 320 до 1400px — запишите, на каких «точках» перестраивается сетка (ваши фактические брейкпоинты).

3. Добавьте 4-й брейкпоинт (min-width: 1200px) — увеличить max-width контента до 1200px и добавить padding — и объясните, что «наслоилось» от предыдущих брейкпоинтов.

4. Добавьте @media (prefers-color-scheme: dark) { body { background: #212529; color: #fff; } } — и проверьте в DevTools (Emulate prefers-color-scheme: dark).

5. Бонус: переделайте .menu на мобильном в «колонку» (flex-direction: column) при ширине < 400px (max-width-исключение — «допустимо», объясните почему).
