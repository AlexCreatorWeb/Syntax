import { useT } from "../i18n/useT";
import { useLanguage } from "../context/useLanguage";
import TECHS from "../lib/techs";
import { getCompleted, prefixOfCompleted } from "../lib/progress";
import { localizedLessonTitle } from "../lib/lessonTitles";

// Логи треков — static-мапа (react-compiler: getTech().Logo в рендере ломает компилятор)
const TRACK_LOGOS = Object.fromEntries(
  TECHS.map((tech) => [tech.id, tech.Logo]),
);

/**
 * Карточка «Continue learning» — следующий урок АКТИВНОГО курса.
 * Живёт в rail главной (компакт) и вверху страницы Courses (тот же компонент).
 * Данные: уроки трека из БД + реальный прогресс (Udemy-префикс).
 * Если курс не начат или пройден — null (hero/каталог покрывают эти состояния).
 */
export default function ContinueLearning({
  techId,
  dbLessons,
  onContinue,
  onNavigate,
}) {
  const t = useT();
  const { langCode } = useLanguage();
  void onNavigate; // rail-вариант может вести и на Courses (onContinue решает)
  const rows = (dbLessons || []).filter((l) => l.tech === techId);
  if (!techId || rows.length === 0) return null;
  const completed = prefixOfCompleted(rows, getCompleted(techId));
  const nextIdx = rows.findIndex((l) => !completed.includes(l.id));
  if (nextIdx < 0) return null; // курс пройден
  const n = nextIdx + 1;
  const m = rows.length;
  const pct = Math.round((completed.length / m) * 100);
  const Logo = TRACK_LOGOS[techId];
  return (
    <div className="card continue-card">
      <div className="continue-card__head">
        <span className="label-caps continue-card__title">
          {t("continueLearning.title")}
        </span>
        {pct > 0 && <span className="continue-card__pct">{pct}%</span>}
      </div>
      <div className="continue-card__track">
        {Logo && (
          <span className="continue-card__logo">
            <Logo />
          </span>
        )}
        <span className="continue-card__name">
          {t(
            TECHS.find((tech) => tech.id === techId)?.label || "home.tech.html",
          )}
        </span>
      </div>
      <div className="continue-card__progress">
        <span className="continue-card__lesson">
          {t("continueLearning.progress", { n, m })}
        </span>
        <div
          className="bar bar--thin"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="bar__fill" style={{ width: `${pct}%` }}></div>
        </div>
      </div>
      <p className="continue-card__next">
        {t("continueLearning.next", {
          title: localizedLessonTitle(techId, n, rows[nextIdx].title, langCode),
        })}
      </p>
      <button
        type="button"
        className="btn btn--primary continue-card__cta"
        onClick={onContinue}
      >
        {t("continueLearning.button")}
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
  );
}
