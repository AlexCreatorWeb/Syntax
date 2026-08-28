import { useState } from "react";
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

function ReferenceLibrary({ t }) {
  const sections = t("docs.refNav");
  const [activeIndex, setActiveIndex] = useState(0);

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
            <h3 className="reference__doc-title">{t("docs.docTitle")}</h3>
            <span className="code-chip">python 3.9+</span>
          </div>
          <p className="reference__doc-desc">{t("docs.docDesc")}</p>
          <pre className="code">
            <code>
              <span className="tk-cm"># Syntax: {"{key_expr: value_expr for item in iterable}"}</span>
              {"\n\n"}
              <span className="tk-kw">def</span> <span className="tk-fn">process_data</span>(data_list):
              {"\n    "}
              <span className="tk-cm"># Create a mapping of squares for even numbers</span>
              {"\n    "}
              squares_map = {"{"}x: x**<span className="tk-num">2</span> <span className="tk-kw">for</span> x <span className="tk-kw">in</span> data_list <span className="tk-kw">if</span> x % <span className="tk-num">2</span> == <span className="tk-num">0</span>
              {"}"}
              {"\n\n    "}
              <span className="tk-kw">return</span> squares_map
              {"\n\n"}
              <span className="tk-cm"># Output: {"{2: 4, 4: 16, 6: 36}"}</span>
              {"\n"}
              result = <span className="tk-fn">process_data</span>([<span className="tk-num">1</span>, <span className="tk-num">2</span>, <span className="tk-num">3</span>, <span className="tk-num">4</span>, <span className="tk-num">5</span>, <span className="tk-num">6</span>])
              {"\n"}
              <span className="tk-fn">print</span>(result)
            </code>
          </pre>
        </div>
      </div>
    </section>
  );
}

function DocsView() {
  const t = useT();
  const guides = t("docs.guides");
  const tocItems = t("docs.toc");
  const [activeTocIndex, setActiveTocIndex] = useState(0);

  return (
    <div className="docs-view">
      <header className="page-head">
        <h1 className="page-head__title">{t("docs.title")}</h1>
        <p className="page-head__desc">{t("docs.desc")}</p>
      </header>

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

        <aside className="docs-rail">
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
        </aside>
      </div>
    </div>
  );
}

export default DocsView;
