import { useEffect } from "react";
import { useT } from "../../i18n/useT";
import { getTech } from "../../lib/techs";
import { getCompleted } from "../../lib/progress";

// Страница технологии (макет: technology-page).
// Контент (описание, модули, ресурсы, AI-пример, урок) — в i18n: `techs.{id}`
// (EN base + RU; uk/es/de откатываются на EN). UI-строки — `techPage.*` (5 языков).
function TechnologyView({ techId, onResume, onOpenDbLesson, dbLessons, onNavigate }) {
  const t = useT();
  const tech = getTech(techId) || getTech("javascript");
  const Logo = tech.Logo;
  const content = t(`techs.${tech.id}`);
  // Уроки трека из Supabase (таблица lessons, tech = id трека): нумерация с 1
  const dbTechLessons = (dbLessons || []).filter((l) => l.tech === tech.id);

  // Прогресс курса: реальный, по отметкам выполнения (localStorage, успешный Submit).
  // Без уроков в БД (другие треки) — демо-значение из i18n.
  const completed = getCompleted(tech.id);
  const hasDb = dbTechLessons.length > 0;
  const dbDone = dbTechLessons.filter((l) => completed.includes(l.id)).length;
  const pct = hasDb ? Math.round((dbDone / dbTechLessons.length) * 100) : content.pct;
  const firstOpen = hasDb ? dbTechLessons.find((l) => !completed.includes(l.id)) : null;
  const progressLine = hasDb
    ? firstOpen
      ? t("techPage.lessonOf", { n: dbTechLessons.indexOf(firstOpen) + 1, m: dbTechLessons.length })
      : t("techPage.done")
    : content.progressModule;

  // K3: вход на страницу трека — всегда с верха (hero + CTA в первом кадре)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tech.id]);

  return (
    <div className="tech-page">
      {/* Hero: лого + название + статус доступности + объём + описание */}
      <section className="card card--feature tech-page__hero spotlight">
        <span className="tech-page__logo"><Logo /></span>
        <div className="tech-page__hero-body">
          <div className="tech-page__hero-title">
            <h1 className="tech-page__name">{t(tech.label)}</h1>
            <span className="chip chip--live">{t("techPage.live")}</span>
            <span className="tech-page__lessons">{t("techPage.lessons", { n: hasDb ? dbTechLessons.length : tech.lessons })}</span>
          </div>
          <p className="tech-page__desc">{content.desc}</p>
        </div>
      </section>

      {/* Change track: быстрый выход из контекста трека в каталог (UX-аудит п.7) */}
      <button type="button" className="tech-page__change" onClick={() => onNavigate && onNavigate("roadmap")}>
        {t("techPage.changeTrack")}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>

      {/* Course Progress: где я + действие */}
      <section className="card tech-page__progress spotlight">
        <div className="tech-page__progress-head">
          <h2 className="tech-page__card-title">{t("techPage.progress")}</h2>
          <span className="tech-page__pct">{pct}%</span>
        </div>
        <p className="tech-page__progress-module">{progressLine}</p>
        <div
          className="bar"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="bar__fill" style={{ width: `${pct}%` }}></div>
        </div>
        <button type="button" className="btn btn--primary tech-page__cta" onClick={() => onResume(tech.id)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
            <path d="m8 6 8 6-8 6V6Z" />
          </svg>
          {t("techPage.continue")}
        </button>
      </section>

      {/* Lessons: уроки трека из базы (Supabase), кликабельны — открываются в редакторе */}
      {dbTechLessons.length > 0 && (
        <section className="tech-page__dblessons">
          <h2 className="tech-page__section-title">{t("techPage.dbLessons")}</h2>
          <div className="techmod-list">
            {dbTechLessons.map((l, i) => (
              <article
                key={l.id}
                className="card techmod techmod--db"
                role="button"
                tabIndex={0}
                aria-current={i === 0 ? "step" : undefined}
                onClick={() => onOpenDbLesson(l, tech.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpenDbLesson(l, tech.id); }
                }}
              >
                <span className="techmod__icon techmod__icon--current" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m8 6 8 6-8 6V6Z" />
                  </svg>
                </span>
                <div className="techmod__body">
                  <h3 className="techmod__title">{i + 1}. {l.title}</h3>
                  <p className="techmod__desc">{t("techPage.dbLessonOpen")}</p>
                </div>
                {/* Красный NEW: три последних урока трека (материал про свежие обновления; пока по позиции — дальше колонка-флаг) */}
                {i >= dbTechLessons.length - 3 && <span className="chip chip--new">NEW</span>}
              </article>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}

export default TechnologyView;
