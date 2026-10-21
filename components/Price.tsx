"use client";
import { discountPct, formatPaisa } from "@/lib/format";
import { useT } from "./I18nProvider";

export default function Price({ paisa, mrp, size = "md" }: { paisa: number; mrp?: number; size?: "md" | "lg" }) {
  const t = useT();
  const off = paisa > 0 ? discountPct(paisa, mrp) : 0;
  if (paisa <= 0) return <p className={`font-medium text-rose-dark ${size === "lg" ? "text-xl" : "text-sm"}`}>{t("Price on request")}</p>;
  return (
    <p className="flex flex-wrap items-baseline gap-x-2">
      <span className={`font-medium text-cocoa ${size === "lg" ? "text-2xl" : "text-base"}`}>{formatPaisa(paisa)}</span>
      {off > 0 && mrp && (
        <>
          <s className="text-sm text-ink/50" aria-label={t("Original price {amount}", { amount: formatPaisa(mrp) })}>{formatPaisa(mrp)}</s>
          <span className="text-sm font-medium text-rose-dark">{t("{n}% off", { n: off })}</span>
        </>
      )}
    </p>
  );
}
