import { useState, useEffect, useRef } from "react";
import { useT } from "../i18n/useT";
import { NAV_GROUPS, NAV_ICONS } from "./nav-data";

// Выпадающее меню настроек (как в VS Code): пункты открываются здесь, без перехода на вкладку
const SETTINGS_STUB_ITEMS = ["editor", "notifications", "shortcuts", "about"];

// 2026-09-08: Settings поднят в группу Resources (под Documentation) — дропдаун
// стал пунктом навигации; внизу сайдбара вместо него — виджет-индикатор системы.
function SettingsDropdown({ t, theme, onToggleTheme, onSelectTab, activeTab }) {
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

  return (
    <div className="nav__dropdown" ref={settingsRef}>
      <button
        type="button"
        className={`nav__item ${activeTab === "settings" ? "is-active" : ""} ${settingsOpen ? "is-open" : ""}`}
        aria-haspopup="menu"
        aria-expanded={settingsOpen}
        onClick={() => setSettingsOpen((v) => !v)}
      >
        {NAV_ICONS.settings}
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
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
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
            onClick={() => {
              setSettingsOpen(false);
              onSelectTab("settings");
            }}
          >
            {t(`settingsMenu.${key}`)}
            <span
              className="settings-menu__hint settings-menu__hint--nav"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// 2026-09-08: виджет-индикатор «Система онлайн» (дизайн: Stitch, Protocol Neo;
// референс SyntaxAddDesign/индикатор.png). Анимация: «голова» ЭКГ бежит по линии +
// точка «бьётся» (двойной удар). Без интернета — offline-режим: серые точка/линия,
// анимация остановлена, подписи — статус офлайна.
function StatusWidget({ t }) {
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return (
    <div
      className={`sidebar-status nav--bottom ${online ? "" : "is-offline"}`}
      role="status"
    >
      <div className="sidebar-status__text">
        <span className="sidebar-status__title">
          <span className="sidebar-status__dot" aria-hidden="true" />
          {t(online ? "sidebar.statusOnline" : "sidebar.statusOffline")}
        </span>
        <span className="sidebar-status__sub">
          {t(online ? "sidebar.statusSub" : "sidebar.statusOfflineSub")}
        </span>
      </div>
      <svg
        className="sidebar-status__ekg"
        viewBox="0 0 64 24"
        fill="none"
        aria-hidden="true"
      >
        {/* Линия как на референсе: ровная + узкий острый пик с глубоким провалом */}
        <path
          className="sidebar-status__ekg-base"
          d="M0 12 H20 L24 9 L27 2 L31 21 L34 12 H64"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* «Голова» монитора ЭКГ: яркая дуга всегда на линии (период = pathLength=100,
            бесшовный цикл без тёмных фаз); цвет задаёт CSS */}
        <path
          className="sidebar-status__ekg-pulse"
          d="M0 12 H20 L24 9 L27 2 L31 21 L34 12 H64"
          pathLength={100}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function Sidebar({
  activeTab,
  theme,
  onToggleTheme,
  onSelectTab,
  session,
  guestMode,
  activeTech,
  progressTick,
  onAuth,
}) {
  const t = useT();
  // Фидбек 2026-09: виджет прогресса из сайдбара убран ПОЛНОСТЬЮ (работал
  // некорректно) — прогресс теперь в кольце вокруг аватарки в хедере.
  void guestMode;
  void activeTech;
  // progressTick — перерисовка после sync/Submit (данные уже в LS, тик только ре-рендерит)
  void progressTick;
  const navItems = [
    { id: "roadmap", label: "Roadmap", icon: NAV_ICONS.roadmap },
    { id: "courses", label: "Courses", icon: NAV_ICONS.courses },
    { id: "editor", label: "Editor", icon: NAV_ICONS.editor },
    { id: "tasks", label: "Tasks", icon: NAV_ICONS.tasks },
    { id: "rankings", label: "Rankings", icon: NAV_ICONS.rankings },
    {
      id: "documentation",
      label: "Documentation",
      icon: NAV_ICONS.documentation,
    },
    { id: "community", label: "Community", icon: NAV_ICONS.community },
  ];

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
            <span className="nav__group-label">
              {t(
                `sidebar.group${group.id[0].toUpperCase()}${group.id.slice(1)}`,
              )}
            </span>
            {group.items.map((id) =>
              id === "settings" ? (
                <SettingsDropdown
                  key={id}
                  t={t}
                  theme={theme}
                  onToggleTheme={onToggleTheme}
                  onSelectTab={onSelectTab}
                  activeTab={activeTab}
                />
              ) : (
                renderNavItem(navItems.find((i) => i.id === id))
              ),
            )}
          </div>
        ))}
      </nav>

      {/* 2026-09-08: индикатор системы внизу (референс: SyntaxAddDesign/индикатор.png);
          Settings поднят в группу Resources под Documentation */}
      <StatusWidget t={t} />
      {/* Аудит M5: сайдбар на главной разрежен — гостю внизу лёгкая промо-карточка */}
      {!session && (
        <div className="sidebar-guest-promo">
          <h5>{t("sidebar.guestPromo.title")}</h5>
          <p>{t("sidebar.guestPromo.body")}</p>
          <button type="button" onClick={() => onAuth && onAuth("signup")}>
            {t("header.signupShort")}
          </button>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
