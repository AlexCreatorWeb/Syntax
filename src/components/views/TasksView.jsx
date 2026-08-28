import { useState } from "react";
import { useT } from "../../i18n/useT";

const TASKS = [
  {
    id: 1,
    category: "string",
    difficulty: "easy",
    time: 15,
    xp: 50,
  },
  {
    id: 2,
    category: "data",
    difficulty: "medium",
    time: 30,
    xp: 150,
  },
  {
    id: 3,
    category: "algorithms",
    difficulty: "hard",
    locked: true,
  },
];

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

function TaskCard({ task, t, onSolve }) {
  const item = t("tasks.items")[task.id - 1];
  return (
    <article className={`card task-card ${task.locked ? "task-card--locked" : ""}`}>
      <div className="task-card__body">
        <div className="task-card__meta-top">
          <span className="chip">{t(`tasks.categories.${task.category}`)}</span>
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
      ) : (
        <button type="button" className="btn btn--primary task-card__action" onClick={() => onSolve(task.id - 1)}>
          {t("tasks.solve")}
        </button>
      )}
    </article>
  );
}

function TasksView({ onSolve }) {
  const t = useT();
  const [difficulty, setDifficulty] = useState("all");
  const [query, setQuery] = useState("");

  const items = t("tasks.items");
  const visible = TASKS.filter((task) => {
    const okDiff = difficulty === "all" || task.difficulty === difficulty;
    const okQuery = !query || items[task.id - 1].title.toLowerCase().includes(query.toLowerCase());
    return okDiff && okQuery;
  });

  return (
    <div className="tasks-view">
      <header className="tasks-head">
        <div className="page-head">
          <h1 className="page-head__title">{t("tasks.title")}</h1>
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
          <button
            type="button"
            className="filter-btn"
            title={t("home.soon")}
            aria-disabled="true"
          >
            {t("tasks.allStatuses")}
            <ChevronIcon />
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

      <div className="task-list">
        {visible.map((task) => (
          <TaskCard key={task.id} task={task} t={t} onSolve={onSolve} />
        ))}
        {visible.length === 0 && (
          <div className="tasks-empty">{t("tasks.noResults")}</div>
        )}
      </div>
    </div>
  );
}

export default TasksView;
