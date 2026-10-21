"use client";
import Link from "@/components/L";
import { Minus, Plus } from "lucide-react";
import { useShop } from "@/lib/store";
import { formatPaisa } from "@/lib/format";
import Media from "@/components/Media";
import { useT } from "@/components/I18nProvider";

export default function CartPage() {
  const t = useT();
  const { ready, cart, setQty, removeLine, subtotalPaisa, shippingPaisa, totalPaisa, freeShippingGapPaisa } = useShop();
  if (!ready) return <div className="container-x py-16"><div className="skeleton h-64 rounded-3xl" /></div>;
  if (!cart.length) return (
    <div className="container-x py-24 text-center"><h1 className="h-display text-4xl">{t("Your bag is empty")}</h1><p className="mt-3 text-ink/70">{t("Find something you love.")}</p><Link href="/shop" className="btn-primary mt-8">{t("Browse the shop")}</Link></div>
  );
  return (
    <div className="container-x py-12">
      <h1 className="h-display mb-8 text-4xl sm:text-5xl">{t("Your bag")}</h1>
      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <ul className="divide-y divide-rose/15 border-y border-rose/15">
          {cart.map((l) => (
            <li key={l.key} className="flex gap-5 py-6">
              <Link href={`/product/${l.slug}`} className="relative h-36 w-28 shrink-0 overflow-hidden rounded-xl bg-blush/40"><Media src={l.image} alt={l.name} sizes="112px" /></Link>
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-4"><Link href={`/product/${l.slug}`} className="font-display text-xl font-semibold text-cocoa">{l.name}</Link><p className="font-medium">{formatPaisa(l.unitPaisa * l.qty)}</p></div>
                <p className="mt-1 text-sm text-ink/60">{[l.size && `Size ${l.size}`, l.color, `${formatPaisa(l.unitPaisa)} each`].filter(Boolean).join(" · ")}</p>
                <div className="mt-auto flex items-center gap-5 pt-4">
                  <div className="inline-flex items-center rounded-full border border-rose/30">
                    <button aria-label={t("Decrease quantity")} className="grid h-10 w-10 place-items-center" onClick={() => setQty(l.key, l.qty - 1)}><Minus size={14} /></button>
                    <span className="w-7 text-center">{l.qty}</span>
                    <button aria-label={t("Increase quantity")} disabled={l.qty >= l.maxQty} className="grid h-10 w-10 place-items-center disabled:opacity-30" onClick={() => setQty(l.key, l.qty + 1)}><Plus size={14} /></button>
                  </div>
                  <button className="text-sm text-ink/55 underline underline-offset-2 hover:text-rose-dark" onClick={() => removeLine(l.key)}>{t("Remove")}</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <aside className="h-fit rounded-3xl bg-white/70 p-6 ring-1 ring-rose/20 lg:sticky lg:top-32">
          <h2 className="font-display text-2xl font-semibold text-cocoa">{t("Order summary")}</h2>
          {freeShippingGapPaisa > 0 && <p className="mt-3 rounded-xl bg-blush/50 px-3 py-2 text-sm">{t("Add {amount} more for free delivery", { amount: formatPaisa(freeShippingGapPaisa) })}</p>}
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between"><dt>{t("Subtotal")}</dt><dd>{formatPaisa(subtotalPaisa)}</dd></div>
            <div className="flex justify-between"><dt>{t("Delivery")}</dt><dd>{shippingPaisa ? formatPaisa(shippingPaisa) : t("Free")}</dd></div>
            <div className="flex justify-between border-t border-rose/20 pt-4 text-lg font-medium text-cocoa"><dt>{t("Total")}</dt><dd>{formatPaisa(totalPaisa)}</dd></div>
          </dl>
          <Link href="/checkout" className="btn-primary mt-6 w-full">{t("Checkout")}</Link>
        </aside>
      </div>
    </div>
  );
}
