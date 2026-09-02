import { useState, useEffect, useRef } from "react";
import { useT } from "../i18n/useT";
import { getCompleted } from "../lib/progress";
import { NAV_GROUPS, NAV_ICONS } from "./nav-data";

// Выпадающее меню настроек (как в VS Code): пункты открываются здесь, без перехода на вкладку
const SETTINGS_STUB_ITEMS = ["editor", "notifications", "shortcuts", "about"];

function Sidebar({ activeTab, theme, onToggleTheme, onSelectTab, isAuthed, dbLessons, activeTech }) {
  const t = useT();
  // Реальный прогресс по выбранному треку: выполненные уроки (progress в localStorage,
  // тот же источник, что и Submit-гейт редактора) ÷ опубликованные уроки трека в БД.
  // Окружность кольца: r=19 → C=119.4 — смещение считается, а не хардкодится (is-57 убрана).
  const C = 119.4;
  const trackLessons = (dbLessons || []).filter((l) => l.tech === activeTech);
  const completedSet = getCompleted(activeTech);
  const doneCount = trackLessons.filter((l) => completedSet.includes(l.id)).length;
  const pct = trackLessons.length ? Math.round((doneCount / trackLessons.length) * 100) : 0;
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
      {/* Прогресс ученика — только для залогиненных и после загрузки БД (гость видит без него) */}
      {isAuthed && dbLessons && (
        <button
          type="button"
          className="streak card streak--link"
          onClick={() => onSelectTab("roadmap")}
          aria-label={t("sidebar.roadmap")}
          title={t("sidebar.roadmap")}
        >
          <div className="streak__ring" aria-hidden="true">
            <svg viewBox="0 0 44 44">
              <circle className="ring-bg" cx="22" cy="22" r="19" />
              <circle className="ring-fg" cx="22" cy="22" r="19" style={{ strokeDashoffset: C * (1 - pct / 100) }} />
            </svg>
            <span className="streak__pct">{pct}%</span>
          </div>
          <div className="streak__meta">
            <strong>{t("sidebar.progressTitle")}</strong>
            <span>{trackLessons.length ? t("sidebar.progressCount", { n: doneCount, m: trackLessons.length }) : t("sidebar.progressNoTrack")}</span>
          </div>
        </button>
      )}

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