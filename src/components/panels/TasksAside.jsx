import { useT } from "../../i18n/useT";
import DailyChallenge from "../DailyChallenge";

// Правый сайдбар вкладки Tasks: ежедневное испытание (только по трекам с
// реальными уроками в БД; новое каждый день — lib/daily.js) + аналитика.
function TaskAnalytics({ t, isAuthed }) {
  return (
    <section className="card analytics">
      <div className="analytics__head">
        <span className="label-caps">{t("tasks.analytics.title")}</span>
        {/* Гость видит демо-цифры — честно помечаем как Sample (как «Preview» на roadmap) */}
        {!isAuthed && <span className="chip analytics__sample">{t("tasks.sample")}</span>}
      </div>
      <div className="analytics__grid">
        <div className="stat-box">
          <div className="stat-box__value">24</div>
          <div className="stat-box__label">{t("tasks.analytics.completed")}</div>
        </div>
        <div className="stat-box">
          <div className="stat-box__value stat-box__value--accent">85%</div>
          <div className="stat-box__label">{t("tasks.analytics.accuracy")}</div>
        </div>
      </div>
    </section>
  );
}

function TasksAside({ onNavigate, isAuthed, dbLessons, onAuth }) {
  const t = useT();
  return (
    <>
      <DailyChallenge dbLessons={dbLessons} isAuthed={isAuthed} onAuth={onAuth} onNavigate={onNavigate} backTab="tasks" />
      <TaskAnalytics t={t} isAuthed={isAuthed} />
    </>
  );
}

export default TasksAside;
