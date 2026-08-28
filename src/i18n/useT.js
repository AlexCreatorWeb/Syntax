import { useLanguage } from "../context/useLanguage";
import { LOCALES } from "./index";
import en from "./locales/en";

// Возвращает функцию перевода: t("sidebar.roadmap"), t("roadmap.module", { n: 4 })
// Ненайденные ключи откатываются на en, затем на сам ключ.
export function useT() {
  const { langCode } = useLanguage();
  const dict = LOCALES[langCode] || en;

  const lookup = (d, key) =>
    key.split(".").reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), d);

  return (key, params) => {
    let value = lookup(dict, key);
    if (value === undefined) value = lookup(en, key);
    if (value === undefined) return key;
    if (params) {
      return String(value).replace(/\{(\w+)\}/g, (m, p) =>
        params[p] !== undefined ? String(params[p]) : m
      );
    }
    return value;
  };
}
