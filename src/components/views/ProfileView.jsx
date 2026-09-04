import { useEffect, useRef, useState } from "react";
import { useT } from "../../i18n/useT";
import { useLanguage } from "../../context/useLanguage";
import TECHS from "../../lib/techs";
import {
  getCompleted,
  getDoneTasks,
  prefixOfCompleted,
} from "../../lib/progress";
import { totalXp } from "../../lib/xp";
import { useAvatar, setAvatar, fileToAvatarDataUrl } from "../../lib/avatar";
import { saveAvatarUrl } from "../../lib/auth";

// Страница профиля #/profile: личность (аватар/монограмма, имя, email, дата
// регистрации) + прогресс по ИЗУЧАЕМЫМ трекам (только где есть отметки —
// весь список технологий не пихаем: юзер может Python не учить) + logout.
// Логотипы треков — static-мапа на уровне модуля (React-Compiler).
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
  const [avatarUrl, setAvatarState] = useAvatar();
  const fileRef = useRef(null);
  const [avatarErr, setAvatarErr] = useState(null);
  // Ресайз асинхронный: файл → jpeg 256×256 → localStorage + profiles.
  useEffect(() => {
    const onFile = async (e) => {
      const file = e.target.files && e.target.files[0];
      e.target.value = "";
      if (!file) return;
      setAvatarErr(null);
      try {
        const dataUrl = await fileToAvatarDataUrl(file);
        setAvatarState(dataUrl);
        setAvatar(dataUrl);
        if (session && session.user) saveAvatarUrl(session.user, dataUrl);
      } catch {
        setAvatarErr(t("profile.avatarErr"));
      }
    };
    const el = fileRef.current;
    if (el) el.addEventListener("change", onFile);
    return () => el && el.removeEventListener("change", onFile);
  }, [session, t, setAvatarState]);

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

  // ТРЕКИ, КОТОРЫЕ ЮЗЕР ИЗУЧАЕТ: есть выполненный урок ИЛИ решённая задача.
  // Прочие курсовые треки не показываем (не каждый учит всё подряд).
  const rows = [];
  let totalDone = 0;
  let totalTasks = 0;
  if (isAuthed) {
    const doneTasks = getDoneTasks();
    for (const tc of TECHS) {
      const dbTech = (dbLessons || []).filter((l) => l.tech === tc.id);
      if (!dbTech.length) continue;
      const dbIds = new Set(dbTech.map((l) => l.id));
      // Валидный прогресс = последовательный префикс (Udemy)
      const lessonsDone = prefixOfCompleted(dbTech, getCompleted(tc.id)).filter(
        (id) => dbIds.has(id),
      ).length;
      const tasksDone = doneTasks.filter((k) =>
        k.startsWith(`${tc.id}:`),
      ).length;
      if (!lessonsDone && !tasksDone) continue; // трек не изучается
      totalDone += lessonsDone;
      totalTasks += tasksDone;
      rows.push({
        id: tc.id,
        Logo: TRACK_LOGOS[tc.id],
        done: lessonsDone,
        total: dbTech.length,
        tasks: tasksDone,
      });
    }
  }

  return (
    <div className="profile">
      <section className="card card--feature profile__card spotlight">
        <span
          className={`avatar-dot avatar-dot--md profile__avatar${
            avatarUrl ? " profile__avatar--img" : ""
          }`}
          style={
            avatarUrl
              ? {
                  backgroundImage: `url(${avatarUrl})`,
                }
              : {
                  background: `linear-gradient(135deg, hsl(${hue} 45% 32%), hsl(${hue} 55% 18%))`,
                }
          }
        >
          {!avatarUrl &&
            (isAuthed && userName ? userName : "S").charAt(0).toUpperCase()}
        </span>
        {isAuthed && (
          <div className="profile__avatar-actions">
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => fileRef.current && fileRef.current.click()}
            >
              {avatarUrl ? t("profile.avatarChange") : t("profile.avatarAdd")}
            </button>
            {avatarUrl && (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => {
                  setAvatar(null);
                  setAvatarState(null);
                  saveAvatarUrl(session.user, "");
                }}
              >
                {t("profile.avatarRemove")}
              </button>
            )}
            {avatarErr && (
              <span className="profile__avatar-err" role="alert">
                {avatarErr}
              </span>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              aria-hidden="true"
              tabIndex={-1}
            />
          </div>
        )}
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
              {totalTasks > 0
                ? ` · ${t("profile.tasksDone", { n: totalTasks })}`
                : ""}{" "}
              · {t("profile.xp", { n: totalXp() })}
            </span>
          </header>
          {rows.length ? (
            <div className="profile__rows">
              {rows.map(({ id, Logo, done, total, tasks }) => (
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
                      {tasks > 0 && (
                        <span className="profile__row-tasks">
                          {t("profile.rowTasks", { n: tasks })}
                        </span>
                      )}
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
          <div className="profile__actions">
            <button
              type="button"
              className="btn btn--ghost profile__open"
              onClick={() => onNavigate("roadmap")}
            >
              {t("profile.openRoadmap")}
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm profile__logout"
              onClick={onLogout}
            >
              {t("account.logout")}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export default ProfileView;
