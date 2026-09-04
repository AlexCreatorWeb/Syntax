import { useEffect, useState } from "react";
import { useT } from "../i18n/useT";
import { useLanguage } from "../context/useLanguage";
import { secondsToMidnight } from "../lib/daily";
import { pickDailyTask, locField, locCategory } from "../lib/tasks";
import { getDoneTasks } from "../lib/progress";
import { taskJobFor } from "../lib/taskJob";
import TECHS from "../lib/techs";

// Static-мапа лого (react-compiler: не создавать компоненты в рендере)
const TRACK_LOGOS = Object.fromEntries(TECHS.map((tc) => [tc.id, tc.Logo]));

function formatTime(total) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

// Фолбэк-«огонёк» (каталог задач пуст — трека нет, логотип некуда взять)
function FlameIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 21c3.5 0 6-2.4 6-5.6 0-2.1-1.1-3.9-2.4-5.4C14.4 8.6 13 7 13 4.5c0 0-4.5 2-4.5 6 0-1-.5-2-1.5-2.8C6 9.4 6 11.6 6 15.4 6 18.6 8.5 21 12 21Z" />
      <path d="M12 21c-1.7 0-3-1.3-3-3 0-1.4.8-2.4 1.6-3.3.6-.7 1.4-1.6 1.4-2.7 0 0 2 1.4 2 3.5 0 .8.4 1.2.4 2.5 0 1.7-1 3-2.4 3Z" />
    </svg>
  );
}

/**
 * Плашка «Ежедневные испытания» (2026-09: реальные задачи из каталога).
 * Пул — задачи с dailyChallenge=true; сложность по дням: пн–чт easy, пт–сб medium,
 * вс hard. Выбор детерминирован на день (lib/tasks.js: pickDailyTask) — сегодня у
 * всех одно испытание, завтра другое. Награда: +500 XP (раз в день) + XP задачи.
 *
 * @param {object} props
 * @param {boolean} props.isAuthed гость → Accept ведёт в auth-модалку (ctx challenge)
 * @param {Function} props.onAuth (mode, ctx)
 * @param {Function} props.onNavigate (tab, job)
 * @param {string} props.backTab куда «Назад» из задачи
 */
function DailyChallenge({ isAuthed, onAuth, onNavigate, backTab = "tasks" }) {
  const t = useT();
  const { langCode } = useLanguage();

  // Реальный таймер до полуночи
  const [seconds, setSeconds] = useState(() => secondsToMidnight());
  useEffect(() => {
    const id = setInterval(() => setSeconds(secondsToMidnight()), 1000);
    return () => clearInterval(id);
  }, []);

  const task = pickDailyTask();
  // Лого трека задачи дня — вместо «огонька» в заголовке (цветное, маленькое)
  const TechLogo = task ? TRACK_LOGOS[task.track] : null;
  // Задача дня уже решена (сегодня или раньше) → виджет показывает статус, не CTA
  const taskDone = task
    ? getDoneTasks().includes(`${task.track}:${task.id}`)
    : false;

  const handleAccept = () => {
    if (!isAuthed) {
      onAuth("signup", "challenge");
      return;
    }
    if (task) {
      onNavigate("editor", taskJobFor(task, { langCode, backTab }));
      return;
    }
    // Фолбэк, если каталог пуст (не должно быть: контент в репо)
    onNavigate("editor", {
      kind: "task",
      title: t("tasks.daily.name"),
      desc: t("tasks.daily.desc"),
      backTab,
    });
  };

  return (
    <section className="card daily-challenge">
      <div className="daily-challenge__head">
        <span className="daily-challenge__title">
          {TechLogo ? <TechLogo /> : <FlameIcon />}
          {t("tasks.daily.title")}
        </span>
        {/* Таймер и подпись «сбрасывается» — только пока испытание НЕ решено: после выполнения обратный отсчёт и «сброс в полночь» смысла не имеют */}
        {!taskDone && (
          <div className="daily-challenge__timer">
            <span
              className="timer-chip"
              role="timer"
              aria-label={t("tasks.timerAria")}
            >
              {formatTime(seconds)}
            </span>
            <span className="daily-challenge__reset">
              {t("tasks.resetsDaily")}
            </span>
          </div>
        )}
      </div>

      {task ? (
        <>
          <h3 className="daily-challenge__name">
            {locField(task.title, langCode)}
          </h3>
          <p className="daily-challenge__desc">
            {t("tasks.daily.taskNote", {
              cat: locCategory(task, langCode),
              min: task.minutes,
            })}
          </p>
          <div className="daily-challenge__reward">
            <span className="xp">
              {taskDone ? `+${task.xp + 500} XP` : t("tasks.daily.xpReward")}
            </span>
            <span className={`badge-${task.difficulty}`}>
              {t(`tasks.${task.difficulty}`)}
            </span>
          </div>
          {taskDone ? (
            <button
              type="button"
              className="btn btn--ghost btn--full daily-challenge__done-btn"
              disabled
            >
              {t("tasks.daily.solved")} ✓
            </button>
          ) : (
            <button
              type="button"
              className="btn btn--ghost btn--full"
              onClick={handleAccept}
            >
              {t("tasks.daily.accept")}
            </button>
          )}
        </>
      ) : (
        // Каталог пуст (не должно случиться: задачи — статика в репо)
        <>
          <h3 className="daily-challenge__name">{t("tasks.daily.name")}</h3>
          <p className="daily-challenge__desc">{t("tasks.daily.desc")}</p>
          <div className="daily-challenge__reward">
            <span className="xp">{t("tasks.daily.xpReward")}</span>
          </div>
          <button
            type="button"
            className="btn btn--ghost btn--full"
            onClick={handleAccept}
          >
            {t("tasks.daily.accept")}
          </button>
        </>
      )}
    </section>
  );
}

export default DailyChallenge;
