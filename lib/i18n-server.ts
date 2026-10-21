import { cache } from "react";
import { DEFAULT_LOCALE, makeT, type Locale, type Messages } from "./i18n";
import hi from "./messages/hi";
import { setApiLang } from "./api";

const dict: Record<Locale, Messages> = { en: {}, hi };
/** Request-scoped locale. Every [locale] layout/page calls setLocale() first (same pattern as next-intl). */
const store = cache(() => ({ locale: DEFAULT_LOCALE as Locale }));
export const setLocale = (l: Locale) => { store().locale = l; };
export const getLocale = (): Locale => store().locale;
export const getMessages = (l: Locale = getLocale()): Messages => dict[l];
export const getT = () => makeT(dict[getLocale()], getLocale());

setApiLang(() => getLocale());
