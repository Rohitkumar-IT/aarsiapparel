"use client";
import Link from "@/components/L";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Banknote, CreditCard, Loader2, MessageCircle, Tag } from "lucide-react";
import { api } from "@/lib/api";
import { COMMERCE_API } from "@/lib/env";
import { formatPaisa } from "@/lib/format";
import { newKey, normalizePhone, payOnline, placeOrder, validate } from "@/lib/orders";
import { useQuote } from "@/lib/useQuote";
import { useShop } from "@/lib/store";
import type { AddressInput, PaymentMethod, PincodeInfo } from "@/lib/types";
import Media from "@/components/Media";
import { useT } from "@/components/I18nProvider";
import { useLocalePath } from "@/components/I18nProvider";

const empty: AddressInput = { fullName: "", phone: "", email: "", line1: "", line2: "", landmark: "", city: "", state: "", pincode: "" };

export default function Checkout() {
  const t = useT();
  const { ready, cart, clearCart, customer, notify } = useShop();
  const router = useRouter();
  const lp = useLocalePath();
  const [f, setF] = useState<AddressInput>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof AddressInput, string>>>({});
  const [payment, setPayment] = useState<PaymentMethod>(COMMERCE_API ? "online" : "cod");
  const [codeInput, setCodeInput] = useState(""); const [coupon, setCoupon] = useState("");
  const [pinInfo, setPinInfo] = useState<PincodeInfo | null>(null);
  const [busy, setBusy] = useState(false); const [formError, setFormError] = useState("");
  const idem = useRef(newKey());
  const { quote, loading, error: quoteError } = useQuote(cart, { coupon, pincode: validate.pincode(f.pincode) ? f.pincode : undefined, payment });

  useEffect(() => { if (customer) setF((p) => ({ ...p, fullName: p.fullName || customer.name, email: p.email || customer.email || "", phone: p.phone || customer.phone || "" })); }, [customer]);
  useEffect(() => {
    if (!COMMERCE_API || !validate.pincode(f.pincode)) { setPinInfo(null); return; }
    let alive = true;
    api.pincode(f.pincode).then((i) => { if (!alive) return; setPinInfo(i); if (i.serviceable) setF((p) => ({ ...p, city: p.city || i.city || "", state: p.state || i.state || "" })); if (!i.codAvailable && payment === "cod") setPayment("online"); }).catch(() => alive && setPinInfo(null));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.pincode]);

  const set = (k: keyof AddressInput) => (e: React.ChangeEvent<HTMLInputElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const blocked = quote.lines.some((l) => !l.available) || (pinInfo && !pinInfo.serviceable);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError("");
    const er: typeof errors = {};
    if (f.fullName.trim().length < 2) er.fullName = t("Enter your full name");
    if (!validate.phone(f.phone)) er.phone = t("Enter a valid 10-digit mobile number");
    if (!validate.email(f.email ?? "")) er.email = t("Enter a valid email");
    if (f.line1.trim().length < 6) er.line1 = t("Enter your full address");
    if (f.city.trim().length < 2) er.city = t("Enter your city");
    if (f.state.trim().length < 2) er.state = t("Enter your state");
    if (!validate.pincode(f.pincode)) er.pincode = t("Enter a valid 6-digit pincode");
    setErrors(er);
    if (Object.keys(er).length) { notify(t("Please fix the highlighted fields"), "error"); return; }
    if (blocked) { setFormError(t("Please resolve the items or pincode issue shown before placing your order.")); return; }
    setBusy(true);
    try {
      const r = await placeOrder({ lines: cart, address: { ...f, phone: normalizePhone(f.phone) }, paymentMethod: payment, couponCode: coupon || undefined, quote: quote.lines.length ? quote : null, subtotalPaisa: quote.subtotalPaisa, shippingPaisa: quote.shippingPaisa, totalPaisa: quote.totalPaisa, idempotencyKey: idem.current });
      let order = r.order;
      if (r.kind === "pay") order = await payOnline(r.order, r.payment);
      clearCart();
      if (order.mode === "whatsapp") { const { whatsappUrl } = await import("@/lib/orders"); window.open(whatsappUrl(order), "_blank", "noopener"); }
      router.push(lp(`/order-confirmation/${encodeURIComponent(order.orderNumber)}${order.trackingToken ? `?token=${encodeURIComponent(order.trackingToken)}` : ""}`));
    } catch (err) {
      const msg = (err as Error).message || t("Something went wrong. Please try again.");
      setFormError(msg); notify(msg, "error"); setBusy(false);
      if ((err as { code?: string }).code !== "PAYMENT_CANCELLED" && (err as { code?: string }).code !== "PAYMENT_FAILED") idem.current = newKey();
    }
  };

  if (!ready) return <div className="container-x py-16"><div className="skeleton h-96 rounded-3xl" /></div>;
  if (!cart.length) return <div className="container-x py-24 text-center"><h1 className="h-display text-4xl">{t("Nothing to check out")}</h1><Link href="/shop" className="btn-primary mt-8">{t("Browse the shop")}</Link></div>;

  const input = (k: keyof AddressInput, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, span = "") => (
    <div className={span}>
      <label htmlFor={k} className="mb-1.5 block text-sm font-medium text-cocoa">{t(label)}</label>
      <input id={k} value={f[k] ?? ""} onChange={set(k)} aria-invalid={!!errors[k]} aria-describedby={errors[k] ? `${k}-e` : undefined} className={`field ${errors[k] ? "!border-pink-dark" : ""}`} {...props} />
      {errors[k] && <p id={`${k}-e`} className="mt-1 text-xs text-pink-dark">{errors[k]}</p>}
    </div>
  );
  const row = (label: string, value: string, cls = "") => <div className={`flex justify-between ${cls}`}><dt>{t(label)}</dt><dd>{value}</dd></div>;
  const discount = quote.subtotalPaisa - (quote.totalPaisa - quote.shippingPaisa - quote.codFeePaisa);

  return (
    <div className="container-x py-12">
      <h1 className="h-display mb-8 text-4xl sm:text-5xl">{t("Checkout")}</h1>
      <form onSubmit={submit} noValidate className="grid gap-10 lg:grid-cols-[1fr_420px]">
        <div className="space-y-9">
          {!customer && <p className="rounded-2xl bg-blush/40 px-4 py-3 text-sm">{t("Have an account?")} <Link href="/login?returnTo=/checkout" className="font-medium text-rose-dark underline underline-offset-4">{t("Sign in with Google")}</Link> {t("to fill your details faster. Guest checkout works too.")}</p>}
          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-4 font-display text-2xl font-semibold text-cocoa">{t("Delivery details")}</legend>
            {input("fullName", "Full name", { autoComplete: "name" }, "sm:col-span-2")}
            {input("phone", "Mobile number", { autoComplete: "tel", inputMode: "tel", placeholder: "98765 43210" })}
            {input("email", "Email (optional)", { autoComplete: "email", type: "email" })}
            {input("pincode", "Pincode", { autoComplete: "postal-code", inputMode: "numeric", maxLength: 6 })}
            <div className="flex items-end pb-1 text-sm">{pinInfo && (pinInfo.serviceable ? <p className="text-emerald-700">{t("Delivers to")} {pinInfo.city ?? f.pincode}{pinInfo.etaDaysMin ? ` · ${pinInfo.etaDaysMin}–${pinInfo.etaDaysMax ?? pinInfo.etaDaysMin} ${t("days")}` : ""}</p> : <p className="text-pink-dark">{t("We don’t deliver to this pincode yet.")}</p>)}</div>
            {input("line1", "Address", { autoComplete: "address-line1" }, "sm:col-span-2")}
            {input("line2", "Apartment, suite (optional)", { autoComplete: "address-line2" })}
            {input("landmark", "Landmark (optional)")}
            {input("city", "City", { autoComplete: "address-level2" })}
            {input("state", "State", { autoComplete: "address-level1" })}
          </fieldset>

          <fieldset>
            <legend className="mb-4 font-display text-2xl font-semibold text-cocoa">{t("Payment")}</legend>
            {COMMERCE_API ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {([["online", t("Pay online"), t("UPI, cards, wallets, netbanking"), CreditCard, true], ["cod", t("Cash on delivery"), pinInfo && !pinInfo.codAvailable ? t("Not available for this pincode") : t("Pay when it arrives"), Banknote, pinInfo?.codAvailable !== false]] as const).map(([v, l, d, I, ok]) => (
                  <label key={v} className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 ${payment === v ? "border-cocoa bg-white" : "border-rose/30 bg-white/50"} ${!ok ? "cursor-not-allowed opacity-50" : ""}`}>
                    <input type="radio" name="payment" className="mt-1 accent-[#8C4A2D]" checked={payment === v} disabled={!ok} onChange={() => setPayment(v)} />
                    <span><span className="flex items-center gap-2 font-medium text-cocoa"><I size={17} />{l}</span><span className="text-sm text-ink/65">{d}</span></span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-rose/25 bg-white/60 p-5 text-sm leading-6"><p className="font-medium text-cocoa">{t("How ordering works")}</p><p className="mt-1 text-ink/75">{t("Your order opens in WhatsApp, ready to send to our team. We confirm stock, delivery charge and payment with you there before dispatch.")}</p></div>
            )}
          </fieldset>
        </div>

        <aside className="h-fit rounded-3xl bg-white/70 p-6 ring-1 ring-rose/20 lg:sticky lg:top-36">
          <h2 className="font-display text-2xl font-semibold text-cocoa">{t("Order summary")}</h2>
          <ul className="mt-4 divide-y divide-rose/15">
            {cart.map((l) => { const ql = quote.lines.find((x) => x.productId === l.productId && (x.variantId ?? "default") === l.variantId); return (
              <li key={l.key} className="flex gap-3 py-3">
                <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-blush/40"><Media src={l.image} alt={l.name} sizes="64px" /></div>
                <div className="min-w-0 flex-1 text-sm"><p className="line-clamp-2 font-medium text-cocoa">{l.name}</p><p className="text-ink/60">{[l.size, l.color].filter(Boolean).join(" · ")} × {l.qty}</p>{ql && !ql.available && <p className="text-xs text-pink-dark">{ql.issue || t("No longer available")}</p>}</div>
                <p className="text-sm">{formatPaisa((ql?.unitPricePaisa ?? l.unitPaisa) * l.qty)}</p>
              </li>); })}
          </ul>

          {COMMERCE_API && (
            <div className="mt-4">
              <label htmlFor="coupon" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-cocoa"><Tag size={14} />{t("Coupon code")}</label>
              <div className="flex gap-2"><input id="coupon" value={codeInput} onChange={(e) => setCodeInput(e.target.value.toUpperCase())} className="field uppercase" placeholder={t("WELCOME10")} /><button type="button" className="btn-ghost px-5" onClick={() => setCoupon(codeInput.trim())}>{t("Apply")}</button></div>
              {quote.couponError && <p className="mt-1 text-xs text-pink-dark">{quote.couponError}</p>}
              {coupon && !quote.couponError && quote.couponDiscountPaisa > 0 && <p className="mt-1 text-xs text-emerald-700">{t("{code} applied", { code: quote.couponCode ?? coupon })}</p>}
            </div>
          )}

          <dl className="mt-4 space-y-2 text-sm">
            {row("Subtotal", formatPaisa(quote.subtotalPaisa))}
            {quote.tierDiscount && row(quote.tierDiscount.label, `− ${formatPaisa(quote.tierDiscount.amountPaisa)}`, "text-emerald-700")}
            {quote.couponDiscountPaisa > 0 && row(`${t("Coupon")} ${quote.couponCode ?? ""}`, `− ${formatPaisa(quote.couponDiscountPaisa)}`, "text-emerald-700")}
            {quote.prepaidDiscountPaisa > 0 && row("Prepaid discount", `− ${formatPaisa(quote.prepaidDiscountPaisa)}`, "text-emerald-700")}
            {!quote.tierDiscount && !quote.couponDiscountPaisa && !quote.prepaidDiscountPaisa && discount > 0 && row("Discount", `− ${formatPaisa(discount)}`, "text-emerald-700")}
            {row("Delivery", quote.shippingPaisa ? formatPaisa(quote.shippingPaisa) : t("Free"))}
            {quote.codFeePaisa > 0 && row("COD fee", formatPaisa(quote.codFeePaisa))}
            <div className="flex justify-between border-t border-rose/20 pt-3 text-lg font-medium text-cocoa"><dt>{t("Total")}</dt><dd>{loading ? <Loader2 size={18} className="animate-spin" /> : formatPaisa(quote.totalPaisa)}</dd></div>
            {quote.gstIncludedPaisa > 0 && <p className="text-xs text-ink/55">{t("Includes GST of {amount}", { amount: formatPaisa(quote.gstIncludedPaisa) })}</p>}
          </dl>
          {quote.messages.map((m) => <p key={m} className="mt-2 text-xs text-rose-dark">{m}</p>)}
          {(quoteError || formError) && <p role="alert" className="mt-3 rounded-xl bg-pink-light/60 px-3 py-2 text-sm text-pink-dark">{formError || quoteError}</p>}
          <button type="submit" disabled={busy || loading} className="btn-primary mt-5 w-full">
            {busy ? <><Loader2 size={18} className="animate-spin" />{t("Placing order…")}</> : COMMERCE_API ? (payment === "online" ? t("Pay {amount}", { amount: formatPaisa(quote.totalPaisa) }) : t("Place order")) : <><MessageCircle size={18} />{t("Place order on WhatsApp")}</>}
          </button>
        </aside>
      </form>
    </div>
  );
}
