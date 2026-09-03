import { useT } from "../i18n/useT";
import TECHS from "../lib/techs";
import { localizedLessonTitle } from "../lib/lessonTitles";
import { useLanguage } from "../context/useLanguage";

// Единая сетка карточек треков (главная + Roadmap-селектор).
// Клик = выбор трека + переход на страницу технологии (UX-аудит К1/К5).
function TechCardsGrid({ activeTech, onOpenTech, dbLessons }) {
  const t = useT();
  const { langCode } = useLanguage();
  // UX-аудит: «Lesson 1: {title}» вместо абстрактного «16 lessons» — что внутри трека
  const firstTitle = (tech) => {
    const lesson = (dbLessons || []).find((l) => l.tech === tech.id);
    return lesson
      ? localizedLessonTitle(tech.id, 1, lesson.title, langCode)
      : null;
  };
  return (
    <div className="tech-row">
      {TECHS.map((tech) => {
        const Logo = tech.Logo;
        const lesson1 = firstTitle(tech);
        return (
          <button
            key={tech.id}
            type="button"
            className={`tech-card ${activeTech === tech.id ? "tech-card--active" : ""}`}
            onClick={() => onOpenTech(tech.id)}
          >
            <Logo />
            <span className="tech-card__body">
              <span className="tech-card__name">{t(tech.label)}</span>
              <span className="tech-card__meta">
                {t("home.lessons", { n: tech.lessons })}
              </span>
              {lesson1 && (
                <span className="tech-card__first">
                  {t("home.lesson1", { title: lesson1 })}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default TechCardsGrid;
