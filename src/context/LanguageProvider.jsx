import { useEffect, useState } from "react";
import { LanguageContext } from "./LanguageContext";
import { UI_LANGUAGES } from "./uiLanguages";

const STORAGE_KEY = "syntax-ui-lang";

// UI-язык интерфейса: выбор в топбаре + персистентность в localStorage.
function LanguageProvider({ children }) {
  const [langCode, setLangCode] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return UI_LANGUAGES.some((l) => l.code === saved) ? saved : "en";
  });

  const selectLanguage = (code) => setLangCode(code);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, langCode);
    document.documentElement.lang = langCode;
  }, [langCode]);

  const lang = UI_LANGUAGES.find((l) => l.code === langCode) || UI_LANGUAGES[0];

  return (
    <LanguageContext.Provider value={{ lang, langCode, selectLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export default LanguageProvider;
