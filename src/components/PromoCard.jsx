import { useT } from "../i18n/useT";
import { PROMOS } from "../lib/promos";

function PromoCard({ id }) {
  const t = useT();
  const p = PROMOS[id];
  if (!p) return null;
  const ctaInner = (
    <>
      {t(p.ctaKey)}
      {p.url && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M7 17 17 7M9 7h8v8" />
        </svg>
      )}
    </>
  );
  return (
    <article className="card promo">
      <div className={`promo__media${p.mediaClass ? ` ${p.mediaClass}` : ""}`}>
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
