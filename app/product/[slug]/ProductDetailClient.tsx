"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, ChevronDown, Heart, MessageCircle, Minus, Plus, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { useShop } from "@/lib/store";
import { formatDate, formatPaisa } from "@/lib/format";
import { whatsappChatUrl } from "@/lib/orders";
import * as env from "@/lib/env";
import type { Product } from "@/lib/types";
import Gallery from "./Gallery";
import Price from "@/components/Price";
import Stars from "@/components/Stars";

const MAX_PER_LINE = 10;
const returnDays = (env as unknown as { POLICY?: { returnDays?: number } }).POLICY?.returnDays ?? 0;

function Accordion({ title, children, open = false }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group border-b border-rose/20 py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between font-display text-xl font-semibold text-cocoa [&::-webkit-details-marker]:hidden">{title}<ChevronDown size={18} className="transition-transform group-open:rotate-180" /></summary>
      <div className="pt-3 text-sm leading-7 text-ink/80">{children}</div>
    </details>
  );
}

export default function ProductDetailClient({ product: p }: { product: Product }) {
  const { addToCart, toggleWish, isWished, notify, settings } = useShop();
  const router = useRouter();
  const { sizes, colors, variants } = p;
  const [size, setSize] = useState<string | undefined>(sizes.length === 1 ? sizes[0] : undefined);
  const [color, setColor] = useState<string | undefined>(colors.length === 1 ? colors[0].name : undefined);
  const [qty, setQty] = useState(1);

  const variant = useMemo(
    () => variants.find((v) => (!sizes.length || v.size === size) && (!colors.length || v.color === color)),
    [variants, sizes.length, colors.length, size, color],
  );
  const optionOk = (o: { size?: string; color?: string }) =>
    !variants.length || variants.some((v) => v.inStock && (!o.size || v.size === o.size) && (!o.color || v.color === o.color));

  const price = variant?.pricePaisa ?? p.pricePaisa;
  const mrp = variant?.mrpPaisa ?? p.mrpPaisa;
  const payable = variant?.payablePaisa ?? p.payablePaisa;
  const gst = variant?.gstPaisa ?? p.gstPaisa;
  const soldOut = !p.inStock || (variant ? !variant.inStock : false);
  const max = Math.max(1, Math.min(variant?.stock ?? MAX_PER_LINE, MAX_PER_LINE));
  const wished = isWished(p.id);

  const ready = (): boolean => {
    if (sizes.length && !size) { notify("Please choose a size", "error"); document.getElementById("size-group")?.scrollIntoView({ behavior: "smooth", block: "center" }); return false; }
    if (colors.length && !color) { notify("Please choose a colour", "error"); return false; }
    if (variants.length && !variant) { notify("That combination isn't available", "error"); return false; }
    return true;
  };
  const add = () => { if (ready()) addToCart(p, variant, Math.min(qty, max)); };
  const buyNow = () => { if (!ready()) return; addToCart(p, variant, Math.min(qty, max)); router.push("/checkout"); };
  const free = settings.freeShippingThresholdPaisa;

  return (
    <div className="container-x grid gap-8 pb-28 pt-6 lg:grid-cols-[1.15fr_1fr] lg:gap-14 lg:pb-14 lg:pt-8">
      <div className="lg:sticky lg:top-36 lg:self-start"><Gallery media={p.media} name={p.name} /></div>

      <div>
        {p.category && <p className="text-xs font-medium uppercase tracking-[.2em] text-rose-dark">{p.category.name}</p>}
        <h1 className="h-display mt-2 text-3xl leading-tight sm:text-4xl lg:text-5xl">{p.name}</h1>
        {p.reviewCount > 0 && p.rating > 0 && <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-sm text-ink/70"><Stars value={p.rating} /> {p.rating.toFixed(1)} ({p.reviewCount})</a>}
        <div className="mt-5"><Price paisa={price} mrp={mrp} size="lg" /></div>
        <p className="mt-1 text-xs text-ink/60">{gst !== undefined && payable !== undefined ? `Includes GST ${formatPaisa(gst)} · Payable ${formatPaisa(payable)}` : "Inclusive of all taxes"}</p>
        {p.summary && <p className="mt-5 leading-7 text-ink/80">{p.summary}</p>}

        {sizes.length > 0 && (
          <fieldset id="size-group" className="mt-8">
            <legend className="mb-3 text-sm font-medium text-cocoa">Size{size && <span className="font-normal text-ink/60"> · {size}</span>}</legend>
            <div className="flex flex-wrap gap-2">{sizes.map((s) => <button key={s} type="button" className="chip" aria-pressed={size === s} disabled={!optionOk({ size: s, color })} onClick={() => { setSize(s); setQty(1); }}>{s}</button>)}</div>
          </fieldset>
        )}
        {colors.length > 0 && (
          <fieldset className="mt-6">
            <legend className="mb-3 text-sm font-medium text-cocoa">Colour{color && <span className="font-normal text-ink/60"> · {color}</span>}</legend>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button key={c.name} type="button" className="chip gap-2" aria-pressed={color === c.name} disabled={!optionOk({ size, color: c.name })} onClick={() => { setColor(c.name); setQty(1); }}>
                  {c.hex && <span className="h-4 w-4 rounded-full border border-black/10" style={{ background: c.hex }} aria-hidden />}{c.name}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center rounded-full border border-rose/40" role="group" aria-label="Quantity">
            <button type="button" aria-label="Decrease quantity" className="grid h-12 w-12 place-items-center disabled:opacity-30" disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))}><Minus size={16} /></button>
            <span className="w-8 text-center" aria-live="polite">{qty}</span>
            <button type="button" aria-label="Increase quantity" className="grid h-12 w-12 place-items-center disabled:opacity-30" disabled={qty >= max} onClick={() => setQty((q) => Math.min(max, q + 1))}><Plus size={16} /></button>
          </div>
          <button type="button" className="btn-primary h-12 flex-1 px-8" disabled={soldOut} onClick={add}>{soldOut ? "Sold out" : "Add to bag"}</button>
          <button type="button" className={`grid h-12 w-12 place-items-center rounded-full border border-rose/40 transition-colors hover:bg-blush/50 ${wished ? "bg-blush/60" : ""}`} aria-pressed={wished} aria-label={wished ? "Remove from wishlist" : "Save to wishlist"} onClick={() => toggleWish(p)}><Heart size={19} className={wished ? "fill-rose text-rose" : ""} /></button>
        </div>
        <button type="button" className="btn-gold mt-3 w-full" disabled={soldOut} onClick={buyNow}>Buy it now</button>
        {variant?.stock != null && variant.stock > 0 && variant.stock <= 5 && <p className="mt-3 text-sm font-medium text-sale">Only {variant.stock} left{size ? ` in size ${size}` : ""}</p>}

        <ul className="mt-8 grid gap-3 rounded-2xl bg-blush/30 p-5 text-sm">
          <li className="flex gap-3"><Truck size={18} className="shrink-0 text-rose" />{free ? `Free delivery above ${formatPaisa(free)}. ` : ""}Delivered across India{settings.shippingFeePaisa ? ` · ${formatPaisa(settings.shippingFeePaisa)} delivery below that` : ""}.</li>
          {settings.codAvailable && <li className="flex gap-3"><Banknote size={18} className="shrink-0 text-rose" />Cash on delivery available.</li>}
          {returnDays > 0 && <li className="flex gap-3"><RotateCcw size={18} className="shrink-0 text-rose" />{returnDays}-day easy returns &amp; exchanges.</li>}
          <li className="flex gap-3"><ShieldCheck size={18} className="shrink-0 text-rose" />Secure checkout. We confirm availability before dispatch.</li>
          <li><a className="flex gap-3 text-rose-dark underline underline-offset-4" target="_blank" rel="noopener noreferrer" href={whatsappChatUrl(`Hello Aarsi Apparel, I have a question about "${p.name}".`)}><MessageCircle size={18} className="shrink-0" />Ask about this piece on WhatsApp</a></li>
        </ul>

        <div className="mt-8 border-t border-rose/20">
          {(p.description || p.details.length > 0) && (
            <Accordion title="Product details" open>
              {p.description && <p className="whitespace-pre-line">{p.description}</p>}
              {p.details.length > 0 && <dl className="mt-4 divide-y divide-rose/15 border-y border-rose/15">{p.details.map((d) => <div key={d.label} className="grid grid-cols-[110px_1fr] gap-4 py-2.5"><dt className="text-ink/60">{d.label}</dt><dd>{d.value}</dd></div>)}</dl>}
            </Accordion>
          )}
          <Accordion title="Shipping & returns">
            <p>Orders are packed and dispatched after we confirm availability. Delivery charges, if any, are shown at checkout before you pay.{returnDays > 0 ? ` You can return or exchange within ${returnDays} days of delivery.` : ""}</p>
          </Accordion>
          <Accordion title={`Reviews${p.reviewCount ? ` (${p.reviewCount})` : ""}`} open={p.reviews.length > 0}>
            <div id="reviews" className="scroll-mt-36">
              {p.reviews.length === 0 ? <p className="text-ink/60">No reviews yet.</p> : (
                <ul className="space-y-6">
                  {p.reviews.map((r) => (
                    <li key={r.id} className="border-b border-rose/15 pb-6 last:border-0">
                      <div className="flex flex-wrap items-center gap-3"><Stars value={r.rating} size={14} /><span className="font-medium text-cocoa">{r.author}</span><span className="text-xs text-ink/50">{formatDate(r.createdAt)}</span></div>
                      {r.title && <p className="mt-2 font-medium text-cocoa">{r.title}</p>}
                      <p className="mt-1">{r.body}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Accordion>
        </div>
      </div>

      {/* Mobile sticky buy bar (page has pb-28 so it never covers content) */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-rose/20 bg-cream/95 p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <div className="min-w-0 flex-1"><p className="truncate text-xs text-ink/60">{p.name}</p><p className="font-medium text-cocoa">{formatPaisa(price)}</p></div>
        <button type="button" className="btn-ghost px-5" disabled={soldOut} onClick={add}>Add</button>
        <button type="button" className="btn-primary px-6" disabled={soldOut} onClick={buyNow}>{soldOut ? "Sold out" : "Buy now"}</button>
      </div>
    </div>
  );
}
