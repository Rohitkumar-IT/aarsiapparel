import { COMMERCE_API, STORE } from "./env";
import { api, ApiError } from "./api";
import { formatPaisa } from "./format";
import type { CartLine } from "./store";
import type { AddressInput, OrderRequest, OrderView, PaymentMethod, PaymentSession, Quote } from "./types";

/**
 * ORDER HAND-OFF — two modes, switched by NEXT_PUBLIC_COMMERCE_API:
 *  • "on"  → real API: POST /orders (+ Razorpay verify for online payments). Contract: API_SPEC.md
 *  • "off" → WhatsApp message to the store + a copy kept in this browser (default until backend is ready)
 */
const KEY = "aarsi.orders.v2";
export const newKey = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `k-${Date.now()}-${Math.random().toString(36).slice(2)}`);
export const localId = () => "AA-" + Date.now().toString(36).toUpperCase().slice(-6) + Math.random().toString(36).toUpperCase().slice(2, 4);

export function saveOrder(o: OrderView) {
  try { const all = JSON.parse(localStorage.getItem(KEY) || "[]") as OrderView[]; localStorage.setItem(KEY, JSON.stringify([o, ...all.filter((x) => x.orderNumber !== o.orderNumber)].slice(0, 20))); } catch { /* ignore */ }
}
export const loadOrders = (): OrderView[] => { try { return JSON.parse(localStorage.getItem(KEY) || "[]") as OrderView[]; } catch { return []; } };
export const loadOrder = (num: string) => loadOrders().find((o) => o.orderNumber === num) ?? null;

export const validate = {
  phone: (v: string) => /^(\+?91)?[6-9]\d{9}$/.test(v.replace(/[\s-]/g, "")),
  pincode: (v: string) => /^[1-9]\d{5}$/.test(v.trim()),
  email: (v: string) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
};
export const normalizePhone = (v: string) => v.replace(/[\s-]/g, "").replace(/^(\+?91)/, "");

/* ───────── WhatsApp mode ───────── */
export function whatsappMessage(o: OrderView): string {
  const lines = o.items.map((l, i) => `${i + 1}. ${l.name}${l.size ? ` | Size ${l.size}` : ""}${l.color ? ` | ${l.color}` : ""} × ${l.quantity} = ${formatPaisa(l.unitPricePaisa * l.quantity)}`);
  const a = o.address;
  return [`*New order ${o.orderNumber}* — Aarsi Apparel`, "", ...lines, "", `Subtotal: ${formatPaisa(o.subtotalPaisa)}`, o.discountPaisa ? `Discount: -${formatPaisa(o.discountPaisa)}` : "", `Delivery: ${o.shippingPaisa ? formatPaisa(o.shippingPaisa) : "Free"}`, `*Total: ${formatPaisa(o.totalPaisa)}*`, "",
    "*Deliver to*", `${a.fullName} (${a.phone})`, `${[a.line1, a.line2, a.landmark].filter(Boolean).join(", ")}, ${a.city}, ${a.state} - ${a.pincode}`, a.email ? `Email: ${a.email}` : ""]
    .filter((l, i, arr) => l !== "" || (arr[i - 1] !== "" && i > 0)).join("\n");
}
export const whatsappUrl = (o: OrderView) => `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(whatsappMessage(o))}`;
export const whatsappChatUrl = (text = "Hello Aarsi Apparel, I'd like some help.") => `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(text)}`;

/* ───────── Place order ───────── */
export interface PlaceInput { lines: CartLine[]; address: AddressInput; paymentMethod: PaymentMethod; couponCode?: string; quote: Quote | null; subtotalPaisa: number; shippingPaisa: number; totalPaisa: number; notes?: string; idempotencyKey: string }
export type PlaceResult = { kind: "done"; order: OrderView } | { kind: "pay"; order: OrderView; payment: PaymentSession };

export async function placeOrder(i: PlaceInput): Promise<PlaceResult> {
  if (COMMERCE_API) {
    const body: OrderRequest = {
      items: i.lines.map((l) => ({ productId: l.productId, variantId: l.variantId === "default" ? undefined : l.variantId, quantity: l.qty })),
      couponCode: i.couponCode || undefined, paymentMethod: i.paymentMethod, shippingAddress: { ...i.address, phone: normalizePhone(i.address.phone) },
      billingSameAsShipping: true, notes: i.notes || undefined, quoteTotalPaisa: i.quote?.totalPaisa ?? i.totalPaisa, source: "web",
    };
    const { order, payment } = await api.createOrder(body, i.idempotencyKey);
    saveOrder(order);
    return payment && i.paymentMethod === "online" ? { kind: "pay", order, payment } : { kind: "done", order };
  }
  const q = i.quote;
  const order: OrderView = {
    id: localId(), orderNumber: "", status: "pending_confirmation", paymentStatus: "pending", paymentMethod: "whatsapp",
    items: i.lines.map((l) => ({ name: l.name, imageUrl: l.image, size: l.size, color: l.color, quantity: l.qty, unitPricePaisa: l.unitPaisa })),
    subtotalPaisa: i.subtotalPaisa, discountPaisa: q ? q.subtotalPaisa - (q.totalPaisa - q.shippingPaisa - q.codFeePaisa) : 0, shippingPaisa: i.shippingPaisa, codFeePaisa: 0, totalPaisa: i.totalPaisa,
    address: i.address, createdAt: new Date().toISOString(), mode: "whatsapp", timeline: [{ status: "placed", label: "Order sent on WhatsApp" }],
  };
  order.orderNumber = order.id; saveOrder(order);
  return { kind: "done", order };
}

/* ───────── Razorpay Checkout (loaded only when the customer pays online) ───────── */
declare global { interface Window { Razorpay?: new (o: Record<string, unknown>) => { open(): void; on(e: string, cb: (r: unknown) => void): void } } }
function loadRazorpay(): Promise<boolean> {
  return new Promise((res) => {
    if (window.Razorpay) return res(true);
    const s = document.createElement("script"); s.src = "https://checkout.razorpay.com/v1/checkout.js"; s.async = true;
    s.onload = () => res(true); s.onerror = () => res(false); document.body.appendChild(s);
  });
}
export async function payOnline(order: OrderView, pay: PaymentSession): Promise<OrderView> {
  if (!(await loadRazorpay()) || !window.Razorpay) throw new ApiError(0, "Could not load the payment window. Check your connection and try again.");
  return new Promise<OrderView>((resolve, reject) => {
    const rz = new window.Razorpay!({
      key: pay.keyId, amount: pay.amountPaisa, currency: pay.currency, order_id: pay.providerOrderId, name: "Aarsi Apparel", description: `Order ${order.orderNumber}`,
      prefill: { name: order.address.fullName, email: order.address.email, contact: order.address.phone }, theme: { color: "#331609" },
      handler: async (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        try { const paid = await api.verifyPayment(order.id, r); saveOrder(paid); resolve(paid); } catch (e) { reject(e); }
      },
      modal: { ondismiss: () => reject(new ApiError(0, "Payment was cancelled. Your order is saved — you can retry from Track order.", "PAYMENT_CANCELLED")) },
    });
    rz.on("payment.failed", () => reject(new ApiError(0, "Payment failed. Please try another method.", "PAYMENT_FAILED")));
    rz.open();
  });
}
