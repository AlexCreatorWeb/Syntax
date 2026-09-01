import { useEffect, useState } from "react";
import { useT } from "../i18n/useT";
import { useLanguage } from "../context/useLanguage";
import { translateText } from "../lib/translate";

const UI_LOCALES = { en: "en", ru: "ru", uk: "uk", es: "es", de: "de" };

// Модалка «прочитать новость Medium»: клик по новости в списке уведомлений.
// Заголовок и анонс переводятся в UI-язык (translateText/MyMemory),
// оригинал — сворачиваемым блоком; кнопка ведёт на статью на Medium.
function NewsModal({ item, onClose }) {
  const t = useT();
  const { langCode } = useLanguage();
  const [translated, setTranslated] = useState(null); // { lang, title, summary } | null

  // Esc + body-scroll-lock (паттерн SignupModal)
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Перевод при открытии статьи и при смене языка (en — оригинал, без сетевых запросов).
  // setState только в async-колбэке (react-hooks/set-state-in-effect); «идёт перевод»
  // выводится из состояния: нет перевода для текущего языка — показываем спиннер.
  useEffect(() => {
    if (langCode === "en") return;
    let alive = true;
    Promise.all([
      translateText(item.title, langCode),
      translateText(item.summary, langCode),
    ]).then(([title, summary]) => {
      if (!alive) return;
      setTranslated({
        lang: langCode,
        title: title || item.title,
        summary: summary || item.summary,
      });
    });
    return () => { alive = false; };
  }, [item, langCode]);

  const date = new Date(item.pubDate);
  const dateStr = isNaN(date)
    ? item.pubDate
    : date.toLocaleDateString(UI_LOCALES[langCode] || "en", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

  const eff = translated && translated.lang === langCode ? translated : null; // en — всегда оригинал
  const translating = langCode !== "en" && !eff;
  const showTitle = (eff ? eff.title : item.title) || item.title;
  const showSummary = translating ? null : (eff ? eff.summary : item.summary) || item.summary;

  return (
    <div
      className="news-modal"
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="news-modal__panel">
        <button type="button" className="news-modal__close" onClick={onClose} aria-label={t("news.close")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="news-modal__meta">
          <span className="chip chip--medium">{t("news.source", { feed: t(`home.tech.${item.techId}`) })}</span>
          <span className="news-modal__meta-date">{t("news.published", { date: dateStr })}</span>
        </div>

        <h2 className="news-modal__title">{showTitle}</h2>

        {eff && (
          <span className="chip chip--medium news-modal__trans-chip">{t("news.translated")}</span>
        )}

        <div className="news-modal__body">
          {translating ? (
            <p className="news-modal__translating">
              <span className="news-modal__spinner" aria-hidden="true" />
              {t("news.translating")}
            </p>
          ) : (
            <p className="news-modal__summary">{showSummary}</p>
          )}
        </div>

        <div className="news-modal__author">{t("news.byAuthor", { author: item.author })}</div>

        <details className="news-modal__original">
          <summary>{t("news.original")}</summary>
          <div>
            <p className="news-modal__original-title">{item.title}</p>
            {item.summary && <p className="news-modal__original-text">{item.summary}</p>}
          </div>
        </details>

        <div className="news-modal__actions">
          <a
            className="btn btn--primary news-modal__read"
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("news.read")}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M7 17 17 7M8 7h9v9" />
            </svg>
          </a>
          <button type="button" className="btn news-modal__cancel" onClick={onClose}>
            {t("news.close")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NewsModal;
