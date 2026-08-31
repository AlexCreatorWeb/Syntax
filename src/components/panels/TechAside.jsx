import { useT } from "../../i18n/useT";
import { getTech } from "../../lib/techs";

// Правый rail страницы технологии (макет: technology-page):
// Resources (ссылки-заглушки) + Syntax AI Assistant (статичный демо-чат, без бэкенда).
function TechAside({ techId }) {
  const t = useT();
  const tech = getTech(techId) || getTech("javascript");
  const content = t(`techs.${tech.id}`);

  return (
    <>
      <section className="card rail-card">
        <h2 className="rail-card__title rail-card__title--icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z" />
            <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
          </svg>
          {t("techPage.resources")}
        </h2>
        <ul className="tech-aside__resources">
          {content.resources.map((r, i) => (
            <li key={i}>
              <button type="button" className="tech-aside__resource" title={t("home.soon")} aria-disabled="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 12h9M12 12V3M12 12 3 21" />
                </svg>
                {r}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="card rail-card tech-aside__ai">
        <div className="tech-aside__ai-head">
          <h2 className="rail-card__title tech-aside__ai-title">
            <span className="dot-pulse" aria-hidden="true"></span>
            {t("techPage.aiTitle")}
          </h2>
          <span className="tech-aside__ai-dots" aria-hidden="true">···</span>
        </div>
        <div className="tech-aside__chat" aria-hidden="true">
          <p className="tech-aside__bubble tech-aside__bubble--ai">{t("techPage.aiHint")}</p>
          <p className="tech-aside__bubble tech-aside__bubble--user">{content.aiQ}</p>
          <p className="tech-aside__bubble tech-aside__bubble--ai tech-aside__bubble--clipped">{content.aiA}</p>
        </div>
        <div className="tech-aside__input">
          <input className="field tech-aside__field" type="text" placeholder={t("techPage.aiInput")} aria-label={t("techPage.aiInput")} />
          <button type="button" className="icon-btn tech-aside__send" title={t("home.soon")} aria-disabled="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12 20 4l-4 16-4-6-7-2Z" />
            </svg>
          </button>
        </div>
      </section>
    </>
  );
}

export default TechAside;
