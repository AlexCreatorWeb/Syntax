import { useT } from "../../i18n/useT";
import Avatar from "../Avatar";
import { leaderboard } from "../../lib/rank";
import { last7DaysEarnings } from "../../lib/xp";

// UX-аудит 2026-09: rail = та же картина, что таблица (lib/rank), weekly —
// реальные XP по дням (журнал в lib/xp.js), лига/строка «2d 14h» убраны.
// День недели для подписи столбца (weeklyDays: пн=0 … вс=6).
const dayIndex = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  return (new Date(y, m - 1, d).getDay() + 6) % 7;
};

function RankingsAside({ isAuthed = false, onAuth = null, userName = "" }) {
  const t = useT();
  const days = t("rankings.weeklyDays");
  const lb = leaderboard();
  // Weekly-график — только для юзера: гостю демо-столбики = вводящий в
  // заблуждение контекст (аудит #12); гость видит CTA + заметку.
  const week = isAuthed ? last7DaysEarnings() : null;
  const weekTotal = week ? week.reduce((a, b) => a + b.xp, 0) : 0;
  const weekMax = week ? Math.max(500, ...week.map((d) => d.xp)) : 1;

  return (
    <aside className="card rank-card">
      <div className="rank-card__top">
        <div>
          <span className="label-caps rank-card__label">
            {t("rankings.yourRank")}
            {!isAuthed && (
              <span className="chip chip--sample rank-card__sample">
                SAMPLE
              </span>
            )}
          </span>
          <div className="rank-card__number-row">
            <span className="rank-card__number">
              {isAuthed ? `#${lb.youRank}` : "—"}
            </span>
          </div>
        </div>
        {isAuthed ? (
          <Avatar name={userName || "You"} hue={158} size="avatar" />
        ) : (
          <button
            type="button"
            className="btn btn--primary rank-card__cta"
            onClick={() => onAuth && onAuth("signup")}
          >
            {t("rankings.railCta")}
          </button>
        )}
      </div>

      {isAuthed ? (
        lb.next ? (
          <div className="rank-card__next">
            {/* Цифры из той же функции, что строка «вы» в таблице */}
            <span className="rank-card__next-xp">
              {t("rankings.rowNext", {
                n: lb.gap.toLocaleString("en-US"),
                rank: lb.next.rank,
              })}
            </span>
            <div className="bar rank-card__bar">
              <div
                className="bar__fill bar__fill--shimmer"
                style={{ width: `${lb.progress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <span className="rank-card__next-xp">#{lb.youRank}</span>
        )
      ) : (
        <p className="rank-card__guest-note">{t("rankings.railGuestNote")}</p>
      )}

      {week && (
        <div className="rank-card__weekly">
          <h4>
            {t("rankings.weekly")} · +{weekTotal.toLocaleString("en-US")} XP{" "}
            {t("rankings.weeklyTotal")}
          </h4>
          <div
            className="weekly"
            role="img"
            aria-label={`${t("rankings.weekly")}: ${week
              .map((d) => d.xp)
              .join(", ")}`}
          >
            {week.map((d, i) => {
              const isToday = i === week.length - 1;
              return (
                <div
                  key={d.key}
                  className={`weekly__col ${isToday ? "weekly__col--today" : ""}`}
                  title={`+${d.xp} XP`}
                >
                  <div
                    className={`weekly__bar ${isToday ? "weekly__bar--today" : ""}`}
                    style={{ height: `${Math.round((d.xp / weekMax) * 100)}%` }}
                  />
                  <span className="weekly__day">
                    {days[dayIndex(d.key)] || ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}

export default RankingsAside;
