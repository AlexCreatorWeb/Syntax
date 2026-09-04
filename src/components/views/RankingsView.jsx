import { useState, useEffect, useRef } from "react";
import { useT } from "../../i18n/useT";
import Avatar from "../Avatar";
import { leaderboard } from "../../lib/rank";

// UX-аудит 2026-09: одна картина данных (lib/rank) для подиума, таблицы и
// rail-карты; «вы» = реальный XP (totalXp), соперники — демо-когорта (SAMPLE).
// Убрано: скоупы Friends/Teams (соц. слой не существует), период Week/Month,
// tech-фильтр (5 из 9 треков), уровни/стрики/дельты (механик нет), «Топ 100».

const fmt = (n) => n.toLocaleString("en-US");

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

// Профиль лидера (реюзаем паттерн модалки Community): показывает то, что
// лидерборд реально знает (место, XP) + SAMPLE-бейдж до бэкенда.
function LeaderProfile({ user, t, onClose }) {
  return (
    <div
      className="community-modal"
      role="dialog"
      aria-modal="true"
      aria-label={user.name}
      onClick={onClose}
    >
      <div
        className="community-modal__panel community-modal__panel--leader"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="profile">
          <Avatar name={user.name} hue={user.hue} size="lg" />
          <strong className="profile__name">{user.name}</strong>
          <span className="profile__handle">SAMPLE</span>
          <div className="profile__stats">
            <div className="profile__stat">
              <strong>#{user.rank}</strong>
              <span>{t("rankings.thRank")}</span>
            </div>
            <div className="profile__stat">
              <strong>{fmt(user.xp)} XP</strong>
              <span>{t("rankings.thXp")}</span>
            </div>
          </div>
          <div className="profile__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              {t("rankings.close")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RankingsView({ isAuthed = false, onAuth = null, userName = "" }) {
  const t = useT();
  const [query, setQuery] = useState("");
  const [howOpen, setHowOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const howRef = useRef(null);
  const youRowRef = useRef(null);

  // «Как работает рейтинг»: цифры из реальных механик (lib/xp.js)
  useEffect(() => {
    if (!howOpen) return undefined;
    const close = (e) => {
      if (howRef.current && !howRef.current.contains(e.target))
        setHowOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [howOpen]);

  // «Вы» — главный ответ страницы: не за фолдом (при поиске — под запрос)
  useEffect(() => {
    youRowRef.current?.scrollIntoView({ block: "nearest" });
  }, [query]);

  // Единые данные: подиум = топ-3 тех же строк, что в таблице
  const lb = leaderboard();
  const youName = userName || t("rankings.you");
  // Гость: демо-строка «you» (гостевой XP) не показывается — только CTA
  const rows = lb.rows.filter((r) => {
    if (!isAuthed && r.you) return false;
    if (!query) return true;
    const name = r.you ? youName : r.name;
    return name.toLowerCase().includes(query.toLowerCase());
  });
  const podium = lb.rows.slice(0, 3);

  return (
    <div className="rankings">
      {/* Шапка: заголовок + «как работает» (реальные цифры XP) + поиск */}
      <div className="rankings__head">
        <div className="rankings__head-left">
          <h1 className="rankings__title">
            {t("rankings.title")}
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
                  </ul>
                </div>
              )}
            </span>
          </h1>
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

      {/* Подиум = топ-3 из тех же строк, что в таблице (одна картина) */}
      <section className="podium card">
        {podium.map((user) => (
          <div
            key={user.name}
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
            <button
              type="button"
              className={`podium__name ${user.rank === 1 ? "podium__name--first" : ""}`}
              onClick={() => setProfile(user)}
            >
              {user.name}
            </button>
            <p className="podium__xp">{fmt(user.xp)} XP</p>
            <div
              className={`podium__pedestal podium__pedestal--${user.rank}`}
            />
          </div>
        ))}
      </section>

      {/* Таблица: ВСЕ строки (включая подиум — поиск и клик работают на всех) */}
      <section className="card rankings__table-card">
        <div className="rankings__table-head">
          <h2>{t("rankings.tableTitle")}</h2>
        </div>
        <div className="rankings__table-scroll">
          <table className="rankings__table">
            <thead>
              <tr>
                <th className="rk-center col-rank">{t("rankings.thRank")}</th>
                <th>{t("rankings.thUser")}</th>
                <th className="rk-right col-xp">{t("rankings.thXp")}</th>
              </tr>
            </thead>
            {/* Ключ tbody — от поиска: fade строк; ключи строк — по имени */}
            <tbody key={query}>
              {rows.map((row) => (
                <tr
                  key={row.name}
                  ref={row.you ? youRowRef : undefined}
                  className={`rankings__row rankings__row--in${row.you ? " rankings__row--you" : ""}`}
                >
                  <td className="rk-center rankings__rank">#{row.rank}</td>
                  <td>
                    <div className="rankings__user">
                      <Avatar
                        name={row.you ? youName : row.name}
                        hue={row.hue}
                        size="sm"
                        ring={row.you}
                      />
                      <div className="rankings__user-info">
                        <div className="rankings__name-row">
                          <button
                            type="button"
                            className="rankings__username"
                            onClick={() => setProfile(row)}
                          >
                            {row.you ? youName : row.name}
                          </button>
                          {row.you && (
                            <span className="rankings__you-badge">
                              {t("rankings.you")}
                            </span>
                          )}
                        </div>
                        {/* Цель: прогресс до позиции выше — единственный
                            элемент, превращающий таблицу в действие */}
                        {row.you && lb.next && (
                          <div className="rankings__you-next">
                            <div className="bar bar--mini">
                              <div
                                className="bar__fill"
                                style={{ width: `${lb.progress}%` }}
                              ></div>
                            </div>
                            <span>
                              {t("rankings.rowNext", {
                                n: fmt(lb.gap),
                                rank: lb.next.rank,
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td
                    className={`rk-right rankings__total${row.you ? " rankings__total--you" : ""}`}
                  >
                    {fmt(row.xp)}
                  </td>
                </tr>
              ))}
              {/* Гость: строка-CTA вместо демо-метрик «его» (аудит #12) */}
              {!isAuthed && (
                <tr
                  className="rankings__row rankings__row--cta"
                  role="button"
                  tabIndex={0}
                  onClick={() => onAuth && onAuth("signup")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onAuth && onAuth("signup");
                    }
                  }}
                >
                  <td className="rk-center rankings__rank">—</td>
                  <td>
                    <span className="rankings__username rankings__username--cta">
                      {t("rankings.guestRow")}
                    </span>
                  </td>
                  <td className="rk-right rankings__total">—</td>
                </tr>
              )}
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

      {profile && (
        <LeaderProfile user={profile} t={t} onClose={() => setProfile(null)} />
      )}
    </div>
  );
}

export default RankingsView;
