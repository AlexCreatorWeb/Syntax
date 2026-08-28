import { useState } from "react";
import CodeEditor from "./CodeEditor";
import MainView from "./views/MainView";
import RoadmapView from "./views/RoadmapView";
import TasksView from "./views/TasksView";
import DocsView from "./views/DocsView";
import RankingsView from "./views/RankingsView";
import CommunityView from "./views/CommunityView";
import { useT } from "../i18n/useT";

// Учебный контекст «урока» (демо-данные; дальше — с бэкенда)
function lessonJob(t) {
  return {
    kind: "lesson",
    title: t("lesson.title"),
    desc: t("lesson.desc"),
    backTab: "roadmap",
  };
}

function taskJob(t, index) {
  const item = t("tasks.items")[index];
  return {
    kind: "task",
    title: item.title,
    desc: item.desc,
    backTab: "tasks",
  };
}

function MainContent({ activeTab, theme, job, onNavigate }) {
  const t = useT();
  const [currentLanguage] = useState("javascript"); // селектор языка редактора появится позже

  const openLesson = () => onNavigate("editor", lessonJob(t));
  const openTask = (index) => onNavigate("editor", taskJob(t, index));

  const renderLessonCard = () => (
    <section className="card lesson">
      <div className="lesson__top">
        <span className="chip chip--module">{t("lesson.chip")}</span>
        <button type="button" className="btn btn--primary" onClick={openLesson}>
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
          aria-valuenow={45}
          aria-valuemin={0}
          aria-valuemax={100}
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
      case "home":
        return <MainView onNavigate={onNavigate} onContinue={openLesson} />;
      case "roadmap":
        return <RoadmapView onNavigate={onNavigate} onResume={openLesson} />;
      case "editor":
        return <CodeEditor language={currentLanguage} theme={theme} job={job} onNavigate={onNavigate} />;
      case "tasks":
        return <TasksView onSolve={openTask} />;
      case "documentation":
        return <DocsView />;
      case "rankings":
        return <RankingsView />;
      case "community":
        return <CommunityView />;
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
