import { useEffect, useMemo, useState } from "react";
import { useT } from "../i18n/useT";
import { useLanguage } from "../context/useLanguage";
import { translateText, translateArticleBlocks } from "../lib/translate";
import { fetchMediumArticle } from "../lib/medium";
import { parseMdBlocks } from "../lib/markdown";
import { MdContent } from "../lib/markdown-view";
import Avatar from "./Avatar";

const UI_LOCALES = { en: "en", ru: "ru", uk: "uk", es: "es", de: "de" };
// Свёрнутый вид: сколько знаков статьи показывать до «Learn more»
const PREVIEW_LIMIT = 700;

// Модалка «прочитать новость Medium»: ПОЛНАЯ статья (Jina Reader → markdown-lite)
// в широкой модалке (70vw). Шапка: источник · аватар автора · автор · дата.
// Перевод: заголовок и текстовые блоки статьи в UI-язык (по блокам — код и
// картинки через MT не проходят, поэтому всегда рендерятся).
// Статья свёрнута: превью + кнопка «Learn more» / «Show less»;
// кнопка закрытия sticky — доступна внизу статьи без скролла вверх.
function NewsModal({ item, onClose }) {
  const t = useT();
  const { langCode } = useLanguage();
  const [translatedTitle, setTranslatedTitle] = useState(null); // string | null
  const [article, setArticle] = useState(null); // { md, avatar } | null
  const [articleFailed, setArticleFailed] = useState(false);
  const [translatedBlocks, setTranslatedBlocks] = useState(null); // блоки | null
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

  // setState только в async-колбэках (react-hooks/set-state-in-effect).
  // Модалка монтируется на каждую новость заново, сбросов state не нужно.

  // Перевод заголовка
  useEffect(() => {
    if (langCode === "en") return;
    let alive = true;
    translateText(item.title, langCode).then((title) => {
      if (alive && title) setTranslatedTitle(title);
    });
    return () => { alive = false; };
  }, [item, langCode]);

  // Загрузка полной статьи (+ аватар автора)
  useEffect(() => {
    let alive = true;
    fetchMediumArticle(item.link).then((a) => {
      if (!alive) return;
      if (a) setArticle(a);
      else setArticleFailed(true);
    });
    return () => { alive = false; };
  }, [item.link]);

  // Перевод статьи по блокам (картинки/код не трогаем). Оригинал показываем
  // сразу; готовый перевод подменяет (спиннер «Переводим…» в конце).
  const articleBlocks = useMemo(
    () => (article ? parseMdBlocks(article.md) : null),
    [article]
  );
  useEffect(() => {
    if (!articleBlocks || langCode === "en") return;
    let alive = true;
    translateArticleBlocks(articleBlocks, langCode).then((tr) => {
      if (alive && tr) setTranslatedBlocks(tr);
    });
    return () => { alive = false; };
  }, [articleBlocks, langCode]);

  const isEn = langCode === "en";
  const shownTitle = !isEn && translatedTitle ? translatedTitle : item.title;
  const shownBlocks = !isEn && translatedBlocks ? translatedBlocks : articleBlocks;
  const translatingArticle = !isEn && articleBlocks && !translatedBlocks;

  // «Learn more» показываем, только если статья реально длиннее превью
  const totalLen = useMemo(() => {
    if (!shownBlocks) return 0;
    return shownBlocks.reduce((sum, b) => sum + (b.text || b.code || b.src || "").length, 0);
  }, [shownBlocks]);
  const hasMore = totalLen > PREVIEW_LIMIT;

  const date = new Date(item.pubDate);
  const dateStr = isNaN(date)
    ? item.pubDate
    : date.toLocaleDateString(UI_LOCALES[langCode] || "en", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
  const authorHue = useMemo(
    () => [...item.author].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 360,
    [item.author]
  );

  return (
    <div
      className="news-modal"
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="news-modal__panel">
        {/* sticky: кнопка закрытия доступна и в конце длинной статьи */}
        <button type="button" className="news-modal__close" onClick={onClose} aria-label={t("news.close")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="news-modal__inner">
          <div className="news-modal__meta">
            <span className="chip chip--medium">{t("news.source", { feed: t(`home.tech.${item.techId}`) })}</span>
            <span className="news-modal__byline">
              {article && article.avatar ? (
                <img className="news-modal__avatar" src={article.avatar} alt="" loading="lazy" />
              ) : (
                <Avatar name={item.author} hue={authorHue} size="xs" />
              )}
              <span className="news-modal__meta-author">{item.author}</span>
              <span className="news-modal__dot">·</span>
              <span className="news-modal__meta-date">{dateStr}</span>
            </span>
          </div>

          <h2 className="news-modal__title">{shownTitle}</h2>

          <div className="news-modal__body">
            {!articleBlocks && !articleFailed ? (
              <>
                {/* Skeleton (ванильный CSS shimmer) — Jina Reader отдаёт статью не мгновенно */}
                <div className="news-skeleton" aria-hidden="true">
                  <div className="news-skeleton__hero" />
                  <div className="news-skeleton__line news-skeleton__line--w70" />
                  <div className="news-skeleton__line" />
                  <div className="news-skeleton__line news-skeleton__line--w90" />
                  <div className="news-skeleton__line" />
                  <div className="news-skeleton__line news-skeleton__line--w60" />
                </div>
                <p className="news-modal__loading">
                  <span className="news-modal__spinner" aria-hidden="true" />
                  {t("news.loading")}
                </p>
              </>
            ) : articleFailed ? (
              <p className="news-modal__summary">{item.summary || item.title}</p>
            ) : (
              <>
                <MdContent blocks={shownBlocks} t={t} limit={expanded ? undefined : PREVIEW_LIMIT} />
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
