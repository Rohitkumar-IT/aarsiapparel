"use client";
import { useT } from "@/components/I18nProvider";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  const t = useT();
  return (
    <div className="container-x py-24 text-center">
      <h1 className="h-display text-4xl sm:text-5xl">{t("Something went wrong")}</h1>
      <p className="mt-3 text-ink/70">{t("We couldn’t load this page. Check your connection and try again.")}</p>
      <button onClick={reset} className="btn-primary mt-8">{t("Try again")}</button>
    </div>
  );
}
