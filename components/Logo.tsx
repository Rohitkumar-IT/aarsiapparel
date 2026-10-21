"use client";
import Image from "next/image";
import Link from "./L";
import { useT } from "./I18nProvider";

/**
 * Logo system (all assets derived from the supplied logo/visiting card):
 *  • "mark"    – AS monogram tile (rounded square), crisp at 32–96 px, used in header/cart/login
 *  • "lockup"  – mark + AARSI APPAREL wordmark (wordmark is live text → sharp, accessible, themeable)
 *  • "emblem"  – the full wreath emblem from the card (hero only)
 * `tone="light"` flips the wordmark for dark (cocoa) backgrounds.
 */
export function LogoMark({ size = 44, priority = false, className = "" }: { size?: number; priority?: boolean; className?: string }) {
  return <Image src="/brand/monogram.webp" alt="" width={size} height={size} priority={priority} sizes={`${size}px`} className={`shrink-0 rounded-[26%] shadow-card ${className}`} style={{ width: size, height: size }} />;
}

export function Wordmark({ tone = "dark", className = "" }: { tone?: "dark" | "light"; className?: string }) {
  return (
    <span className={`flex flex-col leading-none ${className}`}>
      <span className={`keep-tracking font-display font-semibold uppercase tracking-[.28em] ${tone === "light" ? "text-blush" : "text-cocoa"}`}>Aarsi Apparel</span>
      <span className={`keep-tracking mt-1.5 hidden text-[9px] uppercase tracking-[.42em] sm:block ${tone === "light" ? "text-blush/60" : "text-rose-dark"}`}>Fashion · Lifestyle</span>
    </span>
  );
}

export default function Logo({ tone = "dark", size = 44, priority = false, href = "/", wordmark = true }: { tone?: "dark" | "light"; size?: number; priority?: boolean; href?: string | null; wordmark?: boolean }) {
  const t = useT();
  const inner = (<><LogoMark size={size} priority={priority} />{wordmark && <Wordmark tone={tone} className="text-[13px] sm:text-[15px]" />}</>);
  return href ? <Link href={href} aria-label={t("Aarsi Apparel — home")} className="flex items-center gap-3">{inner}</Link> : <span className="flex items-center gap-3">{inner}</span>;
}

export function Emblem({ size = 480, priority = false }: { size?: number; priority?: boolean }) {
  const t = useT();
  return (
    <div className="ring-frame mx-auto aspect-square w-full bg-cream shadow-soft" style={{ maxWidth: size }}>
      <Image src="/brand/emblem.webp" alt={t("Aarsi Apparel emblem")} width={800} height={800} priority={priority} sizes={`(min-width:1024px) ${size}px, 80vw`} className="h-full w-full rounded-full object-cover" />
    </div>
  );
}
