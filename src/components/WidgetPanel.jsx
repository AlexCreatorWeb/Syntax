import { useT } from "../i18n/useT";
import RankingsAside from "./panels/RankingsAside";
import CommunityAside from "./panels/CommunityAside";
import DocsAside from "./panels/DocsAside";
import TasksAside from "./panels/TasksAside";
import TechAside from "./panels/TechAside";
import PromoCard from "./PromoCard";

// Вкладки, у которых в дизайне есть собственный правый сайдбар:
// он монтируется во внешнюю rail вместо дефолтных виджетов.
const TAB_ASIDES = {
  rankings: RankingsAside,
  community: CommunityAside,
  documentation: DocsAside,
  tasks: TasksAside,
  technology: TechAside,
};

function WidgetPanel({ activeTab, onNavigate, onSignup, job, activeTech }) {
  const t = useT();
  const Aside = TAB_ASIDES[activeTab];

  return (
    <aside className="rail">
      {Aside ? (
        <Aside onNavigate={onNavigate} techId={(job && job.techId) || activeTech} />
      ) : (
        <>
          {/* Daily challenge */}
          <section className="card rail-card rail-card--challenge">
            <h2 className="rail-card__title">{t("widget.dailyTitle")}</h2>
            <div className="challenge">
              <div className="challenge__head">
                <span className="challenge__icon" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M8 21h8M12 17v4M7 4h10v6a5 5 0 0 1-10 0V4Z" />
                    <path d="M7 6H4a1 1 0 0 0-1 1 4 4 0 0 0 4 4M17 6h3a1 1 0 0 1 1 1 4 4 0 0 1-4 4" />
                  </svg>
                </span>
                <strong>{t("widget.dailyName")}</strong>
              </div>
              <p>{t("widget.dailyDesc")}</p>
              <button type="button" className="btn btn--secondary btn--full" onClick={onSignup}>
                {t("widget.start")}
              </button>
            </div>
          </section>

          {/* Реклама: книга (вместо AI-ментора; остальные виджеты — позже) */}
          <PromoCard id="book" />
        </>
      )}
    </aside>
  );
}

export default WidgetPanel;
