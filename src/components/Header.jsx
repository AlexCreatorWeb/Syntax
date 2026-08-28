import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/useLanguage';
import { UI_LANGUAGES } from '../context/uiLanguages';
import { useT } from '../i18n/useT';

function Header({ activeTab, onToggleTheme }) {
  const { lang, selectLanguage } = useLanguage();
  const t = useT();
  const [isOpen, setIsOpen] = useState(false);
  const langRef = useRef(null);

  const toggleDropdown = () => setIsOpen((prev) => !prev);

  const handleSelectLang = (code) => {
    selectLanguage(code);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
        if (langRef.current && !langRef.current.contains(event.target)) {
        setIsOpen(false);
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
        }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
    };
    }, []);

  return (
    <header className="topbar">
      <div className="topbar__left">
        <a className="brand" href="#">
          Syn<span>tax</span>
        </a>
      </div>
      {activeTab === "documentation" && (
        <div className="topbar__center">
          <div className="topbar__search">
            <svg
              className="search-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input type="search" placeholder={t("header.searchDocs")} aria-label={t("header.searchDocs")} />
            <span className="search-kbd" aria-hidden="true">
              <kbd>⌘</kbd>
              <kbd>K</kbd>
            </span>
          </div>
        </div>
      )}
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

        <button className="icon-btn" type="button" aria-label={t("header.notifications")}>
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
        </button>

        <button className="avatar" type="button" aria-label={t("header.account")}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6" />
          </svg>
        </button>
      </div>
    </header>
  );
}

export default Header;