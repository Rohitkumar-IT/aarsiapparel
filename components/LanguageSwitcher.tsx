"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { Languages } from "lucide-react";
import { LOCALES, LOCALE_COOKIE, LOCALE_LABEL, localePath, stripLocale, type Locale } from "@/lib/i18n";
import { useLocale, useT } from "./I18nProvider";

export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const locale = useLocale(); const t = useT();
  const path = usePathname(); const sp = useSearchParams();
  const go = (l: Locale) => {
    if (l === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${l};path=/;max-age=31536000;samesite=lax`;
    const q = sp.toString();
    window.location.assign(localePath(l, stripLocale(path)) + (q ? `?${q}` : ""));
  };
  return (
    <div role="group" aria-label={t("Language")} className={`inline-flex items-center gap-1 rounded-full border border-rose/30 bg-white/60 p-0.5 text-xs ${className}`}>
      <Languages size={14} className="ml-2 text-rose" aria-hidden />
      {LOCALES.map((l) => (
        <button key={l} type="button" lang={l} aria-pressed={l === locale} onClick={() => go(l)}
          className={`rounded-full px-2.5 py-1 font-medium transition-colors ${l === locale ? "bg-cocoa text-cream" : "text-ink/70 hover:bg-blush/50"}`}>{LOCALE_LABEL[l].short}</button>
      ))}
    </div>
  );
}
