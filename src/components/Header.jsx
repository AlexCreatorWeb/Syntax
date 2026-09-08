import { useState, useEffect, useRef, useMemo } from "react";
import { useLanguage } from "../context/useLanguage";
import { UI_LANGUAGES } from "../context/uiLanguages";
import { useT } from "../i18n/useT";
import { NAV_GROUPS, NAV_BOTTOM, NAV_ICONS } from "./nav-data";
import { useAvatar } from "../lib/avatar";
import { getCompleted } from "../lib/progress";
import { translateText } from "../lib/translate";

// Заголовок новости в дропдауне: перевод на язык платформы (фидбек 2026-09:
// «не понимаю что за новость» — RSS-заголовки EN). Цепочка translate.js с
// кэшем на сессию; сбой/EN — оригинал (тихий фолбэк, UI никогда не ломается).
function NewsTitle({ title }) {
  const { langCode } = useLanguage();
  // {title, lang, value} — перевод валиден только для той пары title+lang,
  // на которую он запрашивался (иначе старый перевод «плывёт» за другим
  // заголовком). Без sync-setState в effect (react-compiler).
  const [translated, setTranslated] = useState(null);
  useEffect(() => {
    let alive = true;
    if (!title || langCode === "en") return undefined;
    translateText(title, langCode).then((v) => {
      if (alive && v) setTranslated({ title, lang: langCode, value: v });
    });
    return () => {
      alive = false;
    };
  }, [title, langCode]);
  const ok =
    translated && translated.title === title && translated.lang === langCode;
  return <>{ok ? translated.value : title}</>;
}

// Универсальный хедер: логотип (→ главная) + язык / тема / уведомления / аккаунт.
// Лого всегда оригинальный Syntax (тех-лого живёт на странице технологии — UX-фидбек);
// таб-специфичный контент (заголовки, поиски) — внутри вьюх.
function Header({
  onToggleTheme,
  onNavigate,
  onAuth,
  onLogout,
  user = null,
  userEmail = null,
  mediumNews = [],
  seenNewsLinks,
  onOpenNews,
  onMarkAllNewsRead,
  activeTab = null,
  guest = false,
  onExitGuest,
  dbLessons = null,
  activeTech = null,
}) {
  const { lang, selectLanguage } = useLanguage();
  const t = useT();
  const [avatarUrl] = useAvatar(); // загруженное фото (если есть — вместо монограммы)
  const [isOpen, setIsOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null); // "notif" | "account" | null
  const [menuOpen, setMenuOpen] = useState(false); // мобильное burger-меню (≤640px)
  const langRef = useRef(null);
  const notifRef = useRef(null);
  const accountRef = useRef(null);
  const guestRef = useRef(null);

  // Hue монограммы-аватара — детерминированно от имени (паттерн аватаров платформы)
  const nameHue = useMemo(() => {
    let h = 0;
    const s = user || "";
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
    return h;
  }, [user]);

  // Кольцо прогресса вокруг аватарки (паттерн Udemy, фидбек 2026-09): процент
  // выполненных уроков АКТИВНОГО трека. Нет трека/уроков — кольцо не рендерится.
  const ring = (() => {
    if (!user && !guest) return null;
    if (!dbLessons || !dbLessons.length || !activeTech) return null;
    const total = dbLessons.filter((l) => l.tech === activeTech).length;
    if (!total) return null;
    const done = Math.min(total, getCompleted(activeTech).length);
    return { pct: Math.round((done / total) * 100), done, total };
  })();

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
      if (guestRef.current && !guestRef.current.contains(event.target)) {
        setOpenMenu((m) => (m === "guest" ? null : m));
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen((prevOpen) => {
          if (prevOpen) {
            // Возвращаем фокус на кнопку-тоггл при закрытии через Escape
            langRef.current?.querySelector(".lang__toggle")?.focus();
          }
          return false;
        });
        setOpenMenu(null);
        setMenuOpen(false);
      }
      // ⌘K / Ctrl+K — фокус на поиск в Документации
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onNavigate && onNavigate("documentation");
        setTimeout(
          () =>
            window.dispatchEvent(new CustomEvent("syntax-focus-docs-search")),
          60,
        );
      }
    };

    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onNavigate]);

  return (
    <>
      <header className="topbar">
        <div className="topbar__left">
          {/* Лого всегда оригинальное, клик — всегда на главную (тех-лого не дублируем) */}
          <button
            type="button"
            className="brand brand--link"
            onClick={() => onNavigate && onNavigate("home")}
            aria-label={t("header.home")}
          >
            {/* Иконка-логотип «</>» (референс «Новый стиль карточек нейронок») */}
            <svg
              className="brand__mark"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m8 8-4.5 4L8 16" />
              <path d="m16 8 4.5 4L16 16" />
              <path d="M13.5 5.5 10.5 18.5" />
            </svg>
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
                    className={`lang__item ${isActive ? "is-active" : ""}`}
                    type="button"
                    role="menuitem"
                    onClick={() => handleSelectLang(item.code)}
                  >
                    <span className="lang__code-badge" aria-hidden="true">
                      {item.label}
                    </span>{" "}
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
              onClick={() =>
                setOpenMenu((m) => (m === "notif" ? null : "notif"))
              }
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
                hidden={
                  !mediumNews.some(
                    (n) => seenNewsLinks && !seenNewsLinks.has(n.link),
                  )
                }
              />
            </button>
            <div
              className="tb-menu tb-menu--notif"
              role="menu"
              hidden={openMenu !== "notif"}
            >
              <div className="tb-menu__head">
                <span className="tb-menu__title">
                  {t("notifications.title")}
                </span>
                {mediumNews.length > 0 && (
                  <button
                    type="button"
                    className="tb-menu__markall"
                    disabled={
                      !mediumNews.some(
                        (n) => seenNewsLinks && !seenNewsLinks.has(n.link),
                      )
                    }
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
                    {item.image && (
                      <img
                        className="tb-menu__news-img"
                        src={item.image}
                        alt=""
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                    <span className="tb-menu__news-body">
                      <span className="tb-menu__news-title">
                        <NewsTitle title={item.title} />
                      </span>
                      {item.summary && (
                        <span className="tb-menu__news-summary">
                          {item.summary}
                        </span>
                      )}
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
                onClick={() =>
                  setOpenMenu((m) => (m === "account" ? null : "account"))
                }
                title={
                  ring
                    ? t("sidebar.progressCount", {
                        n: ring.done,
                        m: ring.total,
                      })
                    : undefined
                }
              >
                <span className={`avatar-progress${ring ? " is-on" : ""}`}>
                  <span
                    className={`avatar-dot avatar-dot--sm${avatarUrl ? " avatar-dot--img" : ""}`}
                    style={
                      avatarUrl
                        ? { backgroundImage: `url(${avatarUrl})` }
                        : {
                            background: `linear-gradient(135deg, hsl(${nameHue} 45% 32%), hsl(${nameHue} 55% 18%))`,
                          }
                    }
                  >
                    {!avatarUrl && user.charAt(0).toUpperCase()}
                  </span>
                  {ring && (
                    <svg
                      className="avatar-progress__ring"
                      viewBox="0 0 100 100"
                      aria-hidden="true"
                    >
                      <circle
                        className="avatar-progress__bg"
                        cx="50"
                        cy="50"
                        r="50"
                      />
                      <circle
                        className="avatar-progress__fg"
                        cx="50"
                        cy="50"
                        r="50"
                        strokeDasharray={`${(ring.pct / 100) * 314.16} 314.16`}
                      />
                    </svg>
                  )}
                </span>
              </button>
              <div
                className="tb-menu tb-menu--account"
                role="menu"
                hidden={openMenu !== "account"}
              >
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
            // Гость: (гостевая сессия — чип + меню) + Log in (ghost) + Sign up free
            <div className="auth">
              {guest && (
                <div className="tb-menu-wrap" ref={guestRef}>
                  <button
                    type="button"
                    className="guest-chip"
                    aria-haspopup="true"
                    aria-expanded={openMenu === "guest"}
                    aria-label={t("header.guest")}
                    onClick={() =>
                      setOpenMenu((m) => (m === "guest" ? null : "guest"))
                    }
                  >
                    {t("header.guest")}
                  </button>
                  <div
                    className="tb-menu tb-menu--guest"
                    role="menu"
                    hidden={openMenu !== "guest"}
                  >
                    <div className="tb-menu__user">
                      <strong>{t("header.guest")}</strong>
                      <span>{t("header.guestNote")}</span>
                    </div>
                    <button
                      type="button"
                      role="menuitem"
                      className="tb-menu__item tb-menu__item--danger"
                      onClick={() => {
                        setOpenMenu(null);
                        onExitGuest && onExitGuest();
                      }}
                    >
                      {t("header.guestEnd")}
                    </button>
                  </div>
                </div>
              )}
              <button
                type="button"
                className="auth__login"
                onClick={() => onAuth("login")}
              >
                {t("header.login")}
              </button>
              <button
                type="button"
                className="btn btn--primary auth__signup"
                onClick={() => onAuth("signup")}
              >
                {/* Аудит C3 (≤480): «Sign up free» не влезает — короткий вариант */}
                <span className="auth__signup-label auth__signup-label--full">
                  {t("header.signup")}
                </span>
                <span className="auth__signup-label auth__signup-label--short">
                  {t("header.signupShort")}
                </span>
              </button>
            </div>
          )}
          {/* Мобильное меню: бургер — в САМЫЙ ПРАВЫЙ край хедера (фидбек 2026-09), виден только на ≤640px */}
          <button
            type="button"
            className="menu-toggle"
            aria-label={t("header.menu")}
            aria-haspopup="true"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Мобильное меню (≤640px): тот же набор пунктов, что и сайдбар, но с подписями и группами.
        Открывается бургером; закрывается — пунктом, фоном или Esc. */}
      {menuOpen && (
        <div className="mobile-menu">
          <div
            className="mobile-menu__backdrop"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <nav className="mobile-menu__panel" aria-label={t("header.menu")}>
            <div className="mobile-menu__head">
              <svg
                className="brand__mark brand__mark--sm"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m8 8-4.5 4L8 16" />
                <path d="m16 8 4.5 4L16 16" />
                <path d="M13.5 5.5 10.5 18.5" />
              </svg>
              <span className="brand__word">
                Syn<span className="brand__accent">tax</span>
              </span>
              <button
                type="button"
                className="icon-btn icon-btn--sm"
                aria-label={t("header.menuClose")}
                onClick={() => setMenuOpen(false)}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
            {/* UX-аудит 2026-09: колокольчик на мобилке не было нигде —
                уведомления доступны из drawer (счётчик непрочитанных) */}
            <button
              type="button"
              className="mobile-menu__item"
              onClick={() => {
                const unread = mediumNews.find(
                  (n) => seenNewsLinks && !seenNewsLinks.has(n.link),
                );
                onOpenNews && onOpenNews(unread || mediumNews[0]);
                setMenuOpen(false);
              }}
              disabled={mediumNews.length === 0}
            >
              <span className="mobile-menu__icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                </svg>
              </span>
              {t("notifications.title")}
              <span className="mobile-menu__badge">
                {
                  mediumNews.filter(
                    (n) => seenNewsLinks && !seenNewsLinks.has(n.link),
                  ).length
                }
              </span>
            </button>
            {NAV_GROUPS.map((group) => (
              <div className="mobile-menu__group" key={group.id}>
                <span className="mobile-menu__group-label">
                  {t(
                    `sidebar.group${group.id[0].toUpperCase()}${group.id.slice(1)}`,
                  )}
                </span>
                {group.items.map((id) => (
                  <button
                    key={id}
                    type="button"
                    className={`mobile-menu__item ${activeTab === id ? "is-active" : ""}`}
                    onClick={() => {
                      onNavigate && onNavigate(id);
                      setMenuOpen(false);
                    }}
                  >
                    <span className="mobile-menu__icon" aria-hidden="true">
                      {NAV_ICONS[id]}
                    </span>
                    {t(`sidebar.${id}`)}
                  </button>
                ))}
              </div>
            ))}
            <div className="mobile-menu__group">
              {NAV_BOTTOM.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={`mobile-menu__item ${activeTab === id ? "is-active" : ""}`}
                  onClick={() => {
                    onNavigate && onNavigate(id);
                    setMenuOpen(false);
                  }}
                >
                  <span className="mobile-menu__icon" aria-hidden="true">
                    {NAV_ICONS[id]}
                  </span>
                  {t(`sidebar.${id}`)}
                </button>
              ))}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}

export default Header;
