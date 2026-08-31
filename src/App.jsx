import { useState, useEffect, useRef, useCallback } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import MainContent from "./components/MainContent";
import WidgetPanel from "./components/WidgetPanel";
import SignupModal from "./components/SignupModal";
import { getTech } from "./lib/techs";

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


  // Гостевой sign-up: одна модалка на все гостевые действия (пока без бэкенда)
  const [signupOpen, setSignupOpen] = useState(false);
  const openSignup = useCallback(() => setSignupOpen(true), []);
  const closeSignup = useCallback(() => setSignupOpen(false), []);

  // Демо-auth: submit формы sign-up «логинит» на время сессии.
  // Пока без бэкенда — в-memory; с бэкендом станет реальная сессия.
  const [isAuthed, setIsAuthed] = useState(false);
  const handleAuthed = useCallback(() => setIsAuthed(true), []);

  return (
    <div className="app">
      <div className="ambient" aria-hidden="true" />
      <Header onToggleTheme={toggleTheme} onNavigate={openTab} onSignup={openSignup} />
      <div className="shell">
        <Sidebar activeTab={activeTab} theme={theme} onToggleTheme={toggleTheme} onSelectTab={openTab} isAuthed={isAuthed} />
        <MainContent
          activeTab={activeTab}
          theme={theme}
          job={job}
          onNavigate={openTab}
          activeTech={activeTech}
          onSelectTech={selectTech}
          onSignup={openSignup}
          routeParam={routeParam}
        />
        <WidgetPanel activeTab={activeTab} onNavigate={openTab} onSignup={openSignup} job={job} activeTech={activeTech} isAuthed={isAuthed} />
      </div>
      <SignupModal open={signupOpen} onClose={closeSignup} onAuthed={handleAuthed} />
    </div>
  );
}

export default App;
