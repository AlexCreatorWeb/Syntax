import { useState, useEffect, useRef } from "react";
import { useT } from "../i18n/useT";
import { NAV_GROUPS, NAV_ICONS } from "./nav-data";
import TECHS, { getTech } from "../lib/techs";
import { getCompleted } from "../lib/progress";
import { totalXp, levelInfo, currentStreak } from "../lib/xp";

// Лого трека для персонального блока (static-мапа — react-compiler, паттерн хроники)
const TRACK_LOGOS = Object.fromEntries(TECHS.map((tc) => [tc.id, tc.Logo]));

// Выпадающее меню настроек (как в VS Code): пункты открываются здесь, без перехода на вкладку
const SETTINGS_STUB_ITEMS = ["editor", "notifications", "shortcuts", "about"];

function Sidebar({
  activeTab,
  theme,
  onToggleTheme,
  onSelectTab,
  session,
  guestMode,
  dbLessons,
  activeTech,
  progressTick,
  onNavigate,
  onAuth,
}) {
  const t = useT();
  // UX-аудит V1: персональная панель (вместо убранной глобальной карточки прогресса) —
  // прогресс АКТИВНОГО трека + уровень/XP + streak. Для юзера всегда виден
  // (retention-сигнал на всех вкладках), для гостя — когда прогресс уже есть.
  const lessons =
    dbLessons && dbLessons.length
      ? dbLessons.filter((l) => l.tech === activeTech)
      : [];
  const completedCount = activeTech ? getCompleted(activeTech).length : 0;
  const xp = totalXp();
  const lvl = levelInfo(xp);
  const streak = currentStreak();
  const tech = getTech(activeTech);
  const showPersonal =
    Boolean(session) || (guestMode && (xp > 0 || completedCount > 0));
  // progressTick — перерисовка после sync/Submit (данные уже в LS, тик только ре-рендерит)
  void progressTick;
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
    {
      id: "documentation",
      label: "Documentation",
      icon: NAV_ICONS.documentation,
    },
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
      {showPersonal && (
        <div className="sidebar-me">
          <div className="sidebar-me__head">
            <span className="sidebar-me__title">{t("sidebar.me")}</span>
            <span className="sidebar-me__level">
              {t("sidebar.level", { n: lvl.level })}
            </span>
          </div>
          {lessons.length > 0 && (
            <button
              type="button"
              className="sidebar-me__track"
              onClick={() => onNavigate("technology", { techId: activeTech })}
            >
              <span className="sidebar-me__logo">
                {(() => {
                  const L = tech ? TRACK_LOGOS[tech.id] : null;
                  return L ? <L /> : null;
                })()}
              </span>
              <span className="sidebar-me__track-text">
                <span className="sidebar-me__track-name">
                  {t(tech ? tech.label : "sidebar.noTech")}
                </span>
                <span className="sidebar-me__track-status">
                  <span className="sidebar-me__track-count">
                    {t("sidebar.progressCount", {
                      n: completedCount,
                      m: lessons.length,
                    })}
                  </span>
                  <span
                    className="bar sidebar-me__bar"
                    role="progressbar"
                    aria-valuenow={completedCount}
                    aria-valuemin={0}
                    aria-valuemax={lessons.length}
                  >
                    <span
                      className="bar__fill"
                      style={{
                        width: `${Math.round((completedCount / lessons.length) * 100)}%`,
                      }}
                    />
                  </span>
                </span>
              </span>
            </button>
          )}
          <div className="sidebar-me__xp">
            <span className="sidebar-me__xp-label">
              {t("sidebar.xp", { n: xp })}
            </span>
            <span
              className="bar sidebar-me__bar"
              role="progressbar"
              aria-valuenow={lvl.pct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span className="bar__fill" style={{ width: `${lvl.pct}%` }} />
            </span>
            {!lvl.maxed && (
              <span className="sidebar-me__xp-need">
                {t("sidebar.xpNeed", { n: lvl.need })}
              </span>
            )}
          </div>
          {streak > 0 && (
            <div className="sidebar-me__streak">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 23c-4.97 0-8-3.13-8-7.5 0-3.1 1.65-5.22 3.2-7.02.88-1.02 1.78-2.03 2.45-3.22.43-.76.67-1.6.72-2.51.02-.42.48-.65.81-.42 2.37 1.7 7.82 6.9 7.82 13.17 0 4.37-3.03 7.5-7 7.5Zm0-2.2c2.3 0 4.8-1.6 4.8-4.9 0-3.6-2.9-6.9-4.8-8.5-2 1.6-5 5-5 8.5 0 3.3 2.5 4.9 5 4.9Z" />
              </svg>
              <span>{t("sidebar.streakDays", { n: streak })}</span>
            </div>
          )}
          {!session && (
            <button
              type="button"
              className="sidebar-me__guest"
              onClick={() => onAuth && onAuth("signup")}
            >
              {t("sidebar.meGuest")}
            </button>
          )}
        </div>
      )}
      <nav className="nav" aria-label="Main">
        {NAV_GROUPS.map((group) => (
          <div className="nav__group" key={group.id}>
            <span className="nav__group-label">
              {t(
                `sidebar.group${group.id[0].toUpperCase()}${group.id.slice(1)}`,
              )}
            </span>
            {group.items.map((id) =>
              renderNavItem(navItems.find((i) => i.id === id)),
            )}
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
            {" "}
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
        {/* UX-аудит V9: Support убран из навигации (два полых пункта обесценивали меню);
            заглушка #/support осталась для старых ссылок */}
      </div>
    </aside>
  );
}

export default Sidebar;
