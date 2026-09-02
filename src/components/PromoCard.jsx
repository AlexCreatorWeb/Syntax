import { useT } from "../i18n/useT";
import { PROMOS } from "../lib/promos";

// Иконка CTA: корзина (книга, как в дизайне) / внешняя ссылка (остальное)
function CtaIcon({ kind }) {
  return kind === "cart" ? (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 4h-2l-1 2h2l3.6 7.6-1.4 2.5c-.6 1.1.2 2.4 1.5 2.4h9.3c.6 0 1.1-.3 1.4-.9l3.1-6.2c.3-.7-.2-1.4-.9-1.4H6.6L4.5 4H2v2h2l3.6 7.6-1.3 2.3c-.6 1.2.3 2.6 1.7 2.6h11v-2H8.7l1.1-2h11.5l-2.4 4.9H8.3l2-3.6L7 4Zm4 14a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm7 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}

function PromoCard({ id }) {
  const t = useT();
  const p = PROMOS[id];
  if (!p) return null;

  // Книга: макет «amazone-widget» — наклонная обложка с тенью (hover: scale),
  // по центру название/подзаголовок/автор, primary-кнопка с корзиной.
  if (p.bookLayout) {
    return (
      <article className="card promo promo--book">
        <div className="promo--book__glow" aria-hidden="true" />
        <div className="promo--book__cover">
          <img src={p.img} alt={t(p.titleKey)} loading="lazy" />
        </div>
        <div className="promo--book__body">
          <h4 className="promo--book__title">{t(p.titleKey)}</h4>
        </div>
        <a
          className={`btn ${p.ctaClass} promo--book__cta`}
          href={p.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <CtaIcon kind={p.ctaIcon} />
          {t(p.ctaKey)}
        </a>
      </article>
    );
  }

  const ctaInner = (
    <>
      {t(p.ctaKey)}
      {p.url && <CtaIcon kind={p.ctaIcon} />}
    </>
  );
  return (
    <article className="card promo">
      <div className="promo__media">
        <span className="promo__badge">{t("home.sponsored")}</span>
        <img src={p.img} alt={t(p.titleKey)} loading="lazy" />
      </div>
      <div className="promo__body">
        <h4 className="promo__title">{t(p.titleKey)}</h4>
        <p className="promo__desc">{t(p.descKey)}</p>
        {p.url ? (
          <a
            type="button"
            className={`btn ${p.ctaClass} promo__cta`}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {ctaInner}
          </a>
        ) : (
          <button
            type="button"
            className={`btn ${p.ctaClass} promo__cta`}
            title={t("home.soon")}
            aria-disabled="true"
          >
            {ctaInner}
          </button>
        )}
      </div>
    </article>
  );
}

export default PromoCard;
