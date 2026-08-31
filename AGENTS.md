# Syntax — контекст для AI-разработчика

Фронтенд обучающей платформы «Syntax» (учим программирование в браузере).
Работа ведётся в этом репо; бэкенд пока не существует — все данные статические (в конфигах/i18n).

## Запуск
- `npm run dev` → http://localhost:5173 (лог: `/tmp/vite-dev.log`). Vite обязан работать с `server.watch.usePolling: true` — НЕ убирать (AI меняет иноды файлов, watcher виснет без поллинга).
- `npm run build`, `npm run lint` — обязаны быть зелёными после каждого изменения.
- Версии: Vite 7.3.6, React 19.2.8, @vitejs/plugin-react 5.2.0, @monaco-editor/react 4.7.0, emmet-monaco-es, flag-icons.

## Архитектура
- `src/App.jsx` — hash-роутинг (`#/roadmap`, `#/editor`, …) + «job»-состояние: `openTab(tab, job)` передаёт контекст урока/задачи в редактор. Home = `activeTab === "home"` (в сайдбаре нет, по умолчанию при загрузке).
- `src/components/MainContent.jsx` — свитч вкладок: `home → MainView`, `roadmap → RoadmapView`, `tasks → TasksView`, `rankings → RankingsView`, `documentation → DocsView`, `community → CommunityView`, `editor → CodeEditor`, остальное → заглушка lesson-карты.
- **Правый сайдбар унифицирован**: `WidgetPanel` получает `activeTab` и `onNavigate`; таблица `TAB_ASIDES` мапит вкладки → `src/components/panels/{RankingsAside, CommunityAside, DocsAside, TasksAside}.jsx`. Вьюха НЕ содержит свой правый rail — она одноколоночная, aside монтируется во внешний rail. Две колонки справа — баг.
- **Хедер универсальный** (`Header.jsx`): логотип (→ home), флаг-язык, тема, уведомления, **гостевой блок auth** (Log in ghost + Sign up free primary, класс `.auth`; на ≤1100px только пилюля, ≤480 скрыт колокольчик `.tb-menu-wrap--notif`), аватар. Таб-специфичный контент (заголовки, поиска, сегмент-контролы) живёт ВНУТРИ вьюх. `.topbar` — `sticky; z-index: 50`; НИКАКИХ поздних правил, перебивающих его position/z-index (был баг: `.topbar, .shell { position: relative; z-index: 1 }` — топбар ехал под липкие карточки сайдбара).
- **SignupModal** (`src/components/SignupModal.jsx`, state в App: `openSignup`/`closeSignup`): одна модалка на ВСЕ гостевые действия (Start for free, Continue Learning, Start Challenge, финальный CTA, кнопки хедера). Пока без бэкенда: submit просто закрывает; «Continue as guest» — тоже. Esc/клик-аутсайд, body-scroll-lock.
- Дропдауны хедера: `hidden` + глобальное CSS `[hidden] { display: none !important }` (классы с `display:flex` иначе перебивают UA-правило). Клик-аутсайд — на `click`, каждый дропдаун закрывается независимо.
- `CodeEditor.jsx` — Monaco (загружается с CDN **0.55.1** через @monaco-editor/loader — не путать с node_modules). Emmet НЕ в ядре Monaco 0.5x: подключается плагином `emmet-monaco-es` в `beforeMount` (`emmetHTML(emmetCSS(emmetJSX))`, гвард `monaco.__syntaxEmmet`). Рабочее пространство файлов: старт-файл с кодом, новые файлы пустые, дубликаты имени → `(2)`, `(3)`, табы перетаскиваются и закрываются. Run: JS-only файлы — скрытый раннер-iframe, HTML — перезапуск превью; `console.log/warn/error` и ошибки перехватываются скриптом `CONSOLE_CAPTURE` в iframe и выводятся в панели консоли. Submit = run + вердикт.

## Конвенции
- Дизайн-система «Protocol Neo»: токены тем в `src/css/style.css` (`:root` тёмная, `[data-theme="light"]`). Скроллбары: тонкие, тёмная тема — акцентный зелёный, светлая — нейтральный (токены `--scroll-thumb*`).
- i18n: **5 языков** EN/RU/UK/ES/DE. `src/i18n/index.js` (EN + RU), `locales-extra.js` (UK/ES/DE). `useT()` — dot-lookup, `{param}`-интерполяция, fallback на EN. Список-данные (посты, модули, задачи, гиды, уведомления) — переводятся как массивы в словарях; state в компонентах держит **индексы**, не строки. Новый ключ обязан попасть во ВСЕ 5 словарей.
- Выбор языка: `localStorage["syntax-ui-lang"]`, тема: `localStorage["syntax-theme"]`, синхронизируется `<html lang>`.
- Аватары: монограммы-кружки с HSL-градиентом (`src/components/Avatar.jsx`), фото придут с бэкендом.
- i18n-аудит ключей (обязателен после добавления t("...")): `npx esbuild src/i18n/index.js --bundle --format=cjs --outfile=/tmp/locales.cjs` + node-скрипт: собрать все `t("key")` из jsx, сверить с LOCALES по всем 5 языкам (шаблон скрипта — в хронике/прошлых сессиях; node ESM напрямую не импортирует i18n — там extension-less import, только через esbuild).

## Дизайн-макеты (эталон)
`/mnt/c/Users/User/Desktop/SyntaxAddDesign/`:
`Syntax-main_dashboard`, `Syntax_roadmap_dashboard`, `Syntax-tasks_dashboard`, `Syntax-documentation_dashboard`, `Syntax-rankings_dashboard`, `Syntax-comunity_dashboard` (опечатка в имени — один m). В каждом: `screen.png` + `code.html`.

## Состояние (на момент правки этого файла)
Сделано: каркас, все вкладки, i18n 5 языков, hash-роутинг, замкнутый учебный цикл, унифицированный правый сайдбар, эммет, live-превью, мобилка, a11y.
**Гостевая главная (раунд 2, по аналитике)**: герой-оффер в первом экране (eyebrow + H1 + desc + «Start for free» primary → SignupModal + «Try a demo lesson» → реальный демо-урок в редакторе + trust-строка + avatar-stack «50,000+ · ★ 4.8»); mock окна редактора справа (typing-анимация строк, One Dark-токены, Run + «✓ 3 tests passed» с задержкой); resume-карта стала «LIVE PREVIEW» (второй блок, CTA → модалка); tech-карты с «N lessons · Beginner → Pro» (данные в lib/techs.js, `t("home.lessons", { n })`); bento: success-широкий (кольцо 120, hover-glow), «Your first project — 2 weeks» вместо velocity; sparkline draw-on + пульс-точка на hover; цитата-кейс Maya K.; final-CTA-баннер; футер (Product/Company/Legal); «For you»-заголовок над Daily Challenge в rail; Start Challenge → SignupModal. Хедер: Log in (ghost) + Sign up free (primary) — гостевые кнопки. SignupModal (src/components/SignupModal.jsx): одна модалка на все guest-действия, «Continue as guest», Esc/клик-аутсайд. Ambient усилен: сетка 8%, маска 120%/100%, noise 5%, aurora 13%. Mобилка: bottom-nav с подписями 10px, brand 18px, ≤480 скрывается колокольчик (`.tb-menu-wrap--notif`).
Осторожно с i18n: скрипты batch-вставки с вложенными циклами ломали файлы (дубли ключей) — после любых python-правок: `npm run lint` + esbuild-аудит полноты (собрать t("...") из jsx, сверить с LOCALES через `npx esbuild src/i18n/index.js --bundle --format=cjs`).
Открыто:
1. **Продуктовое решение: Python vs JavaScript** — roadmap/docs контент на Python, урок/редактор/главная — JS. Варианты: (а) unify в один язык, (б) JS активный трек, остальные «скоро» (текущее состояние, tech-cards с бейджем), (в) реальный переключатель треков (большая фича). `<title>`/мета в index.html пока нейтральные.
2. Вкладки **Settings** и **Support** — ждём макеты.
3. Фича «изучаемый язык» (смена бренда/контента) — ждём набросок пользователя.
4. News в дефолтном правом сайдбаре — сейчас Daily Challenge («For you»-заголовок) + PromoCard (книга, `src/lib/promos.js` + `src/assets/promo-*.png`; NeoStudio подготовлен, ставится позже на другие страницы).
5. **Гостевые фичи лендинга (раунд 2)**: mock-редактор в hero (typing-анимация CSS-only), SignupModal (демо, без бэкенда), «Try a demo lesson» → реальный урок без регистрации. Open: «как это работает» 3-плитки (§2в аналитики), canvas-частицы (§5.1в), бэкенд auth.
6. Git: работаем на master, ahead от origin, push — по команде пользователя.

## Правила
- Перед завершением задачи: `npm run lint` + `npm run build` зелёные.
- Не ломать: polling в vite.config, Emmet-гвард, `[hidden]` правило, TAB_ASIDES паттерн, 5-язычную полноту i18n, `sticky/z-50` топбара (см. архитектуру).
- style.css: единый файл ~3000 строк; мобильные оверрайды home — БЛОКОМ В КОНЦЕ home-секции (базовые правила ниже перебивают media-заголовки выше). При массовой вставке CSS — python-заменой между маркерами секций.
- Скриншоты для проверок: puppeteer-core из `/home/alex_creator_web/screenshot-tool/` + chrome-headless-shell из `~/.cache/puppeteer/` (скрипт кладём ВНУТРЬ screenshot-tool для резолва модулей; запуск `node /tmp/...` не работает). Скрипт-шаблон: `/tmp/shot_syntax.js`.
- Коммиты — только по команде пользователя.

## История (хроника)
- 2026-07: скаффолд Vite+React; статичный макет → компоненты; i18n 5 языков; Monaco (темы, табы файлов, превью, Emmet через emmet-monaco-es); вьюхи home/roadmap/tasks/docs/rankings/community; унифицированный правый сайдбар (TAB_ASIDES); hash-роутинг; учебный цикл (job-контекст, Run, консоль в редакторе, Submit); fix HMR (polling); тонкие скроллбары; мобилка и a11y; уведомления (красные метки важных), меню аккаунта, ⌘K. Коммит d576c60 — финальный на сегодня.
- 2026-07 (раунд 2, гостевая главная по аналитике): hero-оффер (H1 + Start for free + demo-урок + social proof), mock-редактор с typing, live-preview-карта, tech-карты со счётчиками уроков, bento (success-широкий, first-project вместо velocity), цитата-кейс, final CTA, футер, SignupModal, auth-кнопки в хедере, PromoCard (книга) в rail, ambient-усиление, sparkline draw-on, мобилка (nav с подписями), fix z-index топбара, fix i18n-дыр (editor.preview, uk header.home). Коммит 10b8dc3+ — см. git log.
