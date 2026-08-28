import { useT } from "../../i18n/useT";

const MODULES = [
  { num: 1, status: "done", pct: 100 },
  { num: 2, status: "done", pct: 100 },
  { num: 3, status: "done", pct: 100 },
  { num: 4, status: "current", pct: 45 },
  { num: 5, status: "locked", pct: 0 },
  { num: 6, status: "locked", pct: 0 },
];

function RoadmapNode({ status }) {
  const base = "roadmap__node";
  if (status === "done") {
    return (
      <span className={`${base} ${base}--done`} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 12 5 5 9-10" />
        </svg>
      </span>
    );
  }
  if (status === "current") {
    return <span className={`${base} ${base}--current`} aria-hidden="true"></span>;
  }
  return (
    <span className={`${base} ${base}--locked`} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="11" width="16" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </svg>
    </span>
  );
}

function RoadmapView() {
  const t = useT();
  const modules = t("roadmap.modules");

  return (
    <div className="roadmap-view">
      <header className="page-head">
        <h1 className="page-head__title">{t("roadmap.title")}</h1>
        <p className="page-head__desc">{t("roadmap.desc")}</p>
      </header>

      <div className="roadmap">
        <div className="roadmap__line" aria-hidden="true"></div>
        {MODULES.map((m, i) => (
          <div
            key={m.num}
            className={`roadmap__item roadmap__item--${i % 2 === 0 ? "left" : "right"}`}
          >
            <RoadmapNode status={m.status} />
            <article
              className={`card roadmap__card ${
                m.status === "current" ? "roadmap__card--current" : ""
              } ${m.status === "locked" ? "roadmap__card--locked" : ""}`}
            >
              <div className="roadmap__card-head">
                {m.status === "current" ? (
                  <span className="chip chip--module">{t("roadmap.current")}</span>
                ) : (
                  <span className="roadmap__module">{t("roadmap.module", { n: m.num })}</span>
                )}
                <span className="roadmap__pct">{m.pct}%</span>
              </div>
              <h2 className="roadmap__title">{modules[i].title}</h2>
              <p className="roadmap__desc">{modules[i].desc}</p>
              {m.status !== "locked" && (
                <div className="bar" role="progressbar" aria-valuenow={m.pct} aria-valuemin={0} aria-valuemax={100}>
                  <div className="bar__fill" style={{ width: `${m.pct}%` }}></div>
                </div>
              )}
              {m.status === "current" && (
                <button type="button" className="btn btn--primary btn--full roadmap__cta">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m8 6 8 6-8 6V6Z" />
                  </svg>
                  {t("roadmap.resume")}
                </button>
              )}
            </article>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RoadmapView;
