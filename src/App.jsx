import { useState, useEffect } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import MainContent from "./components/MainContent";
import WidgetPanel from "./components/WidgetPanel";

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("syntax-theme") || "dark";
  });

  // Состояние активной вкладки (для дев-проверялов: ?tab=roadmap)
  const [activeTab, setActiveTab] = useState(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    return tab || "lessons";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("syntax-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <div className="app">
      {/* Передаем состояние и функцию клика в Header */}
      <Header activeTab={activeTab} theme={theme} onToggleTheme={toggleTheme} />
      <div className="shell">
        <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />
        <MainContent activeTab={activeTab} theme={theme} />
        <WidgetPanel activeTab={activeTab} />
      </div>
    </div>
  );
}

export default App;