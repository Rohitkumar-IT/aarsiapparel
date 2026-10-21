"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Banknote, CreditCard, Loader2, MessageCircle, Tag } from "lucide-react";
import { useShop } from "@/lib/store";
import { ApiError } from "@/lib/api";
import { formatPaisa } from "@/lib/format";
import { validate } from "@/lib/orders";
import { loadRazorpay, orderApi, type Order, type PaymentMethod, type Quote } from "@/lib/orderApi";
import Media from "@/components/Media";

type Address = { name: string; phone: string; email: string; line1: string; city: string; state: string; pincode: string; note: string };
const empty: Address = { name: "", phone: "", email: "", line1: "", city: "", state: "", pincode: "", note: "" };
const IDEM_KEY = "aarsi.idem.v1";

export default function Checkout() {
  const { ready, cart, subtotalPaisa, shippingPaisa, totalPaisa, clearCart, customer, notify, settings } = useShop();
  const router = useRouter();
  const [f, setF] = useState<Address>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof Address, string>>>({});
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>(settings.codAvailable ? "COD" : "ONLINE");
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const useApi = true;

  useEffect(() => { if (customer) setF((p) => ({ ...p, name: p.name || customer.name, email: p.email || customer.email, phone: p.phone || customer.phone || "" })); }, [customer]);
  const set = (k: keyof Address) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((p: Address) => ({ ...p, [k]: e.target.value }));

  /* Server-authoritative totals: re-quote whenever cart, coupon, pincode or payment method change. */
  const seq = useRef(0);
  const requote = useCallback(async () => {
    if (!useApi || !cart.length) return;
    const my = ++seq.current; setQuoting(true);
    try {
      const q = await orderApi.quote(cart, { couponCode: applied || undefined, pincode: validate.pincode(f.pincode) ? f.pincode : undefined, paymentMethod: method });
      if (my === seq.current) setQuote(q);
    } catch (e) { if (my === seq.current) notify((e as Error).message, "error"); }
    finally { if (my === seq.current) setQuoting(false); }
  }, [useApi, cart, applied, f.pincode, method, notify]);
  useEffect(() => { const t = setTimeout(requote, 350); return () => clearTimeout(t); }, [requote]);

  const total = quote?.totalPaisa ?? totalPaisa;
  const shipping = quote?.shippingPaisa ?? shippingPaisa;
  const discount = quote?.discountPaisa ?? 0;
  const blocked = useApi && (!quote || quote.lines.some((l) => !l.available) || !quote.serviceable);

  const finish = (o: Order) => { sessionStorage.removeItem(IDEM_KEY); clearCart(); router.push(`/order-confirmation/${o.orderNumber}${o.accessToken ? `?t=${encodeURIComponent(o.accessToken)}` : ""}`); };

  const payOnline = async (o: Order) => {
    if (!o.payment) return finish(o);
    if (!(await loadRazorpay()) || !window.Razorpay) throw new Error("Could not load the payment window. Please try again.");
    await new Promise<void>((resolve, reject) => {
      const rz = new window.Razorpay!({
        key: o.payment!.keyId, order_id: o.payment!.gatewayOrderId, amount: o.payment!.amountPaisa, currency: o.payment!.currency, name: "Aarsi Apparel", description: `Order ${o.orderNumber}`,
        prefill: { name: f.name, email: f.email, contact: f.phone }, theme: { color: "#3A1708" },
        modal: { ondismiss: () => reject(new Error("Payment was cancelled. Your order is saved — you can retry from your account.")) },
        handler: async (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try { finish(await orderApi.verifyPayment(o.id, { gatewayOrderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature })); resolve(); }
          catch (e) { reject(e); }
        },
      });
      rz.on("payment.failed", () => reject(new Error("Payment failed. Please try again or choose Cash on delivery.")));
      rz.open();
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: typeof errors = {};
    if (f.name.trim().length < 2) er.name = "Enter your full name";
    if (!validate.phone(f.phone)) er.phone = "Enter a valid 10-digit mobile number";
    if (!validate.email(f.email)) er.email = "Enter a valid email";
    if (f.line1.trim().length < 6) er.line1 = "Enter your full address";
    if (f.city.trim().length < 2) er.city = "Enter your city";
    if (f.state.trim().length < 2) er.state = "Enter your state";
    if (!validate.pincode(f.pincode)) er.pincode = "Enter a valid 6-digit pincode";
    setErrors(er);
    if (Object.keys(er).length) { notify("Please fix the highlighted fields", "error"); return; }
    if (busy) return;
    setBusy(true);

    try {
      // Same key for retries of the SAME attempt → the server returns the original order instead of a duplicate.
      const key = sessionStorage.getItem(IDEM_KEY) || crypto.randomUUID(); sessionStorage.setItem(IDEM_KEY, key);
      const order = await orderApi.create(cart, f, { paymentMethod: method, couponCode: applied || undefined, expectedTotalPaisa: total }, key);
      if (method === "ONLINE") await payOnline(order); else finish(order);
    } catch (err) {
      if (err instanceof ApiError && err.code === "PRICE_CHANGED") { notify("Prices were updated — please review your total.", "error"); requote(); }
      else notify((err as Error).message || "Could not place the order", "error");
      setBusy(false);
    }
  };

  if (!ready) return <div className="container-x py-16"><div className="skeleton h-96 rounded-3xl" /></div>;
  if (!cart.length) return <div className="container-x py-24 text-center"><h1 className="h-display text-4xl">Nothing to check out</h1><Link href="/shop" className="btn-primary mt-8">Browse the shop</Link></div>;

  const input = (k: keyof Address, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, span = "") => (
    <div className={span}>
      <label htmlFor={k} className="mb-1.5 block text-sm font-medium text-cocoa">{label}</label>
      <input id={k} value={f[k] ?? ""} onChange={set(k)} aria-invalid={!!errors[k]} aria-describedby={errors[k] ? `${k}-e` : undefined} className={`field ${errors[k] ? "!border-mauve-dark" : ""}`} {...props} />
      {errors[k] && <p id={`${k}-e`} className="mt-1 text-xs text-mauve-dark">{errors[k]}</p>}
    </div>
  );
  const payOpt = (v: PaymentMethod, Icon: typeof Banknote, title: string, sub: string) => (
    <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${method === v ? "border-cocoa bg-white" : "border-rose/25 bg-white/50 hover:border-rose"}`}>
      <input type="radio" name="pay" checked={method === v} onChange={() => setMethod(v)} className="mt-1 accent-rose-dark" />
      <Icon size={20} className="mt-0.5 shrink-0 text-rose" /><span><span className="block font-medium text-cocoa">{title}</span><span className="text-sm text-ink/65">{sub}</span></span>
    </label>
  );

  return (
    <div className="container-x py-12">
      <h1 className="h-display mb-8 text-4xl sm:text-5xl">Checkout</h1>
      <form onSubmit={submit} noValidate className="grid gap-10 lg:grid-cols-[1fr_400px]">
        <div className="space-y-8">
          {!customer && <p className="rounded-2xl bg-blush/40 px-4 py-3 text-sm">Have an account? <Link href="/login?returnTo=/checkout" className="font-medium text-rose-dark underline underline-offset-4">Sign in with Google</Link> to fill your details faster. Guest checkout works too.</p>}
          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-4 font-display text-2xl font-semibold text-cocoa">Delivery details</legend>
            {input("name", "Full name", { autoComplete: "name" }, "sm:col-span-2")}
            {input("phone", "Mobile number", { autoComplete: "tel", inputMode: "tel", placeholder: "98765 43210" })}
            {input("email", "Email (optional)", { autoComplete: "email", type: "email" })}
            {input("line1", "Address", { autoComplete: "street-address" }, "sm:col-span-2")}
            {input("city", "City", { autoComplete: "address-level2" })}
            {input("state", "State", { autoComplete: "address-level1" })}
            {input("pincode", "Pincode", { autoComplete: "postal-code", inputMode: "numeric", maxLength: 6 })}
            <div className="sm:col-span-2"><label htmlFor="note" className="mb-1.5 block text-sm font-medium text-cocoa">Note (optional)</label><textarea id="note" rows={2} value={f.note} onChange={set("note")} className="field" /></div>
          </fieldset>

          {useApi ? (
            <fieldset className="space-y-3">
              <legend className="mb-4 font-display text-2xl font-semibold text-cocoa">Payment</legend>
              {payOpt("ONLINE", CreditCard, "Pay online", "UPI, cards, net banking and wallets")}
              {settings.codAvailable && payOpt("COD", Banknote, "Cash on delivery", "Pay when your order arrives")}
            </fieldset>
          ) : (
            <div className="rounded-2xl border border-rose/25 bg-white/60 p-5 text-sm leading-6"><p className="font-medium text-cocoa">How ordering works</p><p className="mt-1 text-ink/75">Your order opens in WhatsApp, ready to send to our team. We confirm stock, delivery charge and payment with you there before dispatch.</p></div>
          )}
        </div>

        <aside className="h-fit rounded-3xl bg-white/70 p-6 ring-1 ring-rose/20 lg:sticky lg:top-36">
          <h2 className="font-display text-2xl font-semibold text-cocoa">Summary</h2>
          <ul className="mt-4 divide-y divide-rose/15">
            {cart.map((l) => (
              <li key={l.key} className="flex gap-3 py-3">
                <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-blush/40"><Media src={l.image} alt={l.name} sizes="64px" /></div>
                <div className="min-w-0 flex-1 text-sm"><p className="line-clamp-2 font-medium text-cocoa">{l.name}</p><p className="text-ink/60">{[l.size, l.color].filter(Boolean).join(" · ")} × {l.qty}</p>{quote?.lines.find((q) => q.variantId === l.variantId && q.productId === l.productId && !q.available) && <p className="text-xs text-sale">Out of stock — remove to continue</p>}</div>
                <p className="text-sm">{formatPaisa(l.unitPaisa * l.qty)}</p>
              </li>
            ))}
          </ul>

          {useApi && (
            <div className="mt-4 flex gap-2">
              <div className="relative flex-1"><Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-rose" /><input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="Coupon code" aria-label="Coupon code" className="field !pl-9 uppercase" /></div>
              <button type="button" className="btn-ghost px-5 py-2" onClick={() => setApplied(coupon.trim())} disabled={!coupon.trim()}>Apply</button>
            </div>
          )}
          {quote?.coupon && <p className={`mt-2 text-xs ${quote.coupon.applied ? "text-rose-dark" : "text-sale"}`}>{quote.coupon.message || (quote.coupon.applied ? `${quote.coupon.code} applied` : "Coupon not applicable")}</p>}
          {quote && !quote.serviceable && <p className="mt-2 text-xs text-sale">Sorry, we can’t deliver to this pincode yet.</p>}

          <dl className="mt-4 space-y-2 text-sm" aria-busy={quoting}>
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPaisa(quote?.subtotalPaisa ?? subtotalPaisa)}</dd></div>
            {discount > 0 && <div className="flex justify-between text-rose-dark"><dt>Discount</dt><dd>− {formatPaisa(discount)}</dd></div>}
            <div className="flex justify-between"><dt>Delivery</dt><dd>{shipping ? formatPaisa(shipping) : "Free"}</dd></div>
            {!!quote?.codFeePaisa && <div className="flex justify-between"><dt>COD fee</dt><dd>{formatPaisa(quote.codFeePaisa)}</dd></div>}
            <div className="flex justify-between border-t border-rose/20 pt-3 text-lg font-medium text-cocoa"><dt>Total</dt><dd>{formatPaisa(total)}</dd></div>
          </dl>
          <button type="submit" disabled={busy || blocked} className="btn-primary mt-6 w-full">
            {busy ? <><Loader2 size={18} className="animate-spin" />Placing order…</> : useApi ? (method === "ONLINE" ? `Pay ${formatPaisa(total)}` : "Place order") : <><MessageCircle size={18} />Place order on WhatsApp</>}
          </button>
        </aside>
      </form>
    </div>
  );
}
