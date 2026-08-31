import { useEffect } from "react";
import { useT } from "../../i18n/useT";
import { getTech } from "../../lib/techs";

// Страница технологии (макет: technology-page).
// Контент (описание, модули, ресурсы, AI-пример, урок) — в i18n: `techs.{id}`
// (EN base + RU; uk/es/de откатываются на EN). UI-строки — `techPage.*` (5 языков).
function TechnologyView({ techId, onResume, onNavigate }) {
  const t = useT();
  const tech = getTech(techId) || getTech("javascript");
  const Logo = tech.Logo;
  const content = t(`techs.${tech.id}`);
  const modules = content.modules;
  const locked = modules.filter((m) => m.status === "locked");

  // K3: вход на страницу трека — всегда с верха (hero + CTA в первом кадре)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tech.id]);

  const statusLabel = (status) => {
    if (status === "done") return t("techPage.completed");
    if (status === "current") return t("techPage.inProgress");
    return t("techPage.locked");
  };

  const ModuleIcon = ({ status }) => {
    if (status === "done") {
      return (
        <span className="techmod__icon techmod__icon--done" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12 5 5 9-10" />
          </svg>
        </span>
      );
    }
    if (status === "current") {
      return (
        <span className="techmod__icon techmod__icon--current" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
            <path d="m8 6 8 6-8 6V6Z" />
          </svg>
        </span>
      );
    }
    return (
      <span className="techmod__icon techmod__icon--locked" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      </span>
    );
  };

  // П.4: единое правило с roadmap-картой — текущий модуль кликабелен целиком
  const continueModule = (e) => {
    if (e.target.closest("button")) return;
    onResume(tech.id);
  };

  return (
    <div className="tech-page">
      {/* Hero: лого + название + статус доступности + объём + описание */}
      <section className="card card--feature tech-page__hero spotlight">
        <span className="tech-page__logo"><Logo /></span>
        <div className="tech-page__hero-body">
          <div className="tech-page__hero-title">
            <h1 className="tech-page__name">{t(tech.label)}</h1>
            <span className="chip chip--live">{t("techPage.live")}</span>
            <span className="tech-page__lessons">{t("techPage.lessons", { n: tech.lessons })}</span>
          </div>
          <p className="tech-page__desc">{content.desc}</p>
        </div>
      </section>

      {/* Change track: быстрый выход из контекста трека в каталог (UX-аудит п.7) */}
      <button type="button" className="tech-page__change" onClick={() => onNavigate && onNavigate("roadmap")}>
        {t("techPage.changeTrack")}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>

      {/* Course Progress: где я + действие */}
      <section className="card tech-page__progress spotlight">
        <div className="tech-page__progress-head">
          <h2 className="tech-page__card-title">{t("techPage.progress")}</h2>
          <span className="tech-page__pct">{content.pct}%</span>
        </div>
        <p className="tech-page__progress-module">{content.progressModule}</p>
        <div
          className="bar"
          role="progressbar"
          aria-valuenow={content.pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="bar__fill" style={{ width: `${content.pct}%` }}></div>
        </div>
        <button type="button" className="btn btn--primary tech-page__cta" onClick={() => onResume(tech.id)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
            <path d="m8 6 8 6-8 6V6Z" />
          </svg>
          {t("techPage.continue")}
        </button>
      </section>

      {/* Curriculum: модули со статусами */}
      <section className="tech-page__curriculum">
        <h2 className="tech-page__section-title">{t("techPage.curriculum")}</h2>
        <div className="techmod-list">
          {modules.map((m, i) => {
            const isCurrent = m.status === "current";
            return (
              <article
                key={i}
                className={`card techmod ${isCurrent ? "techmod--current" : ""} ${m.status === "locked" ? "techmod--locked" : ""}`}
                role={isCurrent ? "button" : undefined}
                tabIndex={isCurrent ? 0 : undefined}
                aria-current={isCurrent ? "step" : undefined}
                onClick={isCurrent ? continueModule : undefined}
                onKeyDown={isCurrent ? (e) => {
                  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onResume(tech.id); }
                } : undefined}
              >
                <ModuleIcon status={m.status} />
                <div className="techmod__body">
                  <h3 className="techmod__title">{i + 1}. {m.title}</h3>
                  <p className="techmod__desc">{m.desc}</p>
                </div>
                <span className={`techmod__status techmod__status--${m.status}`}>{statusLabel(m.status)}</span>
              </article>
            );
          })}
          {/* П.3: честный empty-state, когда заблокированных модулей нет (Python) */}
          {locked.length === 0 && (
            <div className="card techmod techmod--soon">
              <span className="techmod__icon techmod__icon--locked" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="11" width="16" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
              </span>
              <div className="techmod__body">
                <p className="techmod__desc">{t("techPage.soon")}</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default TechnologyView;
