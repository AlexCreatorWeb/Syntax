import { useState } from "react";
import CodeEditor from "./CodeEditor";
import RoadmapView from "./views/RoadmapView";
import TasksView from "./views/TasksView";
import DocsView from "./views/DocsView";
import { useT } from "../i18n/useT";

function MainContent({ activeTab, theme }) {
  const t = useT();
  const [currentLanguage] = useState("javascript"); // селектор языка редактора появится позже

  const renderLessonCard = () => (
    <section className="card lesson">
      <div className="lesson__top">
        <span className="chip chip--module">{t("lesson.chip")}</span>
        <button type="button" className="btn btn--primary">
          {t("lesson.continue")}
          <svg
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
      </div>
      <h1 className="lesson__title">{t("lesson.title")}</h1>
      <p className="lesson__desc">{t("lesson.desc")}</p>
      <div className="lesson__progress">
        <div className="progress-labels">
          <span className="label-caps">{t("lesson.progress")}</span>
          <span className="label-caps progress-value">45%</span>
        </div>
        <div
          className="bar"
          role="progressbar"
          aria-valuenow="45"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <div className="bar__fill" style={{ width: "45%" }}></div>
        </div>
      </div>
    </section>
  );

  const renderPlaceholder = (tab) => (
    <section className="card">
      <h1 className="lesson__title">{t(`placeholders.${tab}Title`)}</h1>
      <p className="lesson__desc">{t(`placeholders.${tab}Desc`)}</p>
    </section>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "roadmap":
        return <RoadmapView />;
      case "editor":
        return <CodeEditor language={currentLanguage} theme={theme} />;
      case "tasks":
        return <TasksView />;
      case "documentation":
        return <DocsView />;
      case "rankings":
        return renderPlaceholder("rankings");
      case "community":
        return renderPlaceholder("community");
      case "settings":
        return renderPlaceholder("settings");
      case "support":
        return renderPlaceholder("support");
      default:
        return renderLessonCard();
    }
  };

  return <main className="content">{renderTabContent()}</main>;
}

export default MainContent;
