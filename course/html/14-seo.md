# Урок 14. Мета и SEO-базис

## Цель
После урока студент сможет: заполнить `<head>` полностью: description, canonical, Open Graph, favicon, theme-color — и объяснить, что делает каждая строка и кто её «читает».

## Теория
### Кто читает head
Три «клиента» метаданных: браузер (title, favicon, theme-color), поисковик (description, canonical, robots), мессенджеры и соцсети (Open Graph — карточка при шаринге). У каждого свой набор тегов — и все они живут в head.

### description и canonical
`<meta name="description" content="...">` — сниппет под заголовком в поиске: 120–160 символов, продающий, без «это страница о…». `<link rel="canonical" href="https://site.ru/page">` — «канонический» URL: защищает от дублей (www/без www, ?ref=…, http/https): поисковик понимает, какая версия «настоящая». Канон пишем на себя (или на «главную» версию страницы), а не на соседнюю.

### Open Graph — карточка шаринга
`og:title`, `og:description`, `og:image` (абсолютный URL, 1200×630 — стандарт), `og:url`, `og:type`. Когда ссылку кидают в Telegram/Slack/Facebook, бот сайта тянет эти теги и рисует карточку. Без og:image — голый текст и низкий клик. Для X/Twitter есть `twitter:card` (summary_large_image).

### Favicon и theme-color
Favicon: минимум — `icon.svg` (`<link rel="icon" href="/icon.svg" type="image/svg+xml">`) + PNG 180×180 для iOS (`apple-touch-icon`). Генератор: realfavicongenerator.net. `theme-color` — цвет «браузерного» UI на мобильных; тёмная/светлая темы — два meta с `media="(prefers-color-scheme: ...)"`.

### Чуть шире
`robots` (index/noindex) — «разрешить ли индексацию» (локальная страница теста: noindex). robots.txt и sitemap.xml — файлы на уровне домена (не в head), для полноты картины. `title` и `og:title` могут различаться: title — для поиска (с ключом), og:title — «красивее» для соцсетей; это допустимо и часто осознанно.

TIP: вставьте URL страницы в любой OG-preview-сервис (opengraph.xyz и подобные) — увидите карточку шаринга ДО того, как её увидят пользователи.

## Пример
```html
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Курс HTML5 — Syntax</title>
  <meta name="description"
        content="16 уроков от структуры до a11y: семантика, формы, медиа. Учитесь вёрстать в браузере.">
  <link rel="canonical" href="https://syntax.dev/course/html">
  <meta property="og:title" content="Курс HTML5 — Syntax">
  <meta property="og:description" content="16 уроков от структуры до a11y.">
  <meta property="og:image" content="https://syntax.dev/og/html.png">
  <meta property="og:url" content="https://syntax.dev/course/html">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/icon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/apple-touch.png">
  <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0a0f0d">
  <meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff">
</head>
```
Разбор: description ~140 символов, canonical — https + www-единый домен, og:image — абсолютный URL 1200×630, два theme-color под темы.

## Частые ошибки
WARN: description длиннее 160 символов или «это страница о…» — поисковик обрежет или подставит свой текст.
WARN: og:image с относительным путём (/img/og.png) — боты многих сервисов не подхватят; только абсолютный URL.
WARN: только favicon.ico — современные браузеры и iOS хотят SVG + PNG 180×180.
WARN: canonical указывает на страницу с ?utm_ или на http-версию — «канон» сам по себе дубль.
WARN: theme-color один на обе темы — мобильный UI не синхронизирован с prefers-color-scheme.

## Практическое задание
1. В стартовом файле заполните head по TODO: description (120–160 символов), canonical.
2. Добавьте 4 Open Graph тега (og:image — любой абсолютный URL картинки 1200×630).
3. Добавьте twitter:card, favicon (svg + png) и 2 theme-color (тёмный/светлый).
4. Проверьте на validator.w3.org — 0 ошибок.
5. Бонус: вставьте URL в OG-preview-сервис и оцените карточку: что можно улучшить в title/description?
