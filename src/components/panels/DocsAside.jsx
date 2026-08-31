import { useEffect, useState } from "react";
import { useT } from "../../i18n/useT";

// Правый сайдбар вкладки Documentation (монтируется во внешнюю rail):
// on-page TOC текущей статьи (scrollspy) + help-карточка.
// Контент TOC приходит CustomEvent-ом от DocsView (паттерн community-тегов).
function DocsAside({ onNavigate }) {
  const t = useT();
  const [toc, setToc] = useState(null); // { title, anchors: [{id, text}] }
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    const onToc = (e) => {
      setToc(e.detail);
      setActiveId(null);
    };
    window.addEventListener("syntax-docs-toc", onToc);
    // Просим view переслать TOC: при deep-link aside монтируется позже первого dispatch
    window.dispatchEvent(new CustomEvent("syntax-docs-toc-request"));
    return () => window.removeEventListener("syntax-docs-toc", onToc);
  }, []);

  // Scrollspy: активный заголовок — последний h2, прошедший отметку 120px от верха
  useEffect(() => {
    if (!toc || !toc.anchors.length) return;
    const onScroll = () => {
      let current = toc.anchors[0].id;
      for (const a of toc.anchors) {
        const el = document.getElementById(a.id);
        if (el && el.getBoundingClientRect().top <= 130) current = a.id;
      }
      setActiveId(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [toc]);

  const jump = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      {toc && toc.anchors.length > 0 && (
        <section className="card docs-rail-card">
          <span className="label-caps">{t("docs.tocPage")}</span>
          <p className="docs-rail-card__article">{toc.title}</p>
          <nav className="toc" aria-label="On this page">
            {toc.anchors.map((a) => (
              <button
                key={a.id}
                type="button"
                className={`toc__item ${a.id === activeId ? "is-active" : ""}`}
                onClick={() => jump(a.id)}
              >
                {a.text}
              </button>
            ))}
          </nav>
        </section>
      )}
      <section className="card docs-rail-card help-card">
        <span className="label-caps">{t("docs.helpTitle")}</span>
        <p>{t("docs.helpText")}</p>
        <button type="button" className="btn btn--secondary btn--full" onClick={() => onNavigate && onNavigate("community")}>
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
