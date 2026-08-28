import { useEffect, useRef, useState } from "react";
import { useT } from "../../i18n/useT";

const GUIDE_ICONS = [
  (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="m8 10 2.5 2L8 14M13 14h4" />
    </svg>
  ),
  (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" />
      <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" />
    </svg>
  ),
  (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    </svg>
  ),
  (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 3v18M15 9v12" />
    </svg>
  ),
];

function ReadGuideLink({ t }) {
  return (
    <a className="read-link" href="#">
      {t("docs.readGuide")}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </a>
  );
}

// Код-примеры для секций справочника (коды не локализуем)
const REF_CODE = [
  `# Базовые типы\nx = 10          # int\nname = "Ada"    # str\nok = True       # bool\npi = 3.14       # float\n\n# Структуры\nnums = [1, 2, 3]       # list\npoint = (3, 4)         # tuple\nsizes = {1, 2, 3}      # set\nuser = {"name": "Ada"}  # dict`,
  `def add(a, b, *, verbose=False):\n    """Сумма двух чисел."""\n    if verbose:\n        print(a, "+", b)\n    return a + b\n\n# Область видимости (LEGB)\ntotal = 0  # global\nprint(add(2, 3, verbose=True))`,
  `# Импорт модулей\nimport json\nfrom pathlib import Path\n\n# Пакеты: syntax/core, syntax/utils\nfrom syntax.core import engine\n\nprint(engine.version)`,
  `def parse_int(text, fallback=0):\n    try:\n        return int(text)\n    except ValueError:\n        print(f"Не удалось разобрать: {text!r}")\n        return fallback\n\nprint(parse_int("42"))   # 42\nprint(parse_int("один")) # 0`,
];

function ReferenceLibrary({ t }) {
  const sections = t("docs.refNav");
  const sectionDocs = t("docs.refSections");
  const [activeIndex, setActiveIndex] = useState(0);
  const active = sectionDocs[activeIndex] || { title: "", desc: "" };

  return (
    <section className="card reference">
      <header className="reference__head">
        <h2 className="reference__title">{t("docs.referenceTitle")}</h2>
      </header>
      <div className="reference__body">
        <nav className="reference__nav" aria-label="Reference sections">
          {sections.map((section, i) => (
            <button
              key={i}
              type="button"
              className={`reference__nav-item ${i === activeIndex ? "is-active" : ""}`}
              onClick={() => setActiveIndex(i)}
            >
              {section}
            </button>
          ))}
        </nav>
        <div className="reference__content">
          <div className="reference__doc-head">
            <h3 className="reference__doc-title">{active.title}</h3>
            <span className="code-chip">python 3.9+</span>
          </div>
          <p className="reference__doc-desc">{active.desc}</p>
          <pre className="code">
            <code>{REF_CODE[activeIndex]}</code>
          </pre>
        </div>
      </div>
    </section>
  );
}

function DocsView() {
  const t = useT();
  const guides = t("docs.guides");
  const searchRef = useRef(null);

  // ⌘K / Ctrl+K — фокус на поиск (событие шлёт Header)
  useEffect(() => {
    const focus = () => searchRef.current?.focus();
    window.addEventListener("syntax-focus-docs-search", focus);
    return () => window.removeEventListener("syntax-focus-docs-search", focus);
  }, []);

  return (
    <div className="docs-view">
      <header className="page-head">
        <h1 className="page-head__title">{t("docs.title")}</h1>
        <p className="page-head__desc">{t("docs.desc")}</p>
      </header>

      <div className="docs__search-wrap">
        <div className="docs__search">
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
          <input
            ref={searchRef}
            type="search"
            placeholder={t("header.searchDocs")}
            aria-label={t("header.searchDocs")}
          />
          <span className="search-kbd" aria-hidden="true">
            <kbd>⌘</kbd>
            <kbd>K</kbd>
          </span>
        </div>
      </div>

      <div className="docs-layout">
        <div className="docs-main">
          <section>
            <h2 className="section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m12 3 2.7 5.8 6.3.8-4.6 4.3 1.2 6.1L12 17l-5.6 3 1.2-6.1L3 9.6l6.3-.8L12 3Z" />
              </svg>
              {t("docs.guidesTitle")}
            </h2>
            <div className="guides-grid">
              {guides.map((guide, i) => (
                <article key={i} className="card guide-card">
                  <span className="guide-card__icon">{GUIDE_ICONS[i]}</span>
                  <h3 className="guide-card__title">{guide.title}</h3>
                  <p className="guide-card__desc">{guide.desc}</p>
                  <ReadGuideLink t={t} />
                </article>
              ))}
            </div>
          </section>

          <ReferenceLibrary t={t} />
        </div>
      </div>
    </div>
  );
}

export default DocsView;
