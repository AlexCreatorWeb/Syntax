// UI-языки платформы + их флаги (SVG из flag-icons, только нужные 5)
import flagGb from "flag-icons/flags/4x3/gb.svg";
import flagRu from "flag-icons/flags/4x3/ru.svg";
import flagUa from "flag-icons/flags/4x3/ua.svg";
import flagEs from "flag-icons/flags/4x3/es.svg";
import flagDe from "flag-icons/flags/4x3/de.svg";

// Позже в этот же файл добавим словари переводов по кодам.
export const UI_LANGUAGES = [
  { code: "en", country: "gb", label: "EN", name: "English (UK)", flagSrc: flagGb },
  { code: "ru", country: "ru", label: "RU", name: "Русский", flagSrc: flagRu },
  { code: "uk", country: "ua", label: "UA", name: "Українська", flagSrc: flagUa },
  { code: "es", country: "es", label: "ES", name: "Español", flagSrc: flagEs },
  { code: "de", country: "de", label: "DE", name: "Deutsch", flagSrc: flagDe },
];
