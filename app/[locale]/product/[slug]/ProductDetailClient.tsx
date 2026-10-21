"use client";
import Image from "next/image";
import Link from "@/components/L";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, ChevronDown, Heart, MessageCircle, Minus, Package, Plus, RotateCcw, Truck } from "lucide-react";
import { api } from "@/lib/api";
import { COMMERCE_API, RETURN_DAYS } from "@/lib/env";
import { SIZE_CHART } from "@/lib/config";
import { BLUR_DATA } from "@/lib/media";
import { formatDate, formatPaisa } from "@/lib/format";
import { validate, whatsappChatUrl } from "@/lib/orders";
import { useShop } from "@/lib/store";
import type { PincodeInfo, Product } from "@/lib/types";
import Price from "@/components/Price";
import Stars from "@/components/Stars";
import { useT } from "@/components/I18nProvider";
import { useLocalePath } from "@/components/I18nProvider";

type Tab = "desc" | "info" | "size" | "ship" | "reviews";

export default function ProductDetailClient({ product: p }: { product: Product }) {
  const t = useT();
  const { addToCart, toggleWish, isWished, notify, settings } = useShop();
  const router = useRouter();
  const lp = useLocalePath();
  const { sizes, colors } = p;
  const [color, setColor] = useState<string | undefined>(colors.length === 1 ? colors[0].name : undefined);
  const [size, setSize] = useState<string | undefined>(!colors.length && sizes.length === 1 ? sizes[0] : undefined);
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);
  const [tab, setTab] = useState<Tab | "">("desc");
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [pin, setPin] = useState(""); const [pinInfo, setPinInfo] = useState<PincodeInfo | null>(null); const [pinErr, setPinErr] = useState("");
  const tabsRef = useRef<HTMLDivElement>(null);

  const needsColorFirst = colors.length > 0;
  const sizeAvailable = (s: string) => !p.variants.length || p.variants.some((v) => v.inStock && v.size === s && (!color || v.color === color));
  const colorAvailable = (c: string) => !p.variants.length || p.variants.some((v) => v.inStock && v.color === c);
  const variant = useMemo(() => p.variants.find((v) => (!sizes.length || v.size === size) && (!colors.length || v.color === color)), [p.variants, sizes.length, colors.length, size, color]);

  const price = variant?.pricePaisa ?? p.pricePaisa;
  const mrp = variant?.mrpPaisa ?? p.mrpPaisa;
  const gst = variant?.gstPaisa ?? p.gstPaisa;
  const soldOut = !p.inStock || (!!variant && !variant.inStock);
  const max = Math.max(1, Math.min(variant?.stock ?? 10, 10));
  const total = price * qty;

  const pickColor = (c: string) => { setColor(c); if (size && !p.variants.some((v) => v.inStock && v.color === c && v.size === size)) setSize(undefined); setQty(1); };
  const ready = (): boolean => {
    if (colors.length && !color) { notify(t("Please choose a colour"), "error"); return false; }
    if (sizes.length && !size) { notify(t("Please choose a size"), "error"); return false; }
    if (p.variants.length && !variant) { notify(t("That combination isn't available"), "error"); return false; }
    return true;
  };
  const add = () => { if (ready()) addToCart(p, variant, qty); };
  const buyNow = () => { if (!ready()) return; addToCart(p, variant, qty); router.push(lp("/checkout")); };
  const openSizeChart = () => { setTab("size"); setTimeout(() => tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); };

  const checkPin = async () => {
    setPinErr(""); setPinInfo(null);
    if (!validate.pincode(pin)) return setPinErr(t("Enter a valid 6-digit pincode"));
    try { setPinInfo(await api.pincode(pin)); } catch (e) { setPinErr((e as Error).message); }
  };

  const media = p.media.length ? p.media : [{ url: "", alt: p.name, type: "image" as const }];
  const cur = media[Math.min(active, media.length - 1)];
  const wished = isWished(p.id);
  const free = settings.freeShippingThresholdPaisa;

  const Acc = ({ id, title, children }: { id: Tab; title: string; children: React.ReactNode }) => (
    <div className="border-b border-rose/20">
      <h3><button type="button" aria-expanded={tab === id} onClick={() => setTab(tab === id ? "" : id)} className="flex w-full items-center justify-between py-4 text-left text-sm font-medium uppercase tracking-[.14em] text-cocoa">{title}<ChevronDown size={18} className={`text-rose transition-transform ${tab === id ? "rotate-180" : ""}`} /></button></h3>
      {tab === id && <div className="animate-fadeIn pb-6 text-sm leading-7 text-ink/80">{children}</div>}
    </div>
  );

  return (
    <div className="container-x grid gap-10 py-8 lg:grid-cols-2 lg:gap-14 lg:py-10">
      {/* ───────── Gallery ───────── */}
      <div className="flex flex-col-reverse gap-4 lg:sticky lg:top-36 lg:flex-row lg:self-start">
        {media.length > 1 && (
          <ul className="flex gap-3 overflow-x-auto lg:max-h-[620px] lg:flex-col lg:overflow-y-auto" aria-label={t("Product images")}>
            {media.map((m, i) => (
              <li key={m.url + i} className="shrink-0">
                <button onClick={() => setActive(i)} aria-label={`${p.name} thumbnail ${i + 1}`} aria-current={i === active} className={`relative block h-24 w-[72px] overflow-hidden rounded-xl border-2 bg-blush/40 transition-colors ${i === active ? "border-rose" : "border-transparent hover:border-rose/40"}`}>
                  {m.type === "video" ? <span className="grid h-full place-items-center bg-cocoa text-xs text-cream">{t("Video")}</span> : m.url && <Image src={m.url} alt="" fill sizes="72px" className="object-cover" />}
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="relative aspect-[3/4] flex-1 cursor-zoom-in overflow-hidden rounded-2xl bg-blush/40 ring-1 ring-rose/20"
          onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }); }} onMouseLeave={() => setZoom(null)}>
          {p.discount > 0 && <span className="absolute left-4 top-4 z-10 rounded-full bg-pink-dark px-3 py-1.5 text-xs font-semibold text-white">{t("{n}% OFF", { n: p.discount })}</span>}
          {cur.type === "video" ? <video src={cur.url} controls playsInline className="h-full w-full object-cover" /> : cur.url ? (
            <Image src={cur.url} alt={cur.alt || p.name} fill priority sizes="(min-width:1024px) 45vw, 100vw" placeholder="blur" blurDataURL={BLUR_DATA} className="object-cover transition-transform duration-200" style={zoom ? { transform: "scale(1.9)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined} />
          ) : <div className="grid h-full place-items-center"><Image src="/brand/monogram.webp" alt="" width={96} height={96} className="opacity-50" /></div>}
        </div>
      </div>

      {/* ───────── Details ───────── */}
      <div>
        {p.category && <Link href={`/shop?category=${p.category.slug}`} className="text-sm font-medium uppercase tracking-[.16em] text-rose-dark hover:underline">{p.category.name}</Link>}
        <h1 className="h-display mt-2 text-4xl leading-tight sm:text-5xl">{p.name}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className={`font-medium ${p.inStock ? "text-emerald-700" : "text-pink-dark"}`}>{p.inStock ? t("In stock") : t("Out of stock")}</span>
          {p.reviewCount > 0 && p.rating > 0 && <button type="button" onClick={() => { setTab("reviews"); tabsRef.current?.scrollIntoView({ behavior: "smooth" }); }} className="inline-flex items-center gap-2 text-ink/70"><Stars value={p.rating} size={14} />{p.rating.toFixed(1)} ({p.reviewCount})</button>}
          {variant?.sku && <span className="text-ink/45">{t("SKU")} {variant.sku}</span>}
        </div>
        <div className="mt-5"><Price paisa={price} mrp={mrp} size="lg" /><p className="mt-1 text-xs text-ink/55">{t("Inclusive of all taxes")}{gst !== undefined ? ` (GST ${formatPaisa(gst)})` : ""}</p></div>

        {colors.length > 0 && (
          <fieldset className="mt-7">
            <legend className="mb-3 text-sm font-medium text-cocoa">{t("Colour:")} <span className="font-normal text-ink/65">{color ?? t("Select a colour")}</span></legend>
            <div className="flex flex-wrap gap-2.5">
              {colors.map((c) => (
                <button key={c.name} type="button" aria-pressed={color === c.name} disabled={!colorAvailable(c.name)} onClick={() => pickColor(c.name)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${color === c.name ? "border-cocoa bg-cocoa text-cream" : "border-rose/35 bg-white hover:border-rose"}`}>
                  {c.hex && <span className="h-4 w-4 rounded-full border border-black/15" style={{ background: c.hex }} aria-hidden />}{c.name}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {sizes.length > 0 && (
          <fieldset className="mt-6">
            <legend className="mb-3 flex w-full items-center justify-between text-sm font-medium text-cocoa">
              <span>{t("Size:")} <span className="font-normal text-ink/65">{size ?? "—"}</span></span>
              <button type="button" onClick={openSizeChart} className="text-xs font-normal text-rose-dark underline underline-offset-4">{t("Size chart")}</button>
            </legend>
            <div className="flex flex-wrap gap-2.5">
              {sizes.map((s) => <button key={s} type="button" className={`chip ${!needsColorFirst || color ? "chip-out" : ""}`} aria-pressed={size === s} disabled={(needsColorFirst && !color) || !sizeAvailable(s)} onClick={() => { setSize(s); setQty(1); }}>{s}</button>)}
            </div>
            {needsColorFirst && !color && <p className="mt-2 text-xs text-ink/55">{t("Pick a colour first to see which sizes are in stock.")}</p>}
          </fieldset>
        )}

        {p.summary && <p className="mt-6 leading-7 text-ink/80">{p.summary}</p>}
        <p className="mt-6 rounded-xl bg-blush/35 px-4 py-3 text-sm text-ink/80" aria-live="polite">
          {p.name}<br />{t("Colour:")} <b>{color ?? t("not selected")}</b> · {t("Size:")} <b>{size ?? t("not selected")}</b> · {t("Qty:")} <b>{qty}</b> · {t("Total:")} <b className="text-cocoa">{formatPaisa(total)}</b>
        </p>

        <div className="mt-6 flex items-center gap-3">
          <span className="text-sm font-medium text-cocoa">{t("Quantity")}</span>
          <div className="inline-flex items-center rounded-full border border-rose/40 bg-white">
            <button aria-label={t("Decrease quantity")} className="grid h-11 w-11 place-items-center" onClick={() => setQty((q) => Math.max(1, q - 1))}><Minus size={15} /></button>
            <span className="w-8 text-center" aria-live="polite">{qty}</span>
            <button aria-label={t("Increase quantity")} className="grid h-11 w-11 place-items-center disabled:opacity-30" disabled={qty >= max} onClick={() => setQty((q) => Math.min(max, q + 1))}><Plus size={15} /></button>
          </div>
          {variant?.stock != null && variant.stock > 0 && variant.stock <= 5 && <span className="text-sm text-pink-dark">{t("Only {n} left", { n: variant.stock })}</span>}
        </div>

        <div className="mt-6 grid gap-3">
          <button className="btn-primary h-13 w-full py-3.5 uppercase tracking-[.18em]" disabled={soldOut} onClick={add}>{soldOut ? t("Sold out") : t("Add to bag")}</button>
          <button className="btn-rose w-full py-3.5 uppercase tracking-[.18em]" disabled={soldOut} onClick={buyNow}>{t("Buy now")}</button>
          <button className="btn-ghost w-full py-3.5 uppercase tracking-[.18em]" aria-pressed={wished} onClick={() => toggleWish(p)}><Heart size={17} className={wished ? "fill-rose text-rose" : ""} />{wished ? t("Saved to wishlist") : t("Add to wishlist")}</button>
        </div>

        <ul className="mt-7 grid grid-cols-3 gap-3 text-center text-xs">
          <li className="rounded-2xl border border-rose/20 bg-white/60 p-3"><Truck size={20} className="mx-auto text-rose" strokeWidth={1.5} /><p className="mt-2 font-medium text-cocoa">{free ? t("Free shipping") : t("Delivery")}</p><p className="text-ink/60">{free ? t("Above {amount}", { amount: formatPaisa(free) }) : t("Across India")}</p></li>
          <li className="rounded-2xl border border-rose/20 bg-white/60 p-3"><Banknote size={20} className="mx-auto text-rose" strokeWidth={1.5} /><p className="mt-2 font-medium text-cocoa">{settings.codAvailable ? t("Cash on delivery") : t("Secure payment")}</p><p className="text-ink/60">{settings.codAvailable ? t("Pay when it arrives") : t("UPI, cards, wallets")}</p></li>
          <li className="rounded-2xl border border-rose/20 bg-white/60 p-3"><RotateCcw size={20} className="mx-auto text-rose" strokeWidth={1.5} /><p className="mt-2 font-medium text-cocoa">{t("Easy returns")}</p><p className="text-ink/60">{RETURN_DAYS ? t("Within {n} days", { n: RETURN_DAYS }) : t("Ask us on WhatsApp")}</p></li>
        </ul>

        {COMMERCE_API && (
          <div className="mt-6">
            <label htmlFor="pin" className="mb-2 block text-sm font-medium text-cocoa">{t("Check delivery")}</label>
            <div className="flex gap-2"><input id="pin" inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder={t("Enter pincode")} className="field" /><button type="button" className="btn-ghost px-6" onClick={checkPin}>{t("Check")}</button></div>
            {pinErr && <p className="mt-2 text-sm text-pink-dark">{pinErr}</p>}
            {pinInfo && <p className="mt-2 flex items-start gap-2 text-sm text-ink/80"><Package size={16} className="mt-0.5 shrink-0 text-rose" />{pinInfo.serviceable ? <>{t("Delivers to")} {pinInfo.city ?? pin}{pinInfo.etaDaysMin ? ` · ${pinInfo.etaDaysMin}–${pinInfo.etaDaysMax ?? pinInfo.etaDaysMin} ${t("days")}` : ""}. {pinInfo.codAvailable ? t("Cash on delivery available.") : t("Online payment only.")}</> : t("Sorry, we don't deliver to this pincode yet.")}</p>}
          </div>
        )}

        <a className="mt-5 inline-flex items-center gap-2 text-sm text-rose-dark underline underline-offset-4" target="_blank" rel="noopener noreferrer" href={whatsappChatUrl(`Hello Aarsi Apparel, I have a question about "${p.name}".`)}><MessageCircle size={16} />{t("Ask about this piece on WhatsApp")}</a>

        <div ref={tabsRef} className="mt-9 scroll-mt-36 border-t border-rose/20">
          <Acc id="desc" title={t("Description")}><p className="whitespace-pre-line">{p.description || `${p.name} — thoughtfully made, with quality fabric and finishing.`}</p></Acc>
          <Acc id="info" title={t("Additional information")}>
            <dl className="divide-y divide-rose/15">
              {[...(p.category ? [{ label: t("Category"), value: p.category.name }] : []), ...p.details, ...(sizes.length ? [{ label: t("Sizes"), value: sizes.join(", ") }] : []), ...(colors.length ? [{ label: t("Colours"), value: colors.map((c) => c.name).join(", ") }] : [])].map((d) => <div key={d.label} className="grid grid-cols-[130px_1fr] gap-4 py-2.5"><dt className="text-ink/55">{t(d.label)}</dt><dd>{d.value}</dd></div>)}
            </dl>
          </Acc>
          <Acc id="size" title={t("Size guide")}>
            <div className="overflow-x-auto"><table className="w-full min-w-[320px] text-center"><thead><tr className="bg-blush/40 text-cocoa"><th className="p-2.5">{t("Size")}</th><th>{t("Bust (in)")}</th><th>{t("Waist (in)")}</th><th>{t("Hip (in)")}</th></tr></thead>
              <tbody>{SIZE_CHART.map((r) => <tr key={r.size} className={`border-b border-rose/15 ${r.size === size ? "bg-blush/30 font-medium" : ""}`}><td className="p-2.5">{r.size}</td><td>{r.bust}</td><td>{r.waist}</td><td>{r.hip}</td></tr>)}</tbody></table></div>
            <p className="mt-3 text-xs text-ink/60">{t("Measurements are body measurements. Between sizes? Choose the larger one or message us for advice.")}</p>
          </Acc>
          <Acc id="ship" title={t("Shipping & returns")}>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>{free ? t("Free delivery on orders above {free}; otherwise {fee}.", { free: formatPaisa(free), fee: formatPaisa(settings.shippingFeePaisa) }) : t("Delivery charge, if any, is shown at checkout.")}</li>
              {settings.codAvailable && <li>{t("Cash on delivery is available on eligible pincodes.")}</li>}
              {RETURN_DAYS > 0 ? <li>{t("Returns and exchanges within {n} days of delivery. Items must be unworn with tags intact.", { n: RETURN_DAYS })}</li> : <li>{t("Message us on WhatsApp after delivery for returns or exchanges.")}</li>}
            </ul>
          </Acc>
          <Acc id="reviews" title={`${t("Reviews")}${p.reviewCount ? ` (${p.reviewCount})` : ""}`}>
            {p.reviews.length === 0 ? <p>{t("No reviews yet.")}</p> : <ul className="space-y-6">{p.reviews.map((r) => (
              <li key={r.id} className="border-b border-rose/15 pb-5 last:border-0"><div className="flex flex-wrap items-center gap-3"><Stars value={r.rating} size={14} /><span className="font-medium text-cocoa">{r.author}</span><span className="text-xs text-ink/50">{formatDate(r.createdAt, t.locale)}</span></div>
                {r.title && <p className="mt-2 font-medium text-cocoa">{r.title}</p>}<p className="mt-1">{r.body}</p></li>))}</ul>}
          </Acc>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-rose/20 bg-cream/95 p-3 backdrop-blur lg:hidden">
        <div className="min-w-0 flex-1"><p className="truncate text-xs text-ink/60">{p.name}</p><p className="font-medium text-cocoa">{formatPaisa(price)}</p></div>
        <button className="btn-primary px-8" disabled={soldOut} onClick={add}>{soldOut ? t("Sold out") : t("Add to bag")}</button>
      </div>
    </div>
  );
}
