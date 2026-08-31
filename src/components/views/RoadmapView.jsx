import { useT } from "../../i18n/useT";
import TECHS, { getTech } from "../../lib/techs";

// Дорожная карта = трек прохождения курса выбранной технологии (UX-аудит раунд 3):
// статус (модуль X из 4 · %), таймлайн: завершённые → текущий (доминирующая карточка)
// → locked → «модули идут дальше». Переключатель треков — пилюли с лого.
// Данные: i18n `techs.{id}` (modules, progressModule, pct).
function RoadmapView({ activeTech, onSelectTech, onResume }) {
  const t = useT();
  const tech = getTech(activeTech) || getTech("javascript");
  const Logo = tech.Logo;
  const content = t(`techs.${tech.id}`);
  const modules = content.modules;
  const currentIdx = Math.max(0, modules.findIndex((m) => m.status === "current"));

  const Node = ({ status, big }) => {
    const cls = `roadmap__node roadmap__node--${status} ${big ? "roadmap__node--big" : ""}`;
    if (status === "done") {
      return (
        <span className={cls} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5 9-10" /></svg>
        </span>
      );
    }
    if (status === "current") {
      return (
        <span className={cls} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="m8 6 8 6-8 6V6Z" /></svg>
        </span>
      );
    }
    return (
      <span className={cls} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
      </span>
    );
  };

  const continueModule = (e) => {
    if (e.target.closest("button")) return;
    onResume(tech.id);
  };

  let upNextShown = false;

  return (
    <div className="roadmap-view">
      <header className="page-head">
        <h1 className="page-head__title">{t("roadmap.heading")}</h1>
        <p className="page-head__desc">{t("roadmap.trackDesc", { tech: t(tech.label) })}</p>
      </header>

      {/* Переключатель треков: смена активного трека прямо на карте */}
      <div className="roadmap-switch" role="tablist" aria-label={t("techPage.changeTrack")}>
        {TECHS.map((tc) => {
          const TLogo = tc.Logo;
          return (
            <button
              key={tc.id}
              type="button"
              role="tab"
              aria-selected={tc.id === tech.id}
              className={`roadmap-switch__item ${tc.id === tech.id ? "roadmap-switch__item--active" : ""}`}
              onClick={() => onSelectTech(tc.id)}
            >
              <TLogo />
              <span>{t(tc.label)}</span>
            </button>
          );
        })}
      </div>

      {/* Статус прохождения */}
      <div className="card roadmap__status spotlight">
        <div className="roadmap__status-text">
          <strong>{content.progressModule}</strong>
          <span>{t("roadmap.statusLine", { m: currentIdx + 1, n: modules.length })} · {content.pct}%</span>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => onResume(tech.id)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><path d="m8 6 8 6-8 6V6Z" /></svg>
          {t("techPage.continue")}
        </button>
      </div>

      {/* Таймлайн трека */}
      <div className="roadmap">
        <div className="roadmap__line" aria-hidden="true"></div>
        {modules.map((m, i) => {
          const isCurrent = m.status === "current";
          const isLocked = m.status === "locked";
          // Групповая метка «Up next» перед первым locked
          if (isLocked && !upNextShown) {
            upNextShown = true;
            return (
              <div key={`upnext-${i}`}>
                <p className="roadmap__group-label">{t("roadmap.upNext")}</p>
                <RoadmapRow m={m} i={i} isCurrent={isCurrent} isLocked={isLocked} Node={Node} statusLabel={t} continueModule={continueModule} onResume={onResume} techId={tech.id} />
              </div>
            );
          }
          return <RoadmapRow key={i} m={m} i={i} isCurrent={isCurrent} isLocked={isLocked} Node={Node} statusLabel={t} continueModule={continueModule} onResume={onResume} techId={tech.id} />;
        })}
        {/* Честный empty-state: заблокированных модулей нет */}
        <div className="roadmap__item">
          <Node status="locked" />
          <div className="card roadmap__ghost">
            <p className="roadmap__ghost-text">{t("techPage.soon")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoadmapRow({ m, i, isCurrent, isLocked, Node, statusLabel, continueModule, onResume, techId }) {
  const status = isCurrent
    ? statusLabel("techPage.inProgress")
    : isLocked
      ? statusLabel("techPage.locked")
      : statusLabel("techPage.completed");

  return (
    <div className={`roadmap__item ${isCurrent ? "roadmap__item--current" : ""}`}>
      <Node status={m.status} big={isCurrent} />
      <div
        className={`card roadmap__card ${isCurrent ? "roadmap__card--current" : ""} ${isLocked ? "roadmap__card--locked" : ""}`}
        role={isCurrent ? "button" : undefined}
        tabIndex={isCurrent ? 0 : undefined}
        aria-current={isCurrent ? "step" : undefined}
        onClick={isCurrent ? continueModule : undefined}
        onKeyDown={isCurrent ? (e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onResume(techId); }
        } : undefined}
      >
        <div className="roadmap__card-head">
          <span className="roadmap__num">{i + 1}</span>
          <strong className="roadmap__title">{m.title}</strong>
          <span className={`roadmap__chip roadmap__chip--${m.status}`}>{status}</span>
        </div>
        <p className="roadmap__desc">{m.desc}</p>
      </div>
    </div>
  );
}

export default RoadmapView;
