import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import es from '../locales/es.json';
import en from '../locales/en.json';

const LANG_KEY = 'techstore-lang';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
    },
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: LANG_KEY,
    },
  });

export const setHtmlLang = (lng) => {
  if (document && document.documentElement) {
    document.documentElement.lang = lng === 'en' ? 'en' : 'es';
  }
};

i18n.on('languageChanged', (lng) => {
  setHtmlLang(lng);
  try {
    localStorage.setItem(LANG_KEY, lng);
  } catch {
    // ignore
  }
});

setHtmlLang(i18n.language);

export default i18n;
