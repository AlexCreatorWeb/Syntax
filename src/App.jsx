import { useState, useEffect, useRef, useCallback } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import MainContent from "./components/MainContent";
import WidgetPanel from "./components/WidgetPanel";

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

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <div className="app">
      <Header onToggleTheme={toggleTheme} onNavigate={openTab} />
      <div className="shell">
        <Sidebar activeTab={activeTab} onSelectTab={openTab} />
        <MainContent activeTab={activeTab} theme={theme} job={job} onNavigate={openTab} />
        <WidgetPanel activeTab={activeTab} onNavigate={openTab} />
      </div>
    </div>
  );
}

export default App;
