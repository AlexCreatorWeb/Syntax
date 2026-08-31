import { useT } from "../../i18n/useT";
import Avatar from "../Avatar";

// Значения — в «XP/10» для наглядности (демо); tooltip — реальные значения
const WEEK_BARS = [30, 50, 40, 80, 60, 90]; // последнее — сегодня

function RankingsAside() {
  const t = useT();
  const days = t("rankings.weeklyDays");
  const weekTotal = WEEK_BARS.reduce((a, b) => a + b, 0) * 10;

  return (
    <>
      <aside className="card rank-card">
        <div className="rank-card__top">
          <div>
            <span className="label-caps rank-card__label">{t("rankings.yourRank")}</span>
            <div className="rank-card__number-row">
              <span className="rank-card__number">#6</span>
              <span className="rank-card__up">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 19V5" />
                  <path d="m5 12 7-7 7 7" />
                </svg>
                2
              </span>
            </div>
          </div>
          <Avatar name="NeoCoder" hue={158} size="avatar" />
        </div>

        <div className="rank-card__next">
          <div className="rank-card__next-row">
            <span>{t("rankings.nextRank")}</span>
            <span className="rank-card__next-xp">{t("rankings.needXp")}</span>
          </div>
          {/* 9840 / 10120 = 97% — совпадает с прогрессом в строке таблицы */}
          <div className="bar rank-card__bar">
            <div className="bar__fill bar__fill--shimmer" style={{ width: "97%" }}></div>
          </div>
        </div>

        <div className="rank-card__weekly">
          <h4>
            {t("rankings.weekly")} · +{weekTotal.toLocaleString("en-US")} XP {t("rankings.weeklyTotal")}
          </h4>
          <div className="weekly" role="img" aria-label={`${t("rankings.weekly")}: ${WEEK_BARS.join(", ")}`}>
            {WEEK_BARS.map((v, i) => {
              const isToday = i === WEEK_BARS.length - 1;
              return (
                <div
                  key={i}
                  className={`weekly__col ${isToday ? "weekly__col--today" : ""}`}
                  title={`+${v * 10} XP`}
                >
                  <div className={`weekly__bar ${isToday ? "weekly__bar--today" : ""}`} style={{ height: `${v}%` }} />
                  <span className="weekly__day">{days[i] || ""}</span>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      <aside className="card league-card">
        <div className="league-card__head">
          <span className="league-card__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3h12l4 6-10 12L2 9l4-6Z" />
              <path d="M2 9h20M9 3l3 6 3-6M12 21l-3-12M12 21l3-12" />
            </svg>
          </span>
          <div>
            <h3 className="league-card__name">{t("rankings.leagueName")}</h3>
            <p className="league-card__desc">{t("rankings.leagueDesc")}</p>
          </div>
        </div>

        <div className="league-card__zones">
          <div className="league-card__zones-row">
            <span className="league-card__promo">{t("rankings.promotion")}</span>
            <span className="league-card__left">{t("rankings.timeLeft")}</span>
          </div>
          <div className="league-card__bar" role="img" aria-label={t("rankings.promotion")}>
            <div className="league-card__zone league-card__zone--safe" style={{ width: "60%" }} title={t("rankings.promoteNote")} />
            <div className="league-card__zone league-card__zone--promo" style={{ width: "20%" }} title={t("rankings.promoteNote")}>
              <span className="league-card__marker" style={{ left: "70%" }}>
                <span className="league-card__marker-label">{t("rankings.leagueYou")}</span>
              </span>
            </div>
            <div className="league-card__zone league-card__zone--demote" style={{ width: "20%" }} title={t("rankings.demoteNote")} />
          </div>
          <div className="league-card__labels">
            <span>{t("rankings.safe")}</span>
            <span>{t("rankings.promote")}</span>
            <span className="league-card__label--demote">{t("rankings.demote")}</span>
          </div>
          {/* Пороги зон: «какой ранг = Demote» — ответ на недоверие */}
          <div className="league-card__notes">
            <span>{t("rankings.promoteNote")}</span>
            <span className="league-card__label--demote">{t("rankings.demoteNote")}</span>
          </div>
        </div>
      </aside>
    </>
  );
}

export default RankingsAside;
