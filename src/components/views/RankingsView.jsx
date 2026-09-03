import { useState, useEffect, useRef } from "react";
import { useT } from "../../i18n/useT";
import Avatar from "../Avatar";

// Статичные данные рейтинга (позже — с бэкенда).
// Дельты позиций (▲/▼) — половина азарта лидерборда (UX-аудит Rankings).
const PODIUM = [
  { rank: 2, name: "ByteSniper", xp: 12450, streak: 9, delta: -1, hue: 210 },
  { rank: 1, name: "SyntaxError", xp: 15890, streak: 21, delta: 3, hue: 158 },
  { rank: 3, name: "NullPointer", xp: 11200, streak: 5, delta: 1, hue: 20 },
];

const SCOPES = {
  global: [
    {
      name: "DevJedi",
      level: 42,
      streak: 14,
      hot: true,
      tasks: 342,
      xp: 10850,
      delta: 2,
      hue: 200,
    },
    {
      name: "CodeNinja",
      level: 40,
      streak: 3,
      hot: false,
      tasks: 315,
      xp: 10120,
      delta: -1,
      hue: 260,
    },
    {
      name: "you",
      level: 38,
      streak: 7,
      hot: true,
      tasks: 289,
      xp: 9840,
      delta: 2,
      hue: 158,
      you: true,
    },
  ],
  friends: [
    {
      name: "CodeNinja",
      level: 40,
      streak: 3,
      hot: false,
      tasks: 315,
      xp: 10120,
      delta: 0,
      hue: 260,
    },
    {
      name: "PixelWitch",
      level: 35,
      streak: 11,
      hot: true,
      tasks: 240,
      xp: 8975,
      delta: 1,
      hue: 300,
    },
    {
      name: "you",
      level: 38,
      streak: 7,
      hot: true,
      tasks: 289,
      xp: 9840,
      delta: 2,
      hue: 158,
      you: true,
    },
  ],
  teams: [
    {
      name: "NullPtr Co.",
      members: 5,
      streak: 21,
      hot: true,
      tasks: 1240,
      xp: 12840,
      delta: 1,
      hue: 200,
    },
    {
      name: "Syntax Squad",
      members: 4,
      streak: 12,
      hot: true,
      tasks: 860,
      xp: 9840,
      delta: 2,
      hue: 158,
      you: true,
    },
  ],
};

// Период и трек — демо-множители: данные визуально различимы при смене фильтров,
// порядок строк пересчитывается (ключи строк — по имени, готовы к FLIP с бэкендом)
const PERIOD_MULT = { week: 1 / 38, month: 1 / 8, all: 1 };
const TECH_FACTOR = {
  all: 1,
  html: 0.55,
  css: 0.6,
  javascript: 0.95,
  python: 0.8,
};
const TECH_PILLS = ["all", "html", "css", "javascript", "python"];

const fmt = (n) => n.toLocaleString("en-US");

function FlameIcon({ hot }) {
  return (
    <svg
      className={`streak-icon ${hot ? "streak-icon--hot" : ""}`}
      viewBox="0 0 24 24"
      fill={hot ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 22c4 0 7-2.6 7-6.5 0-3.7-2.7-5.6-4.2-8.5-.4.9-.6 2.2-1.3 3C12.6 7 11.5 4 9.5 2c.2 2.4-1 3.8-2.2 5.4C6 9.2 5 10.9 5 13.5 5 17.4 8 22 12 22Z" />
    </svg>
  );
}

function TrophyIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4a1 1 0 0 0-1 1c0 2.2 1.8 4 4 4M17 6h3a1 1 0 0 1 1 1c0 2.2-1.8 4-4 4" />
    </svg>
  );
}

// Динамика позиции: ▲2 зелёным, ▼1 красным
function Delta({ value }) {
  if (value > 0)
    return (
      <span className="rk-delta rk-delta--up" aria-hidden="true">
        ▲{value}
      </span>
    );
  if (value < 0)
    return (
      <span className="rk-delta rk-delta--down" aria-hidden="true">
        ▼{-value}
      </span>
    );
  return (
    <span className="rk-delta" aria-hidden="true">
      —
    </span>
  );
}

function RankingsView({ isAuthed = false, onAuth = null }) {
  const t = useT();
  const [scope, setScope] = useState("global");
  const [period, setPeriod] = useState("all");
  const [techFilter, setTechFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [howOpen, setHowOpen] = useState(false);
  const howRef = useRef(null);
  const youRowRef = useRef(null);

  // «Как работает рейтинг»: источники XP, периодичность сброса (UX-аудит: траст)
  useEffect(() => {
    if (!howOpen) return undefined;
    const close = (e) => {
      if (howRef.current && !howRef.current.contains(e.target))
        setHowOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [howOpen]);

  // Строка «Вы» — в кадре: главный ответ страницы не должен быть за фолдом
  useEffect(() => {
    youRowRef.current?.scrollIntoView({ block: "nearest" });
  }, [scope, period, techFilter]);

  // Данные: скоуп → множители периода/трека → сортировка → ранги.
  // Таблица начинается с #4: пьедестал занимает 1–3 (согласовано с рейлом «#6»)
  const rowsAll = SCOPES[scope]
    .map((r) => ({
      ...r,
      xpNow: Math.round(r.xp * PERIOD_MULT[period] * TECH_FACTOR[techFilter]),
    }))
    .sort((a, b) => b.xpNow - a.xpNow)
    .map((r, i) => ({ ...r, rank: i + 4 }));
  const rows = rowsAll.filter(
    (r) => !query || r.name.toLowerCase().includes(query.toLowerCase()),
  );
  const youRow = rowsAll.find((r) => r.you);
  const nextRow = youRow
    ? rowsAll.find((r) => r.rank === youRow.rank - 1)
    : null;
  const youGap = nextRow ? nextRow.xpNow - youRow.xpNow : 0;
  const youProgress = nextRow
    ? Math.min(100, Math.round((youRow.xpNow / nextRow.xpNow) * 100))
    : 0;

  return (
    <div className="rankings">
      {/* Шапка: динамический заголовок (активный скоуп) + «как работает» + поиск */}
      <div className="rankings__head">
        <div className="rankings__head-left">
          <h1 className="rankings__title">
            {t("rankings.titleScope", { scope: t(`rankings.${scope}`) })}
            <span className="rankings__how" ref={howRef}>
              <button
                type="button"
                className="icon-btn icon-btn--sm rankings__how-btn"
                aria-label={t("rankings.howTitle")}
                aria-expanded={howOpen}
                onClick={() => setHowOpen((v) => !v)}
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
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 11v5M12 8h.01" />
                </svg>
              </button>
              {howOpen && (
                <div
                  className="rankings__how-pop card"
                  role="dialog"
                  aria-label={t("rankings.howTitle")}
                >
                  <h3>{t("rankings.howTitle")}</h3>
                  <ul>
                    <li>{t("rankings.howLessons")}</li>
                    <li>{t("rankings.howTasks")}</li>
                    <li>{t("rankings.howDaily")}</li>
                    <li>{t("rankings.howStreak")}</li>
                  </ul>
                  <p>{t("rankings.howReset")}</p>
                </div>
              )}
            </span>
          </h1>
          {/* Скоуп + период: два сегмент-контрола (лига = Week, глобальный = All-time) */}
          <div className="rankings__segs">
            <div
              className="seg"
              role="tablist"
              aria-label={t("rankings.titleScope", {
                scope: t(`rankings.${scope}`),
              })}
            >
              {["global", "friends", "teams"].map((s) => (
                <button
                  key={s}
                  type="button"
                  role="tab"
                  aria-selected={scope === s}
                  className={`seg__item ${scope === s ? "seg__item--active" : ""}`}
                  onClick={() => setScope(s)}
                >
                  {t(`rankings.${s}`)}
                </button>
              ))}
            </div>
            <div
              className="seg"
              role="tablist"
              aria-label={t("rankings.periodAll")}
            >
              {[
                ["week", "rankings.periodWeek"],
                ["month", "rankings.periodMonth"],
                ["all", "rankings.periodAll"],
              ].map(([p, key]) => (
                <button
                  key={p}
                  type="button"
                  role="tab"
                  aria-selected={period === p}
                  className={`seg__item ${period === p ? "seg__item--active" : ""}`}
                  onClick={() => setPeriod(p)}
                >
                  {t(key)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="finduser">
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
            placeholder={t("rankings.findUser")}
            aria-label={t("rankings.findUser")}
          />
        </div>
      </div>

      {/* Фильтр по треку: рейтинг — вокруг 9 треков платформы */}
      <div className="rank-pills">
        {TECH_PILLS.map((tc) => (
          <button
            key={tc}
            type="button"
            className={`task-chip ${techFilter === tc ? "task-chip--active" : ""}`}
            onClick={() => setTechFilter(tc)}
          >
            {tc === "all" ? t("tasks.allCategories") : t(`home.tech.${tc}`)}
          </button>
        ))}
      </div>

      {/* Подиум топ-3: ступенчатый 2-1-3, высота = ранг, трофей над №1, стрик + дельта */}
      <section className="podium card">
        {PODIUM.map((user) => (
          <div
            key={user.rank}
            className={`podium__slot podium__slot--${user.rank}`}
          >
            {user.rank === 1 && <TrophyIcon className="podium__trophy" />}
            <div className="podium__figure">
              <Avatar
                name={user.name}
                hue={user.hue}
                size={user.rank === 1 ? "lg" : "md"}
                ring={user.rank === 1}
              />
              <span
                className={`podium__badge ${user.rank === 1 ? "podium__badge--first" : ""}`}
              >
                {user.rank}
              </span>
            </div>
            <h3
              className={`podium__name ${user.rank === 1 ? "podium__name--first" : ""}`}
            >
              {user.name}
            </h3>
            <p className="podium__xp">{fmt(user.xp)} XP</p>
            <p className="podium__meta">
              <span
                className={`streak ${user.streak >= 7 ? "streak--hot" : ""}`}
              >
                <FlameIcon hot={user.streak >= 7} />
                {user.streak}
              </span>
              <Delta value={user.delta} />
            </p>
            <div
              className={`podium__pedestal podium__pedestal--${user.rank}`}
            />
          </div>
        ))}
      </section>

      {/* Таблица: XP — визуальное ядро строки (сразу после имени), дельты, прогресс до #N */}
      <section className="card rankings__table-card">
        <div className="rankings__table-head">
          <h2>{t("rankings.top100")}</h2>
          {/* Честный soon: 100 строк придут с бэкендом */}
          <span className="rankings__viewall is-soon" aria-disabled="true">
            {t("rankings.viewAll")}
            <span className="soon-badge">{t("home.soon")}</span>
          </span>
        </div>
        <div className="rankings__table-scroll">
          <table className="rankings__table">
            <thead>
              <tr>
                <th className="rk-center col-rank">{t("rankings.thRank")}</th>
                <th>{t("rankings.thUser")}</th>
                <th className="rk-right col-xp">{t("rankings.thXp")}</th>
                <th className="rk-center col-level">{t("rankings.thLevel")}</th>
                <th className="rk-center col-streak">
                  {t("rankings.thStreak")}
                </th>
                <th className="rk-right col-tasks">{t("rankings.thTasks")}</th>
              </tr>
            </thead>
            {/* Ключ tbody — от фильтров: fade/slide строк при смене данных; ключи строк — по имени (FLIP-ready) */}
            <tbody key={`${scope}-${period}-${techFilter}-${query}`}>
              {rows.map((row) => (
                <tr
                  key={row.name}
                  ref={row.you ? youRowRef : undefined}
                  className={`rankings__row rankings__row--in ${row.you ? "rankings__row--you" : ""}${row.you && !isAuthed ? " rankings__row--cta" : ""}`}
                  role={row.you && !isAuthed ? "button" : undefined}
                  tabIndex={row.you && !isAuthed ? 0 : undefined}
                  onClick={
                    row.you && !isAuthed
                      ? () => onAuth && onAuth("signup")
                      : undefined
                  }
                  onKeyDown={
                    row.you && !isAuthed
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onAuth && onAuth("signup");
                          }
                        }
                      : undefined
                  }
                >
                  <td className="rk-center rankings__rank">
                    #{row.rank} <Delta value={row.delta} />
                  </td>
                  <td>
                    <div className="rankings__user">
                      <Avatar
                        name={row.name}
                        hue={row.hue}
                        size="sm"
                        ring={row.you}
                      />
                      <div className="rankings__user-info">
                        <span className="rankings__username">
                          {row.you && !row.members
                            ? isAuthed
                              ? t("rankings.you")
                              : t("rankings.guestRow")
                            : row.name}
                        </span>
                        {/* Мобилка: уровень/участники под именем (колонки скрыты) */}
                        <span className="rankings__user-sub">
                          {row.members
                            ? t("rankings.members", { n: row.members })
                            : `Lv. ${row.level}`}
                        </span>
                      </div>
                    </div>
                    {/* Прогресс «до следующего ранга» — в самой строке пользователя
                        (гостю не показываем: демо-ранг без аккаунта — вводить в заблуждение) */}
                    {row.you && nextRow && isAuthed && (
                      <div className="rankings__you-next">
                        <div className="bar bar--mini">
                          <div
                            className="bar__fill"
                            style={{ width: `${youProgress}%` }}
                          ></div>
                        </div>
                        <span>
                          {t("rankings.rowNext", {
                            n: fmt(youGap),
                            rank: nextRow.rank,
                          })}
                        </span>
                      </div>
                    )}
                  </td>
                  <td
                    className={`rk-right rankings__total ${row.you ? "rankings__total--you" : ""}`}
                  >
                    {fmt(row.xpNow)}
                  </td>
                  <td className="rankings__level col-level">
                    {row.members
                      ? t("rankings.members", { n: row.members })
                      : `Lv. ${row.level}`}
                  </td>
                  <td className="rk-center col-streak">
                    <span className={`streak ${row.hot ? "streak--hot" : ""}`}>
                      <FlameIcon hot={row.hot} />
                      {row.streak}
                    </span>
                  </td>
                  <td className="rk-right rankings__tasks col-tasks">
                    {fmt(row.tasks)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <div className="tasks-empty rankings__empty">
              {t("tasks.noResults")}
              {query && (
                <button
                  type="button"
                  className="btn btn--ghost rankings__showme"
                  onClick={() => setQuery("")}
                >
                  {t("rankings.showMe")}
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default RankingsView;
