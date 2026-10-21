"use client";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { localePath, makeT, type Locale, type Messages, type TFn } from "@/lib/i18n";

interface Ctx { locale: Locale; t: TFn; lp: (href: string) => string }
const C = createContext<Ctx>({ locale: "en", t: Object.assign((k: string) => k, { locale: "en" as Locale }), lp: (h) => h });

export function I18nProvider({ locale, messages, children }: { locale: Locale; messages: Messages; children: ReactNode }) {
  const value = useMemo<Ctx>(() => ({ locale, t: makeT(messages, locale), lp: (h) => localePath(locale, h) }), [locale, messages]);
  return <C.Provider value={value}>{children}</C.Provider>;
}
export const useT = () => useContext(C).t;
export const useLocale = () => useContext(C).locale;
export const useLocalePath = () => useContext(C).lp;
