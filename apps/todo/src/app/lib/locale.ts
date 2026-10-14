const LOCALE_MAP: Record<string, string> = {
  en: 'en-US',
  de: 'de-DE',
  uk: 'uk-UA',
};

/** Intl locale for an i18n language code such as "en" or "uk-UA". */
export function resolveLocale(language: string): string {
  return LOCALE_MAP[language] ?? LOCALE_MAP[language.split('-')[0]] ?? 'en-US';
}
