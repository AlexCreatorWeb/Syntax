import { useEffect } from "react";
import { useT } from "../i18n/useT";
import { useLanguage } from "../context/useLanguage";
import TECHS, { getTech } from "../lib/techs";

// UX-аудит Q3: кульминация «курс пройден» — финальный проект/урок курса
// выполнен → модалка-сертификат. Static-мапа лого (react-compiler).
const TRACK_LOGOS = Object.fromEntries(TECHS.map((tc) => [tc.id, tc.Logo]));

const CERT_LOCALES = {
  ru: "ru-RU",
  en: "en-GB",
  uk: "uk-UA",
  es: "es-ES",
  de: "de-DE",
};

export default function CourseCompleteModal({ tech, onClose, onNavigate }) {
  const t = useT();
  const { langCode } = useLanguage();
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

  const tc = getTech(tech);
  const Logo = tc ? TRACK_LOGOS[tc.id] : null;
  const name = (tc && t(tc.label)) || tech;
  const date = new Date().toLocaleDateString(
    CERT_LOCALES[langCode] || "en-GB",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal course-done"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="course-done__badge" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="8" r="6" />
            <path d="M8.5 13.5 7 22l5-3 5 3-1.5-8.5" />
          </svg>
        </div>
        <h2>{t("courseDone.title", { name })}</h2>
        <p className="course-done__sub">{t("courseDone.sub")}</p>
        <div className="course-done__cert">
          <div className="course-done__cert-head">
            {Logo ? (
              <span className="course-done__logo">
                <Logo />
              </span>
            ) : null}
            <span className="course-done__cert-name">{name}</span>
          </div>
          <span className="course-done__cert-line">
            {t("sidebar.complete")}
          </span>
          <span className="course-done__cert-date">{date}</span>
        </div>
        <div className="course-done__actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              onClose();
              onNavigate("rankings");
            }}
          >
            {t("courseDone.viewRank")}
          </button>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            {t("courseDone.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
