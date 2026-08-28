import { useState } from "react";
import { useT } from "../../i18n/useT";
import Avatar from "../Avatar";

// Статичные данные рейтинга (позже — с бэкенда)
const PODIUM = [
  { rank: 2, name: "ByteSniper", xp: "12,450 XP", hue: 210 },
  { rank: 1, name: "SyntaxError", xp: "15,890 XP", hue: 158 },
  { rank: 3, name: "NullPointer", xp: "11,200 XP", hue: 20 },
];

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
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4a1 1 0 0 0-1 1c0 2.2 1.8 4 4 4M17 6h3a1 1 0 0 1 1 1c0 2.2-1.8 4-4 4" />
    </svg>
  );
}

function RankingsView() {
  const t = useT();
  const [rankScope, setRankScope] = useState("global");
  const [query, setQuery] = useState("");

  const rowsAll = [
    { rank: 4, name: "DevJedi", level: "Lv. 42", streak: 14, hot: true, tasks: "342", xp: "10,850", hue: 200 },
    { rank: 5, name: "CodeNinja", level: "Lv. 40", streak: 3, hot: false, tasks: "315", xp: "10,120", hue: 260 },
    { rank: 6, name: t("rankings.you"), level: "Lv. 38", streak: 7, hot: true, tasks: "289", xp: "9,840", hue: 158, you: true },
  ];
  const rows = rowsAll.filter((r) => !query || r.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="rankings">
      {/* Шапка: заголовок + скоупы + поиск пользователя */}
      <div className="rankings__head">
        <div className="rankings__head-left">
          <h1 className="rankings__title">{t("rankings.title")}</h1>
          <div className="seg" role="tablist" aria-label={t("rankings.title")}>
            {["global", "friends", "teams"].map((scope) => (
              <button
                key={scope}
                type="button"
                role="tab"
                aria-selected={rankScope === scope}
                className={`seg__item ${rankScope === scope ? "seg__item--active" : ""}`}
                onClick={() => setRankScope(scope)}
              >
                {t(`rankings.${scope}`)}
              </button>
            ))}
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

      {/* Подиум топ-3 */}
      <section className="podium card">
        {PODIUM.map((user) => (
          <div key={user.rank} className={`podium__slot podium__slot--${user.rank}`}>
            <div className="podium__figure">
              <Avatar
                name={user.name}
                hue={user.hue}
                size={user.rank === 1 ? "lg" : "md"}
                ring={user.rank === 1}
              />
              <span className={`podium__badge ${user.rank === 1 ? "podium__badge--first" : ""}`}>
                {user.rank}
              </span>
            </div>
            <h3 className={`podium__name ${user.rank === 1 ? "podium__name--first" : ""}`}>
              {user.name}
            </h3>
            <p className="podium__xp">{user.xp}</p>
            <div className={`podium__pedestal ${user.rank === 1 ? "podium__pedestal--first" : ""}`}>
              {user.rank === 1 && <TrophyIcon className="podium__trophy" />}
            </div>
          </div>
        ))}
      </section>

      {/* Таблица Top 100 */}
      <section className="card rankings__table-card">
        <div className="rankings__table-head">
          <h2>{t("rankings.top100")}</h2>
          <button type="button" className="rankings__viewall" title={t("home.soon")}>
            {t("rankings.viewAll")} →
          </button>
        </div>
        <div className="rankings__table-scroll">
          <table className="rankings__table">
            <thead>
              <tr>
                <th className="rk-center">{t("rankings.thRank")}</th>
                <th>{t("rankings.thUser")}</th>
                <th>{t("rankings.thLevel")}</th>
                <th className="rk-center">{t("rankings.thStreak")}</th>
                <th className="rk-right">{t("rankings.thTasks")}</th>
                <th className="rk-right">{t("rankings.thXp")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.rank} className={row.you ? "rankings__row--you" : ""}>
                  <td className="rk-center rankings__rank">{row.rank}</td>
                  <td>
                    <div className="rankings__user">
                      <Avatar name={row.name} hue={row.hue} size="sm" ring={row.you} />
                      <span className="rankings__username">{row.name}</span>
                    </div>
                  </td>
                  <td className="rankings__level">{row.level}</td>
                  <td className="rk-center">
                    <span className={`streak ${row.hot ? "streak--hot" : ""}`}>
                      <FlameIcon hot={row.hot} />
                      {row.streak}
                    </span>
                  </td>
                  <td className="rk-right rankings__tasks">{row.tasks}</td>
                  <td className={`rk-right rankings__total ${row.you ? "rankings__total--you" : ""}`}>
                    {row.xp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <div className="tasks-empty rankings__empty">{t("tasks.noResults")}</div>
          )}
        </div>
      </section>
    </div>
  );
}

export default RankingsView;
