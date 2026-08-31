import { useT } from "../../i18n/useT";
import TechCardsGrid from "../TechCardsGrid";

// Дорожная карта (UX-аудит К1): точка входа-селектор, а не вторая «карта трека».
// Карта конкретного трека живёт на одной поверхности — странице технологии;
// «Дорожная карта Python · 6 модулей» как отдельная сущность убрана.
function RoadmapView({ activeTech, onOpenTech }) {
  const t = useT();

  return (
    <div className="roadmap-view">
      <header className="page-head">
        <h1 className="page-head__title">{t("sidebar.roadmap")}</h1>
        <p className="page-head__desc">{t("roadmap.catalogDesc")}</p>
      </header>
      <TechCardsGrid activeTech={activeTech} onOpenTech={onOpenTech} />
    </div>
  );
}

export default RoadmapView;
