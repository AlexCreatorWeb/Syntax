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
**Технологии и треки (коммит cb2471b, UX-аудиты раунды 1–2)**: страницы технологии `#/technology/<id>` (hero лого+описание+Open track+N lessons, курс-прогресс с Continue Learning, curriculum с статусами completed/in-progress/locked; контент трека в i18n `techs.{id}` — EN+RU, UI-ключи `techPage.*` 5 языков; rail: Resources + Syntax AI Assistant — `TechAside`). Выбранный трек: `localStorage["syntax-tech"]`, deep-link (трехк в hash, валидация против TECHS), лого-<тех> в хедере кликабелен → страница трека, «Not your track?» под hero → каталог. Roadmap = селектор треков (старый таймлайн удалён); карточки — общий `TechCardsGrid` (9 техник, официальные лого: CSS3-щит #1572B6, Node, PostgreSQL, MongoDB; tile-grid 3×3, клик = выбор + страница). Урок = файл трека: `techs.{id}.lesson { title, desc, file }`, CodeEditor берёт старт-файл и Monaco-язык из job по расширению. Гостевая главная: герой-оффер в первом экране + mock-редактор с typing, live-preview-карта, stats-bento 5 карточек (first-project вместо velocity), цитата-кейс, final CTA, футер; SignupModal (in-memory demo-auth, refresh сбрасывает); sidebar: 3 группы (Learn/Community/Resources, мобилка — bottom-nav), streak-карта гостевая, «Settings» = «Editor settings».
Осторожно с i18n: скрипты batch-вставки с вложенными циклами ломали файлы (дубли ключей) — после любых python-правок: `npm run lint` + esbuild-аудит полноты (собрать t("...") из jsx, сверить с LOCALES через `npx esbuild src/i18n/index.js --bundle --format=cjs`; ложные срабатывания на комментарии — глечить).
Открыто:
1. **Контент треков**: переключатель работает (коммит cb2471b), но контент demo — `techs.{id}` только EN+RU (uk/es/de откатываются на EN через useT), уроки = один старт-файл на трек. Дальше: полные программы модулей, бэкенд прогресса.
2. Вкладки **Settings** и **Support** — ждём макеты.
3. News в дефолтном правом сайдбаре — сейчас Daily Challenge + PromoCard (книга, `src/lib/promos.js` + `src/assets/promo-*.png`; NeoStudio подготовлен, ставится позже на другие страницы).
4. **Гостевые фичи лендинга**: mock-редактор в hero (typing CSS-only), SignupModal (in-memory demo-auth, refresh сбрасывает), «Try a demo lesson». Open: «как это работает» 3-плитки (§2в аналитики), canvas-частицы (§5.1в), бэкенд auth.
5. Git: работаем на master, ahead от origin, push — по команде пользователя.

## Правила
- Перед завершением задачи: `npm run lint` + `npm run build` зелёные.
- Не ломать: polling в vite.config, Emmet-гвард, `[hidden]` правило, TAB_ASIDES паттерн, 5-язычную полноту i18n, `sticky/z-50` топбара (см. архитектуру).
- style.css: единый файл ~3000 строк; мобильные оверрайды home — БЛОКОМ В КОНЦЕ home-секции (базовые правила ниже перебивают media-заголовки выше). При массовой вставке CSS — python-заменой между маркерами секций.
- Скриншоты для проверок: puppeteer-core из `/home/alex_creator_web/screenshot-tool/` + chrome-headless-shell из `~/.cache/puppeteer/` (скрипт кладём ВНУТРЬ screenshot-tool для резолва модулей; запуск `node /tmp/...` не работает). Скрипт-шаблон: `/tmp/shot_syntax.js`.
- Коммиты — только по команде пользователя.

## История (хроника)
- 2026-07: скаффолд Vite+React; статичный макет → компоненты; i18n 5 языков; Monaco (темы, табы файлов, превью, Emmet через emmet-monaco-es); вьюхи home/roadmap/tasks/docs/rankings/community; унифицированный правый сайдбар (TAB_ASIDES); hash-роутинг; учебный цикл (job-контекст, Run, консоль в редакторе, Submit); fix HMR (polling); тонкие скроллбары; мобилка и a11y; уведомления (красные метки важных), меню аккаунта, ⌘K. Коммит d576c60 — финальный на сегодня.
- 2026-07 (раунд 2, гостевая главная по аналитике): hero-оффер (H1 + Start for free + demo-урок + social proof), mock-редактор с typing, live-preview-карта, tech-карты со счётчиками уроков, bento (success-широкий, first-project вместо velocity), цитата-кейс, final CTA, футер, SignupModal, auth-кнопки в хедере, PromoCard (книга) в rail, ambient-усиление, sparkline draw-on, мобилка (nav с подписями), fix z-index топбара, fix i18n-дыр (editor.preview, uk header.home). Коммит f0544b9.
- 2026-07 (UX-аудиты раунды 1–2, техники и треки): home-аудит (hero в первом кадре, порядок секций, кнопка одна, sidebar-группы, футер-синхронизация); страницы технологии (макет technology-page) с контентом по 9 трекам; Roadmap → селектор треков (двойная карта убрана); трек в localStorage + deep-link #/technology/<id>; уроки привязаны к треку (файл/заголовок по расширению); fix: refresh-падение на JS-контент (techId fallback на activeTech). Коммит cb2471b.
