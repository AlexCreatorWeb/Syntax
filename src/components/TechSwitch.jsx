import { useT } from "../i18n/useT";
import TECHS from "../lib/techs";

// Единая «шапка технологий»: пилюли с лого — один компонент на Roadmap, Tasks
// и страницу технологии (тех-страница открывается с гостевой карточки — пользователь
// обязан видеть тот же верхний блок, что на «Дорожной карте»).
function TechSwitch({ activeId, onSelect }) {
  const t = useT();
  return (
    <div className="tech-switch" role="tablist" aria-label={t("techPage.changeTrack")}>
      {TECHS.map((tc) => {
        const TLogo = tc.Logo;
        return (
          <button
            key={tc.id}
            type="button"
            role="tab"
            aria-selected={tc.id === activeId}
            className={`tech-switch__item ${tc.id === activeId ? "tech-switch__item--active" : ""}`}
            onClick={() => onSelect(tc.id)}
          >
            <TLogo />
            <span>{t(tc.label)}</span>
          </button>
        );
      })}
    </div>
  );
}

export default TechSwitch;
