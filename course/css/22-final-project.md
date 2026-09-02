# Урок 22. Финальный проект: адаптивная страница-каталог

## Цель
Собрать «вместе» ВСЁ из курса: страница-каталог товаров (шапка, hero, сетка карточек, подвал) на Grid+Flexbox, с переменными (темы), media queries (mobile-first), container query (карточка), clamp (типографика) и transition (hover). Результат — «портфолио-страница», которую можно показать.

## Теория
### Как «собирается» страница (архитектура)
Структура HTML (семантика — курс HTML): **header** (логотип + навигация — flex-строка), **main** → **section.hero** (заголовок, подзаголовок, CTA) + **section.catalog** (сетка карточек), **footer**.

CSS «по слоям» (урок 4: @layer): **base** — reset (box-sizing), токены в :root (урок 20), типографика (clamp, урок 19); **components** — .btn, .card, .nav (flex, уроки 12–13); **layout** — .page (grid-template-areas, урок 15), .catalog (auto-fit, урок 15); **overrides** — media queries (mobile-first, урок 17) и container query (карточка, урок 18).

### Раскладки: «что» «где»

- **.page** — grid-template-areas (шапка/контент/подвал) + min-height: 100dvh (урок 15, «святой грааль»);

- **.nav** — flex: логотип слева, меню «вправо» (margin-left: auto, урок 12);

- **.hero** — flex-колонка по центру (place-items, урок 12);

- **.catalog** — grid: repeat(auto-fit, minmax(min(100%, 260px), 1fr)) — «резиновая» галерея БЕЗ media query (уроки 15, 19);

- **.card** — container-type: inline-size + @container: узкая — колонка, широкая — «изображение сверху, контент» (урок 18); внутри — flex-колонка с margin-top: auto у кнопки (кнопка «внизу», урок 13).

### Движение и темы
**hover** — transition transform+box-shadow 0.2s ease-out (урок 21); **тема** — [data-theme="dark"] + prefers-color-scheme (урок 20), переключатель — инлайн-JS в каркасе; **a11y** — prefers-reduced-motion (урок 21), контраст 4.5:1 (урок 10), :focus-visible (урок 3).

TIP: «порядок сборки» — «сверху вниз»: (1) HTML-каркас, (2) base (reset+токены+типографика), (3) layout (.page, .catalog), (4) components (.card, .btn, .nav), (5) «украшения» (hover, темы, a11y). «Не наоборот» (сначала hover, потом «основной» layout).

NOTE: «проверка» проекта — «три» ширины: 360px (телефон), 768px (планшет), 1280px+ (desktop). На каждой: «нет» горизонтального скролла, «все» элементы «в кадре», контраст «в норме», tab-навигация «работает».

## Пример
HTML-каркас (создайте index.html — это «каркас» проекта, CSS — ваше задание):
```html
<!DOCTYPE html>
<html lang="ru" data-theme="light">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Каталог — финальный проект</title>
</head>
<body>
  <div class="page">
    <header class="topbar">
      <span class="logo">Syntax Shop</span>
      <nav class="nav">
        <a href="#">Каталог</a>
        <a href="#">О нас</a>
        <button class="theme-toggle">Тема</button>
      </nav>
    </header>
    <main class="main">
      <section class="hero">
        <h1>Вещи для разработчиков</h1>
        <p>Карточки «подстраиваются» под контейнер. Попробуйте сузить окно.</p>
        <button class="btn">Смотреть каталог</button>
      </section>
      <section class="catalog">
        <article class="card">
          <div class="c-img">IMG</div>
          <h2>Механическая клавиатура</h2>
          <p>Свитчи red linear, подсветка RGB. Для тех, кто «слышит» свой код.</p>
          <span class="price">24 990 ₽</span>
          <button class="btn">В корзину</button>
        </article>
        <article class="card">
          <div class="c-img">IMG</div>
          <h2>Монитор 27"</h2>
          <p>4K, 144 Гц, Type-C. Два кода — на одном экране.</p>
          <span class="price">89 990 ₽</span>
          <button class="btn">В корзину</button>
        </article>
        <article class="card">
          <div class="c-img">IMG</div>
          <h2>Эргономичная мышь</h2>
          <p>Вертикальный хват — запястье скажет спасибо после 8-часового спринта.</p>
          <span class="price">7 990 ₽</span>
          <button class="btn">В корзину</button>
        </article>
        <article class="card">
          <div class="c-img">IMG</div>
          <h2>Стакан «segfault»</h2>
          <p>Напоминание, что и чашка кофе — часть пайплайна.</p>
          <span class="price">1 290 ₽</span>
          <button class="btn">В корзину</button>
        </article>
      </section>
    </main>
    <footer class="footer">Syntax Shop · Курс CSS · 2026</footer>
  </div>
  <script>
    document.querySelector('.theme-toggle').addEventListener('click', () => {
      const h = document.documentElement;
      h.dataset.theme = h.dataset.theme === 'dark' ? 'light' : 'dark';
    });
  </script>
</body>
</html>
```
Ключевой фрагмент CSS (остальное — в TODO-скелете):
```css
.catalog {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
  gap: 1rem;
}

.card .btn { margin-top: auto; } /* кнопка "внизу" карточки */
```
CSS-скелет задания — в styles.css (TODO по разделам). «Эталонный» результат: на 360px — 1 колонка карточек, nav «компактный»; на 1280px — 3–4 колонки, hero «широкий»; карточка в узком контейнере — колонка, в широком — «изображение + контент»; переключение темы «работает»; hover «приподнимает» карточку; reduced-motion «гасит» анимации.

## Частые ошибки
WARN: «основной» layout «после» hover-эффектов — «перекрываются» (hover «в» overrides, layout «в» base — «конфликт»); слои «по порядку»: base → components → layout → overrides (media/cq).
WARN: карточки «разной» высоты «в» ряду — align-items: stretch (по умолчанию) «равняет», но «внутри» карточки «кнопки» «едут»: flex-колонка + margin-top: auto у кнопки (урок 13) ИЛИ subgrid (урок 16).
WARN: горизонтальный скролл «на» мобильном — «виновник»: (1) min-width «у» flex-колонки (min-width: 0), (2) width: 100% + padding «без» border-box, (3) «длинное» слово «без» overflow-wrap. Ищите «виновника» в DevTools (Element → «красная» рамка переполнения).
WARN: media query «для» «каждого» компонента — «копипаст» брейкпоинтов «на» всё: «общие» брейкпоинты «для» layout, «компонентные» — container query (урок 18).
WARN: «забыли» prefers-reduced-motion / :focus-visible / контраст — «красиво», но «не доступно»: финальная «проверка» — a11y-чек-лист (DevTools → Accessibility, Contrast, Rendering → Emulate).

## Практическое задание

1. Создайте index.html с каркасом из Примера и реализуйте styles.css по TODO-скелету (разделы: base/токены, layout, components, overrides).

2. Проверьте «три» ширины (360/768/1280) в DevTools — «нет» горизонтального скролла, сетка «перестраивается» (1→2→3–4 колонки).

3. Переключите тему — «все» цвета «пересчитались», контраст «в норме» (DevTools → Contrast у .price и .card p).

4. Наведите на карточку — hover «приподнимает» (transition 0.2s). Включите Emulate prefers-reduced-motion — hover «мгновенный» (без «перелёта»).

5. Бонус: (а) добавьте 2 карточки (всего 6) — проверьте, что сетка «перестроилась» (auto-fit); (б) соберите «чёрный» скриншот проекта (3 ширины) — это ваше «портфолио».
