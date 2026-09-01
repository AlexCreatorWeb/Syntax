import { useEffect, useMemo, useState } from "react";
import { useT } from "../i18n/useT";
import { useLanguage } from "../context/useLanguage";
import { translateText, translateLong } from "../lib/translate";
import { fetchMediumArticle } from "../lib/medium";
import { parseMdBlocks } from "../lib/markdown";
import { MdContent } from "../lib/markdown-view";

const UI_LOCALES = { en: "en", ru: "ru", uk: "uk", es: "es", de: "de" };
// Свёрнутый вид: сколько знаков статьи показывать до «Learn more»
const PREVIEW_LIMIT = 700;

// Модалка «прочитать новость Medium»: ПОЛНАЯ статья (Jina Reader → markdown-lite)
// в широкой модалке (70vw). Заголовок и текст переводятся в UI-язык
// (translateText/translateLong → MyMemory), по сбое — оригинал.
// Статья свёрнута: превью + кнопка «Learn more» / «Show less».
function NewsModal({ item, onClose }) {
  const t = useT();
  const { langCode } = useLanguage();
  const [translated, setTranslated] = useState(null); // заголовок: { lang, title } | null
  const [article, setArticle] = useState(null); // полный markdown | null
  const [articleFailed, setArticleFailed] = useState(false);
  const [articleTranslated, setArticleTranslated] = useState(null); // string | null
  const [expanded, setExpanded] = useState(false);

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

  // Перевод заголовка (setState только в async-колбэке — react-hooks/set-state-in-effect)
  useEffect(() => {
    if (langCode === "en") return;
    let alive = true;
    translateText(item.title, langCode).then((title) => {
      if (!alive) return;
      setTranslated({ lang: langCode, title: title || item.title });
    });
    return () => { alive = false; };
  }, [item, langCode]);

  // Загрузка полной статьи (модалка монтируется на каждую новость заново)
  useEffect(() => {
    let alive = true;
    fetchMediumArticle(item.link).then((a) => {
      if (!alive) return;
      if (a) setArticle(a.md);
      else setArticleFailed(true);
    });
    return () => { alive = false; };
  }, [item.link]);

  // Перевод полной статьи (чанками); оригинал показываем сразу, когда будет готов —
  // подменяем (читатель не ждёт на пустой модалке)
  useEffect(() => {
    if (!article || langCode === "en") return;
    let alive = true;
    translateLong(article, langCode).then((tr) => {
      if (alive && tr) setArticleTranslated(tr);
    });
    return () => { alive = false; };
  }, [article, langCode]);

  const isEn = langCode === "en";
  const shownTitle = !isEn && translated && translated.lang === langCode ? translated.title : item.title;
  const shownArticle = !isEn && articleTranslated ? articleTranslated : article;
  const translatingArticle = !isEn && article && !articleTranslated;

  // «Learn more» показываем, только если статья реально длиннее превью
  const totalLen = useMemo(() => {
    if (!shownArticle) return 0;
    return parseMdBlocks(shownArticle).reduce((sum, b) => sum + (b.text || b.code || b.src || "").length, 0);
  }, [shownArticle]);
  const hasMore = totalLen > PREVIEW_LIMIT;

  const date = new Date(item.pubDate);
  const dateStr = isNaN(date)
    ? item.pubDate
    : date.toLocaleDateString(UI_LOCALES[langCode] || "en", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

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

        <div className="news-modal__inner">
          <div className="news-modal__meta">
            <span className="chip chip--medium">{t("news.source", { feed: t(`home.tech.${item.techId}`) })}</span>
            <span className="news-modal__meta-date">{t("news.published", { date: dateStr })}</span>
            <span className="news-modal__meta-author">{t("news.byAuthor", { author: item.author })}</span>
          </div>

          <h2 className="news-modal__title">{shownTitle}</h2>
          {!isEn && translated && (
            <span className="chip chip--medium news-modal__trans-chip">{t("news.translated")}</span>
          )}

          <div className="news-modal__body">
            {!article && !articleFailed ? (
              <p className="news-modal__loading">
                <span className="news-modal__spinner" aria-hidden="true" />
                {t("news.loading")}
              </p>
            ) : articleFailed ? (
              <p className="news-modal__summary">{item.summary || item.title}</p>
            ) : (
              <>
                <MdContent src={shownArticle} t={t} limit={expanded ? undefined : PREVIEW_LIMIT} />
                {translatingArticle && (
                  <p className="news-modal__loading news-modal__loading--inline">
                    <span className="news-modal__spinner" aria-hidden="true" />
                    {t("news.translating")}
                  </p>
                )}
                {hasMore && (
                  <button
                    type="button"
                    className="btn news-modal__more"
                    onClick={() => setExpanded((v) => !v)}
                  >
                    {expanded ? t("news.showLess") : t("news.learnMore")}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewsModal;
