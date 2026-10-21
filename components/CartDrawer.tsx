"use client";
import Image from "next/image";
import Link from "@/components/L";
import { useEffect } from "react";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useShop } from "@/lib/store";
import { formatPaisa } from "@/lib/format";
import Media from "./Media";
import { useT } from "@/components/I18nProvider";

export default function CartDrawer() {
  const t = useT();
  const { drawerOpen, closeDrawer, cart, setQty, removeLine, subtotalPaisa, freeShippingGapPaisa, cartCount } = useShop();

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeDrawer();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [drawerOpen, closeDrawer]);

  if (!drawerOpen) return null;
  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={t("Shopping bag")}>
      <div className="absolute inset-0 animate-fadeIn bg-cocoa/50" onClick={closeDrawer} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md animate-slideIn flex-col overscroll-contain bg-cream shadow-soft">
        <header className="flex items-center justify-between border-b border-rose/20 px-5 py-4">
          <h2 className="font-display text-2xl font-semibold text-cocoa">{t("Your bag")} <span className="text-base font-normal text-ink/60">({cartCount})</span></h2>
          <button onClick={closeDrawer} aria-label={t("Close bag")} className="grid h-10 w-10 place-items-center rounded-full hover:bg-blush/50"><X size={20} /></button>
        </header>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <Image src="/brand/monogram.webp" alt="" width={72} height={72} className="opacity-60" />
            <p className="font-display text-2xl text-cocoa">{t("Your bag is empty")}</p>
            <p className="text-sm text-ink/70">{t("Pieces you add will wait for you here.")}</p>
            <Link href="/shop" onClick={closeDrawer} className="btn-primary">{t("Browse the shop")}</Link>
          </div>
        ) : (
          <>
            {freeShippingGapPaisa > 0 && <p className="bg-blush/50 px-5 py-2.5 text-center text-sm text-cocoa">{t("Add {amount} more for free delivery", { amount: formatPaisa(freeShippingGapPaisa) })}</p>}
            <ul className="flex-1 divide-y divide-rose/15 overflow-y-auto px-5">
              {cart.map((l) => (
                <li key={l.key} className="flex gap-4 py-5">
                  <Link href={`/product/${l.slug}`} onClick={closeDrawer} className="relative h-28 w-[84px] shrink-0 overflow-hidden rounded-xl bg-blush/40"><Media src={l.image} alt={l.name} sizes="84px" /></Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link href={`/product/${l.slug}`} onClick={closeDrawer} className="line-clamp-2 font-display text-lg font-semibold leading-snug text-cocoa">{l.name}</Link>
                    <p className="mt-0.5 text-sm text-ink/60">{[l.size && `Size ${l.size}`, l.color].filter(Boolean).join(" · ")}</p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="inline-flex items-center rounded-full border border-rose/30">
                        <button aria-label={t("Decrease quantity")} className="grid h-9 w-9 place-items-center" onClick={() => setQty(l.key, l.qty - 1)}><Minus size={14} /></button>
                        <span className="w-6 text-center text-sm" aria-live="polite">{l.qty}</span>
                        <button aria-label={t("Increase quantity")} disabled={l.qty >= l.maxQty} className="grid h-9 w-9 place-items-center disabled:opacity-30" onClick={() => setQty(l.key, l.qty + 1)}><Plus size={14} /></button>
                      </div>
                      <p className="font-medium text-cocoa">{formatPaisa(l.unitPaisa * l.qty)}</p>
                    </div>
                    <button onClick={() => removeLine(l.key)} className="mt-1 self-start text-xs text-ink/50 underline underline-offset-2 hover:text-rose-dark">{t("Remove")}</button>
                  </div>
                </li>
              ))}
            </ul>
            <footer className="space-y-3 border-t border-rose/20 bg-white/50 p-5">
              <div className="flex justify-between text-cocoa"><span>{t("Subtotal")}</span><span className="text-lg font-medium">{formatPaisa(subtotalPaisa)}</span></div>
              <p className="text-xs text-ink/60">{t("Delivery is added at checkout.")}</p>
              <Link href="/checkout" onClick={closeDrawer} className="btn-primary w-full">{t("Checkout")}</Link>
              <Link href="/cart" onClick={closeDrawer} className="btn-ghost w-full">{t("View bag")}</Link>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
