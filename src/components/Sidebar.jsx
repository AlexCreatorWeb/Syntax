import { useState, useEffect, useRef } from "react";
import { useT } from "../i18n/useT";
import { NAV_GROUPS, NAV_ICONS } from "./nav-data";

// Выпадающее меню настроек (как в VS Code): пункты открываются здесь, без перехода на вкладку
const SETTINGS_STUB_ITEMS = ["editor", "notifications", "shortcuts", "about"];

function Sidebar({ activeTab, theme, onToggleTheme, onSelectTab }) {
  const t = useT();
  // (Глобальная карточка прогресса убрана, фидбек 2026-09: прогресс привязан к конкретной
  //  технологии и живёт на ЕЁ странице; в общем сайдбаре было непонятно «чей это трек»)
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef(null);

  useEffect(() => {
    if (!settingsOpen) return;
    const handleClickOutside = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setSettingsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setSettingsOpen(false);
    };
    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [settingsOpen]);
  const navItems = [
    { id: "roadmap", label: "Roadmap", icon: NAV_ICONS.roadmap },
    { id: "editor", label: "Editor", icon: NAV_ICONS.editor },
    { id: "tasks", label: "Tasks", icon: NAV_ICONS.tasks },
    { id: "rankings", label: "Rankings", icon: NAV_ICONS.rankings },
    { id: "documentation", label: "Documentation", icon: NAV_ICONS.documentation },
    { id: "community", label: "Community", icon: NAV_ICONS.community },
  ];

  const settingsIcon = NAV_ICONS.settings;

  const renderNavItem = (item) => (
    <button
      key={item.id}
      type="button"
      className={`nav__item ${activeTab === item.id ? "is-active" : ""}`}
      aria-label={t(`sidebar.${item.id}`)}
      onClick={() => onSelectTab(item.id)}
    >
      {item.icon}
      <span>{t(`sidebar.${item.id}`)}</span>
    </button>
  );

  return (
    <aside className="sidebar">
      <nav className="nav" aria-label="Main">
        {NAV_GROUPS.map((group) => (
          <div className="nav__group" key={group.id}>
            <span className="nav__group-label">{t(`sidebar.group${group.id[0].toUpperCase()}${group.id.slice(1)}`)}</span>
            {group.items.map((id) => renderNavItem(navItems.find((i) => i.id === id)))}
          </div>
        ))}
      </nav>

      <div className="nav nav--bottom">
        <div className="nav__dropdown" ref={settingsRef}>
          <button
            type="button"
            className={`nav__item nav__item--settings ${settingsOpen ? "is-open" : ""}`}
            aria-haspopup="menu"
            aria-expanded={settingsOpen}
            onClick={() => setSettingsOpen((v) => !v)}
          >
            {settingsIcon}
            <span>{t("sidebar.settings")}</span>
            <svg
              className="settings-menu__chev"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          <div className="settings-menu" role="menu" hidden={!settingsOpen}>
            <button
              type="button"
              role="menuitem"
              className="settings-menu__item"
              onClick={onToggleTheme}
            >
              {t("settingsMenu.appearance")}
              <span className="settings-menu__hint" aria-hidden="true">
                {theme === "dark" ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                  </svg>
                )}
              </span>
            </button>
            {SETTINGS_STUB_ITEMS.map((key) => (
              <button
                key={key}
                type="button"
                role="menuitem"
                className="settings-menu__item"
                title={t("home.soon")}
                aria-disabled="true"
              >
                {t(`settingsMenu.${key}`)}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          className={`nav__item ${activeTab === "support" ? "is-active" : ""}`}
          onClick={() => onSelectTab("support")}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M9.5 9a2.5 2.5 0 0 1 5 .5c0 1.5-2.5 2-2.5 3.5" />
            <circle cx="12" cy="17" r=".5" fill="currentColor" />
          </svg>
          <span>{t("sidebar.support")}</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;