import promoStudio from "../assets/promo-studio.png";

// Реклама-виджеты. Какой показывается где — определяют вьюхи.
// book: обложка Flanagan рисется CSS'ом (.promo__cover — нет зависимости от
// внешних картинок), CTA ведёт на страницу книги в Amazon (новая вкладка).
export const PROMOS = {
  book: {
    cover: "flanagan",
    url: "https://www.amazon.com/dp/1098151219", // JavaScript: The Definitive Guide, 7th ed.
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
