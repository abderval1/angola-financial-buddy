import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n
    .use(initReactI18next)
    .init({
        resources: {
            pt: {
                translation: {}
            },
            en: {
                translation: {}
            }
        },
        lng: "pt",
        fallbackLng: "pt",
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
