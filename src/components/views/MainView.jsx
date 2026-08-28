import { useState } from "react";
import { useT } from "../../i18n/useT";

// Статичные данные домашнего дашборда (позже — с бэкенда)
const TECHS = [
  { id: "javascript", label: "home.tech.javascript", chip: "JS", chipClass: "tech-chip--js" },
  { id: "python", label: "home.tech.python", chip: "Py", chipClass: "tech-chip--py" },
  { id: "htmlcss", label: "home.tech.htmlcss", chip: "5", chipClass: "tech-chip--html" },
  { id: "react", label: "home.tech.react", chip: "atom", chipClass: "tech-chip--react" },
];

// Значения статистики (мокап)
const STATS = {
  students: "50k+",
  tasks: "1.2M",
  success: 94,
  velocity: "3.4x",
};

function TechChip({ tech }) {
  if (tech.chip === "atom") {
    return (
      <span className={`tech-chip ${tech.chipClass}`} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1">
          <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
          <ellipse cx="12" cy="12" rx="10" ry="4.1" />
          <ellipse cx="12" cy="12" rx="10" ry="4.1" transform="rotate(60 12 12)" />
          <ellipse cx="12" cy="12" rx="10" ry="4.1" transform="rotate(120 12 12)" />
        </svg>
      </span>
    );
  }
  return <span className={`tech-chip ${tech.chipClass}`}>{tech.chip}</span>;
}

function MainView({ onNavigate, onContinue }) {
  const t = useT();
  const [activeTech, setActiveTech] = useState("javascript");

  // Дуга donut-индикатора: r=36 => окружность ~226.2
  const C = 226.2;
  const successOffset = C * (1 - STATS.success / 100);

  return (
    <div className="home">
      {/* Поиск по командам и модулям (только внутри главной) */}
      <div className="home__search-wrap">
        <div className="home__search">
          <svg
            className="search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            placeholder={t("home.search")}
            aria-label={t("home.search")}
            onKeyDown={(e) => {
              if (e.key === "Enter") onNavigate("documentation");
            }}
          />
        </div>
      </div>

      {/* Продолжение обучения — главное для возвратного студента */}
      <section className="card home__continue">
        <div className="home__continue-main">
          <span className="label-caps home__greeting">{t("home.greeting")}</span>
          <div className="home__continue-head">
            <span className="chip chip--module">{t("lesson.chip")}</span>
            <h2 className="home__continue-title">{t("lesson.title")}</h2>
          </div>
          <div className="home__continue-progress">
            <div className="progress-labels">
              <span className="label-caps">{t("lesson.progress")}</span>
              <span className="label-caps progress-value">45%</span>
            </div>
            <div className="bar" role="progressbar" aria-valuenow={45} aria-valuemin={0} aria-valuemax={100}>
              <div className="bar__fill" style={{ width: "45%" }}></div>
            </div>
          </div>
        </div>
        <button type="button" className="btn btn--primary home__continue-btn" onClick={onContinue}>
          {t("lesson.continue")}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </section>

      {/* Селектор технологий */}
      <section className="home__tech" aria-label={t("home.tech.javascript")}>
        {TECHS.map((tech) => {
          const isActive = tech.id === activeTech;
          const isSoon = tech.id !== "javascript";
          return (
            <button
              key={tech.id}
              type="button"
              className={`tech-card ${isActive ? "tech-card--active" : ""}`}
              onClick={() => !isSoon && setActiveTech(tech.id)}
              aria-pressed={isActive}
              aria-disabled={isSoon || undefined}
              title={isSoon ? t("home.soon") : undefined}
            >
              <TechChip tech={tech} />
              <span className="tech-card__name">{t(tech.label)}</span>
              {isActive && <span className="tech-card__dot" aria-hidden="true" />}
              {isSoon && <span className="tech-card__soon">{t("home.soon")}</span>}
            </button>
          );
        })}
      </section>

      {/* Сетка статистики */}
      <section className="home__stats">
        <div className="stat-card">
          <span className="stat-card__label">{t("home.stats.activeStudents")}</span>
          <div>
            <div className="stat-card__value">{STATS.students}</div>
            <div className="stat-card__delta">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 17l6-6 4 4 8-8" />
                <path d="M14 7h7v7" />
              </svg>
              {t("home.stats.studentsDelta")}
            </div>
          </div>
        </div>

        <div className="stat-card stat-card--chart">
          <span className="stat-card__label">{t("home.stats.tasksSolved")}</span>
          <div>
            <div className="stat-card__value">{STATS.tasks}</div>
          </div>
          <div className="stat-card__chart" aria-hidden="true">
            <div className="stat-card__bar" style={{ height: "25%" }} />
            <div className="stat-card__bar" style={{ height: "50%" }} />
            <div className="stat-card__bar" style={{ height: "75%" }} />
            <div className="stat-card__bar" style={{ height: "100%" }} />
          </div>
        </div>

        <div className="stat-card stat-card--ring">
          <svg className="ring" viewBox="0 0 96 96" role="img" aria-label={`${t("home.stats.successRate")}: ${STATS.success}%`}>
            <circle className="ring__track" cx="48" cy="48" r="36" fill="none" strokeWidth="4" />
            <circle
              className="ring__fill"
              cx="48"
              cy="48"
              r="36"
              fill="none"
              strokeWidth="4"
              strokeDasharray={C}
              strokeDashoffset={successOffset}
            />
          </svg>
          <div className="stat-card__ring-label">
            <span className="stat-card__label">{t("home.stats.successRate")}</span>
            <span className="stat-card__ring-value">{STATS.success}%</span>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-card__label">{t("home.stats.velocity")}</span>
          <div>
            <div className="stat-card__value">{STATS.velocity}</div>
            <div className="stat-card__delta">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 19V5" />
                <path d="m5 12 7-7 7 7" />
              </svg>
              {t("home.stats.velocityDelta")}
            </div>
          </div>
        </div>
      </section>

      {/* Приветственный герой */}
      <section className="home__hero">
        <div className="home__hero-text">
          <h1 className="home__hero-title">{t("home.hero.title")}</h1>
          <p className="home__hero-desc">{t("home.hero.desc")}</p>
          <button type="button" className="btn btn--primary home__hero-btn" onClick={() => onNavigate("roadmap")}>
            {t("home.hero.start")}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
        <div className="home__hero-rings" aria-hidden="true">
          <div className="rings" />
        </div>
      </section>
    </div>
  );
}

export default MainView;
