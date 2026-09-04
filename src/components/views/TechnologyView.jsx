import { useEffect } from "react";
import { useT } from "../../i18n/useT";
import { useLanguage } from "../../context/useLanguage";
import { getTech } from "../../lib/techs";
import { getCompleted, prefixOfCompleted } from "../../lib/progress";
import { localizedLessonTitle } from "../../lib/lessonTitles";
import { hasRecentFeature } from "../../lib/web-features";
import TechSwitch from "../TechSwitch";

// Страница технологии (макет: technology-page).
// Контент (описание, модули, ресурсы, AI-пример, урок) — в i18n: `techs.{id}`
// (EN base + RU; uk/es/de откатываются на EN). UI-строки — `techPage.*` (5 языков).
function TechnologyView({
    techId,
    onResume,
    onOpenDbLesson,
    dbLessons,
    onSelectTech,
    onNavigate,
    isAuthed = false,
}) {
    const t = useT();
    const { langCode } = useLanguage();
    const tech = getTech(techId) || getTech("javascript");
    const Logo = tech.Logo;
    const content = t(`techs.${tech.id}`);
    // Уроки трека из Supabase (таблица lessons, tech = id трека): нумерация с 1
    const dbTechLessons = (dbLessons || []).filter((l) => l.tech === tech.id);

    // Прогресс курса: реальный, по отметкам выполнения (localStorage, успешный Submit).
    // Без уроков в БД (другие треки) — демо-значение из i18n.
    // Валидный прогресс = ТОЛЬКО последовательный префикс (Udemy): отметка
    // «в дыре» (L15 при непройденных L2–L14) не светится пройденной.
    const completed = prefixOfCompleted(dbTechLessons, getCompleted(tech.id));
    const hasDb = dbTechLessons.length > 0;
    const dbDone = completed.length;
    const pct = hasDb
        ? Math.round((dbDone / dbTechLessons.length) * 100)
        : content.pct;
    const firstOpen = hasDb
        ? dbTechLessons.find((l) => !completed.includes(l.id))
        : null;
    const progressLine = hasDb
        ? firstOpen
            ? t("techPage.lessonOf", {
                  n: dbTechLessons.indexOf(firstOpen) + 1,
                  m: dbTechLessons.length,
              })
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
                <span className="tech-page__logo">
                    <Logo />
                </span>
                <div className="tech-page__hero-body">
                    <div className="tech-page__hero-title">
                        <h1 className="tech-page__name">{t(tech.label)}</h1>
                        <span className="chip chip--live">
                            {t("techPage.live")}
                        </span>
                        <span className="tech-page__lessons">
                            {t("techPage.lessons", {
                                n: hasDb ? dbTechLessons.length : tech.lessons,
                            })}
                        </span>
                    </div>
                    <p className="tech-page__desc">{content.desc}</p>
                </div>
            </section>

            {/* Шапка технологий: единый блок (TechSwitch), как на «Дорожной карте» —
          пользователь приходит с гостевой карточки и должен видеть тот же верхний блок */}
            <TechSwitch activeId={tech.id} onSelect={onSelectTech} />

            {/* Course Progress: где я + действие */}
            {/* Прогресс курса — привязан к ЭТОЙ технологии (фидбек 2026-09): реальный, по отметкам
          выполнения (localStorage, успешный Submit). Гостю — без процентов: чей это прогресс
          и какой трек было непонятно — вместо него честный интро-блок «N уроков · начать». */}
            <section className="card tech-page__progress spotlight">
                <div className="tech-page__progress-head">
                    <h2 className="tech-page__card-title">
                        {isAuthed
                            ? t("techPage.progress")
                            : t("techPage.course")}
                    </h2>
                    {isAuthed && <span className="tech-page__pct">{pct}%</span>}
                </div>
                <p className="tech-page__progress-module">
                    {isAuthed
                        ? progressLine
                        : hasDb
                          ? t("techPage.guestLine", { m: dbTechLessons.length })
                          : content.progressModule}
                </p>
                {isAuthed && (
                    <div
                        className="bar"
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                    >
                        <div
                            className="bar__fill"
                            style={{ width: `${pct}%` }}
                        ></div>
                    </div>
                )}
                <div className="tech-page__cta-row">
                    <button
                        type="button"
                        className="btn btn--primary tech-page__cta"
                        onClick={() => onResume(tech.id)}
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="m8 6 8 6-8 6V6Z" />
                        </svg>
                        {isAuthed
                            ? t("techPage.continue")
                            : t("techPage.start")}
                    </button>
                    {/* UX-аудит: OPEN TRACK — явная кнопка перехода в карту курса (hero-статус не читается как CTA) */}
                    <button
                        type="button"
                        className="btn btn--ghost tech-page__cta"
                        onClick={() => onNavigate("roadmap")}
                    >
                        {t("techPage.openTrack")}
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
            </section>

            {/* Lessons: уроки трека из базы (Supabase), кликабельны — открываются в редакторе */}
            {dbTechLessons.length > 0 && (
                <section className="tech-page__dblessons">
                    <div className="tech-page__section-head">
                        <h2 className="tech-page__section-title">
                            {t("techPage.dbLessons")}
                        </h2>
                        {/* UX-аудит: язык курса честный (контент RU, UI любой) — мелкая пометка, не чип */}
                        <span className="tech-page__lang-note">
                            {t("lessonView.courseLangNote")}
                        </span>
                    </div>
                    <div className="techmod-list">
                        {/* NEW-лейбл: только если урок про НОВУЮ технологию (фича ≤ 3 лет — словарь web-features.js),
                а не про добавление урока в базу: popover в HTML — NEW, <table> с 2005 года — нет. */}
                        {dbTechLessons.map((l, i) => {
                            // Последовательная разблокировка (механика Udemy):
                            // урок открыт, если предыдущий завершён (видео ≥ 75% или Submit).
                            const isDone = completed.includes(l.id);
                            const openIdx = dbTechLessons.findIndex(
                                (x) => !completed.includes(x.id),
                            );
                            const status = isDone
                                ? "done"
                                : i === openIdx
                                  ? "current"
                                  : "locked";
                            const clickable = status !== "locked";
                            return (
                                <article
                                    key={l.id}
                                    className={`card techmod techmod--db ${
                                        status === "locked"
                                            ? "techmod--db--locked"
                                            : status === "done"
                                              ? "techmod--db--done"
                                              : ""
                                    }`}
                                    role={clickable ? "button" : undefined}
                                    tabIndex={clickable ? 0 : undefined}
                                    aria-disabled={clickable ? undefined : true}
                                    aria-current={
                                        status === "current"
                                            ? "step"
                                            : undefined
                                    }
                                    onClick={
                                        clickable
                                            ? () => onOpenDbLesson(l, tech.id)
                                            : undefined
                                    }
                                    onKeyDown={
                                        clickable
                                            ? (e) => {
                                                  if (
                                                      e.key === "Enter" ||
                                                      e.key === " "
                                                  ) {
                                                      e.preventDefault();
                                                      onOpenDbLesson(
                                                          l,
                                                          tech.id,
                                                      );
                                                  }
                                              }
                                            : undefined
                                    }
                                >
                                    <span
                                        className={`techmod__icon techmod__icon--${status}`}
                                        aria-hidden="true"
                                    >
                                        {status === "done" ? (
                                            <svg
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2.4"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <path d="m5 12 5 5 9-10" />
                                            </svg>
                                        ) : status === "locked" ? (
                                            <svg
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <rect
                                                    x="4"
                                                    y="11"
                                                    width="16"
                                                    height="10"
                                                    rx="2"
                                                />
                                                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                                            </svg>
                                        ) : (
                                            <svg
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <path d="m8 6 8 6-8 6V6Z" />
                                            </svg>
                                        )}
                                    </span>
                                    <div className="techmod__body">
                                        <h3 className="techmod__title">
                                            {i + 1}.{" "}
                                            {localizedLessonTitle(
                                                tech.id,
                                                i + 1,
                                                l.title,
                                                langCode,
                                            )}
                                        </h3>
                                        <p className="techmod__desc">
                                            {status === "done"
                                                ? t("techPage.completed")
                                                : status === "locked"
                                                  ? t("techPage.lessonLocked", {
                                                        n: i,
                                                    })
                                                  : t("techPage.dbLessonOpen")}
                                        </p>
                                    </div>
                                    {/* NEW: урок про свежую технологию (см. web-features.js) */}
                                    {hasRecentFeature(
                                        `${l.title} ${l.content || ""}`,
                                    ) && (
                                        <span className="chip chip--new">
                                            NEW
                                        </span>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                </section>
            )}
        </div>
    );
}

export default TechnologyView;
