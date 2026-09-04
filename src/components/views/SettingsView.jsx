import { useRef, useState } from "react";
import { useT } from "../../i18n/useT";
import { useLanguage } from "../../context/useLanguage";
import { UI_LANGUAGES } from "../../context/uiLanguages";
import { useAvatar, setAvatar, fileToAvatarDataUrl } from "../../lib/avatar";
import { saveAvatarUrl, updateUserName } from "../../lib/auth";

// Вкладка Settings: рабочие настройки, которые уже существуют на платформе —
// тема (тёмная/светлая), язык интерфейса, профиль (имя, аватар), аккаунт (email,
// дата, logout), «О платформе». Гостю — то же, что доступно без аккаунта.
const DATE_LOCALES = {
  en: "en-GB",
  ru: "ru-RU",
  uk: "uk-UA",
  es: "es-ES",
  de: "de-DE",
};

function SettingsView({ theme, onToggleTheme, session, userName, onLogout, onNavigate }) {
  const t = useT();
  const { langCode, selectLanguage } = useLanguage();
  const isAuthed = Boolean(session && session.user);
  const [avatarUrl, setAvatarState] = useAvatar();
  const fileRef = useRef(null);
  const [nameDraft, setNameDraft] = useState(userName || "");
  const [nameState, setNameState] = useState(null); // null | "saving" | "ok" | "err"
  const [avatarErr, setAvatarErr] = useState(null);

  // Имя синхронизируем при смене userName (после login/смены имени) — без effect:
  // draft держим state'ом и сбрасываем явно при сохранении.
  const onPickFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setAvatarErr(null);
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      setAvatarState(dataUrl);
      setAvatar(dataUrl);
      if (isAuthed) saveAvatarUrl(session.user, dataUrl);
    } catch {
      setAvatarErr(t("profile.avatarErr"));
    }
  };

  const saveName = async () => {
    const name = nameDraft.trim();
    if (!name || name === userName || !isAuthed) return;
    setNameState("saving");
    const ok = await updateUserName(session.user, name);
    setNameState(ok ? "ok" : "err");
    if (ok) setTimeout(() => setNameState(null), 2500);
  };

  const memberSince =
    isAuthed && session.user.created_at
      ? new Date(session.user.created_at).toLocaleDateString(
          DATE_LOCALES[langCode] || "en-GB",
          { year: "numeric", month: "long", day: "numeric" },
        )
      : null;

  return (
    <div className="settings">
      <header className="settings__head">
        <h1 className="lesson__title">{t("settings.title")}</h1>
        <p className="lesson__desc">{t("settings.titleDesc")}</p>
      </header>

      {/* Переход к обучению: Settings — «тупиковая» вкладка, выводим студента
          обратно на дорожную карту (Continue Learning) */}
      {isAuthed && (
        <section className="card card--feature settings__section settings__learning spotlight">
          <h2 className="settings__h">{t("settings.learn")}</h2>
          <p className="settings__desc">{t("settings.learnDesc")}</p>
          <button
            type="button"
            className="btn btn--primary settings__learn-btn"
            onClick={() => onNavigate && onNavigate("roadmap")}
          >
            {t("settings.continueLearning")}
          </button>
        </section>
      )}

      {/* Внешний вид — тема (тот же switch, что в сайдбаре/хедере) */}
      <section className="card settings__section">
        <h2 className="settings__h">{t("settings.appearance")}</h2>
        <p className="settings__desc">{t("settings.appearanceDesc")}</p>
        <div
          className="settings__theme"
          role="group"
          aria-label={t("settings.appearance")}
        >
          <button
            type="button"
            className={`settings__theme-opt${theme === "dark" ? " is-active" : ""}`}
            aria-pressed={theme === "dark"}
            onClick={() => theme !== "dark" && onToggleTheme()}
          >
            <span aria-hidden="true">🌙</span> {t("settings.dark")}
          </button>
          <button
            type="button"
            className={`settings__theme-opt${theme === "light" ? " is-active" : ""}`}
            aria-pressed={theme === "light"}
            onClick={() => theme !== "light" && onToggleTheme()}
          >
            <span aria-hidden="true">☀️</span> {t("settings.light")}
          </button>
        </div>
      </section>

      {/* Язык интерфейса */}
      <section className="card settings__section">
        <h2 className="settings__h">{t("settings.language")}</h2>
        <p className="settings__desc">{t("settings.languageDesc")}</p>
        <div className="settings__langs">
          {UI_LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              className={`settings__lang${langCode === l.code ? " is-active" : ""}`}
              aria-pressed={langCode === l.code}
              onClick={() => selectLanguage(l.code)}
            >
              <img src={l.flagSrc} alt="" className="settings__lang-flag" />
              <span>{l.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Профиль: имя + аватар (authed) */}
      {isAuthed && (
        <section className="card settings__section">
          <h2 className="settings__h">{t("settings.profile")}</h2>
          <div className="settings__avatar-row">
            <span
              className={`avatar-dot avatar-dot--md settings__avatar${avatarUrl ? " avatar-dot--img" : ""}`}
              style={
                avatarUrl
                  ? { backgroundImage: `url(${avatarUrl})` }
                  : {
                      background:
                        "linear-gradient(135deg, var(--surface-3), var(--surface-2))",
                    }
              }
            >
              {!avatarUrl && (userName || "S").charAt(0).toUpperCase()}
            </span>
            <div className="settings__avatar-actions">
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
                    setAvatarState(null);
                    setAvatar(null);
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
                onChange={onPickFile}
              />
            </div>
          </div>
          <label className="settings__field">
            <span className="settings__label">{t("settings.name")}</span>
            <div className="settings__name-row">
              <input
                type="text"
                className="field"
                value={nameDraft}
                maxLength={50}
                disabled={nameState === "saving"}
                onChange={(e) => {
                  setNameDraft(e.target.value);
                  setNameState(null);
                }}
              />
              <button
                type="button"
                className="btn btn--primary"
                disabled={
                  !nameDraft.trim() ||
                  nameDraft.trim() === userName ||
                  nameState === "saving"
                }
                onClick={saveName}
              >
                {t("settings.save")}
              </button>
            </div>
            <span
              className={`settings__name-state${nameState ? " is-on" : ""}`}
              role="status"
            >
              {nameState === "saving" && t("settings.saving")}
              {nameState === "ok" && t("settings.saved")}
              {nameState === "err" && t("settings.saveErr")}
            </span>
          </label>
        </section>
      )}

      {/* Аккаунт */}
      {isAuthed && (
        <section className="card settings__section">
          <h2 className="settings__h">{t("settings.account")}</h2>
          <dl className="settings__facts">
            <div className="settings__fact">
              <dt>{t("settings.email")}</dt>
              <dd>{session.user.email}</dd>
            </div>
            {memberSince && (
              <div className="settings__fact">
                <dt>{t("settings.memberSince")}</dt>
                <dd>{memberSince}</dd>
              </div>
            )}
          </dl>
          <button
            type="button"
            className="btn btn--ghost btn--sm settings__logout"
            onClick={onLogout}
          >
            {t("account.logout")}
          </button>
        </section>
      )}

      {/* О платформе */}
      <section className="card settings__section">
        <h2 className="settings__h">{t("settings.about")}</h2>
        <p className="settings__about">{t("settings.aboutBody")}</p>
      </section>
    </div>
  );
}

export default SettingsView;
