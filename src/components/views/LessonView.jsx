import { useState } from "react";
import CodeEditor from "../CodeEditor";
import { MdContent } from "../../lib/markdown-view";
import TechList, { getTech } from "../../lib/techs";
import { useT } from "../../i18n/useT";

// Статическая мапа логов (react-compiler: без getTech().Logo в рендере)
const LOGO_MAP = Object.fromEntries(TechList.map((x) => [x.id, x.Logo]));

// Страница урока из базы (Supabase `lessons`):
// хлебные крошки (тех › Уроки) → заголовок → ТАБЫ «Материал | Задание».
// Обе панели всегда смонтированы (неактивная прячется CSS'ом):
// код Monaco, консоль и scroll-позиция переживают переключение табов.
function LessonView({ job, theme, onNavigate }) {
  const t = useT();
  const [tab, setTab] = useState("material");
  const [taskVisited, setTaskVisited] = useState(false);

  const tech = job && job.techId ? getTech(job.techId) : null;
  const Logo = job && job.techId ? LOGO_MAP[job.techId] : null;

  const goTask = () => {
    setTab("task");
    setTaskVisited(true);
  };
  const listHref = tech ? `#/technology/${tech.id}` : `#/${job.backTab || "roadmap"}`;

  return (
    <div className="lesson-view">
      {/* Хлебные крошки: выход на список уроков технологии */}
      <nav className="lesson-view__crumbs" aria-label="Breadcrumb">
        {tech && (
          <>
            <a className="crumb crumb--tech" href={listHref}>
              {Logo && (
                <span className="crumb__logo" aria-hidden="true"><Logo /></span>
              )}
              {t(tech.label)}
            </a>
            <svg className="crumb__sep" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m9 6 6 6-6 6" />
            </svg>
          </>
        )}
        <a className="crumb crumb--list" href={listHref}>
          {t("techPage.dbLessons")}
        </a>
      </nav>

      <h1 className="lesson-view__title">{job.title}</h1>

      {/* Табы: материал / задание (редактор не размонтируется) */}
      <div className="lesson-view__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "material"}
          className={`lesson-view__tab ${tab === "material" ? "lesson-view__tab--active" : ""}`}
          onClick={() => setTab("material")}
        >
          {t("lessonView.tabMaterial")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "task"}
          className={`lesson-view__tab ${tab === "task" ? "lesson-view__tab--active" : ""}`}
          onClick={goTask}
        >
          {t("lessonView.tabTask")}
          {!taskVisited && <span className="lesson-view__tab-dot" aria-hidden="true" />}
        </button>
      </div>

      {/* Панели: обе смонтированы, неактивная — display:none (состояние Monaco сохраняется) */}
      <div className={`lesson-view__panel ${tab !== "material" ? "lesson-view__panel--hidden" : ""}`}>
        <div className="card lesson-view__material">
          <MdContent src={job.content} t={t} />
          <button type="button" className="btn btn--primary lesson-view__goto" onClick={goTask}>
            {t("lessonView.goToTask")}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>
      <div className={`lesson-view__panel lesson-view__panel--editor ${tab !== "task" ? "lesson-view__panel--hidden" : ""}`}>
        <CodeEditor
          language="javascript"
          theme={theme}
          job={{ ...job, kind: "lesson" }}
          defaultShowPreview={false}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
}

export default LessonView;
