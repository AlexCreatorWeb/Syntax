import bookFlanagan from "../assets/book-flanagan.jpg";
import promoStudio from "../assets/promo-studio.png";

// Реклама-виджеты. Какой показывается где — определяют вьюхи.
// book: оригинальная обложка (Amazon: O'Reilly, носорог) — локальный ассет,
// CTA ведёт на страницу книги в Amazon (новая вкладка).
export const PROMOS = {
  book: {
    img: bookFlanagan,
    rowLayout: true, // обложка-миниатюра слева + текст справа (портретный оригинал не режется)
    url: "https://www.amazon.com/dp/1491952024", // JavaScript: The Definitive Guide, 7th ed.
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
