import { useState, useEffect } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import MainContent from "./components/MainContent";
import WidgetPanel from "./components/WidgetPanel";

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("syntax-theme") || "dark";
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
      <Header theme={theme} onToggleTheme={toggleTheme} />
      <div className="shell">
        <Sidebar />
        <MainContent />
        <WidgetPanel />
      </div>
    </div>
  );
}

export default App;