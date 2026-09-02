import { useEffect, useState } from "react";
import { useT } from "../i18n/useT";
import { pickDailyChallenge, secondsToMidnight } from "../lib/daily";
import { lessonJobFor } from "../lib/lessonJob";

function formatTime(total) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

/**
 * Плашка «Ежедневные испытания».
 * Пул — только технологии с реально опубликованными уроками (dbLessons из БД);
 * выбор детерминирован на день (lib/daily.js): сегодня у всех одно испытание,
 * завтра — другое. dbLessons === null → скелетон, [] → статичный fallback.
 *
 * @param {object} props
 * @param {Array|null} props.dbLessons уроки из БД (null = грузится)
 * @param {boolean} props.isAuthed гость → Start ведёт в auth-модалку (ctx challenge)
 * @param {Function} props.onAuth (mode, ctx)
 * @param {Function} props.onNavigate (tab, job)
 * @param {string} props.backTab куда «Назад» из урока
 */
function DailyChallenge({ dbLessons, isAuthed, onAuth, onNavigate, backTab = "tasks" }) {
  const t = useT();
  // Реальный таймер до полуночи (ранее — фиктивные 14:22:05 «навсегда»)
  const [seconds, setSeconds] = useState(() => secondsToMidnight());
  useEffect(() => {
    const id = setInterval(() => setSeconds(secondsToMidnight()), 1000);
    return () => clearInterval(id);
  }, []);

  // null = ещё грузим БД; {} = пусто (fallback на статичное); иначе — daily-урок
  const daily = dbLessons === null ? null : pickDailyChallenge(dbLessons) || {};
  const isDaily = dbLessons !== null && Boolean(daily && daily.lesson);
  const techName = isDaily ? t(`home.tech.${daily.tech}`) || daily.tech : t("tasks.general");

  const handleAccept = () => {
    if (!isAuthed) {
      onAuth("signup", "challenge");
      return;
    }
    if (isDaily) {
      onNavigate("lesson", lessonJobFor(daily.lesson, daily.tech, backTab));
      return;
    }
    // Fallback-вариант (уроков в БД нет): исходное демо-задание в редакторе
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 21c3.5 0 6-2.4 6-5.6 0-2.1-1.1-3.9-2.4-5.4C14.4 8.6 13 7 13 4.5c0 0-4.5 2-4.5 6 0-1-.5-2-1.5-2.8C6 9.4 6 11.6 6 15.4 6 18.6 8.5 21 12 21Z" />
            <path d="M12 21c-1.7 0-3-1.3-3-3 0-1.4.8-2.4 1.6-3.3.6-.7 1.4-1.6 1.4-2.7 0 0 2 1.4 2 3.5 0 .8.4 1.2.4 2.5 0 1.7-1 3-2.4 3Z" />
          </svg>
          {t("tasks.daily.title")}
        </span>
        {/* Таймер и подпись — отдельная группа под заголовком (не конкурирует с ним за ширину) */}
        <div className="daily-challenge__timer">
          <span className="timer-chip" role="timer" aria-label={t("tasks.timerAria")}>
            {formatTime(seconds)}
          </span>
          <span className="daily-challenge__reset">{t("tasks.resetsDaily")}</span>
        </div>
      </div>

      {dbLessons === null ? (
        // Состояние загрузки: скелетон (шиммер общий с roadmap)
        <div className="daily-challenge__skel" aria-hidden="true">
          <div className="roadmap__skel roadmap__skel--title" />
          <div className="roadmap__skel roadmap__skel--sub" />
          <div className="roadmap__skel roadmap__skel--btn" />
        </div>
      ) : (
        <>
          <h3 className="daily-challenge__name">
            {isDaily ? daily.lesson.title : t("tasks.daily.name")}
            <span className="chip daily-challenge__general">{techName}</span>
          </h3>
          <p className="daily-challenge__desc">
            {isDaily ? t("tasks.daily.lessonNote", { tech: techName }) : t("tasks.daily.desc")}
          </p>
          <div className="daily-challenge__reward">
            <span className="xp">{t("tasks.daily.xpReward")}</span>
            <span className="badge-hard">{t("tasks.daily.hard")}</span>
          </div>
          <button type="button" className="btn btn--ghost btn--full" onClick={handleAccept}>
            {t("tasks.daily.accept")}
          </button>
        </>
      )}
    </section>
  );
}

export default DailyChallenge;
