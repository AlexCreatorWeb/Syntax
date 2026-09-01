import CodeEditor from "../CodeEditor";
import { MdContent } from "../../lib/markdown-view";
import TechList, { getTech } from "../../lib/techs";
import { useT } from "../../i18n/useT";

// Статическая мапа логов (react-compiler: без getTech().Logo в рендере)
const LOGO_MAP = Object.fromEntries(TechList.map((x) => [x.id, x.Logo]));

// Страница урока из базы (Supabase `lessons`):
// шапка (тех · урок, From database, Back) | материал (markdown-lite) | редактор с заданием.
// Редактор — тот же CodeEditor; его собственный job-заголовок скрыт CSS
// (заголовок/Back уже в шапке урока), Run/Submit/консоль — на месте.
function LessonView({ job, theme, onNavigate }) {
  const t = useT();
  const tech = job && job.techId ? getTech(job.techId) : null;
  const Logo = job && job.techId ? LOGO_MAP[job.techId] : null;

  const back = () => onNavigate(job.backTab || "roadmap", job.techId ? { techId: job.techId } : null);

  return (
    <div className="lesson-view">
      {/* Шапка урока */}
      <div className="lesson-view__head">
        <div className="lesson-view__row">
          <span className="chip">
            {tech ? `${t(tech.label)} · ` : ""}
            {t("editor.lessonLabel")}
          </span>
          {job.fromDb && <span className="chip chip--db">{t("editor.dbSource")}</span>}
          <button type="button" className="editor-job__back" onClick={back}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>
            {t("editor.back")}
          </button>
        </div>
        <h1 className="lesson-view__title">
          {Logo ? <span className="lesson-view__logo" aria-hidden="true"><Logo /></span> : null}
          {job.title}
        </h1>
        {job.desc ? <p className="lesson-view__desc">{job.desc}</p> : null}
      </div>

      {/* Материал + редактор */}
      <div className="lesson-view__grid">
        <section className="card lesson-view__material">
          <h2 className="lesson-view__section">{t("lessonView.material")}</h2>
          {job.content ? (
            <MdContent src={job.content} t={t} />
          ) : (
            <p className="md-p">{job.desc || t("lessonView.noMaterial")}</p>
          )}
        </section>
        <section className="lesson-view__code">
          <h2 className="lesson-view__section lesson-view__section--task">{t("lessonView.task")}</h2>
          <CodeEditor
            language="javascript"
            theme={theme}
            job={{ ...job, kind: "lesson" }}
            onNavigate={onNavigate}
          />
        </section>
      </div>
    </div>
  );
}

export default LessonView;
