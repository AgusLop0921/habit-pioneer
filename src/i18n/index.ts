import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import es from './locales/es';
import en from './locales/en';
import pt from './locales/pt';

const deviceLang = getLocales()[0]?.languageCode ?? 'es';
const supportedLangs = ['es', 'en', 'pt'];
const fallback = supportedLangs.includes(deviceLang) ? deviceLang : 'es';

i18n.use(initReactI18next).init({
  resources: { es, en, pt },
  lng: fallback,
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

export default i18n;
