import { useT } from "../../i18n/useT";
import { getTech } from "../../lib/techs";
import { getCompleted } from "../../lib/progress";
import TechSwitch from "../TechSwitch";

// Дорожная карта = карта РЕАЛЬНОГО курса активного трека:
// уроки — из таблицы `lessons` (tech = id трека, порядок = порядок id),
// прогресс — localStorage (lib/progress: отметки ставятся успешным Submit в редакторе).
// Состояния: null = БД грузится (скелетон) · есть уроки = таймлайн · пусто = empty-state
// с CTA на курс HTML. Демо-модули i18n (modules) убраны.
function RoadmapNode({ status, big }) {
  const cls = `roadmap__node roadmap__node--${status} ${big ? "roadmap__node--big" : ""}`;
  if (status === "done") {
    return (
      <span className={cls} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5 9-10" /></svg>
      </span>
    );
  }
  if (status === "current") {
    return (
      <span className={cls} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="m8 6 8 6-8 6V6Z" /></svg>
      </span>
    );
  }
  return (
    <span className={cls} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
    </span>
  );
}

function LessonRow({ lesson, i, status, onOpen }) {
  const t = useT();
  const isCurrent = status === "current";
  const isDone = status === "done";
  const isLocked = status === "locked";
  const clickable = isCurrent || isDone;
  const statusLabel = isCurrent
    ? t("techPage.inProgress")
    : isLocked
      ? t("techPage.locked")
      : t("techPage.completed");

  return (
    <div className={`roadmap__item ${isCurrent ? "roadmap__item--current" : ""}`}>
      <RoadmapNode status={status} big={isCurrent} />
      <div
        className={`card roadmap__card ${isCurrent ? "roadmap__card--current" : ""} ${isLocked ? "roadmap__card--locked" : ""} ${isDone ? "roadmap__card--review" : ""}`}
        role={clickable ? "button" : undefined}
        tabIndex={clickable ? 0 : undefined}
        aria-current={isCurrent ? "step" : undefined}
        onClick={clickable ? () => onOpen(lesson) : undefined}
        onKeyDown={clickable ? (e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(lesson); }
        } : undefined}
      >
        <div className="roadmap__card-head">
          <span className="roadmap__num">{String(i + 1).padStart(2, "0")}</span>
          <strong className="roadmap__title">{lesson.title}</strong>
          <span className={`roadmap__chip roadmap__chip--${status === "done" ? "done" : status}`}>{statusLabel}</span>
        </div>
        {isCurrent && <p className="roadmap__desc">{t("roadmap.currentHint")}</p>}
      </div>
    </div>
  );
}

function RoadmapView({ activeTech, onSelectTech, onResume, dbLessons, onOpenDbLesson, onNavigate }) {
  const t = useT();
  const tech = getTech(activeTech) || getTech("html");
  const TechLogo = tech.Logo;
  const lessons = (dbLessons || []).filter((l) => l.tech === tech.id);
  const completed = getCompleted(tech.id);
  const doneCount = lessons.filter((l) => completed.includes(l.id)).length;
  const currentIdx = lessons.findIndex((l) => !completed.includes(l.id));
  const allDone = lessons.length > 0 && doneCount === lessons.length;
  const pct = lessons.length ? Math.round((doneCount / lessons.length) * 100) : 0;
  const firstLockedIdx = currentIdx < 0 ? lessons.length : currentIdx + 1;

  // БД ещё грузится — скелетон (после загрузки null больше не приходит)
  if (dbLessons === null) {
    return (
      <div className="roadmap-view">
        {/* Хлебные крошки: понятный возврат (Главная → Дорожная карта) */}
        <nav className="page-crumbs" aria-label={t("roadmap.crumbsLabel")}>
          <button type="button" onClick={() => onNavigate("home")}>{t("roadmap.backHome")}</button>
          <span className="page-crumbs__sep" aria-hidden="true">/</span>
          <span className="page-crumbs__current">{t("roadmap.heading")}</span>
        </nav>        <header className="page-head">
          <h1 className="page-head__title">{t("roadmap.heading")}</h1>
          <p className="page-head__desc">{t("roadmap.trackDesc", { tech: t(tech.label) })}</p>
        </header>
        <TechSwitch activeId={tech.id} onSelect={onSelectTech} />
        <div className="card roadmap__status spotlight" aria-busy="true">
          <div className="roadmap__status-text">
            <div className="roadmap__skel roadmap__skel--title"></div>
            <div className="roadmap__skel roadmap__skel--sub"></div>
          </div>
          <div className="roadmap__skel roadmap__skel--btn"></div>
        </div>
        <div className="roadmap">
          <div className="roadmap__line" aria-hidden="true"></div>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="roadmap__item">
              <RoadmapNode status="locked" />
              <div className="card roadmap__card">
                <div className="roadmap__skel roadmap__skel--row" style={{ animationDelay: `${i * 90}ms` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Трека без уроков в БД — честный empty-state (паттерн docs-empty) + CTA на курс HTML
  if (lessons.length === 0) {
    return (
      <div className="roadmap-view">
        {/* Хлебные крошки: понятный возврат (Главная → Дорожная карта) */}
        <nav className="page-crumbs" aria-label={t("roadmap.crumbsLabel")}>
          <button type="button" onClick={() => onNavigate("home")}>{t("roadmap.backHome")}</button>
          <span className="page-crumbs__sep" aria-hidden="true">/</span>
          <span className="page-crumbs__current">{t("roadmap.heading")}</span>
        </nav>        <header className="page-head">
          <h1 className="page-head__title">{t("roadmap.heading")}</h1>
          <p className="page-head__desc">{t("roadmap.trackDesc", { tech: t(tech.label) })}</p>
        </header>
        <TechSwitch activeId={tech.id} onSelect={onSelectTech} />
        <div className="docs-empty">
          <div className="docs-empty__logo"><TechLogo /></div>
          <h2 className="docs-empty__title">{t("roadmap.emptyTitle", { tech: t(tech.label) })}</h2>
          <p className="docs-empty__body">{t("roadmap.emptyBody")}</p>
          <div className="docs-empty__actions">
            <button type="button" className="btn btn--primary" onClick={() => onSelectTech("html")}>
              {t("roadmap.emptyCta")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const openLessonRow = (lesson) => onOpenDbLesson(lesson, tech.id, "roadmap");

  return (
    <div className="roadmap-view">
      {/* Хлебные крошки: понятный возврат (Главная → Дорожная карта) */}
      <nav className="page-crumbs" aria-label={t("roadmap.crumbsLabel")}>
        <button type="button" onClick={() => onNavigate("home")}>{t("roadmap.backHome")}</button>
        <span className="page-crumbs__sep" aria-hidden="true">/</span>
        <span className="page-crumbs__current">{t("roadmap.heading")}</span>
      </nav>      <header className="page-head">
        <h1 className="page-head__title">{t("roadmap.heading")}</h1>
        <p className="page-head__desc">{t("roadmap.trackDesc", { tech: t(tech.label) })}</p>
      </header>

      {/* Переключатель треков: смена активного трека прямо на карте */}
      <TechSwitch activeId={tech.id} onSelect={onSelectTech} />

      {/* Статус прохождения (реальный: localStorage × уроки трека) */}
      <div className="card roadmap__status spotlight">
        <div className="roadmap__status-text">
          <strong>{allDone ? t("roadmap.courseDone") : t("roadmap.lessonStatus", { m: (currentIdx < 0 ? lessons.length : currentIdx) + 1, n: lessons.length })}</strong>
          <span>{t("roadmap.doneOf", { a: doneCount, b: lessons.length })} · {pct}%</span>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => onResume(tech.id)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><path d="m8 6 8 6-8 6V6Z" /></svg>
          {t("techPage.continue")}
        </button>
      </div>

      {/* Таймлайн курса: завершённые (кликабельны — повторить) → текущий → locked */}
      <div className="roadmap">
        <div className="roadmap__line" aria-hidden="true"></div>
        {lessons.map((lesson, i) => {
          const status =
            completed.includes(lesson.id) ? "done" : i === currentIdx ? "current" : "locked";
          const showUpNext = status === "locked" && i === firstLockedIdx;
          return (
            <div key={lesson.id}>
              {showUpNext && <p className="roadmap__group-label">{t("roadmap.upNext")}</p>}
              <LessonRow lesson={lesson} i={i} status={status} onOpen={openLessonRow} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RoadmapView;
