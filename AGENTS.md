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
- **Хедер универсальный** (`Header.jsx`): логотип (→ home), флаг-язык, тема, уведомления, аватар. Таб-специфичный контент (заголовки, поиска, сегмент-контролы) живёт ВНУТРИ вьюх.
- Дропдауны хедера: `hidden` + глобальное CSS `[hidden] { display: none !important }` (классы с `display:flex` иначе перебивают UA-правило). Клик-аутсайд — на `click`, каждый дропдаун закрывается независимо.
- `CodeEditor.jsx` — Monaco (загружается с CDN **0.55.1** через @monaco-editor/loader — не путать с node_modules). Emmet НЕ в ядре Monaco 0.5x: подключается плагином `emmet-monaco-es` в `beforeMount` (`emmetHTML(emmetCSS(emmetJSX))`, гвард `monaco.__syntaxEmmet`). Рабочее пространство файлов: старт-файл с кодом, новые файлы пустые, дубликаты имени → `(2)`, `(3)`, табы перетаскиваются и закрываются. Run: JS-only файлы — скрытый раннер-iframe, HTML — перезапуск превью; `console.log/warn/error` и ошибки перехватываются скриптом `CONSOLE_CAPTURE` в iframe и выводятся в панели консоли. Submit = run + вердикт.

## Конвенции
- Дизайн-система «Protocol Neo»: токены тем в `src/css/style.css` (`:root` тёмная, `[data-theme="light"]`). Скроллбары: тонкие, тёмная тема — акцентный зелёный, светлая — нейтральный (токены `--scroll-thumb*`).
- i18n: **5 языков** EN/RU/UK/ES/DE. `src/i18n/index.js` (EN + RU), `locales-extra.js` (UK/ES/DE). `useT()` — dot-lookup, `{param}`-интерполяция, fallback на EN. Список-данные (посты, модули, задачи, гиды, уведомления) — переводятся как массивы в словарях; state в компонентах держит **индексы**, не строки. Новый ключ обязан попасть во ВСЕ 5 словарей.
- Выбор языка: `localStorage["syntax-ui-lang"]`, тема: `localStorage["syntax-theme"]`, синхронизируется `<html lang>`.
- Аватары: монограммы-кружки с HSL-градиентом (`src/components/Avatar.jsx`), фото придут с бэкендом.
- i18n-аудит ключей: собрать все `t("...")` из jsx и сверить с LOCALES (скрипт писался на лету в /tmp).

## Дизайн-макеты (эталон)
`/mnt/c/Users/User/Desktop/SyntaxAddDesign/`:
`Syntax-main_dashboard`, `Syntax_roadmap_dashboard`, `Syntax-tasks_dashboard`, `Syntax-documentation_dashboard`, `Syntax-rankings_dashboard`, `Syntax-comunity_dashboard` (опечатка в имени — один m). В каждом: `screen.png` + `code.html`.

## Состояние (на момент правки этого файла)
Сделано: каркас, все вкладки (home/roadmap/tasks/docs/rankings/community/editor), полный i18n 5 языков, hash-роутинг, замкнутый учебный цикл (урок/задача → редактор с баннером, Run, консоль, Submit, назад), унифицированный правый сайдбар, эммет, live-превью, мобилка (<1200 rail уходит под контент, <640 bottom-nav), a11y (reduced-motion, aria), красная точка и значки важных уведомлений.
Открыто:
1. **Продуктовое решение: Python vs JavaScript** — roadmap/docs контент на Python, урок/редактор/главная — JS. Варианты: (а) unify в один язык, (б) JS активный трек, остальные «скоро» (текущее состояние, tech-cards с бейджем), (в) реальный переключатель треков (большая фича). `<title>`/мета в index.html пока нейтральные.
2. Вкладки **Settings** и **Support** — ждём макеты.
3. Фича «изучаемый язык» (смена бренда/контента) — ждём набросок пользователя.
4. News/ads в дефолтном правом сайдбаре — сейчас Daily Challenge + AI Mentor.
5. Git: работаем на master, ahead от origin на 3+ коммита (fc73993, d576c60), push — по команде пользователя.

## Правила
- Перед завершением задачи: `npm run lint` + `npm run build` зелёные.
- Не ломать: polling в vite.config, Emmet-гвард, `[hidden]` правило, TAB_ASIDES паттерн, 5-язычную полноту i18n.
- Коммиты — только по команде пользователя.

## История (хроника)
- 2026-07: скаффолд Vite+React; статичный макет → компоненты; i18n 5 языков; Monaco (темы, табы файлов, превью, Emmet через emmet-monaco-es); вьюхи home/roadmap/tasks/docs/rankings/community; унифицированный правый сайдбар (TAB_ASIDES); hash-роутинг; учебный цикл (job-контекст, Run, консоль в редакторе, Submit); fix HMR (polling); тонкие скроллбары; мобилка и a11y; уведомления (красные метки важных), меню аккаунта, ⌘K. Коммит d576c60 — финальный на сегодня.
