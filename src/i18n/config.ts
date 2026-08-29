import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import es from "./locales/es.json";

const savedLanguage = localStorage.getItem("wearos_manager_lang") || "en";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
  },
  lng: savedLanguage,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export const changeLanguage = (lang: "en" | "es") => {
  i18n.changeLanguage(lang);
  localStorage.setItem("wearos_manager_lang", lang);
};

export default i18n;
