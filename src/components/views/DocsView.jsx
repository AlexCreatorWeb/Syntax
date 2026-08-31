import { useEffect, useMemo, useRef, useState } from "react";
import { useT } from "../../i18n/useT";
import TECHS from "../../lib/techs";
import { getTech } from "../../lib/techs";

const TRACK_LOGOS = Object.fromEntries(TECHS.map((tc) => [tc.id, tc.Logo]));

/* ————— Подсветка Python (лёгкий regex-токенайзер; код в доках — статика) ————— */
const PY_TOKEN =
  /(#[^\n]*)|("""[\s\S]*?"""|f?["'][^"'\n]*["'])|\b(def|return|if|elif|else|for|in|while|try|except|finally|raise|import|from|as|class|with|and|or|not|is|None|True|False|pass|lambda|async|await|yield|global)\b|(\b\d+(?:\.\d+)?\b)/g;

function highlightPy(code) {
  const out = [];
  let last = 0;
  let m;
  let k = 0;
  PY_TOKEN.lastIndex = 0;
  while ((m = PY_TOKEN.exec(code))) {
    if (m.index > last) out.push(code.slice(last, m.index));
    const cls = m[1] ? "tok-comment" : m[2] ? "tok-string" : m[3] ? "tok-keyword" : "tok-number";
    out.push(
      <span key={k++} className={cls}>
        {m[0]}
      </span>
    );
    last = m.index + m[0].length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}

function CodeBlock({ code, t }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* headless/permissions — toast всё равно показываем (демо) */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <div className="code-block">
      <div className="code-block__bar">
        <span className="code-chip">python 3.9+</span>
        <button type="button" className="code-block__copy" onClick={copy} aria-label={t("docs.copy")}>
          {copied ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m5 13 4 4L19 7" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="9" y="9" width="12" height="12" rx="2" />
              <path d="M5 15V5a2 2 0 0 1 2-2h10" />
            </svg>
          )}
          {copied ? t("docs.copied") : t("docs.copy")}
        </button>
      </div>
      <pre className="code-block__pre">
        <code>{highlightPy(code)}</code>
      </pre>
    </div>
  );
}

function Callout({ kind, text }) {
  const labels = { tip: "Tip", note: "Note", warning: "Warning" };
  return (
    <div className={`callout callout--${kind}`}>
      <span className="callout__label">{labels[kind]}</span>
      <p className="callout__text">{text}</p>
    </div>
  );
}

/* ————— Детальная страница статьи ————— */
function ArticleView({ article, prev, next, t }) {
  const [helpful, setHelpful] = useState(null);
  return (
    <article className="docs-article">
      <nav className="docs-breadcrumb" aria-label="Breadcrumb">
        <a href="#/documentation">{t("docs.breadcrumb")}</a>
        <span className="docs-breadcrumb__sep" aria-hidden="true">/</span>
        <span>Python</span>
        <span className="docs-breadcrumb__sep" aria-hidden="true">/</span>
        <span className="docs-breadcrumb__current">{article.title}</span>
      </nav>
      <h1 className="docs-article__title">{article.title}</h1>
      <div className="docs-article__meta">
        <span>{t("docs.minRead", { n: article.minutes })}</span>
        <span aria-hidden="true">·</span>
        <span>{t("docs.updated", { date: article.updated })}</span>
        <span className="code-chip">python 3.9+</span>
      </div>
      <div className="docs-article__body">
        {article.body.map((block, i) => {
          if (block.type === "h2") {
            return (
              <h2 key={i} id={`h-${i}`} className="docs-article__h2">
                {block.text}
              </h2>
            );
          }
          if (block.type === "code") return <CodeBlock key={i} code={block.text} t={t} />;
          if (block.type === "callout") return <Callout key={i} kind={block.kind} text={block.text} t={t} />;
          return <p key={i}>{block.text}</p>;
        })}
      </div>

      {prev || next ? (
        <nav className="docs-prevnext" aria-label="Article navigation">
          {prev ? (
            <a className="card docs-prevnext__item" href={`#/documentation/${prev.slug}`}>
              <span className="docs-prevnext__dir">← {t("docs.breadcrumb")}</span>
              <strong>{prev.title}</strong>
            </a>
          ) : (
            <span className="docs-prevnext__item docs-prevnext__item--empty" aria-hidden="true" />
          )}
          {next ? (
            <a className="card docs-prevnext__item docs-prevnext__item--next" href={`#/documentation/${next.slug}`}>
              <span className="docs-prevnext__dir">{t("docs.breadcrumb")} →</span>
              <strong>{next.title}</strong>
            </a>
          ) : (
            <span className="docs-prevnext__item docs-prevnext__item--empty" aria-hidden="true" />
          )}
        </nav>
      ) : null}

      <div className="docs-helpful">
        {helpful === null ? (
          <>
            <span className="docs-helpful__q">{t("docs.helpful")}</span>
            <div className="docs-helpful__btns">
              <button type="button" className="btn btn--ghost" onClick={() => setHelpful("yes")} aria-label={t("docs.yes")}>
                👍
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => setHelpful("no")} aria-label={t("docs.no")}>
                👎
              </button>
            </div>
          </>
        ) : (
          <span className="docs-helpful__thanks">{t("docs.thanks")}</span>
        )}
      </div>
    </article>
  );
}

/* ————— Empty state: трек без статей ————— */
function TrackEmpty({ tech, t, onSwitchToPython }) {
  const [notified, setNotified] = useState(false);
  const Logo = TRACK_LOGOS[tech.id];
  return (
    <div className="docs-empty card">
      <span className="docs-empty__logo" aria-hidden="true">
        {Logo ? <Logo /> : null}
      </span>
      <h2 className="docs-empty__title">{t("docs.emptyTitle", { tech: t(tech.label) })}</h2>
      <p className="docs-empty__body">{t("docs.emptyBody", { tech: t(tech.label) })}</p>
      <div className="docs-empty__progress">
        <div className="docs-empty__bar">
          <span style={{ width: "25%" }} />
        </div>
        <span className="docs-empty__pct">{t("docs.emptyProgress", { a: 3, b: 12 })}</span>
      </div>
      <div className="docs-empty__actions">
        <button
          type="button"
          className={`btn ${notified ? "btn--secondary" : "btn--primary"}`}
          aria-pressed={notified}
          onClick={() => setNotified(true)}
        >
          {notified ? t("docs.notified") : t("docs.notify")}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onSwitchToPython}>
          {t("docs.meanwhile")}
        </button>
      </div>
    </div>
  );
}

function DocsView({ routeParam, activeTech }) {
  const t = useT();
  const articles = useMemo(() => t("docs.articles") || [], [t]);

  // Трек документации: по умолчанию активный трек пользователя; без статей — Python (полная база)
  const techsWithDocs = useMemo(() => new Set(["python"]), []);
  const [docsTech, setDocsTech] = useState(() => {
    const def = activeTech && activeTech !== "none" ? activeTech : "python";
    return techsWithDocs.has(def) ? def : "python";
  });

  // Статья из deep-link #/documentation/<slug>
  const slug = typeof routeParam === "string" && routeParam.startsWith("py-") ? routeParam : null;
  const current = slug ? articles.find((a) => a.slug === slug) : null;
  const currentIdx = current ? articles.indexOf(current) : -1;
  const prev = currentIdx > 0 ? articles[currentIdx - 1] : null;
  const next = currentIdx > -1 && currentIdx < articles.length - 1 ? articles[currentIdx + 1] : null;

  // Правый рейл: on-page TOC текущей статьи (CustomEvent — DocsAside, паттерн community-тегов).
  //Aside может смонтироваться ПОСЛЕ первого dispatch (deep-link) — просит повтор через request-событие
  const tocDetail = useMemo(() => {
    if (!current) return null;
    const anchors = current.body
      .map((b, i) => (b.type === "h2" ? { id: `h-${i}`, text: b.text } : null))
      .filter(Boolean);
    return { title: current.title, anchors };
  }, [current]);

  useEffect(() => {
    const send = () => window.dispatchEvent(new CustomEvent("syntax-docs-toc", { detail: tocDetail }));
    send();
    window.addEventListener("syntax-docs-toc-request", send);
    return () => window.removeEventListener("syntax-docs-toc-request", send);
  }, [tocDetail]);

  // Скролл наверх при открытии статьи
  useEffect(() => {
    if (current) window.scrollTo(0, 0);
  }, [current, slug]);

  // Живой поиск по базе знаний
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);

  // ⌘K / Ctrl+K — фокус на поиск (событие шлёт Header)
  useEffect(() => {
    const focus = () => searchRef.current?.focus();
    window.addEventListener("syntax-focus-docs-search", focus);
    return () => window.removeEventListener("syntax-focus-docs-search", focus);
  }, []);
  const q = query.trim().toLowerCase();
  const searchResults = q
    ? articles
        .map((a) => ({ a, hit: (a.title + " " + a.desc + " " + a.body.map((b) => b.text || "").join(" ")).toLowerCase().includes(q) }))
        .filter((x) => x.hit)
        .slice(0, 6)
        .map((x) => x.a)
    : [];

  const mark = (text) => {
    const i = text.toLowerCase().indexOf(q);
    if (i < 0) return text;
    return (
      <>
        {text.slice(0, i)}
        <mark>{text.slice(i, i + q.length)}</mark>
        {text.slice(i + q.length)}
      </>
    );
  };

  // Дерево разделов (левая колонка): две категории
  const refArticles = articles.filter((a) => a.cat === "ref");
  const guideArticles = articles.filter((a) => a.cat === "guide");
  const [openCats, setOpenCats] = useState({ ref: true, guide: true });
  const tech = getTech(docsTech);

  const categories = [
    { id: "ref", label: t("docs.referenceTitle"), items: refArticles },
    { id: "guide", label: t("docs.guidesTitle"), items: guideArticles },
  ];

  return (
    <div className="docs-view">
      {/* Hero: заголовок + селектор трека (тех-пилюли, по умолчанию — активный трек) */}
      <header className="page-head docs-hero">
        <div>
          <h1 className="page-head__title">{t("docs.title")}</h1>
          <p className="page-head__desc">{t("docs.desc")}</p>
        </div>
        <div className="docs-for">
          <span className="label-caps docs-for__label">{t("docs.forTrack")}</span>
          <div className="tech-switch" role="tablist" aria-label={t("docs.forTrack")}>
            {TECHS.map((tc) => {
              const Logo = TRACK_LOGOS[tc.id];
              const has = tc.id === "python";
              return (
                <button
                  key={tc.id}
                  type="button"
                  role="tab"
                  aria-selected={docsTech === tc.id}
                  className={`tech-switch__item ${docsTech === tc.id ? "tech-switch__item--active" : ""}`}
                  title={has ? t(tc.label) : t("docs.emptyTitle", { tech: t(tc.label) })}
                  onClick={() => {
                    setDocsTech(tc.id);
                    // Смена трека сбрасывает открытую статью (она из Python-базы)
                    if (slug) window.location.hash = "#/documentation";
                  }}
                >
                  <span className="tech-switch__icon-glyph">
                    <Logo />
                  </span>
                  <span className="tech-switch__name">{t(tc.label)}</span>
                  {!has && (
                    <span className="tech-switch__soon-badge">Soon</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Живой поиск по базе знаний */}
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
            value={query}
            placeholder={t("header.searchDocs")}
            aria-label={t("header.searchDocs")}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setQuery("");
                setSearchOpen(false);
                e.currentTarget.blur();
              }
            }}
          />
          <span className="search-kbd" aria-hidden="true">
            <kbd>⌘</kbd>
            <kbd>K</kbd>
          </span>
          {searchOpen && q && (
            <div className="docs-search-drop" role="listbox">
              {searchResults.length === 0 ? (
                <div className="docs-search-drop__empty">
                  <strong>{t("docs.noResults", { q: query.trim() })}</strong>
                </div>
              ) : (
                <>
                  <span className="docs-search-drop__count">{t("docs.resultsCount", { n: searchResults.length })}</span>
                  {searchResults.map((a) => (
                    <a
                      key={a.slug}
                      className="docs-search-drop__item"
                      href={`#/documentation/${a.slug}`}
                      onMouseDown={() => {
                        setQuery("");
                        setSearchOpen(false);
                      }}
                    >
                      <strong>{mark(a.title)}</strong>
                      <span>{mark(a.desc)}</span>
                    </a>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {current ? (
        /* Статья: дерево | статья (правый on-page TOC — во внешнем рейле через DocsAside) */
        <div className="docs-layout docs-layout--article">
          <nav className="docs-tree" aria-label="Documentation sections">
            {categories.map((cat) => (
              <div key={cat.id} className="docs-tree__cat">
                <button
                  type="button"
                  className="docs-tree__cat-btn"
                  aria-expanded={openCats[cat.id]}
                  onClick={() => setOpenCats((prev) => ({ ...prev, [cat.id]: !prev[cat.id] }))}
                >
                  <span>{cat.label}</span>
                  <svg
                    className={`docs-tree__chev ${openCats[cat.id] ? "is-open" : ""}`}
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
                {openCats[cat.id] && (
                  <div className="docs-tree__items">
                    {cat.items.map((a) => (
                      <a
                        key={a.slug}
                        href={`#/documentation/${a.slug}`}
                        className={`docs-tree__item ${a.slug === current.slug ? "is-active" : ""}`}
                        aria-current={a.slug === current.slug ? "page" : undefined}
                      >
                        {a.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
          <div className="docs-main">
            <ArticleView article={current} prev={prev} next={next} t={t} />
          </div>
        </div>
      ) : techsWithDocs.has(docsTech) ? (
        /* Обзор Python: гайды (Read Guide → deep-link) + справочная библиотека */
        <div className="docs-main">
          <section>
            <h2 className="section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m12 3 2.7 5.8 6.3.8-4.6 4.3 1.2 6.1L12 17l-5.6 3 1.2-6.1L3 9.6l6.3-.8L12 3Z" />
              </svg>
              {t("docs.guidesTitle")}
            </h2>
            <div className="guides-grid">
              {guideArticles.map((guide, i) => (
                <a key={guide.slug} className="card guide-card" href={`#/documentation/${guide.slug}`}>
                  <span className="guide-card__icon">{GUIDE_ICONS[i % GUIDE_ICONS.length]}</span>
                  <h3 className="guide-card__title">{guide.title}</h3>
                  <p className="guide-card__desc">{guide.desc}</p>
                  <span className="guide-card__read">
                    {t("docs.readGuide")}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </span>
                </a>
              ))}
            </div>
          </section>

          <ReferenceLibrary t={t} articles={refArticles} />
        </div>
      ) : (
        /* Трек без статей */
        <TrackEmpty tech={tech} t={t} onSwitchToPython={() => setDocsTech("python")} />
      )}
    </div>
  );
}

/* ————— Справочная библиотека (обзорная страница): секции → статьи ————— */
function ReferenceLibrary({ t, articles }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = articles[activeIndex];

  return (
    <section className="card reference">
      <header className="reference__head">
        <h2 className="reference__title">{t("docs.referenceTitle")}</h2>
      </header>
      <div className="reference__body">
        <nav className="reference__nav" aria-label="Reference sections">
          {articles.map((section, i) => (
            <button
              key={section.slug}
              type="button"
              className={`reference__nav-item ${i === activeIndex ? "is-active" : ""}`}
              onClick={() => setActiveIndex(i)}
            >
              {section.title}
            </button>
          ))}
        </nav>
        <div className="reference__content">
          {active && (
            <>
              <div className="reference__doc-head">
                <h3 className="reference__doc-title">{active.title}</h3>
                <span className="code-chip">python 3.9+</span>
              </div>
              <p className="reference__doc-desc">{active.desc}</p>
              {(() => {
                const codeBlock = (active.body || []).find((b) => b.type === "code");
                return codeBlock ? <CodeBlock code={codeBlock.text} t={t} /> : null;
              })()}
              <a className="read-link reference__open" href={`#/documentation/${active.slug}`}>
                {t("docs.readGuide")}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </a>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

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

export default DocsView;
