import { useT } from "../i18n/useT";
import TECHS from "../lib/techs";

// Единая сетка карточек треков (главная + Roadmap-селектор).
// Клик = выбор трека + переход на страницу технологии (UX-аудит К1/К5).
function TechCardsGrid({ activeTech, onOpenTech }) {
  const t = useT();
  return (
    <div className="tech-row">
      {TECHS.map((tech) => {
        const Logo = tech.Logo;
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
              <span className="tech-card__meta">{t("home.lessons", { n: tech.lessons })}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default TechCardsGrid;
