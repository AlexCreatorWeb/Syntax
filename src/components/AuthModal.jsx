import { useEffect, useRef, useState } from "react";
import { useT } from "../i18n/useT";
import { signIn, signUp } from "../lib/auth";

// Модальная авторизация: два режима — signup (имя + email + пароль) и login (email + пароль).
// Бэкенд — Supabase Auth; сессию ловит App через onAuthStateChange (модалка просто закрывается).
// session === null после signUp → Supabase ждёт подтверждения email: показываем «проверьте почту».
// Монтируется ТОЛЬКО когда открыта (App рендерит условно) + key=mode — state всегда свежий
// (без sync-reset в effect — react-hooks/set-state-in-effect).
function AuthModal({ mode, onClose, onSwitchMode, ctx }) {
  const t = useT();
  const boxRef = useRef(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null); // code из lib/auth
  const [sent, setSent] = useState(false); // signup ушёл, ждём подтверждение email

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const isLogin = mode === "login";

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("email");
      return;
    }
    if (password.length < 6) {
      setError("weak");
      return;
    }
    setBusy(true);
    try {
      if (isLogin) {
        await signIn({ email, password });
        onClose(); // сессию подхватит слушатель в App
      } else {
        const { session } = await signUp({ name, email, password });
        if (session) {
          onClose(); // подтверждение email отключено — вошли сразу
        } else {
          setSent(true); // письмо с подтверждением ушло
        }
      }
    } catch (err) {
      setError(err.code || "generic");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="signup"
      role="dialog"
      aria-modal="true"
      aria-label={t(isLogin ? "auth.loginTitle" : "signup.title")}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="signup__box" ref={boxRef}>
        <button type="button" className="signup__close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        {sent ? (
          // Signup ушёл, но сессии нет (Supabase требует подтвердить email)
          <div className="auth__sent">
            <div className="auth__sent-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
            </div>
            <h2 className="signup__title">{t("auth.emailSentTitle")}</h2>
            <p className="signup__subtitle">{t("auth.emailSent", { email })}</p>
            <button type="button" className="btn btn--primary signup__submit" onClick={onClose}>
              {t("auth.emailSentOk")}
            </button>
          </div>
        ) : (
          <>
            <h2 className="signup__title">{t(isLogin ? "auth.loginTitle" : ctx === "challenge" ? "signup.titleChallenge" : "signup.title")}</h2>
            <p className="signup__subtitle">{t(isLogin ? "auth.loginSubtitle" : ctx === "challenge" ? "signup.subtitleChallenge" : "signup.subtitle")}</p>
            <form
              className="signup__form"
              onSubmit={submit}
              aria-busy={busy}
            >
              {!isLogin && (
                <input
                  className="field"
                  type="text"
                  placeholder={t("signup.name")}
                  aria-label={t("signup.name")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              )}
              <input
                className="field"
                type="email"
                placeholder={t("signup.email")}
                aria-label={t("signup.email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
              <input
                className="field"
                type="password"
                placeholder={t("auth.password")}
                aria-label={t("auth.password")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
              />
              {error && (
                <p className="auth__error" role="alert">
                  {t(`auth.err${error.charAt(0).toUpperCase()}${error.slice(1)}`)}
                </p>
              )}
              <button type="submit" className="btn btn--primary signup__submit" disabled={busy}>
                {busy ? (
                  <span className="auth__spinner" aria-hidden="true" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                )}
                {t(isLogin ? "auth.loginSubmit" : "signup.submit")}
              </button>
            </form>
            <button type="button" className="signup__switch" onClick={() => onSwitchMode(isLogin ? "signup" : "login")}>
              {t(isLogin ? "auth.toSignup" : "auth.toLogin", { action: t(isLogin ? "auth.signupCta" : "auth.loginCta") })}
            </button>
            <button type="button" className="signup__guest" onClick={onClose}>
              {t("signup.guest")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default AuthModal;
