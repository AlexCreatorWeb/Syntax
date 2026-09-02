import { useState, useEffect, useRef, useCallback } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import MainContent from "./components/MainContent";
import WidgetPanel from "./components/WidgetPanel";
import AuthModal from "./components/AuthModal";
import NewsModal from "./components/NewsModal";
import { getTech } from "./lib/techs";
import { fetchDbLessons } from "./lib/supabase";
import { readStoredSession, getSession, onAuthChange, signOut, syncProfile, displayName } from "./lib/auth";
import { syncProgressFromDb, pushProgressToDb } from "./lib/db-progress";
import { fetchMediumNews, getSeenLinks, markLinkSeen, clearSeenLinks, mediumDayKey, markAllLinksSeen } from "./lib/medium";

// URL-роутинг: #/<tab>[/param] — refresh не теряет вкладку, работают bookmarks и back-кнопка.
// Единственный параметризованный маршрут: #/technology/<techId> (deep-link на трек).
const parseHash = () => {
  const raw = window.location.hash.replace(/^#\/?/, "");
  const [tab, param] = raw.split("/");
  return { tab: tab || "home", param };
};

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("syntax-theme") || "dark";
  });

  const [activeTab, setActiveTab] = useState(() => {
    const fromHash = parseHash().tab;
    if (fromHash) return fromHash;
    const tab = new URLSearchParams(window.location.search).get("tab");
    return tab || "home";
  });

  // Учебный контекст для редактора: { type: "lesson" | "task", title, desc }
  // URL-параметр вкладки (#/documentation/<slug> — статья; #/technology/<id> — трек)
  const [routeParam, setRouteParam] = useState(() => parseHash().param);

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
    try { savedDay = localStorage.getItem("syntax-medium-day"); } catch { /* некритично */ }
    if (savedDay !== day) {
      try { localStorage.setItem("syntax-medium-day", day); } catch { /* некритично */ }
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
      try { savedDay = localStorage.getItem("syntax-medium-day"); } catch { /* некритично */ }
      if (savedDay !== day) {
        try { localStorage.setItem("syntax-medium-day", day); } catch { /* некритично */ }
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
    if (id && id !== "none" && window.location.hash.startsWith("#/technology/")) {
      window.location.hash = `#/technology/${id}`;
    }
  }, []);

  useEffect(() => {
    if (!window.location.hash) {
      history.replaceState(null, "", "#/home");
    }
    const onHash = () => {
      const { tab, param } = parseHash();
      setActiveTab(tab || "home");
      setRouteParam(param);
      // Deep-link #/technology/<id>: трек из URL становится выбранным (переживает refresh)
      if (tab === "technology" && param && getTech(param)) {
        selectTech(param);
      }
      setJob(pendingJob.current);
      pendingJob.current = null;
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [selectTech]);

  const openTab = useCallback((tab, newJob = null) => {
    // Страница трека пишет трек в URL — bookmark/refresh ведут на тот же трек
    const wantHash = tab === "technology" && newJob && newJob.techId ? `#/technology/${newJob.techId}` : `#/${tab}`;
    if (window.location.hash === wantHash) {
      setActiveTab(tab);
      setJob(newJob);
    } else {
      pendingJob.current = newJob;
      window.location.hash = wantHash;
    }
  }, []);

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
      if (s && s.user) syncProfile(s.user); // SIGNED_IN: строка в profiles (fire-and-forget)
    });
    return () => unsub();
  }, []);
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
  const handleLogout = useCallback(() => signOut(), []);

  // Модалка auth: null | "signup" | "login" — одна на все гостевые действия и на «Log in» хедера.
  // ctx: "challenge" — заголовок под контекст тригера (M5-аудит: не терять цель регистрации)
  const [authMode, setAuthMode] = useState(null);
  const [authCtx, setAuthCtx] = useState(null);
  const openAuth = useCallback((mode = "signup", ctx = null) => { setAuthMode(mode); setAuthCtx(ctx); }, []);
  const closeAuth = useCallback(() => setAuthMode(null), []);

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
      />
      <div className="shell" data-tab={activeTab}>
        <Sidebar
          activeTab={activeTab}
          theme={theme}
          onToggleTheme={toggleTheme}
          onSelectTab={openTab}
        />
        <MainContent
          activeTab={activeTab}
          theme={theme}
          job={job}
          onNavigate={openTab}
          activeTech={activeTech}
          onSelectTech={selectTech}
          onSignup={(ctx) => openAuth("signup", ctx)}
          routeParam={routeParam}
          dbLessons={dbLessons}
          session={session}
          userName={userName}
          onAuth={openAuth}
          onLogout={handleLogout}
          progressTick={progressTick}
        />
        <WidgetPanel
          activeTab={activeTab}
          onNavigate={openTab}
          onAuth={openAuth}
          job={job}
          activeTech={activeTech}
          isAuthed={isAuthed}
          dbLessons={dbLessons}
        />
      </div>
      {authMode && <AuthModal key={authMode} mode={authMode} ctx={authCtx} onClose={closeAuth} onSwitchMode={openAuth} />}
      {newsItem && <NewsModal item={newsItem} onClose={closeNews} />}
    </div>
  );
}

export default App;
