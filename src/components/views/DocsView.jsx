import { useEffect, useMemo, useRef, useState } from "react";
import { useT } from "../../i18n/useT";
import { useLanguage } from "../../context/useLanguage";
import TECHS from "../../lib/techs";
import { getTech } from "../../lib/techs";
import { formatDocsDate, isMacOS, docsPathFor, DEFAULT_DOCS_TRACK } from "../../lib/docs-route";
import { docsPagesForTrack, docsTracks, docsCountForTrack, ALL_DOC_PAGES } from "../../lib/docs-content";
import { getTaskById, locField } from "../../lib/tasks";

const TRACK_LOGOS = Object.fromEntries(TECHS.map((tc) => [tc.id, tc.Logo]));
// Треки с контентом в src/content/docs/** (остальные — «in development»)
const DOCS_TRACK_SET = docsTracks();
// Контент доков: EN + RU (остальные языки — fallback на EN, как в i18n-конвенции доков)
const docLangFor = (langCode) => (langCode === "ru" ? "ru" : "en");
// Локализация страницы: title/desc/body активного языка, fallback на EN
const localizePage = (p, lang) => ({
  ...p,
  title: (p.title && (p.title[lang] || p.title.en)) || p.id,
  desc: (p.excerpt && (p.excerpt[lang] || p.excerpt.en)) || "",
  body: (p.body && p.body[lang] && p.body[lang].length ? p.body[lang] : p.body.en) || [],
});

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
    const cls = m[1] ? "tok-comment" : m[2] ? "tok-string" : m[3] ? "tok-keyword" : m[4] ? "tok-number" : null;
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

/* ————— Обобщённый подсветчик для остальных языков (комментарии/строки/числа/ключевые) ————— */
const GENERIC_KEYWORDS = {
  js: "const|let|var|function|return|if|else|for|while|of|in|new|class|extends|import|from|export|default|async|await|try|catch|finally|throw|switch|case|break|continue|typeof|instanceof|null|undefined|true|false|this|yield|delete|void|do|static|get|set",
  jsx: "const|let|var|function|return|if|else|for|while|of|in|new|class|extends|import|from|export|default|async|await|try|catch|finally|throw|null|undefined|true|false|this|useState|useEffect|useRef|useMemo|useCallback",
  vue: "const|let|var|function|return|if|else|for|while|of|in|new|import|from|export|default|async|await|ref|reactive|computed|watch|onMounted|nextTick|defineProps|defineEmits|defineExpose|true|false|null",
  bash: "if|then|else|fi|for|do|done|while|function|return|export|local|echo|cd|set|exit|case|esac|node|npm|npx|python|pip|curl",
  sql: "SELECT|FROM|WHERE|AND|OR|NOT|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|INDEX|VIEW|ALTER|DROP|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AS|GROUP|BY|ORDER|HAVING|LIMIT|OFFSET|DISTINCT|UNION|ALL|NULL|IS|IN|LIKE|BETWEEN|EXISTS|WITH|RECURSIVE|CASE|WHEN|THEN|ELSE|END|BEGIN|COMMIT|ROLLBACK|TRANSACTION|SAVEPOINT|PRIMARY|KEY|FOREIGN|REFERENCES|REFERENCES|DEFAULT|CHECK|CONSTRAINT|UNIQUE|CASCADE|RETURNING|COUNT|SUM|AVG|MIN|MAX|OVER|PARTITION|ROW_NUMBER|RANK|LAG|LEAD|EXPLAIN|ANALYZE|GRANT|USING|TO|FOR|TRUE|FALSE|ILIKE|NOT|BETWEEN",
  css: "",
  html: "",
  json: "",
};

function buildGenericTokenizer(lang) {
  const L = (lang || "").toLowerCase();
  if (L === "html" || L === "sfc") {
    return {
      pattern: /(<!--[\s\S]*?-->)|(<\/?[a-zA-Z][\w.-]*|\/?>)|("([^"\n]*")|'([^'\n]*)')|\b(\d+(?:\.\d+)?)\b/g,
      map: (m) => (m[1] ? "tok-comment" : m[2] ? "tok-keyword" : m[3] ? "tok-string" : m[6] ? "tok-number" : null),
    };
  }
  const kws = GENERIC_KEYWORDS[L] || GENERIC_KEYWORDS.js;
  // Комментарные синтаксисы: // и /* */ — у всех; # — shell; -- — SQL/mongosh
  const commentBits = ["//[^\\n]*", "/\\*[\\s\\S]*?\\*\\/"];
  if (L === "bash" || L === "sh") commentBits.push("#[^\\n]*");
  if (L === "sql" || L === "mongodb") commentBits.push("--[^\\n]*");
  const stringBit = '(?:"(?:[^"\\\\\\n]|\\\\.)*"|\'(?:[^\'\\\\\\n]|\\\\.)*\'|`[^`\\n]*`)';
  const keywordBit = kws ? "\\b(?:" + kws + ")\\b" : L === "css" ? "\\b[a-zA-Z-]+(?=\\s*:)" : "";
  const src = "(" + commentBits.join("|") + ")|(" + stringBit + ")|\\b(\\d+(?:\\.\\d+)?)\\b" + (keywordBit ? "|(" + keywordBit + ")" : "");
  const pattern = new RegExp(src, "g");
  return {
    pattern,
    map: (m) => (m[1] ? "tok-comment" : m[2] ? "tok-string" : m[3] ? "tok-number" : m[4] ? "tok-keyword" : null),
  };
}
const TOKENIZER_CACHE = {};
function highlightCode(code, lang) {
  const L = (lang || "").toLowerCase();
  if (L === "python" || L === "py") return highlightPy(code);
  if (!TOKENIZER_CACHE[L]) TOKENIZER_CACHE[L] = buildGenericTokenizer(L);
  const { pattern, map } = TOKENIZER_CACHE[L];
  const out = [];
  let last = 0;
  let m;
  let k = 0;
  pattern.lastIndex = 0;
  while ((m = pattern.exec(code))) {
    if (m.index > last) out.push(code.slice(last, m.index));
    const cls = map(m);
    out.push(
      <span key={k++} className={cls || undefined}>
        {m[0]}
      </span>
    );
    last = m.index + m[0].length;
    if (m.index === pattern.lastIndex) pattern.lastIndex += 1; // защита от пустых матчей
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}

function CodeBlock({ code, lang, version, t }) {
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
        <span className="code-chip">{version}</span>
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
        <code>{highlightCode(code, lang)}</code>
      </pre>
    </div>
  );
}

const CALLOUT_LABELS = { tip: "Tip", note: "Note", warning: "Warning" };
function Callout({ kind, text }) {
  return (
    <div className={`callout callout--${kind}`}>
      <span className="callout__label">{CALLOUT_LABELS[kind]}</span>
      <p className="callout__text">{text}</p>
    </div>
  );
}

/* ————— TOC-анкоры: все h2/h3 статьи (id совпадают с rендером тела) ————— */
const anchorsFor = (article) =>
  article.body
    .map((b, i) =>
      b.type === "h2"
        ? { id: `h-${i}`, text: b.text, level: 2 }
        : b.type === "h3"
          ? { id: `h3-${i}`, text: b.text, level: 3 }
          : null
    )
    .filter(Boolean);

/* Секция, куда вести скролл после поиска: первый заголовок, чей блок содержит запрос */
function sectionForQuery(article, q) {
  let lastId = null;
  for (let i = 0; i < article.body.length; i += 1) {
    const b = article.body[i];
    if (b.type === "h2" || b.type === "h3") {
      if (b.text.toLowerCase().includes(q)) return b.type === "h3" ? `h3-${i}` : `h-${i}`;
      lastId = b.type === "h3" ? `h3-${i}` : `h-${i}`;
    } else if (lastId && (b.text || "").toLowerCase().includes(q)) {
      return lastId;
    }
  }
  return null;
}

// Поиск → «скролл к секции»:-article монтируется после перехода, секцию забирает её effect
let pendingSectionId = null;

/* ————— Детальная страница статьи ————— */
function ArticleView({ article, track, techName, prev, next, prevPosLabel, nextPosLabel, t, onDocsRoute, langCode, onOpenTask }) {
  const feedbackKey = `syntax-docs-feedback-${article.slug}`;
  // Один голос на страницу на клиента: persist в localStorage (после голоса — «thanks»)
  const [helpful, setHelpful] = useState(() => {
    try {
      return localStorage.getItem(feedbackKey) || null;
    } catch {
      return null;
    }
  });
  const vote = (v) => {
    setHelpful(v);
    try {
      localStorage.setItem(feedbackKey, v);
    } catch {
      /* приватный режим — голос живёт до перезагрузки */
    }
  };

  // CTA «Practice this» → связанная задача из раздела Tasks
  const relatedTask = article.relatedTask ? getTaskById(article.relatedTask) : null;

  const anchors = useMemo(() => anchorsFor(article), [article]);

  // Скролл к секции (пришла со поиска)
  useEffect(() => {
    if (!pendingSectionId) return;
    const id = pendingSectionId;
    pendingSectionId = null;
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [article.slug]);

  // Mобилка: TOC — сворачиваемый блок в начале статьи (в rail на десктопе)
  const [tocOpen, setTocOpen] = useState(false);
  const jump = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setTocOpen(false);
  };

  return (
    <article className="docs-article">
      <nav className="docs-breadcrumb" aria-label="Breadcrumb">
        <a href={docsPathFor({ track })} onClick={(e) => { e.preventDefault(); onDocsRoute({ track, page: null }); }}>
          {t("docs.breadcrumb")}
        </a>
        <span className="docs-breadcrumb__sep" aria-hidden="true">/</span>
        <span>{techName}</span>
        <span className="docs-breadcrumb__sep" aria-hidden="true">/</span>
        <span className="docs-breadcrumb__current">{article.title}</span>
      </nav>

      {anchors.length > 0 && (
        <details className="docs-toc-mobile" open={tocOpen} onToggle={(e) => setTocOpen(e.target.open)}>
          <summary>{t("docs.tocPage")}</summary>
          <nav className="toc toc--mobile" aria-label={t("docs.tocPage")}>
            {anchors.map((a) => (
              <button key={a.id} type="button" className={`toc__item ${a.level === 3 ? "toc__item--h3" : ""}`} onClick={() => jump(a.id)}>
                {a.text}
              </button>
            ))}
          </nav>
        </details>
      )}

      <h1 className="docs-article__title">{article.title}</h1>
      <div className="docs-article__meta">
        <span>{t("docs.minRead", { n: article.minutes })}</span>
        <span aria-hidden="true">·</span>
        <span>{t("docs.updated", { date: formatDocsDate(article.updated, langCode) })}</span>
        <span className="code-chip">{article.version}</span>
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
          if (block.type === "h3") {
            return (
              <h3 key={i} id={`h3-${i}`} className="docs-article__h3">
                {block.text}
              </h3>
            );
          }
          if (block.type === "code") return <CodeBlock key={i} code={block.text} lang={block.lang} version={article.version} t={t} />;
          if (block.type === "callout") return <Callout key={i} kind={block.kind} text={block.text} />;
          if (block.type === "table") {
            const [head, ...rows] = block.rows;
            return (
              <div key={i} className="docs-table-wrap">
                <table className="docs-table">
                  <thead>
                    <tr>
                      {head.map((c, j) => (
                        <th key={j}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, k) => (
                      <tr key={k}>
                        {r.map((c, j) => (
                          <td key={j}>{c}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
          return <p key={i}>{block.text}</p>;
        })}
      </div>

      {relatedTask && (
        <div className="card docs-practice">
          <span className="label-caps">{t("docs.practiceLabel")}</span>
          <p className="docs-practice__title">{locField(relatedTask.title, langCode)}</p>
          <p className="docs-practice__meta">
            {t(`tasks.${relatedTask.difficulty}`)} · {relatedTask.minutes} {t("tasks.minutes")} · +{relatedTask.xp} {t("tasks.xp")}
          </p>
          <button type="button" className="btn btn--primary" onClick={() => onOpenTask && onOpenTask(relatedTask)}>
            {t("docs.practiceCta")}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      )}

      <nav className="docs-prevnext" aria-label="Article navigation">
        {prev ? (
          <a
            className="card docs-prevnext__item"
            href={docsPathFor({ track, page: prev.slug })}
            onClick={(e) => { e.preventDefault(); onDocsRoute({ track, page: prev.slug }); }}
          >
            <span className="docs-prevnext__dir">← {t("docs.prev")}</span>
            <span className="docs-prevnext__pos">{prevPosLabel}</span>
            <strong>{prev.title}</strong>
          </a>
        ) : (
          <span className="docs-prevnext__item docs-prevnext__item--empty" aria-hidden="true" />
        )}
        {next ? (
          <a
            className="card docs-prevnext__item docs-prevnext__item--next"
            href={docsPathFor({ track, page: next.slug })}
            onClick={(e) => { e.preventDefault(); onDocsRoute({ track, page: next.slug }); }}
          >
            <span className="docs-prevnext__dir">{t("docs.next")} →</span>
            <span className="docs-prevnext__pos">{nextPosLabel}</span>
            <strong>{next.title}</strong>
          </a>
        ) : (
          <a
            className="card docs-prevnext__item docs-prevnext__item--next"
            href={docsPathFor({ track })}
            onClick={(e) => { e.preventDefault(); onDocsRoute({ track, page: null }); }}
          >
            <span className="docs-prevnext__dir">{t("docs.backToDocs", { tech: techName })} →</span>
            <strong className="docs-prevnext__cta">{t("docs.breadcrumb")}</strong>
          </a>
        )}
      </nav>

      <div className="docs-helpful">
        {helpful === null ? (
          <>
            <span className="docs-helpful__q">{t("docs.helpful")}</span>
            <div className="docs-helpful__btns">
              <button type="button" className="btn btn--ghost" onClick={() => vote("yes")} aria-label={t("docs.yes")}>
                👍
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => vote("no")} aria-label={t("docs.no")}>
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
  // Честный счётчик: сколько страниц уже в бандле из 10
  const have = docsCountForTrack(tech.id);
  return (
    <div className="docs-empty card">
      <span className="docs-empty__logo" aria-hidden="true">
        {Logo ? <Logo /> : null}
      </span>
      <h2 className="docs-empty__title">{t("docs.emptyTitle", { tech: t(tech.label) })}</h2>
      <p className="docs-empty__body">{t("docs.emptyBody", { tech: t(tech.label) })}</p>
      <div className="docs-empty__progress">
        <div className="docs-empty__bar">
          <span style={{ width: `${Math.max(4, have * 10)}%` }} />
        </div>
        <span className="docs-empty__pct">{t("docs.emptyProgress", { a: have, b: 10 })}</span>
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

/* ————— Каталог страниц трека: все гайды и reference, порядок по полю order ————— */
function CatalogItem({ a, n, track, t, onDocsRoute }) {
  return (
    <a
      className="docs-catalog__item"
      href={docsPathFor({ track, page: a.slug })}
      onClick={(e) => { e.preventDefault(); onDocsRoute({ track, page: a.slug }); }}
    >
      <span className="docs-catalog__num" aria-hidden="true">{n}</span>
      <span className="docs-catalog__body">
        <strong>{a.title}</strong>
        <span className="docs-catalog__desc">{a.desc}</span>
      </span>
      <span className="docs-catalog__meta">{t("docs.minRead", { n: a.minutes })}</span>
    </a>
  );
}
function DocsCatalog({ track, techName, guides, refs, t, onDocsRoute }) {
  return (
    <section className="docs-catalog">
      <h2 className="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
        </svg>
        {t("docs.catalogTitle", { tech: techName })}
      </h2>
      <div className="docs-catalog__grid">
        <div className="docs-catalog__col">
          <span className="label-caps">{t("docs.guidesTitle")}</span>
          {guides.map((a, i) => (
            <CatalogItem key={a.slug} a={a} n={i + 1} track={track} t={t} onDocsRoute={onDocsRoute} />
          ))}
        </div>
        <div className="docs-catalog__col">
          <span className="label-caps">{t("docs.referenceTitle")}</span>
          {refs.map((a, i) => (
            <CatalogItem key={a.slug} a={a} n={i + 1} track={track} t={t} onDocsRoute={onDocsRoute} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ————— Справочная библиотека (обзорная страница): секции → превью с кодом ————— */
function ReferenceLibrary({ track, t, articles, onDocsRoute }) {
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
                <span className="code-chip">{active.version}</span>
              </div>
              <p className="reference__doc-desc">{active.desc}</p>
              {(() => {
                const codeBlock = (active.body || []).find((b) => b.type === "code");
                return codeBlock ? <CodeBlock code={codeBlock.text} lang={codeBlock.lang} version={active.version} t={t} /> : null;
              })()}
              <a
                className="read-link reference__open"
                href={docsPathFor({ track, page: active.slug })}
                onClick={(e) => { e.preventDefault(); onDocsRoute({ track, page: active.slug }); }}
              >
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

function DocsView({ docsRoute, onDocsRoute, activeTech, onNavigate, onOpenTask }) {
  const t = useT();
  const { langCode } = useLanguage();
  const docLang = docLangFor(langCode);

  // Трек доков — из URL (/docs/{track}); без трека в пути — активный трек пользователя, иначе Python
  const track =
    (docsRoute && docsRoute.track) ||
    (activeTech && activeTech !== "none" ? activeTech : DEFAULT_DOCS_TRACK);
  const tech = getTech(track);
  const techName = t(tech ? tech.label : "techs.python.label");
  const hasDocs = DOCS_TRACK_SET.has(track);
  const introMap = t("docs.intro") || {};
  const introText = introMap[track] || introMap[DEFAULT_DOCS_TRACK];

  // Страницы трека — из бандла src/content/docs/** (локализация: EN/RU, fallback EN)
  const pages = useMemo(() => {
    const list = docsPagesForTrack(track).map((p) => localizePage(p, docLang));
    return hasDocs ? list : [];
  }, [track, docLang, hasDocs]);
  const sorted = (list) => [...list].sort((a, b) => (a.order || 0) - (b.order || 0));
  const guides = useMemo(() => sorted(pages.filter((p) => p.type === "guide")), [pages]);
  const refs = useMemo(() => sorted(pages.filter((p) => p.type === "reference")), [pages]);

  // Статья — из пути /docs/{track}/{pageId}
  const pageId = docsRoute && docsRoute.page;
  const current = pages.find((p) => p.slug === pageId) || null;
  const catList = current ? (current.type === "guide" ? guides : refs) : [];
  const currentIdx = current ? catList.indexOf(current) : -1;
  const prev = currentIdx > 0 ? catList[currentIdx - 1] : null;
  const next = currentIdx > -1 && currentIdx < catList.length - 1 ? catList[currentIdx + 1] : null;
  const posLabelFor = (p) =>
    p.type === "guide"
      ? t("docs.posGuide", { a: guides.indexOf(p) + 1, b: guides.length })
      : t("docs.posRef", { a: refs.indexOf(p) + 1, b: refs.length });

  // Правый рейл: on-page TOC текущей статьи (CustomEvent — DocsAside; h3 — вложенные)
  const tocDetail = useMemo(() => (current ? { title: current.title, anchors: anchorsFor(current) } : null), [current]);
  useEffect(() => {
    const send = () => window.dispatchEvent(new CustomEvent("syntax-docs-toc", { detail: tocDetail }));
    send();
    window.addEventListener("syntax-docs-toc-request", send);
    return () => window.removeEventListener("syntax-docs-toc-request", send);
  }, [tocDetail]);

  // Невалидная страница в URL (удалённый/переименованный slug): лендинг рендерится,
  // URL чистим через replaceState — share-ссылка ведёт на валидный адрес
  useEffect(() => {
    if (pageId && !current) onDocsRoute({ track, page: null }, { replace: true });
  }, [pageId, current, track, onDocsRoute]);

  // ————— Живой поиск по базе знаний —————
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);

  // Ctrl+K / ⌘K — фокус на поиск (событие шлёт Header)
  useEffect(() => {
    const focus = () => searchRef.current?.focus();
    window.addEventListener("syntax-focus-docs-search", focus);
    return () => window.removeEventListener("syntax-focus-docs-search", focus);
  }, []);

  const allPages = useMemo(() => {
    const bodyText = (blocks) => (blocks || []).map((b) => (b.type === "table" ? b.rows.flat().join(" ") : b.text || "")).join(" ");
    return ALL_DOC_PAGES.map((p) => ({
      ...p,
      title: (p.title && (p.title[docLang] || p.title.en)) || p.id,
      desc: (p.excerpt && (p.excerpt[docLang] || p.excerpt.en)) || "",
      body: (p.body && p.body[docLang] && p.body[docLang].length ? p.body[docLang] : p.body.en) || [],
      text: [
        p.title.en, p.title.ru, p.excerpt.en, p.excerpt.ru,
        bodyText(p.body.en), bodyText(p.body.ru),
      ].join(" ").toLowerCase(),
    }));
  }, [docLang]);
  const tracksWithPages = useMemo(() => new Set(allPages.map((p) => p.track)), [allPages]);
  const q = query.trim().toLowerCase();
  const hits = q ? allPages.filter((p) => p.text.includes(q)).slice(0, 12) : [];
  const guideHits = hits.filter((p) => p.type === "guide");
  const refHits = hits.filter((p) => p.type === "reference");

  const mark = (text) => {
    if (!q) return text;
    const i = String(text).toLowerCase().indexOf(q);
    if (i < 0) return text;
    return (
      <>
        {text.slice(0, i)}
        <mark>{text.slice(i, i + q.length)}</mark>
        {text.slice(i + q.length)}
      </>
    );
  };

  const openResult = (p) => {
    const section = q ? sectionForQuery(p, q) : null;
    if (section) pendingSectionId = section;
    setQuery("");
    setSearchOpen(false);
    onDocsRoute({ track: p.track, page: p.slug });
  };

  const isMac = isMacOS();

  return (
    <div className="docs-view">
      {/* Hero (заголовок + динамичное intro + селектор трека) и поиск — только обзор/empty-state */}
      {!current && (
        <>
          <header className="page-head docs-hero">
            <div>
              <h1 className="page-head__title">{t("docs.title")}</h1>
              <p className="page-head__desc">{introText}</p>
            </div>
            <div className="docs-for">
              <span className="label-caps docs-for__label">{t("docs.forTrack")}</span>
              <div className="tech-switch" role="tablist" aria-label={t("docs.forTrack")}>
                {TECHS.map((tc) => {
                  const Logo = TRACK_LOGOS[tc.id];
                  const has = DOCS_TRACK_SET.has(tc.id);
                  return (
                    <button
                      key={tc.id}
                      type="button"
                      role="tab"
                      aria-selected={track === tc.id}
                      className={`tech-switch__item ${track === tc.id ? "tech-switch__item--active" : ""}`}
                      title={has ? t(tc.label) : t("docs.emptyTitle", { tech: t(tc.label) })}
                      onClick={() => onDocsRoute({ track: tc.id, page: null })}
                    >
                      <span className="tech-switch__icon-glyph">
                        <Logo />
                      </span>
                      <span className="tech-switch__name">{t(tc.label)}</span>
                      {!has && <span className="tech-switch__soon-badge">Soon</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </header>

          {/* Живой поиск: заметное поле под H1, результаты сгруппированы по типам */}
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
                placeholder={t("docs.searchPlaceholder")}
                aria-label={t("docs.searchPlaceholder")}
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
                <kbd>{isMac ? "⌘" : "Ctrl"}</kbd>
                <kbd>K</kbd>
              </span>
              {searchOpen && q && (
                <div className="docs-search-drop" role="listbox">
                  {hits.length === 0 ? (
                    <div className="docs-search-drop__empty">
                      <strong>{t("docs.nothingFound", { q: query.trim() })}</strong>
                      <ul className="docs-search-drop__hints">
                        {(t("docs.nothingFoundHints") || []).map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                      <div className="docs-search-drop__btns">
                        <button
                          type="button"
                          className="btn btn--secondary"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => onNavigate("community")}
                        >
                          {t("docs.askCommunity")}
                        </button>
                        <button
                          type="button"
                          className="btn btn--ghost"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => onNavigate("technology")}
                        >
                          {t("docs.askAi")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="docs-search-drop__count">
                        {t("docs.resultsCount", { n: hits.length })}
                      </span>
                      {guideHits.length > 0 && (
                        <div className="docs-search-drop__group">
                          <span className="docs-search-drop__group-label">{t("docs.resultsGuides")}</span>
                          {guideHits.map((a) => (
                            <a
                              key={a.slug}
                              className="docs-search-drop__item"
                              href={docsPathFor({ track: a.track, page: a.slug })}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                openResult(a);
                              }}
                            >
                              <span className="docs-search-drop__item-head">
                                <strong>{mark(a.title)}</strong>
                                {tracksWithPages.size > 1 && (
                                  <span className="docs-search-drop__badge">{t(`techs.${a.track}.label`)}</span>
                                )}
                              </span>
                              <span>{mark(a.desc)}</span>
                            </a>
                          ))}
                        </div>
                      )}
                      {refHits.length > 0 && (
                        <div className="docs-search-drop__group">
                          <span className="docs-search-drop__group-label">{t("docs.resultsReference")}</span>
                          {refHits.map((a) => (
                            <a
                              key={a.slug}
                              className="docs-search-drop__item"
                              href={docsPathFor({ track: a.track, page: a.slug })}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                openResult(a);
                              }}
                            >
                              <span className="docs-search-drop__item-head">
                                <strong>{mark(a.title)}</strong>
                                {tracksWithPages.size > 1 && (
                                  <span className="docs-search-drop__badge">{t(`techs.${a.track}.label`)}</span>
                                )}
                              </span>
                              <span>{mark(a.desc)}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {current ? (
        /* Статья: дерево | статья (правый on-page TOC — во внешнем рейле через DocsAside) */
        <div className="docs-layout docs-layout--article">
          <nav className="docs-tree" aria-label="Documentation sections">
            <div className="docs-tree__items docs-tree__items--chips">
              {[...guides, ...refs].map((a) => (
                <a
                  key={a.slug}
                  href={docsPathFor({ track: a.track, page: a.slug })}
                  onClick={(e) => { e.preventDefault(); onDocsRoute({ track: a.track, page: a.slug }); }}
                  className={`docs-tree__item ${a.slug === current.slug ? "is-active" : ""}`}
                  aria-current={a.slug === current.slug ? "page" : undefined}
                >
                  {a.title}
                </a>
              ))}
            </div>
          </nav>
          <div className="docs-main">
            <ArticleView
              article={current}
              track={current.track}
              techName={techName}
              prev={prev}
              next={next}
              prevPosLabel={prev ? posLabelFor(prev) : ""}
              nextPosLabel={next ? posLabelFor(next) : ""}
              t={t}
              onDocsRoute={onDocsRoute}
              langCode={langCode}
              onOpenTask={onOpenTask}
            />
          </div>
        </div>
      ) : hasDocs ? (
        /* Обзор трека: каталог всех страниц + справочная библиотека с превью */
        <div className="docs-main">
          <DocsCatalog track={track} techName={techName} guides={guides} refs={refs} t={t} onDocsRoute={onDocsRoute} />
          <ReferenceLibrary track={track} t={t} articles={refs} onDocsRoute={onDocsRoute} />
        </div>
      ) : (
        /* Трек без статей */
        <TrackEmpty tech={tech} t={t} onSwitchToPython={() => onDocsRoute({ track: DEFAULT_DOCS_TRACK, page: null })} />
      )}
    </div>
  );
}

export default DocsView;
