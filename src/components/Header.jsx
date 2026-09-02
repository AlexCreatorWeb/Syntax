import { useState, useEffect, useRef, useMemo } from 'react';
import { useLanguage } from '../context/useLanguage';
import { UI_LANGUAGES } from '../context/uiLanguages';
import { useT } from '../i18n/useT';

// Универсальный хедер: логотип (→ главная) + язык / тема / уведомления / аккаунт.
// Лого всегда оригинальный Syntax (тех-лого живёт на странице технологии — UX-фидбек);
// таб-специфичный контент (заголовки, поиски) — внутри вьюх.
function Header({ onToggleTheme, onNavigate, onAuth, onLogout, user = null, userEmail = null, mediumNews = [], seenNewsLinks, onOpenNews, onMarkAllNewsRead }) {
  const { lang, selectLanguage } = useLanguage();
  const t = useT();
  const [isOpen, setIsOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null); // "notif" | "account" | null
  const langRef = useRef(null);
  const notifRef = useRef(null);
  const accountRef = useRef(null);

  // Hue монограммы-аватара — детерминированно от имени (паттерн аватаров платформы)
  const nameHue = useMemo(() => {
    let h = 0;
    const s = user || "";
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
    return h;
  }, [user]);

  const toggleDropdown = () => setIsOpen((prev) => !prev);

  const handleSelectLang = (code) => {
    selectLanguage(code);
    setIsOpen(false);
  };

  useEffect(() => {
    // Каждый дропдаун закрывается независимо: клик вне своей обёртки.
    const handleClickOutside = (event) => {
      if (langRef.current && !langRef.current.contains(event.target)) {
        setIsOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setOpenMenu((m) => (m === "notif" ? null : m));
      }
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setOpenMenu((m) => (m === "account" ? null : m));
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen((prevOpen) => {
          if (prevOpen) {
            // Возвращаем фокус на кнопку-тоггл при закрытии через Escape
            langRef.current?.querySelector('.lang__toggle')?.focus();
          }
          return false;
        });
        setOpenMenu(null);
      }
      // ⌘K / Ctrl+K — фокус на поиск в Документации
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onNavigate && onNavigate("documentation");
        setTimeout(() => window.dispatchEvent(new CustomEvent("syntax-focus-docs-search")), 60);
      }
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onNavigate]);

  return (
    <header className="topbar">
      <div className="topbar__left">
        {/* Лого всегда оригинальное, клик — всегда на главную (тех-лого не дублируем) */}
        <button
          type="button"
          className="brand brand--link"
          onClick={() => onNavigate && onNavigate("home")}
          aria-label={t("header.home")}
        >
          <span className="brand__word">
            Syn<span className="brand__accent">tax</span>
          </span>
        </button>
      </div>
      <div className="topbar__right">
        <div className="lang" ref={langRef}>
          <button
            className="icon-btn icon-btn--flag lang__toggle"
            type="button"
            aria-haspopup="true"
            aria-expanded={isOpen}
            aria-label={`${t("header.changeLanguage")}: ${lang.name}`}
            onClick={toggleDropdown}
          >
            <img
              src={lang.flagSrc}
              alt=""
              className="lang__flag-img"
              aria-hidden="true"
            />
          </button>

          <div className="lang__menu" role="menu" hidden={!isOpen}>
            {UI_LANGUAGES.map((item) => {
              const isActive = item.code === lang.code;
              return (
                <button
                  key={item.code}
                  className={`lang__item ${isActive ? 'is-active' : ''}`}
                  type="button"
                  role="menuitem"
                  onClick={() => handleSelectLang(item.code)}
                >
                  <span className="lang__code-badge" aria-hidden="true">
                    {item.label}
                  </span>{' '}
                  {item.name}
                  <svg
                    className="lang__check"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m5 12 5 5 9-10" />
                  </svg>
                </button>
              );
            })}
          </div>
        </div>

        <button
          className="icon-btn theme-toggle"
          type="button"
          aria-label={t("header.theme")}
          onClick={onToggleTheme}
        >
          <svg
            className="icon-sun"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
          <svg
            className="icon-moon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
          </svg>
        </button>

        <div className="tb-menu-wrap tb-menu-wrap--notif" ref={notifRef}>
          <button
            className="icon-btn icon-btn--notif"
            type="button"
            aria-label={t("notifications.title")}
            aria-haspopup="true"
            aria-expanded={openMenu === "notif"}
            onClick={() => setOpenMenu((m) => (m === "notif" ? null : "notif"))}
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
              <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
            {/* Активная метка = непрочитанные публикации Medium */}
            <span
              className="tb-menu-badge"
              aria-hidden="true"
              hidden={!mediumNews.some((n) => seenNewsLinks && !seenNewsLinks.has(n.link))}
            />
          </button>
          <div className="tb-menu tb-menu--notif" role="menu" hidden={openMenu !== "notif"}>
            <div className="tb-menu__head">
              <span className="tb-menu__title">{t("notifications.title")}</span>
              {mediumNews.length > 0 && (
                <button
                  type="button"
                  className="tb-menu__markall"
                  disabled={!mediumNews.some((n) => seenNewsLinks && !seenNewsLinks.has(n.link))}
                  onClick={onMarkAllNewsRead}
                >
                  {t("notifications.markAllRead")}
                </button>
              )}
            </div>
            {mediumNews.length === 0 ? (
              <span className="tb-menu__empty">{t("news.empty")}</span>
            ) : (
              // ВСЕ новости (не только 5): бейдж считается по всем unread,
              // скрытые строки держали бы точку «горящей» вечно
              mediumNews.map((item) => (
                <button
                  key={item.link}
                  type="button"
                  role="menuitem"
                  className="tb-menu__item tb-menu__item--news"
                  onClick={() => {
                    setOpenMenu(null);
                    onOpenNews && onOpenNews(item);
                  }}
                >
                  <span
                    className={`tb-menu__notif-dot ${seenNewsLinks && !seenNewsLinks.has(item.link) ? "is-important" : ""}`}
                    aria-hidden="true"
                  />
                  <span className="tb-menu__news-body">
                    <span className="tb-menu__news-title">{item.title}</span>
                    <span className="tb-menu__news-meta">
                      {t(`home.tech.${item.techId}`)} · {item.author}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {user ? (
          // Авторизован: монограмма + меню (Профиль, Settings, Log out)
          <div className="tb-menu-wrap" ref={accountRef}>
            <button
              className="avatar avatar--user"
              type="button"
              aria-label={t("header.account")}
              aria-haspopup="true"
              aria-expanded={openMenu === "account"}
              onClick={() => setOpenMenu((m) => (m === "account" ? null : "account"))}
            >
              <span className="avatar-dot avatar-dot--sm" style={{ background: `linear-gradient(135deg, hsl(${nameHue} 45% 32%), hsl(${nameHue} 55% 18%))` }}>
                {user.charAt(0).toUpperCase()}
              </span>
            </button>
            <div className="tb-menu tb-menu--account" role="menu" hidden={openMenu !== "account"}>
              <div className="tb-menu__user">
                <strong>{user}</strong>
                {userEmail && <span>{userEmail}</span>}
              </div>
              <button
                type="button"
                role="menuitem"
                className="tb-menu__item"
                onClick={() => {
                  onNavigate("profile");
                  setOpenMenu(null);
                }}
              >
                {t("account.profile")}
              </button>
              <button
                type="button"
                role="menuitem"
                className="tb-menu__item"
                onClick={() => {
                  onNavigate("settings");
                  setOpenMenu(null);
                }}
              >
                {t("sidebar.settings")}
              </button>
              <button
                type="button"
                role="menuitem"
                className="tb-menu__item tb-menu__item--danger"
                onClick={() => {
                  setOpenMenu(null);
                  onLogout();
                }}
              >
                {t("account.logout")}
              </button>
            </div>
          </div>
        ) : (
          // Гость: Log in (ghost) + Sign up free (primary) — модалка в соответствующем режиме
          <div className="auth">
            <button type="button" className="auth__login" onClick={() => onAuth("login")}>
              {t("header.login")}
            </button>
            <button type="button" className="btn btn--primary auth__signup" onClick={() => onAuth("signup")}>
              {t("header.signup")}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
