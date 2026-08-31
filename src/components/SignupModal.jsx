import { useEffect, useRef } from "react";
import { useT } from "../i18n/useT";

// Sign-up модалка для всех гостевых действий (demo/preview → «создайте аккаунт»,
// либо «continue as guest»). Пока без бэкенда: submit просто закрывает.
function SignupModal({ open, onClose, onAuthed }) {
  const t = useT();
  const boxRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <div
      className="signup"
      role="dialog"
      aria-modal="true"
      aria-label={t("signup.title")}
      hidden={!open}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="signup__box" ref={boxRef}>
        <button type="button" className="signup__close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        <h2 className="signup__title">{t("signup.title")}</h2>
        <p className="signup__subtitle">{t("signup.subtitle")}</p>
        <form
          className="signup__form"
          onSubmit={(e) => {
            e.preventDefault();
            onAuthed && onAuthed(); // демо-auth: submit «логинит» юзера
            onClose();
          }}
        >
          <input className="field" type="text" placeholder={t("signup.name")} aria-label={t("signup.name")} />
          <input className="field" type="email" placeholder={t("signup.email")} aria-label={t("signup.email")} />
          <button type="submit" className="btn btn--primary signup__submit">
            {t("signup.submit")}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </form>
        <button type="button" className="signup__guest" onClick={onClose}>
          {t("signup.guest")}
        </button>
      </div>
    </div>
  );
}

export default SignupModal;
