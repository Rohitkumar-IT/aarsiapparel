/**
 * ORDER FLOW CLIENT  (contract documented in docs/API_ORDER_FLOW.md)
 * These endpoints are PROPOSED: they are not in the current Postman collection. Enable the
 * integration with NEXT_PUBLIC_ORDER_API=true once the backend ships them; until then the checkout
 * keeps using the WhatsApp hand-off. Prices are NEVER sent by the browser: the server re-prices
 * every line from productId + variantId, which is what makes tampering with localStorage harmless.
 */
import type { CartLine } from "./store";

interface Address {
  name: string;
  phone: string;
  email: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  note?: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(path, { ...options, headers });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export type PaymentMethod = "COD" | "ONLINE";

export interface QuoteRequest {
  items: { productId: string; variantId: string; qty: number }[];
  couponCode?: string;
  pincode?: string;
  paymentMethod: PaymentMethod;
}
export interface QuoteLine { productId: string; variantId: string; name: string; qty: number; unitPaisa: number; linePaisa: number; available: boolean; maxQty?: number }
export interface Quote {
  lines: QuoteLine[];
  subtotalPaisa: number; discountPaisa: number; shippingPaisa: number; codFeePaisa: number; gstPaisa: number; totalPaisa: number;
  coupon?: { code: string; applied: boolean; message?: string };
  serviceable: boolean; etaDays?: { min: number; max: number };
  warnings: string[];
}

export interface CreateOrderRequest {
  items: QuoteRequest["items"];
  paymentMethod: PaymentMethod;
  couponCode?: string;
  customer: { name: string; phone: string; email?: string };
  shippingAddress: { name: string; phone: string; line1: string; line2?: string; landmark?: string; city: string; state: string; pincode: string; country: "IN" };
  billingSameAsShipping: boolean;
  notes?: string;
  /** Total the customer saw. The server rejects with 409 PRICE_CHANGED if it no longer matches. */
  expectedTotalPaisa: number;
  source: "web";
}
export interface GatewayPayment { gateway: "razorpay"; keyId: string; gatewayOrderId: string; amountPaisa: number; currency: "INR" }
export interface Order {
  id: string; orderNumber: string; status: string; paymentStatus: string; paymentMethod: PaymentMethod;
  placedAt: string; lines: QuoteLine[];
  subtotalPaisa: number; discountPaisa: number; shippingPaisa: number; codFeePaisa: number; gstPaisa: number; totalPaisa: number;
  shippingAddress: CreateOrderRequest["shippingAddress"];
  /** Present only for ONLINE orders that still need payment. */
  payment?: GatewayPayment;
  /** Lets a guest re-open /order-confirmation/:orderNumber?t=… without logging in. */
  accessToken?: string;
  tracking?: { courier?: string; awb?: string; url?: string };
}
export interface PaymentVerifyRequest { gatewayOrderId: string; paymentId: string; signature: string }

const items = (cart: CartLine[]) => cart.map((l) => ({ productId: l.productId, variantId: l.variantId, qty: l.qty }));

export const orderApi = {
  quote: (cart: CartLine[], o: Pick<QuoteRequest, "couponCode" | "pincode" | "paymentMethod">) =>
    request<Quote>("/api/v1/public/cart/quote", { method: "POST", cache: "no-store", body: JSON.stringify({ items: items(cart), ...o } satisfies QuoteRequest) }),

  create: (cart: CartLine[], a: Address, o: { paymentMethod: PaymentMethod; couponCode?: string; expectedTotalPaisa: number }, idempotencyKey: string) => {
    const body: CreateOrderRequest = {
      items: items(cart), paymentMethod: o.paymentMethod, couponCode: o.couponCode || undefined,
      customer: { name: a.name.trim(), phone: a.phone.replace(/[\s-]/g, ""), email: a.email.trim() || undefined },
      shippingAddress: { name: a.name.trim(), phone: a.phone.replace(/[\s-]/g, ""), line1: a.line1.trim(), city: a.city.trim(), state: a.state.trim(), pincode: a.pincode.trim(), country: "IN" },
      billingSameAsShipping: true, notes: a.note?.trim() || undefined, expectedTotalPaisa: o.expectedTotalPaisa, source: "web",
    };
    return request<Order>("/api/v1/public/orders", { method: "POST", cache: "no-store", headers: { "Idempotency-Key": idempotencyKey }, body: JSON.stringify(body) });
  },

  verifyPayment: (orderId: string, p: PaymentVerifyRequest) =>
    request<Order>(`/api/v1/public/orders/${encodeURIComponent(orderId)}/payment/verify`, { method: "POST", cache: "no-store", body: JSON.stringify(p) }),

  get: (orderNumber: string, token?: string) =>
    request<Order>(`/api/v1/public/orders/${encodeURIComponent(orderNumber)}${token ? `?token=${encodeURIComponent(token)}` : ""}`, { cache: "no-store" }),
};

/** Razorpay Checkout loader (only runs when an ONLINE order is created). */
declare global { interface Window { Razorpay?: new (o: Record<string, unknown>) => { open(): void; on(e: string, cb: (r: unknown) => void): void } } }
export function loadRazorpay(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((res) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js"; s.async = true;
    s.onload = () => res(true); s.onerror = () => res(false);
    document.body.appendChild(s);
  });
}
