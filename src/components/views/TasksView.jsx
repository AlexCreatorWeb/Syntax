import { useState } from "react";
import { useT } from "../../i18n/useT";
import { getTech } from "../../lib/techs";
import TECHS from "../../lib/techs";
import { getDoneTasks } from "../../lib/progress";

// Лого треков на уровне модуля: стабильные ссылки (react-compiler не любит getTech() в рендере)
const TRACK_LOGOS = Object.fromEntries(TECHS.map((tc) => [tc.id, tc.Logo]));

// Задания (UX-аудит Tasks): раздел знает о треке — tech-табы (синхронно с выбранным
// треком), заголовок «{Track} Tasks», счётчик «N of M · track», tech-empty-state.
// Карточка кликабельна целиком (паттерн roadmap-модуля). «All Statuses» — деактивен (soon).
const TASKS = [
  { id: 1, tech: "general", category: "string", difficulty: "easy", time: 15, xp: 50 },
  { id: 2, tech: "general", category: "data", difficulty: "medium", time: 30, xp: 150 },
  { id: 3, tech: "general", category: "algorithms", difficulty: "hard", locked: true },
  { id: 4, tech: "javascript", category: "algorithms", difficulty: "medium", time: 25, xp: 120 },
  { id: 5, tech: "javascript", category: "data", difficulty: "easy", time: 10, xp: 40 },
  { id: 6, tech: "python", category: "data", difficulty: "easy", time: 12, xp: 45 },
  { id: 7, tech: "python", category: "algorithms", difficulty: "medium", time: 35, xp: 150 },
  { id: 8, tech: "postgres", category: "data", difficulty: "medium", time: 20, xp: 100 },
  { id: 9, tech: "html", category: "data", difficulty: "easy", time: 12, xp: 45 },
  { id: 10, tech: "html", category: "data", difficulty: "medium", time: 20, xp: 100 },
  { id: 11, tech: "css", category: "algorithms", difficulty: "medium", time: 25, xp: 120 },
  { id: 12, tech: "css", category: "algorithms", difficulty: "easy", time: 10, xp: 40 },
];

const CATEGORIES = ["string", "data", "algorithms"];

function ChevronIcon() {
  return (
    <svg
      className="filter-btn__chevron"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function TaskCard({ task, t, onSolve, done }) {
  const item = t("tasks.items")[task.id - 1];
  const TrackLogo = TRACK_LOGOS[task.tech];

  // Единое правило «карточка действия = кликабельна целиком» (паттерн roadmap)
  const open = (e) => {
    if (task.locked) return;
    if (e.target.closest("button")) return; // кнопку обрабатывает она сама
    onSolve(task.id - 1, task.tech);
  };

  return (
    <article
      className={`card task-card ${task.locked ? "task-card--locked" : "task-card--open"}`}
      role={task.locked ? undefined : "button"}
      tabIndex={task.locked ? undefined : 0}
      onClick={open}
      onKeyDown={task.locked ? undefined : (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSolve(task.id - 1, task.tech); }
      }}
    >
      <div className="task-card__body">
        <div className="task-card__meta-top">
          <span className="chip">{t(`tasks.categories.${task.category}`)}</span>
          {done && (
            <span className="chip chip--done">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg>
              {t("tasks.done")}
            </span>
          )}
          <span className={`difficulty difficulty--${task.difficulty}`}>
            {t(`tasks.${task.difficulty}`)}
          </span>
        </div>
        <h3 className="task-card__title">
          {item.title}
          {task.locked && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="4" y="11" width="16" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
          )}
        </h3>
        <p className="task-card__desc">{item.desc}</p>
        {/* Микрострока-привязка: откуда задача (трек) */}
        {TrackLogo && (
          <span className="task-card__track">
            <TrackLogo />
            {t(`home.tech.${task.tech}`)}
          </span>
        )}
        {!task.locked && (
          <div className="task-card__meta">
            <span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
              {task.time} {t("tasks.minutes")}
            </span>
            <span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="4.5" />
                <circle cx="12" cy="12" r="1" fill="currentColor" />
              </svg>
              {task.xp} {t("tasks.xp")}
            </span>
          </div>
        )}
      </div>
      {task.locked ? (
        <button type="button" className="btn btn--secondary task-card__action" disabled>
          {t("tasks.locked")}
        </button>
      ) : done ? (
        <button type="button" className="btn btn--ghost task-card__action" onClick={() => onSolve(task.id - 1, task.tech)}>
          {t("tasks.reopen")}
        </button>
      ) : (
        <button type="button" className="btn btn--primary task-card__action" onClick={() => onSolve(task.id - 1, task.tech)}>
          {t("tasks.solve")}
        </button>
      )}
    </article>
  );
}

function TasksView({ activeTech, onSelectTech, onSolve }) {
  const t = useT();
  const [difficulty, setDifficulty] = useState("all");
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  // Tech-фильтр: синхронен с выбранным треком через key-перемонтирование в MainContent
  // (key=activeTech); «General» — локальный просмотр
  const [techFilter, setTechFilter] = useState(() => (getTech(activeTech) ? activeTech : "general"));
  // Выполненные задания (успешный Submit в редакторе) — ключ `tech:taskId`
  const doneSet = new Set(getDoneTasks());

  const tech = getTech(techFilter);
  const items = t("tasks.items");

  const pool = TASKS.filter((task) => task.tech === techFilter);
  const visible = pool.filter((task) => {
    const okDiff = difficulty === "all" || task.difficulty === difficulty;
    const okCat = category === "all" || task.category === category;
    const okQuery = !query || items[task.id - 1].title.toLowerCase().includes(query.toLowerCase());
    return okDiff && okCat && okQuery;
  });

  const selectTechTab = (id) => {
    onSelectTech(id); // глобальный выбор трека (пersistence, deep-link-совместимый)
    setTechFilter(id);
  };

  const clearFilters = () => {
    setDifficulty("all");
    setCategory("all");
    setQuery("");
  };

  const contextName = tech ? t(tech.label) : t("tasks.general");

  return (
    <div className="tasks-view">
      <header className="tasks-head">
        <div className="page-head">
          <h1 className="page-head__title">
            {tech ? t("tasks.trackTitle", { tech: t(tech.label) }) : t("tasks.generalTitle")}
          </h1>
          <p className="page-head__desc">{t("tasks.desc")}</p>
        </div>
        <div className="tasks-head__controls">
          <label className="filter-btn filter-btn--select">
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              aria-label={t("tasks.allDifficulties")}
            >
              <option value="all">{t("tasks.allDifficulties")}</option>
              <option value="easy">{t("tasks.easy")}</option>
              <option value="medium">{t("tasks.medium")}</option>
              <option value="hard">{t("tasks.hard")}</option>
            </select>
            <ChevronIcon />
          </label>
          {/* Статусы появятся с бэкендом — контрол честно деактивен */}
          <button type="button" className="filter-btn filter-btn--soon" title={t("home.soon")} aria-disabled="true">
            {t("tasks.allStatuses")}
            <span className="soon-badge">{t("home.soon")}</span>
          </button>
          <div className="tasks-search">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("tasks.search")}
              aria-label={t("tasks.search")}
            />
          </div>
        </div>
      </header>

      {/* Tech-табы: технологии по порядку каталога, «General» — в конце (UX-фидбек) */}
      <div className="tech-switch" role="tablist" aria-label={t("techPage.changeTrack")}>
        {TECHS.map((tc) => {
          const TLogo = tc.Logo;
          return (
            <button
              key={tc.id}
              type="button"
              role="tab"
              aria-selected={techFilter === tc.id}
              className={`tech-switch__item ${techFilter === tc.id ? "tech-switch__item--active" : ""}`}
              onClick={() => selectTechTab(tc.id)}
            >
              <TLogo />
              <span>{t(tc.label)}</span>
            </button>
          );
        })}
        <button
          type="button"
          role="tab"
          aria-selected={techFilter === "general"}
          className={`tech-switch__item ${techFilter === "general" ? "tech-switch__item--active" : ""}`}
          onClick={() => setTechFilter("general")}
        >
          <span className="tech-switch__icon-glyph" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" />
            </svg>
          </span>
          <span>{t("tasks.general")}</span>
        </button>
      </div>

      {/* Чипы категорий + строка состояния списка: масштаб и активный контекст */}
      <div className="tasks-meta-row">
        <div className="task-chips">
          <button
            type="button"
            className={`task-chip ${category === "all" ? "task-chip--active" : ""}`}
            onClick={() => setCategory("all")}
          >
            {t("tasks.allCategories")}
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className={`task-chip ${category === c ? "task-chip--active" : ""}`}
              onClick={() => setCategory(c)}
            >
              {t(`tasks.categories.${c}`)}
            </button>
          ))}
        </div>
        <span className="tasks-count">
          {t("tasks.countLine", { n: visible.length, m: pool.length, tech: contextName })}
        </span>
      </div>

      <div className="task-list">
        {visible.map((task) => (
          <TaskCard key={task.id} task={task} t={t} onSolve={onSolve} done={doneSet.has(`${task.tech}:${task.id}`)} />
        ))}

        {/* Tech-empty: задач по треку нет — путь дальше, а не констатация пустоты */}
        {visible.length === 0 && pool.length === 0 && tech && (
          <div className="tasks-empty">
            <span className="tasks-empty__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="7" width="18" height="13" rx="2" />
                <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <path d="M3 12h18" />
              </svg>
            </span>
            <p className="tasks-empty__text">{t("tasks.techEmptyTitle", { tech: t(tech.label) })}</p>
            <button type="button" className="btn btn--ghost" onClick={() => setTechFilter("general")}>
              {t("tasks.techEmptyCta")}
            </button>
            <p className="tasks-empty__hint">{t("tasks.techEmptyLine")}</p>
          </div>
        )}

        {/* Search-empty: текст с запросом + выход из состояния в 1 действие */}
        {visible.length === 0 && pool.length > 0 && query && (
          <div className="tasks-empty">
            <span className="tasks-empty__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3M8.5 11h5" />
              </svg>
            </span>
            <p className="tasks-empty__text">{t("tasks.noResultsQuery", { q: query })}</p>
            <button type="button" className="btn btn--ghost" onClick={() => setQuery("")}>
              {t("tasks.clearSearch")}
            </button>
          </div>
        )}

        {/* Пусто по фильтрам сложности/категории */}
        {visible.length === 0 && pool.length > 0 && !query && (
          <div className="tasks-empty">
            <span className="tasks-empty__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 5h16l-6 7v5l-4 2v-7L4 5Z" />
              </svg>
            </span>
            <p className="tasks-empty__text">{t("tasks.noResults")}</p>
            <button type="button" className="btn btn--ghost" onClick={clearFilters}>
              {t("tasks.clearFilters")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TasksView;
