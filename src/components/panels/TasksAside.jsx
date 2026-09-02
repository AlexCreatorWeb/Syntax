import { useEffect, useState } from "react";
import { useT } from "../../i18n/useT";

const INITIAL_SECONDS = 14 * 3600 + 22 * 60 + 5; // 14:22:05

function formatTime(total) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

function DailyChallenge({ t, onAccept }) {
  const [seconds, setSeconds] = useState(INITIAL_SECONDS);

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="card daily-challenge">
      <div className="daily-challenge__head">
        <span className="daily-challenge__title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 21c3.5 0 6-2.4 6-5.6 0-2.1-1.1-3.9-2.4-5.4C14.4 8.6 13 7 13 4.5c0 0-4.5 2-4.5 6 0-1-.5-2-1.5-2.8C6 9.4 6 11.6 6 15.4 6 18.6 8.5 21 12 21Z" />
            <path d="M12 21c-1.7 0-3-1.3-3-3 0-1.4.8-2.4 1.6-3.3.6-.7 1.4-1.6 1.4-2.7 0 0 2 1.4 2 3.5 0 .8.4 1.2.4 2.5 0 1.7-1 3-2.4 3Z" />
          </svg>
          {t("tasks.daily.title")}
        </span>
        <span className="timer-chip" role="timer" aria-label={t("tasks.timerAria")}>
          {formatTime(seconds)}
        </span>
        {/* L6-аудит: что именно отсчитывает таймер */}
        <span className="daily-challenge__reset">{t("tasks.resetsDaily")}</span>
      </div>
      <h3 className="daily-challenge__name">
        {t("tasks.daily.name")}
        <span className="chip daily-challenge__general">{t("tasks.general")}</span>
      </h3>
      <p className="daily-challenge__desc">{t("tasks.daily.desc")}</p>
      <div className="daily-challenge__reward">
        <span className="xp">{t("tasks.daily.xpReward")}</span>
        <span className="badge-hard">{t("tasks.daily.hard")}</span>
      </div>
      <button type="button" className="btn btn--ghost btn--full" onClick={onAccept}>
        {t("tasks.daily.accept")}
      </button>
    </section>
  );
}

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

// Правый сайдбар вкладки Tasks (монтируется во внешнюю rail)
function TasksAside({ onNavigate, isAuthed }) {
  const t = useT();
  const dailyJob = {
    kind: "task",
    title: t("tasks.daily.name"),
    desc: t("tasks.daily.desc"),
    backTab: "tasks",
  };
  return (
    <>
      <DailyChallenge t={t} onAccept={() => onNavigate && onNavigate("editor", dailyJob)} />
      <TaskAnalytics t={t} isAuthed={isAuthed} />
    </>
  );
}

export default TasksAside;
