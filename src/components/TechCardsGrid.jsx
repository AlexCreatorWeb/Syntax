import { useT } from "../i18n/useT";
import TECHS from "../lib/techs";
import { getCompleted, prefixOfCompleted } from "../lib/progress";
import { localizedLessonTitle } from "../lib/lessonTitles";
import { useLanguage } from "../context/useLanguage";

// AI-инструменты живут своей секцией на главной (home__aitools, «карточки нейронок»)
// — из core-грида исключены, как и было.
const AI_TOOL_IDS = new Set(["claude", "cursor", "copilot"]);

// Единая сетка карточек курсов (главная + страница Courses + «My courses»).
// Клик = выбор трека + переход на страницу технологии. Карточка начатого курса
// несёт реальный прогресс (Udemy-префикс) вместо «Lesson 1».
function TechCardsGrid({ activeTech, onOpenTech, dbLessons, techs, coreOnly }) {
  const t = useT();
  const { langCode } = useLanguage();
  // coreOnly (главная): AI-инструменты живут своей секцией (home__aitools);
  // страница Courses: полный список (все 12) или явный techs («My courses»)
  const list = (techs || TECHS).filter(
    (tech) => !coreOnly || !AI_TOOL_IDS.has(tech.id),
  );
  const rows = dbLessons || [];
  return (
    <div className="tech-row">
      {list.map((tech) => {
        const Logo = tech.Logo;
        const techLessons = rows.filter((l) => l.tech === tech.id);
        const done = techLessons.length
          ? prefixOfCompleted(techLessons, getCompleted(tech.id)).length
          : 0;
        const started = done > 0;
        const first = techLessons.length
          ? localizedLessonTitle(tech.id, 1, techLessons[0].title, langCode)
          : null;
        return (
          <button
            key={tech.id}
            type="button"
            className={`tech-card ${activeTech === tech.id ? "tech-card--active" : ""}`}
            onClick={() => onOpenTech(tech.id)}
          >
            <Logo />
            <span className="tech-card__body">
              <span className="tech-card__name">
                {t(tech.label)}
                {AI_TOOL_IDS.has(tech.id) && (
                  <span className="chip chip--new tech-card__new">
                    {t("home.aiTools.new")}
                  </span>
                )}
              </span>
              <span className="tech-card__meta">
                {t("home.lessons", { n: tech.lessons })}
              </span>
              {started && (
                <span className="tech-card__progress" aria-hidden="true">
                  <span
                    className="tech-card__progress-fill"
                    style={{
                      width: `${Math.round((done / techLessons.length) * 100)}%`,
                    }}
                  />
                </span>
              )}
              {started ? (
                <span className="tech-card__first tech-card__first--progress">
                  {t("techPage.lessonOf", {
                    n: done + 1,
                    m: techLessons.length,
                  })}
                </span>
              ) : (
                first && (
                  <span className="tech-card__first">
                    {t("home.lesson1", { title: first })}
                  </span>
                )
              )}
            </span>
            {/* Аудит H2: стрелка выезжает на hover (ховер-семейство M6) */}
            <svg
              className="tech-card__arrow"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

export default TechCardsGrid;
