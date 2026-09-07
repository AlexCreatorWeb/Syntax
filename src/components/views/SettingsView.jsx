import { useT } from "../../i18n/useT";
import { useLanguage } from "../../context/useLanguage";
import { totalXp, levelInfo } from "../../lib/xp";

// UX-аудит V9: Settings = реальная страница (аккаунт, внешний вид, язык,
// редактор, уведомления) вместо плейсхолдера. Support убран из навигации
// (два полых пункта обесценивали меню).
const LANGS = [
  { code: "en", label: "English" },
  { code: "ru", label: "Русский" },
  { code: "uk", label: "Українська" },
  { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" },
];

function Section({ title, children }) {
  return (
    <section className="card settings-card spotlight">
      <h2 className="settings-card__title">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, hint, children }) {
  return (
    <div className="settings-row">
      <div className="settings-row__text">
        <span className="settings-row__label">{label}</span>
        {hint && <span className="settings-row__hint">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export default function SettingsView({
  theme,
  onToggleTheme,
  session,
  userName,
  onAuth,
  onLogout,
  onNavigate,
}) {
  const t = useT();
  const { langCode, selectLanguage } = useLanguage();
  void onNavigate;
  const email = session && session.user ? session.user.email : null;
  const memberSince =
    session && session.user && session.user.created_at
      ? new Date(session.user.created_at).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : null;
  const lvl = levelInfo(totalXp());

  return (
    <div className="settings-view">
      <header className="page-head">
        <h1 className="page-head__title">{t("sidebar.settings")}</h1>
        <p className="page-head__desc">{t("settings.desc")}</p>
      </header>

      <Section title={t("settings.sectionAccount")}>
        {session ? (
          <>
            <div className="settings-account">
              <span className="settings-account__avatar" aria-hidden="true">
                {(userName || email || "?").slice(0, 1).toUpperCase()}
              </span>
              <div className="settings-account__text">
                <strong>{userName || t("settings.unknownUser")}</strong>
                {email && <span>{email}</span>}
                {memberSince && (
                  <span className="settings-account__since">
                    {t("settings.memberSince", { date: memberSince })}
                  </span>
                )}
                <span className="settings-account__xp">
                  {t("sidebar.level", { n: lvl.level })} ·{" "}
                  {t("sidebar.xp", { n: totalXp() })}
                </span>
              </div>
            </div>
            <div className="settings-account__actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={onLogout}
              >
                {t("settings.logout")}
              </button>
            </div>
          </>
        ) : (
          <div className="settings-account">
            <div className="settings-account__text">
              <strong>{t("settings.noAccount")}</strong>
              <span className="settings-account__hint">
                {t("settings.noAccountHint")}
              </span>
            </div>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => onAuth("signup")}
            >
              {t("header.signup")}
            </button>
          </div>
        )}
      </Section>

      <Section title={t("settings.sectionAppearance")}>
        <Row
          label={t("settingsMenu.appearance")}
          hint={t("settings.themeHint")}
        >
          <button
            type="button"
            className={`settings-seg ${theme === "dark" ? "" : "settings-seg--light"}`}
            onClick={onToggleTheme}
            aria-label={t("settingsMenu.appearance")}
          >
            <span className={theme === "dark" ? "is-on" : ""}>
              {t("settings.themeDark")}
            </span>
            <span className={theme === "light" ? "is-on" : ""}>
              {t("settings.themeLight")}
            </span>
          </button>
        </Row>
        <Row label={t("settings.language")} hint={t("settings.languageHint")}>
          <div
            className="settings-langs"
            role="group"
            aria-label={t("settings.language")}
          >
            {LANGS.map((l) => (
              <button
                key={l.code}
                type="button"
                className={`settings-lang ${langCode === l.code ? "is-active" : ""}`}
                onClick={() => selectLanguage(l.code)}
                aria-pressed={langCode === l.code}
              >
                {l.label}
              </button>
            ))}
          </div>
        </Row>
      </Section>

      <Section title={t("settings.sectionEditor")}>
        <Row
          label={t("settings.editorTheme")}
          hint={t("settings.editorThemeHint")}
        >
          <span className="settings-static">{t("settings.followsTheme")}</span>
        </Row>
        <Row label={t("settings.autosave")} hint={t("settings.autosaveHint")}>
          <span className="soon-badge">{t("home.soon")}</span>
        </Row>
        <Row label={t("settings.fontSize")} hint={t("settings.fontSizeHint")}>
          <span className="soon-badge">{t("home.soon")}</span>
        </Row>
      </Section>

      <Section title={t("settings.sectionNotifications")}>
        <Row label={t("settings.notifNewTasks")} hint={t("settings.notifHint")}>
          <span className="soon-badge">{t("home.soon")}</span>
        </Row>
        <Row label={t("settings.notifDaily")} hint={t("settings.notifHint2")}>
          <span className="soon-badge">{t("home.soon")}</span>
        </Row>
      </Section>
    </div>
  );
}
