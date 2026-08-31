import promoBook from "../assets/promo-book.png";
import promoStudio from "../assets/promo-studio.png";

// Реклама-виджеты. Какой показывается где — определяют вьюхи
// (пока книга в дефолтном правом rail; остальные — позже).
export const PROMOS = {
  book: {
    img: promoBook,
    titleKey: "promo.book.title",
    descKey: "promo.book.desc",
    ctaKey: "promo.book.cta",
    ctaClass: "btn--ghost",
  },
  studio: {
    img: promoStudio,
    titleKey: "promo.studio.title",
    descKey: "promo.studio.desc",
    ctaKey: "promo.studio.cta",
    ctaClass: "btn--ghost",
  },
};
