import { useState } from "react";
import { useT } from "../../i18n/useT";

// Правый сайдбар вкладки Documentation (монтируется во внешнюю rail)
function DocsAside() {
  const t = useT();
  const tocItems = t("docs.toc");
  const [activeTocIndex, setActiveTocIndex] = useState(0);

  return (
    <>
      <section className="card docs-rail-card">
        <span className="label-caps">{t("docs.tocTitle")}</span>
        <nav className="toc" aria-label="Section navigation">
          {tocItems.map((item, i) => (
            <a
              key={i}
              href="#"
              className={i === activeTocIndex ? "is-active" : ""}
              onClick={(e) => {
                e.preventDefault();
                setActiveTocIndex(i);
              }}
            >
              {item}
            </a>
          ))}
        </nav>
      </section>
      <section className="card docs-rail-card help-card">
        <span className="label-caps">{t("docs.helpTitle")}</span>
        <p>{t("docs.helpText")}</p>
        <button type="button" className="btn btn--secondary btn--full">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12a8 8 0 0 1-8 8H4l2.5-3A8 8 0 1 1 21 12Z" />
          </svg>
          {t("docs.community")}
        </button>
      </section>
    </>
  );
}

export default DocsAside;
