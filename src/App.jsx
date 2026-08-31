import { useState, useEffect, useRef, useCallback } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import MainContent from "./components/MainContent";
import WidgetPanel from "./components/WidgetPanel";
import SignupModal from "./components/SignupModal";

// URL-роутинг: #/<tab> — refresh не теряет вкладку, работают bookmarks и back-кнопка
const tabFromHash = () => window.location.hash.replace(/^#\/?/, "");

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("syntax-theme") || "dark";
  });

  const [activeTab, setActiveTab] = useState(() => {
    const fromHash = tabFromHash();
    if (fromHash) return fromHash;
    const tab = new URLSearchParams(window.location.search).get("tab");
    return tab || "home";
  });

  // Учебный контекст для редактора: { type: "lesson" | "task", title, desc }
  const [job, setJob] = useState(null);
  // job, который нужно применить при следующем hashchange (навигация через URL)
  const pendingJob = useRef(null);

  useEffect(() => {
    if (!window.location.hash) {
      history.replaceState(null, "", "#/home");
    }
    const onHash = () => {
      const tab = tabFromHash() || "home";
      setActiveTab(tab);
      setJob(pendingJob.current);
      pendingJob.current = null;
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const openTab = useCallback((tab, newJob = null) => {
    const wantHash = `#/${tab}`;
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

  // Выбранный язык обучения: только на время сессии (клик по карточке на главной
  // подставляет лого+название языка в хедер). По умолчанию и после перезагрузки
  // — оригинальный лого платформы.
  const [activeTech, setActiveTech] = useState("none");
  const selectTech = useCallback((id) => setActiveTech(id), []);

  // Гостевой sign-up: одна модалка на все гостевые действия (пока без бэкенда)
  const [signupOpen, setSignupOpen] = useState(false);
  const openSignup = useCallback(() => setSignupOpen(true), []);
  const closeSignup = useCallback(() => setSignupOpen(false), []);

  return (
    <div className="app">
      <div className="ambient" aria-hidden="true" />
      <Header activeTech={activeTech} onToggleTheme={toggleTheme} onNavigate={openTab} onSignup={openSignup} />
      <div className="shell">
        <Sidebar activeTab={activeTab} theme={theme} onToggleTheme={toggleTheme} onSelectTab={openTab} />
        <MainContent
          activeTab={activeTab}
          theme={theme}
          job={job}
          onNavigate={openTab}
          activeTech={activeTech}
          onSelectTech={selectTech}
          onSignup={openSignup}
        />
        <WidgetPanel activeTab={activeTab} onNavigate={openTab} onSignup={openSignup} />
      </div>
      <SignupModal open={signupOpen} onClose={closeSignup} />
    </div>
  );
}

export default App;
