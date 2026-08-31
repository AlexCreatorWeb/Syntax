import { useT } from "../i18n/useT";
import { PROMOS } from "../lib/promos";

function PromoCard({ id }) {
  const t = useT();
  const p = PROMOS[id];
  if (!p) return null;
  return (
    <article className="card promo">
      <div className="promo__media">
        <span className="promo__badge">{t("home.sponsored")}</span>
        <img src={p.img} alt={t(p.titleKey)} loading="lazy" />
      </div>
      <div className="promo__body">
        <h4 className="promo__title">{t(p.titleKey)}</h4>
        <p className="promo__desc">{t(p.descKey)}</p>
        <button
          type="button"
          className={`btn ${p.ctaClass} promo__cta`}
          title={t("home.soon")}
          aria-disabled="true"
        >
          {t(p.ctaKey)}
        </button>
      </div>
    </article>
  );
}

export default PromoCard;
