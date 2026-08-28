import { useState, useEffect, useRef } from 'react';

// Прямой импорт только 5 нужных SVG
import flagGb from 'flag-icons/flags/4x3/gb.svg';
import flagRu from 'flag-icons/flags/4x3/ru.svg';
import flagUa from 'flag-icons/flags/4x3/ua.svg';
import flagEs from 'flag-icons/flags/4x3/es.svg';
import flagDe from 'flag-icons/flags/4x3/de.svg';

const LANGUAGES = [
  { code: 'en', flagSrc: flagGb, label: 'EN', name: 'English (UK)' },
  { code: 'ru', flagSrc: flagRu, label: 'RU', name: 'Русский' },
  { code: 'uk', flagSrc: flagUa, label: 'UA', name: 'Українська' },
  { code: 'es', flagSrc: flagEs, label: 'ES', name: 'Español' },
  { code: 'de', flagSrc: flagDe, label: 'DE', name: 'Deutsch' },
];

function Header({ onToggleTheme }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(LANGUAGES[0]);
  const langRef = useRef(null);

  const toggleDropdown = () => setIsOpen((prev) => !prev);

  const handleSelectLang = (lang) => {
    setCurrentLang(lang);
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
      <div className="topbar__right">
        <div className="lang" ref={langRef}>
          <button
            className="icon-btn icon-btn--flag lang__toggle"
            type="button"
            aria-haspopup="true"
            aria-expanded={isOpen}
            aria-label={`Change language: ${currentLang.name}`}
            onClick={toggleDropdown}
          >
            <img
              src={currentLang.flagSrc}
              alt=""
              className="lang__flag-img"
              aria-hidden="true"
            />
          </button>

          <div className="lang__menu" role="menu" hidden={!isOpen}>
            {LANGUAGES.map((lang) => {
              const isActive = lang.code === currentLang.code;
              return (
                <button
                  key={lang.code}
                  className={`lang__item ${isActive ? 'is-active' : ''}`}
                  type="button"
                  role="menuitem"
                  onClick={() => handleSelectLang(lang)}
                >
                  <span className="lang__code-badge" aria-hidden="true">
                    {lang.label}
                  </span>{' '}
                  {lang.name}
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
          aria-label="Toggle theme"
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

        <button className="icon-btn" type="button" aria-label="Notifications">
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

        <button className="avatar" type="button" aria-label="Account">
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