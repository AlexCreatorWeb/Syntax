import { useT } from "../../i18n/useT";
import DailyChallenge from "../DailyChallenge";
import { getTech } from "../../lib/techs";
import { TASKS, tasksForTrack } from "../../lib/tasks";
import { getDoneTasks } from "../../lib/progress";
import { totalXp } from "../../lib/xp";

// Правый сайдбар вкладки Tasks: ежедневное испытание + реальная статистика
// задач. Были статичные «24 / 85%» для всех — теперь живые числа из локального
// прогресса (гостевой бакет наследуется после входа): прогресс по активному
// треку + суммарный XP и общее число завершённых задач.
function TaskAnalytics({ t, techId }) {
  const track = getTech(techId);
  const done = getDoneTasks();
  const trackTasks = track ? tasksForTrack(track.id) : [];
  const doneInTrack = trackTasks.filter((x) =>
    done.includes(`${track.id}:${x.id}`),
  ).length;
  const useTrack = trackTasks.length > 0;
  const total = useTrack ? trackTasks.length : TASKS.length;
  const doneCount = useTrack ? doneInTrack : done.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  return (
    <section className="card analytics">
      <div className="analytics__head">
        <span className="label-caps">{t("tasks.analytics.title")}</span>
      </div>
      <div className="analytics__track-line">
        <span>{useTrack ? t(track.label) : t("tasks.analytics.allTasks")}</span>
        <strong>
          {t("tasks.analytics.track", { done: doneCount, total })}
        </strong>
      </div>
      <div
        className="analytics__bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <span style={{ width: `${pct}%` }} />
      </div>
      <div className="analytics__grid">
        <div className="stat-box">
          <div className="stat-box__value stat-box__value--accent">
            {totalXp()}
          </div>
          <div className="stat-box__label">{t("tasks.analytics.xp")}</div>
        </div>
        <div className="stat-box">
          <div className="stat-box__value">{done.length}</div>
          <div className="stat-box__label">
            {t("tasks.analytics.completed")}
          </div>
        </div>
      </div>
    </section>
  );
}

function TasksAside({ onNavigate, techId, isAuthed, dbLessons, onAuth }) {
  const t = useT();
  return (
    <>
      <DailyChallenge
        dbLessons={dbLessons}
        isAuthed={isAuthed}
        onAuth={onAuth}
        onNavigate={onNavigate}
        backTab="tasks"
      />
      <TaskAnalytics t={t} techId={techId} />
    </>
  );
}

export default TasksAside;
