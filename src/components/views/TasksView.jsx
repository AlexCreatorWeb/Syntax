import { useState, useRef, useEffect } from "react";
import { useT } from "../../i18n/useT";
import { useLanguage } from "../../context/useLanguage";
import TECHS, { getTech } from "../../lib/techs";
import { getDoneTasks } from "../../lib/progress";
import { tasksForTrack, categoriesForTrack, locField } from "../../lib/tasks";
import { InlineMd } from "../../lib/markdown-view";

// Лого треков на уровне модуля: стабильные ссылки (react-compiler не любит getTech() в рендере)
const TRACK_LOGOS = Object.fromEntries(TECHS.map((tc) => [tc.id, tc.Logo]));

// Tasks = структурированный каталог (2026-09): контент — src/content/tasks/*.json
// (lib/tasks.js), вкладка = трек, «SOON» только у реально пустых треков,
// категории — автоматически из задач трека, «Solve» открывает задачу в редакторе
// с тестами (job.files + job.tests → Run → все зелёные → Complete +XP).
function ChevronIcon() {
  return (
    <svg
      className="filter-select__chevron"
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

// Кастомный select-контрол (высота 40px, как поиск): нативный <select> кликался
// только по тексту и показывал браузерную выпадашку, чужую для дизайн-системы.
// Клик по всей площади кнопки, меню на токенах, Esc/клик-аутсайд закрывают.
function FilterSelect({ value, onChange, options, ariaLabel }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target))
        setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = options.find((o) => o.value === value);

  return (
    <div
      className={`filter-select ${open ? "filter-select--open" : ""}`}
      ref={rootRef}
    >
      <button
        type="button"
        className="filter-select__btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen(!open)}
      >
        <span className="filter-select__label">
          {current ? current.label : ""}
        </span>
        <ChevronIcon />
      </button>
      {open && (
        <div
          className="filter-select__menu"
          role="listbox"
          aria-label={ariaLabel}
        >
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              role="option"
              aria-selected={o.value === value}
              className={`filter-select__option ${o.value === value ? "filter-select__option--active" : ""}`}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
            >
              <span>{o.label}</span>
              {o.value === value && (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m5 12 5 5 9-10" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, lang, t, onSolve, done }) {
  const TrackLogo = TRACK_LOGOS[task.track];
  const catName = task.categoryI18n
    ? locField(task.categoryI18n, lang)
    : task.category;

  // Единое правило «карточка действия = кликабельна целиком» (паттерн roadmap)
  const open = (e) => {
    if (e.target.closest("button")) return; // кнопку обрабатывает она сама
    onSolve(task);
  };

  return (
    <article
      className={`card task-card ${done ? "task-card--done" : "task-card--open"}`}
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSolve(task);
        }
      }}
    >
      <div className="task-card__body">
        <div className="task-card__meta-top">
          <span className="chip">{catName}</span>
          {done && (
            <span className="chip chip--done">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m5 12 5 5 9-10" />
              </svg>
              {t("tasks.done")}
            </span>
          )}
          <span className={`difficulty difficulty--${task.difficulty}`}>
            {t(`tasks.${task.difficulty}`)}
          </span>
        </div>
        <h3 className="task-card__title">{locField(task.title, lang)}</h3>
        <p className="task-card__desc">
          <InlineMd text={locField(task.prompt, lang)} />
        </p>
        {/* Микрострока-привязка: откуда задача (трек) — в General-каталоге */}
        {task.track !== "general" && TrackLogo && (
          <span className="task-card__track">
            <TrackLogo />
            {t(`home.tech.${task.track}`)}
          </span>
        )}
        <div className="task-card__meta">
          <span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            {task.minutes} {t("tasks.minutes")}
          </span>
          <span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="4.5" />
              <circle cx="12" cy="12" r="1" fill="currentColor" />
            </svg>
            {task.xp} {t("tasks.xp")}
          </span>
        </div>
      </div>
      {done ? (
        <button
          type="button"
          className="btn btn--ghost task-card__action"
          onClick={() => onSolve(task)}
        >
          {t("tasks.reopen")}
        </button>
      ) : (
        <button
          type="button"
          className="btn btn--primary task-card__action"
          onClick={() => onSolve(task)}
        >
          {t("tasks.solve")}
        </button>
      )}
    </article>
  );
}

function TasksView({ activeTech, onSelectTech, onSolve }) {
  const t = useT();
  const { langCode } = useLanguage();
  const [difficulty, setDifficulty] = useState("all");
  const [status, setStatus] = useState("all"); // all | done | open (2026-09: реально работает)
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  // Tech-фильтр: синхронен с выбранным треком через key-перемонтирование в MainContent
  // (key=activeTech); «General» — локальный просмотр
  const [techFilter, setTechFilter] = useState(() =>
    getTech(activeTech) ? activeTech : "general",
  );
  // Выполненные задания: ключ `track:taskId`
  const doneSet = new Set(getDoneTasks());

  const tech = getTech(techFilter);
  // Каталог: задачи из JSON-контента трека (в порядке order)
  const pool = tasksForTrack(techFilter);
  // Категории — автоматически из задач трека (≤6)
  const cats = categoriesForTrack(techFilter);
  const catName = (slug) => {
    const first = pool.find((x) => x.category === slug);
    return first && first.categoryI18n
      ? locField(first.categoryI18n, langCode)
      : slug;
  };

  const visible = pool.filter((task) => {
    const okDiff = difficulty === "all" || task.difficulty === difficulty;
    const okCat = category === "all" || task.category === category;
    const isDone = doneSet.has(`${task.track}:${task.id}`);
    const okStatus = status === "all" || (status === "done" ? isDone : !isDone);
    const okQuery =
      !query ||
      locField(task.title, langCode)
        .toLowerCase()
        .includes(query.toLowerCase()) ||
      locField(task.prompt, langCode)
        .toLowerCase()
        .includes(query.toLowerCase());
    return okDiff && okCat && okStatus && okQuery;
  });

  const selectTechTab = (id) => {
    onSelectTech(id); // глобальный выбор трека (persistence, deep-link-совместимый)
    setTechFilter(id);
    setCategory("all"); // категории другого трека
  };

  const clearFilters = () => {
    setDifficulty("all");
    setStatus("all");
    setCategory("all");
    setQuery("");
  };

  const contextName = tech ? t(tech.label) : t("tasks.general");

  return (
    <div className="tasks-view">
      <header className="tasks-head">
        <div className="page-head">
          <h1 className="page-head__title">
            {tech
              ? t("tasks.trackTitle", { tech: t(tech.label) })
              : t("tasks.generalTitle")}
          </h1>
          <p className="page-head__desc">{t("tasks.desc")}</p>
        </div>
        <div className="tasks-head__controls">
          <FilterSelect
            value={difficulty}
            onChange={setDifficulty}
            ariaLabel={t("tasks.allDifficulties")}
            options={[
              { value: "all", label: t("tasks.allDifficulties") },
              { value: "easy", label: t("tasks.easy") },
              { value: "medium", label: t("tasks.medium") },
              { value: "hard", label: t("tasks.hard") },
            ]}
          />
          <FilterSelect
            value={status}
            onChange={setStatus}
            ariaLabel={t("tasks.allStatuses")}
            options={[
              { value: "all", label: t("tasks.allStatuses") },
              { value: "done", label: t("tasks.done") },
              { value: "open", label: t("tasks.open") },
            ]}
          />
          <div className="tasks-search">
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
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("tasks.search")}
              aria-label={t("tasks.search")}
            />
          </div>
        </div>
      </header>

      {/* Tech-табы: технологии по порядку каталога, «General» — в конце.
          «SOON» — только у треков без опубликованных задач (2026-09: хардкод убран) */}
      <div
        className="tech-switch"
        role="tablist"
        aria-label={t("techPage.changeTrack")}
      >
        {TECHS.map((tc) => {
          const TLogo = TRACK_LOGOS[tc.id];
          const empty = tasksForTrack(tc.id).length === 0;
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
              {empty && <span className="soon-badge">{t("home.soon")}</span>}
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
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" />
            </svg>
          </span>
          <span>{t("tasks.general")}</span>
        </button>
      </div>

      {/* Чипы категорий (из задач трека) + строка состояния списка */}
      <div className="tasks-meta-row">
        <div className="task-chips">
          <button
            type="button"
            className={`task-chip ${category === "all" ? "task-chip--active" : ""}`}
            onClick={() => setCategory("all")}
          >
            {t("tasks.allCategories")}
          </button>
          {cats.map((c) => (
            <button
              key={c}
              type="button"
              className={`task-chip ${category === c ? "task-chip--active" : ""}`}
              onClick={() => setCategory(c)}
            >
              {catName(c)}
            </button>
          ))}
        </div>
        <span className="tasks-count">
          {t("tasks.countLine", {
            n: visible.length,
            m: pool.length,
            tech: contextName,
          })}
        </span>
      </div>

      <div className="task-list">
        {visible.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            lang={langCode}
            t={t}
            onSolve={onSolve}
            done={doneSet.has(`${task.track}:${task.id}`)}
          />
        ))}

        {/* Tech-empty: задач по треку нет — путь дальше, а не констатация пустоты */}
        {visible.length === 0 && pool.length === 0 && tech && (
          <div className="tasks-empty">
            <span className="tasks-empty__icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="7" width="18" height="13" rx="2" />
                <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <path d="M3 12h18" />
              </svg>
            </span>
            <p className="tasks-empty__text">
              {t("tasks.techEmptyTitle", { tech: t(tech.label) })}
            </p>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setTechFilter("general")}
            >
              {t("tasks.techEmptyCta")}
            </button>
            <p className="tasks-empty__hint">{t("tasks.techEmptyLine")}</p>
          </div>
        )}

        {/* Search-empty: текст с запросом + выход из состояния в 1 действие */}
        {visible.length === 0 && pool.length > 0 && query && (
          <div className="tasks-empty">
            <span className="tasks-empty__icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3M8.5 11h5" />
              </svg>
            </span>
            <p className="tasks-empty__text">
              {t("tasks.noResultsQuery", { q: query })}
            </p>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setQuery("")}
            >
              {t("tasks.clearSearch")}
            </button>
          </div>
        )}

        {/* Пусто по фильтрам сложности/категории/статуса */}
        {visible.length === 0 && pool.length > 0 && !query && (
          <div className="tasks-empty">
            <span className="tasks-empty__icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 5h16l-6 7v5l-4 2v-7L4 5Z" />
              </svg>
            </span>
            <p className="tasks-empty__text">{t("tasks.noResults")}</p>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={clearFilters}
            >
              {t("tasks.clearFilters")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TasksView;
