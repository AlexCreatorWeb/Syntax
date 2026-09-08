import { useT } from "../../i18n/useT";
import TECHS from "../../lib/techs";
import { getCompleted, prefixOfCompleted } from "../../lib/progress";
import TechCardsGrid from "../TechCardsGrid";
import ContinueLearning from "../ContinueLearning";

/**
 * Раздел «Courses» (аудит навигации 2026-09): постоянный дом каталога курсов.
 * Структура: Continue (активный курс, реальный прогресс) → Your courses (начатые)
 * → All courses (все 12, единый контракт карточки, AI-инструменты — тег «New»).
 */
function CoursesView({
  activeTech,
  onSelectTech,
  dbLessons,
  onResume,
  onNavigate,
  progressTick,
}) {
  const t = useT();
  void progressTick; // перерисовка после синка БД/Submit — данные уже в LS
  const rows = dbLessons || [];
  const startedTechs = TECHS.filter((tech) => {
    const techLessons = rows.filter((l) => l.tech === tech.id);
    if (!techLessons.length) return false;
    return prefixOfCompleted(techLessons, getCompleted(tech.id)).length > 0;
  });
  const openTech = (id) => {
    onSelectTech(id);
    onNavigate("technology", { techId: id });
  };
  return (
    <div className="courses-view">
      <div className="courses-view__head">
        <h1 className="courses-view__title">{t("courses.title")}</h1>
        <p className="courses-view__sub">{t("courses.sub")}</p>
      </div>

      {/* Continue: активный курс — daily-действие в один клик */}
      {activeTech && (
        <ContinueLearning
          techId={activeTech}
          dbLessons={rows}
          onContinue={() => onResume(activeTech)}
          onNavigate={onNavigate}
        />
      )}

      {startedTechs.length > 0 && (
        <section className="courses-view__section">
          <h2 className="courses-view__section-title">{t("courses.my")}</h2>
          <TechCardsGrid
            techs={startedTechs}
            activeTech={activeTech}
            dbLessons={rows}
            onOpenTech={openTech}
          />
        </section>
      )}

      <section className="courses-view__section">
        <h2 className="courses-view__section-title">{t("courses.all")}</h2>
        <TechCardsGrid
          activeTech={activeTech}
          dbLessons={rows}
          onOpenTech={openTech}
        />
      </section>
    </div>
  );
}

export default CoursesView;
