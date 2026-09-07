import { useState, useEffect, useRef, useCallback } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import MainContent from "./components/MainContent";
import WidgetPanel from "./components/WidgetPanel";
import AuthModal from "./components/AuthModal";
import NewsModal from "./components/NewsModal";
import CourseCompleteModal from "./components/CourseCompleteModal";
import MobileTabBar from "./components/MobileTabBar";
import { getTech } from "./lib/techs";
import { dailyKey } from "./lib/daily";
import { useT } from "./i18n/useT";
import { parseDocsPath, docsPathFor } from "./lib/docs-route";
import { fetchDbLessons } from "./lib/supabase";
import {
  readStoredSession,
  getSession,
  onAuthChange,
  signOut,
  syncProfile,
  displayName,
  isGuestActive,
  setGuestActive,
} from "./lib/auth";
import { syncProgressFromDb, pushProgressToDb } from "./lib/db-progress";
import {
  fetchMediumNews,
  getSeenLinks,
  markLinkSeen,
  clearSeenLinks,
  mediumDayKey,
  markAllLinksSeen,
} from "./lib/medium";
import RouteErrorBoundary from "./components/RouteErrorBoundary";

// URL-роутинг: #/<tab>[/param] — refresh не теряет вкладку, работают bookmarks и back-кнопка.
// Единственный параметризованный маршрут: #/technology/<techId> (deep-link на трек).
const parseHash = (raw) => {
  const s = (raw ?? window.location.hash).replace(/^#\/?/, "");
  const [tab, param] = s.split("/");
  return { tab: tab || "home", param };
};

// Documentation: трек/страница живут в РЕАЛЬНОМ пути (/docs/{track}/{pageId}) —
// refresh и share-ссылки ведут на ту же страницу (catch-all rewrite в vercel.json).
const isDocsPath = () => window.location.pathname.startsWith("/docs");

function App() {
  const t = useT();
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("syntax-theme") || "dark";
  });

  const [activeTab, setActiveTab] = useState(() => {
    if (parseDocsPath()) return "documentation";
    const fromHash = parseHash().tab;
    if (fromHash) return fromHash;
    const tab = new URLSearchParams(window.location.search).get("tab");
    return tab || "home";
  });

  // Доки-маршрут { track, page } — из /docs-пути (null = вкладка не открыта).
  // Старый bookmark #/documentation без /docs в пути: трек пилюли переносим в URL
  // синхронно в initializer (не в effect — lint-правило set-state-in-effect)
  const [docsRoute, setDocsRoute] = useState(() => {
    const dp = parseDocsPath();
    if (dp) return dp;
    if (parseHash().tab === "documentation") {
      const saved = localStorage.getItem("syntax-tech");
      const track = saved && getTech(saved) ? saved : "python";
      history.replaceState(
        null,
        "",
        `${docsPathFor({ track })}#/documentation`,
      );
      return { track, page: null };
    }
    return null;
  });

  // Уроки из Supabase (таблица lessons): null = ещё грузится, [] = пусто/сбой (fallback на i18n)
  const [dbLessons, setDbLessons] = useState(null);
  useEffect(() => {
    let alive = true;
    const load = (force) =>
      fetchDbLessons(4000, { force }).then((rows) => {
        // сбой/таймаут (null) нормализуем в [] — null остаётся только «ещё грузим»
        if (alive) setDbLessons(rows || []);
      });
    load(false);
    // Возврат на вкладку — свежий fetch (TTL внутри lib гасит спам запросов):
    // правки контента в БД (DELETE+INSERT) становятся видны без перезагрузки/перелогина
    const onVisible = () => {
      if (document.visibilityState === "visible") load(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // Новости Medium (технологии платформы): список в уведомлениях хедера + активная
  // метка на колокольчике у непрочитанных. Только свежие за сегодня; поллинг раз в 10
  // минут. Переход через 00:00 — поле очищается (clearSeenLinks + refresh фидов),
  // все сегодняшние новости снова «активные».
  // Дневной сброс при mount — в initializer (не синхронно в effect — lint-правило).
  const [seenNewsLinks, setSeenNewsLinks] = useState(() => {
    const day = mediumDayKey();
    let savedDay;
    try {
      savedDay = localStorage.getItem("syntax-medium-day");
    } catch {
      /* некритично */
    }
    if (savedDay !== day) {
      try {
        localStorage.setItem("syntax-medium-day", day);
      } catch {
        /* некритично */
      }
      clearSeenLinks();
    }
    return getSeenLinks();
  });
  const [mediumNews, setMediumNews] = useState([]);
  const [newsItem, setNewsItem] = useState(null);
  useEffect(() => {
    let alive = true;
    const load = (forcedRefresh = false) => {
      let refresh = forcedRefresh;
      // Переход через 00:00 прямо в работающем приложении — только из интервала
      // (async-контекст), поэтому setState здесь легально.
      const day = mediumDayKey();
      let savedDay;
      try {
        savedDay = localStorage.getItem("syntax-medium-day");
      } catch {
        /* некритично */
      }
      if (savedDay !== day) {
        try {
          localStorage.setItem("syntax-medium-day", day);
        } catch {
          /* некритично */
        }
        clearSeenLinks();
        setSeenNewsLinks(getSeenLinks());
        refresh = true;
      }
      fetchMediumNews({ refresh }).then((rows) => {
        if (alive) setMediumNews(rows);
      });
    };
    load();
    const timer = setInterval(() => load(), 10 * 60 * 1000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);
  const openNews = useCallback((item) => {
    setNewsItem(item);
    markLinkSeen(item.link); // просмотр = прочитано: метка гаснет
    setSeenNewsLinks(getSeenLinks());
  }, []);
  const closeNews = useCallback(() => setNewsItem(null), []);
  // M7-аудит: «Прочитать все» — все ссылки текущего фида сразу в seen
  const markAllNewsRead = useCallback(() => {
    markAllLinksSeen(mediumNews.map((n) => n.link));
    setSeenNewsLinks(getSeenLinks());
  }, [mediumNews]);

  const [job, setJob] = useState(null);
  // job, который нужно применить при следующем hashchange (навигация через URL)
  const pendingJob = useRef(null);

  // Выбранный трек: состояние пользователя (UX-аудит К4) — персистится в localStorage
  // (паттерн темы/языка). Приоритет: deep-link #/technology/<id> → сохранённый → none.
  const [activeTech, setActiveTech] = useState(() => {
    const { tab, param } = parseHash();
    if (tab === "technology" && param && getTech(param)) return param;
    const saved = localStorage.getItem("syntax-tech");
    return saved && getTech(saved) ? saved : "none";
  });
  const selectTech = useCallback((id) => {
    setActiveTech(id);
    if (id && id !== "none") localStorage.setItem("syntax-tech", id);
    // Deep-link согласованность: на странице трека переключение пилюлей обновляет URL,
    // чтобы refresh вёл на тот же трек (hashchange → onHash → selectTech(id) — идемпотентно)
    if (
      id &&
      id !== "none" &&
      window.location.hash.startsWith("#/technology/")
    ) {
      window.location.hash = `#/technology/${id}`;
    }
  }, []);

  // Доки-навигация: pushState на /docs-путь (hash остаётся #/documentation) —
  // один history-энтри на переход, back/forward через popstate.
  const navigateDocs = useCallback((route, { replace = false } = {}) => {
    const path = docsPathFor(route);
    const url = `${path}#/documentation`;
    if (
      window.location.pathname === path &&
      window.location.hash === "#/documentation" &&
      !replace
    ) {
      setDocsRoute(route);
      setActiveTab("documentation");
      return;
    }
    if (replace) history.replaceState(null, "", url);
    else history.pushState(null, "", url);
    setDocsRoute(route);
    setActiveTab("documentation");
    setJob(null);
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    // Начальная нормализация: #/documentation без /docs-пути обрабатывается в initializer docsRoute
    const initialDocs = parseDocsPath();
    if (initialDocs && window.location.hash !== "#/documentation") {
      history.replaceState(
        null,
        "",
        `${docsPathFor(initialDocs)}#/documentation`,
      );
    } else if (!window.location.hash) {
      history.replaceState(null, "", "#/home");
    }
    const onHash = () => {
      const { tab, param } = parseHash();
      // Доки управляет hash сама (pushState). Но ручной hash-якорь #/… в URL-баре
      // на /docs-пути раньше молча игнорировался (аудит #8) — уходим из доков
      if (isDocsPath()) {
        if (tab !== "documentation") {
          history.replaceState(null, "", "/");
          setDocsRoute(null);
          window.scrollTo(0, 0);
          setActiveTab(tab || "home");
          if (tab === "technology" && param && getTech(param))
            selectTech(param);
          setJob(pendingJob.current);
          pendingJob.current = null;
        }
        return;
      }
      // UX-аудит H3: внешняя смена hash = новая страница — скролл к верху
      // (не сравниваем с activeTab: у effect deps [selectTech] — closure устарел бы)
      window.scrollTo(0, 0);
      setActiveTab(tab || "home");
      // Deep-link #/technology/<id>: трек из URL становится выбранным (переживает refresh)
      if (tab === "technology" && param && getTech(param)) {
        selectTech(param);
      }
      setJob(pendingJob.current);
      pendingJob.current = null;
    };
    // Back/forward: docs-энтри меняют только путь (hash тот же) — hashchange не стреляет,
    // поэтому синхронизация из пути идёт здесь
    const onPop = () => {
      const dp = parseDocsPath();
      if (dp) {
        setDocsRoute(dp);
        setActiveTab("documentation");
        setJob(null);
        return;
      }
      // Путь ушёл из доков, а фрагмент не сменился (редко) — держим вкладку по хешу
      if (parseHash().tab === "documentation") {
        setActiveTab("documentation");
        setJob(null);
      }
    };
    window.addEventListener("hashchange", onHash);
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("popstate", onPop);
    };
  }, [selectTech]);

  const openTab = useCallback(
    (tab, newJob = null) => {
      // Доки: путь — источник правды; из сайдбара/хедера всегда в лендинг текущего трека
      if (tab === "documentation") {
        const track =
          (docsRoute && docsRoute.track) ||
          (activeTech && activeTech !== "none" ? activeTech : "python");
        navigateDocs({ track, page: null });
        return;
      }
      // UX-аудит H3: смена вкладки = новая страница — скролл к верху (без него
      // roadmap/tasks открывались «с середины», а мобилка — уроки снизу)
      window.scrollTo(0, 0);
      // Страница трека пишет трек в URL — bookmark/refresh ведут на тот же трек
      const wantHash =
        tab === "technology" && newJob && newJob.techId
          ? `#/technology/${newJob.techId}`
          : `#/${tab}`;
      // Покидаем docs-путь: refresh с /docs/{...}#/home вёл бы обратно в доки — правим путь
      if (isDocsPath()) {
        history.replaceState(null, "", `/${wantHash}`);
        const { param } = parseHash(wantHash);
        setDocsRoute(null);
        setActiveTab(tab);
        if (tab === "technology" && param && getTech(param)) selectTech(param);
        setJob(newJob);
        return;
      }
      if (window.location.hash === wantHash) {
        setActiveTab(tab);
        setJob(newJob);
      } else {
        pendingJob.current = newJob;
        window.location.hash = wantHash;
      }
    },
    [docsRoute, activeTech, navigateDocs, selectTech],
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("syntax-theme", theme);
  }, [theme]);

  // Spotlight: radial-градиент следует за курсором по карточкам .spotlight
  useEffect(() => {
    const onMove = (e) => {
      const el = e.target.closest && e.target.closest(".spotlight");
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--sx", `${e.clientX - r.left}px`);
      el.style.setProperty("--sy", `${e.clientY - r.top}px`);
    };
    document.addEventListener("mousemove", onMove);
    return () => document.removeEventListener("mousemove", onMove);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Гостевой режим: псевдо-сессия после «Continue as guest» — уроки/задачи
  // открыты, прогресс копится в guest-бакетах (наследуется при регистрации).
  const [guestMode, setGuestModeState] = useState(isGuestActive);
  const setGuestMode = useCallback((on) => {
    setGuestActive(on);
    setGuestModeState(on);
  }, []);

  // Auth (Supabase): сессия — localStorage (readStoredSession синхронно, чтобы не мигать
  // «гость» при загрузке; асинхронный getSession + onAuthStateChange подтверждают/следят).
  const [session, setSession] = useState(readStoredSession);
  useEffect(() => {
    let unsub = () => {};
    getSession().then(({ data }) => {
      if (data && data.session) setSession(data.session);
    });
    unsub = onAuthChange((s) => {
      setSession(s);
      // Реальная сессия = конец гостевого режима (прогресс guest-бакетов уже
      // перенесён в uid-имёнспейс прогресс-механикой при первом маркере)
      if (s && s.user) {
        setGuestMode(false);
        syncProfile(s.user); // SIGNED_IN: строка в profiles (fire-and-forget)
      }
    });
    return () => unsub();
  }, [setGuestMode]);
  // Прогресс в Supabase (2026-09): при входе — БД → локальный кэш (merge),
  // затем кэш (включая гостевой) → БД. Гость — no-op (только localStorage);
  // каждое выполнение в редакторе сразу upsert-ит свою строку (db-progress.js).
  // progressTick: после sync — перерендер (страница, открытая в момент входа,
  // видела пустой кэш; тик обновляет профиль/roadmap без навигации).
  const [progressTick, setProgressTick] = useState(0);
  useEffect(() => {
    if (!session || !dbLessons) return;
    syncProgressFromDb(dbLessons).then(() => {
      pushProgressToDb();
      setProgressTick((v) => v + 1);
    });
  }, [session, dbLessons]);
  const isAuthed = Boolean(session);
  const userName = displayName(session);
  const canAccess = isAuthed || guestMode;

  // UX-аудит Q3: уровень пересечён — toast «Level {n}» (событие из xp.js)
  const [levelUp, setLevelUp] = useState(null);
  useEffect(() => {
    const on = (e) => setLevelUp({ level: e.detail.level, key: Date.now() });
    window.addEventListener("syntax-level-up", on);
    return () => window.removeEventListener("syntax-level-up", on);
  }, []);
  useEffect(() => {
    if (!levelUp) return;
    const timer = setTimeout(() => setLevelUp(null), 5000);
    return () => clearTimeout(timer);
  }, [levelUp]);

  // UX-аудит Q3: последний урок курса — модалка «Курс пройден» (сертификат)
  const [courseDone, setCourseDone] = useState(null);
  useEffect(() => {
    const on = (e) => setCourseDone({ tech: e.detail.tech, key: Date.now() });
    window.addEventListener("syntax-course-complete", on);
    return () => window.removeEventListener("syntax-course-complete", on);
  }, []);

  // UX-аудит V10: signup-момент для гостя — после первой выполненной
  // задачи/урока (событие из job-конструкторов), раз в день.
  const [guestAsk, setGuestAsk] = useState(false);
  useEffect(() => {
    const on = () => {
      if (isAuthed) return;
      const day = dailyKey(new Date());
      try {
        if (localStorage.getItem("syntax-guest-asked") === day) return;
        const n =
          parseInt(
            localStorage.getItem("syntax-guest-completions") || "0",
            10,
          ) || 0;
        localStorage.setItem("syntax-guest-completions", String(n + 1));
        setGuestAsk(true);
      } catch {
        /* приватный режим */
      }
    };
    window.addEventListener("syntax-guest-progress", on);
    return () => window.removeEventListener("syntax-guest-progress", on);
  }, [isAuthed]);
  const dismissGuestAsk = () => {
    try {
      localStorage.setItem("syntax-guest-asked", dailyKey(new Date()));
    } catch {
      /* приватный режим */
    }
    setGuestAsk(false);
  };
  const handleLogout = useCallback(() => {
    signOut();
    setGuestMode(false);
  }, [setGuestMode]);

  // Модалка auth: null | "signup" | "login" — одна на все гостевые действия и на «Log in» хедера.
  // ctx: "challenge" — заголовок под контекст тригера (M5-аудит: не терять цель регистрации)
  const [authMode, setAuthMode] = useState(null);
  const [authCtx, setAuthCtx] = useState(null);
  const openAuth = useCallback((mode = "signup", ctx = null) => {
    setAuthMode(mode);
    setAuthCtx(ctx);
  }, []);
  const closeAuth = useCallback(() => setAuthMode(null), []);
  // «Continue as guest»: флаг + закрытие модалки. Pending-action в MainContent
  // сработает сам (эффект отслеживает canAccess: после флага гостя — действие
  // выполняется, студент оказывается в том же уроке/задаче, что нажал).
  const continueAsGuest = useCallback(() => {
    setGuestMode(true);
    setAuthMode(null);
  }, [setGuestMode]);

  return (
    <div className="app">
      <div className="ambient" aria-hidden="true" />
      <Header
        onToggleTheme={toggleTheme}
        onNavigate={openTab}
        onAuth={openAuth}
        onLogout={handleLogout}
        user={userName}
        userEmail={session && session.user ? session.user.email : null}
        mediumNews={mediumNews}
        seenNewsLinks={seenNewsLinks}
        onOpenNews={openNews}
        onMarkAllNewsRead={markAllNewsRead}
        activeTab={activeTab}
        guest={guestMode && !userName}
        onExitGuest={() => setGuestMode(false)}
      />
      <div className="shell" data-tab={activeTab}>
        <Sidebar
          activeTab={activeTab}
          theme={theme}
          onToggleTheme={toggleTheme}
          onSelectTab={openTab}
          session={session}
          guestMode={guestMode}
          dbLessons={dbLessons || []}
          activeTech={activeTech}
          progressTick={progressTick}
          onNavigate={openTab}
          onAuth={openAuth}
        />
        <RouteErrorBoundary key={activeTab} onNavigate={openTab}>
          <MainContent
            activeTab={activeTab}
            theme={theme}
            job={job}
            onNavigate={openTab}
            activeTech={activeTech}
            onSelectTech={selectTech}
            onSignup={(ctx) => openAuth("signup", ctx)}
            dbLessons={dbLessons}
            session={session}
            userName={userName}
            guestMode={guestMode}
            onAuth={openAuth}
            onLogout={handleLogout}
            progressTick={progressTick}
            docsRoute={docsRoute}
            onDocsRoute={navigateDocs}
            onToggleTheme={toggleTheme}
          />
        </RouteErrorBoundary>
        <WidgetPanel
          activeTab={activeTab}
          onNavigate={openTab}
          onAuth={openAuth}
          job={job}
          activeTech={activeTech}
          isAuthed={canAccess}
          userName={userName}
          dbLessons={dbLessons}
          docsRoute={docsRoute}
        />
      </div>
      {authMode && (
        <AuthModal
          key={authMode}
          mode={authMode}
          ctx={authCtx}
          onClose={closeAuth}
          onSwitchMode={openAuth}
          onContinueAsGuest={continueAsGuest}
        />
      )}
      {newsItem && <NewsModal item={newsItem} onClose={closeNews} />}
      {/* UX-аудит V4: мобильный bottom tab bar (≤640, видим через CSS) */}
      <MobileTabBar activeTab={activeTab} onNavigate={openTab} />
      {levelUp && (
        <div className="toast toast--levelup" key={levelUp.key} role="status">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 2 15 8.5 22 9.3 17 14 18.2 21 12 17.5 5.8 21 7 14 2 9.3 9 8.5 12 2Z" />
          </svg>
          <span>
            <strong>{t("toast.levelUp", { n: levelUp.level })}</strong>
            <em>{t("toast.levelUpSub")}</em>
          </span>
        </div>
      )}
      {courseDone && (
        <CourseCompleteModal
          tech={courseDone.tech}
          onClose={() => setCourseDone(null)}
          onNavigate={openTab}
        />
      )}
      {guestAsk && (
        <div className="modal-overlay" onClick={dismissGuestAsk}>
          <div
            className="modal guest-ask"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h2>{t("guestAsk.title")}</h2>
            <p>{t("guestAsk.body")}</p>
            <div className="guest-ask__actions">
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => {
                  dismissGuestAsk();
                  openAuth("signup", "guest-ask");
                }}
              >
                {t("guestAsk.create")}
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={dismissGuestAsk}
              >
                {t("guestAsk.later")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
