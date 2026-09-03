import { useT } from "../../i18n/useT";
import { useLanguage } from "../../context/useLanguage";
import TECHS from "../../lib/techs";
import { getCompleted, getDoneTasks } from "../../lib/progress";
import { totalXp } from "../../lib/xp";

// Страница профиля #/profile: личность (монограмма, имя, email, дата регистрации) +
// реальный прогресс по курсам (отметки выполнения) + logout. Гость — CTA на вход.
// Логотипы треков — static-мапа на уровне модуля (React-Compiler: не создавать
// компоненты в рендере).
const TRACK_LOGOS = Object.fromEntries(TECHS.map((tc) => [tc.id, tc.Logo]));
const DATE_LOCALES = {
  en: "en-GB",
  ru: "ru-RU",
  uk: "uk-UA",
  es: "es-ES",
  de: "de-DE",
};

function nameHueOf(name) {
  let h = 0;
  const s = name || "";
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

function ProfileView({
  session,
  userName,
  onAuth,
  onNavigate,
  onLogout,
  dbLessons,
}) {
  const t = useT();
  const { langCode } = useLanguage();
  const isAuthed = Boolean(session && session.user);
  const hue = nameHueOf(userName);
  const memberSince =
    isAuthed && session.user.created_at
      ? new Date(session.user.created_at).toLocaleDateString(
          DATE_LOCALES[langCode] || "en-GB",
          {
            year: "numeric",
            month: "long",
            day: "numeric",
          },
        )
      : null;

  // Прогресс по трекам, у которых есть курс в БД (иначе «N of M» не имеет смысла)
  const rows = [];
  let totalDone = 0;
  const doneTasks = getDoneTasks().length;
  const xpTotal = totalXp();
  if (isAuthed) {
    for (const tc of TECHS) {
      const dbTech = (dbLessons || []).filter((l) => l.tech === tc.id);
      if (!dbTech.length) continue;
      const dbIds = new Set(dbTech.map((l) => l.id));
      const done = getCompleted(tc.id).filter((id) => dbIds.has(id)).length;
      totalDone += done;
      rows.push({
        id: tc.id,
        Logo: TRACK_LOGOS[tc.id],
        done,
        total: dbTech.length,
      });
    }
  }

  return (
    <div className="profile">
      <section className="card card--feature profile__card spotlight">
        <span
          className="avatar-dot avatar-dot--md profile__avatar"
          style={{
            background: `linear-gradient(135deg, hsl(${hue} 45% 32%), hsl(${hue} 55% 18%))`,
          }}
        >
          {(isAuthed && userName ? userName : "S").charAt(0).toUpperCase()}
        </span>
        {isAuthed ? (
          <>
            <h1 className="profile__name">{userName}</h1>
            <p className="profile__email">{session.user.email}</p>
            {memberSince && (
              <p className="profile__since">
                {t("profile.memberSince", { date: memberSince })}
              </p>
            )}
          </>
        ) : (
          <>
            <h1 className="profile__name">{t("profile.guestTitle")}</h1>
            <p className="profile__desc">{t("profile.guestBody")}</p>
            <div className="profile__cta">
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => onAuth("signup")}
              >
                {t("profile.signup")}
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => onAuth("login")}
              >
                {t("profile.login")}
              </button>
            </div>
            {/* UX-аудит L20: продаём аккаунт — что даёт регистрация (пустота под CTA убрана) */}
            <div className="profile__gets">
              <h2 className="profile__gets-title">{t("profile.getsTitle")}</h2>
              <ul className="profile__gets-list">
                {[
                  ["profile.gets1t", "profile.gets1d"],
                  ["profile.gets2t", "profile.gets2d"],
                  ["profile.gets3t", "profile.gets3d"],
                  ["profile.gets4t", "profile.gets4d"],
                ].map(([tk, dk], i) => (
                  <li key={i} className="profile__gets-item">
                    <span className="profile__gets-ico" aria-hidden="true">
                      ✓
                    </span>
                    <div className="profile__gets-body">
                      <strong>{t(tk)}</strong>
                      <p>{t(dk)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </section>

      {isAuthed && (
        <section className="card profile__progress">
          <header className="profile__progress-head">
            <h2>{t("profile.progress")}</h2>
            <span className="profile__progress-total">
              {t("profile.totalDone", { n: totalDone })}
              {isAuthed && doneTasks > 0
                ? ` · ${t("profile.tasksDone", { n: doneTasks })}`
                : ""}{" "}
              · {t("profile.xp", { n: xpTotal })}
            </span>
          </header>
          {rows.length ? (
            <div className="profile__rows">
              {rows.map(({ id, Logo, done, total }) => (
                <div className="profile__row" key={id}>
                  <span
                    className="profile__row-logo"
                    onClick={() => onNavigate("technology", { techId: id })}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      onNavigate("technology", { techId: id })
                    }
                  >
                    <Logo />
                  </span>
                  <div className="profile__row-body">
                    <span className="profile__row-name">
                      {t(`home.tech.${id}`)}
                    </span>
                    <span className="profile__bar" aria-hidden="true">
                      <span
                        className="profile__bar-fill"
                        style={{
                          width: `${Math.round((done / total) * 100)}%`,
                        }}
                      />
                    </span>
                  </div>
                  <span className="profile__row-count">
                    {t("profile.doneOf", { a: done, b: total })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="profile__empty">{t("profile.progressEmpty")}</p>
          )}
          <button
            type="button"
            className="btn btn--ghost profile__open"
            onClick={() => onNavigate("roadmap")}
          >
            {t("profile.openRoadmap")}
          </button>
          <button
            type="button"
            className="btn btn--ghost profile__logout"
            onClick={onLogout}
          >
            {t("account.logout")}
          </button>
        </section>
      )}
    </div>
  );
}

export default ProfileView;
