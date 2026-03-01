/**
 * useDateLocale — returns the date-fns Locale that matches the active i18n language.
 *
 * Usage:
 *   const locale = useDateLocale();
 *   format(date, 'PPP', { locale });
 */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { es } from 'date-fns/locale/es';
import { enUS } from 'date-fns/locale/en-US';
import { ptBR } from 'date-fns/locale/pt-BR';
import type { Locale } from 'date-fns';
import type { Language } from '@/types';

const LOCALE_MAP: Record<Language, Locale> = {
  es,
  en: enUS,
  pt: ptBR,
};

export function useDateLocale(): Locale {
  const { i18n } = useTranslation();
  return useMemo(() => {
    const lang = i18n.language as Language;
    return LOCALE_MAP[lang] ?? es;
  }, [i18n.language]);
}
