import { useEffect, useMemo, useState } from "react";
import { useT } from "../i18n/useT";
import { useLanguage } from "../context/useLanguage";
import { translateText, translateArticleBlocks, translatableIndexes } from "../lib/translate";
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
  // Прогрессивный перевод: { done, texts: { [blockIdx]: переведённый текст } }
  const [progress, setProgress] = useState(null);
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

  // Перевод статьи по блокам (картинки/код не трогаем). ПРОГРЕССИВНО: готовые
  // батчи подменяются на лету (спиннер-прогресс с счётчиком), превью-блоки —
  // приоритетом, остальная статья — фоном. Оригинал виден сразу.
  const articleBlocks = useMemo(
    () => (article ? parseMdBlocks(article.md) : null),
    [article]
  );
  const totalBlocks = useMemo(
    () => (articleBlocks ? translatableIndexes(articleBlocks).length : 0),
    [articleBlocks]
  );
  // Блоки видного превью (первые ~PREVIEW_LIMIT знаков) — переводим первыми
  const priorityIdx = useMemo(() => {
    if (!articleBlocks) return [];
    const out = [];
    let len = 0;
    articleBlocks.forEach((b, i) => {
      len += (b.text || b.code || b.src || "").length;
      if ((b.type === "p" || b.type === "h2" || b.type === "h3" || b.type === "callout") && len <= PREVIEW_LIMIT) out.push(i);
      if (len > PREVIEW_LIMIT) return; // break
    });
    return out;
  }, [articleBlocks]);
  useEffect(() => {
    if (!articleBlocks || langCode === "en") return;
    let alive = true;
    translateArticleBlocks(articleBlocks, langCode, {
      priorityIdx,
      onBatch: (updates, done) => {
        if (!alive) return;
        // setState только в async-колбэке (react-hooks/set-state-in-effect)
        setProgress((p) => ({ done, texts: { ...(p ? p.texts : {}), ...updates } }));
      },
    });
    return () => { alive = false; };
  }, [articleBlocks, langCode, priorityIdx]);

  const isEn = langCode === "en";
  const shownTitle = !isEn && translatedTitle ? translatedTitle : item.title;
  // Мерж: переведённые блоки подменяют оригинальные по мере готовности
  const shownBlocks = useMemo(() => {
    if (!articleBlocks) return null;
    if (isEn || !progress) return articleBlocks;
    return articleBlocks.map((b, i) =>
      progress.texts[i] !== undefined ? { ...b, text: progress.texts[i] } : b
    );
  }, [articleBlocks, progress, isEn]);
  const translating = !isEn && !!progress && progress.done < totalBlocks;

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
                {translating && (
                  <div className="news-modal__progress-wrap" role="status">
                    <div className="news-modal__progress">
                      <div
                        className="news-modal__progress-fill"
                        style={{ width: `${Math.max(4, Math.round((progress.done / Math.max(totalBlocks, 1)) * 100))}%` }}
                      />
                    </div>
                    <span className="news-modal__progress-label">
                      🌐 {t("news.translatingProgress", { done: progress.done, total: totalBlocks })}
                    </span>
                  </div>
                )}
                <MdContent blocks={shownBlocks} t={t} limit={expanded ? undefined : PREVIEW_LIMIT} />
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
