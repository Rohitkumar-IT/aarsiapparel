export const LOCALES = ["en", "hi"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "aarsi_locale";
export const LOCALE_LABEL: Record<Locale, { short: string; native: string; html: string; intl: string }> = {
  en: { short: "EN", native: "English", html: "en-IN", intl: "en-IN" },
  hi: { short: "हिं", native: "हिन्दी", html: "hi-IN", intl: "hi-IN" },
};
export const isLocale = (v: unknown): v is Locale => typeof v === "string" && (LOCALES as readonly string[]).includes(v);

export type Messages = Record<string, string>;
export type TFn = ((key: string, vars?: Record<string, string | number>) => string) & { locale: Locale };

/** English text is the key. Missing Hindi → falls back to the English key, so nothing ever breaks. */
export function makeT(messages: Messages, locale: Locale = DEFAULT_LOCALE): TFn {
  const fn = (key: string, vars?: Record<string, string | number>) => {
    let s = messages[key] ?? key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`));
    return s;
  };
  return Object.assign(fn, { locale });
}

/** "/shop" + "hi" → "/hi/shop". English stays unprefixed. External / api / anchors untouched. */
export function localePath(locale: Locale, href: string): string {
  if (!href.startsWith("/") || href.startsWith("//") || href.startsWith("/api/")) return href;
  if (locale === DEFAULT_LOCALE) return href;
  if (href === `/${locale}` || href.startsWith(`/${locale}/`) || href.startsWith(`/${locale}?`)) return href;
  return href === "/" ? `/${locale}` : `/${locale}${href}`;
}
/** Remove any locale prefix from a pathname. */
export function stripLocale(pathname: string): string {
  for (const l of LOCALES) if (pathname === `/${l}`) return "/"; else if (pathname.startsWith(`/${l}/`)) return pathname.slice(l.length + 1);
  return pathname;
}
