import { API_BASE_URL, REVALIDATE } from "./env";
import { toBlog, toCategory, toCollection, toCustomer, toList, toPaged, toProduct, toStore } from "./normalize";
import type { BlogPost, Category, Collection, Customer, Offer, OrderRequest, OrderView, Paged, PaymentSession, PincodeInfo, Product, ProductQuery, Quote, QuoteRequest, StoreSettings } from "./types";
import { toOrderView } from "./order-map";

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) { super(message); }
}

interface Envelope<T> { success: boolean; data?: T; error?: { message?: string; code?: string } | string; message?: string }

const isServer = typeof window === "undefined";
/** Language sent to the backend (Accept-Language + ?lang=). Server pages register their locale via i18n-server. */
let langFn: () => string = () => (typeof document !== "undefined" ? document.documentElement.lang.slice(0, 2) || "en" : "en");
export const setApiLang = (f: () => string) => { langFn = f; };
/** Server: call backend directly. Browser: same-origin /api proxy (cookie-safe, no CORS). */
const base = () => (isServer ? API_BASE_URL : "");

async function request<T>(path: string, init: RequestInit & { revalidate?: number | false; timeoutMs?: number } = {}): Promise<T> {
  const { revalidate, timeoutMs = 10000, ...rest } = init;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const lang = langFn();
    const url = lang !== "en" && path.startsWith("/api/v1/public/") ? `${base()}${path}${path.includes("?") ? "&" : "?"}lang=${lang}` : `${base()}${path}`;
    const res = await fetch(url, {
      ...rest,
      headers: { Accept: "application/json", "Accept-Language": lang, ...(rest.body ? { "Content-Type": "application/json" } : {}), ...rest.headers },
      signal: ctrl.signal,
      ...(isServer ? { next: { revalidate: revalidate === undefined ? REVALIDATE : revalidate } } : { credentials: "include" as const }),
    });
    let json: Envelope<T> | null = null;
    try { json = (await res.json()) as Envelope<T>; } catch { /* empty body (e.g. 204) */ }
    if (!res.ok || (json && json.success === false)) {
      const e = json?.error;
      const msg = (typeof e === "string" ? e : e?.message) || json?.message || `Request failed (${res.status})`;
      throw new ApiError(res.status, msg, typeof e === "object" ? e?.code : undefined);
    }
    return (json ? (json.data ?? (json as unknown)) : (undefined as unknown)) as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if ((err as Error).name === "AbortError") throw new ApiError(408, "The server took too long to respond.");
    throw new ApiError(0, "Could not reach the store. Check your connection and try again.");
  } finally {
    clearTimeout(timer);
  }
}

/** Never let a backend hiccup crash a page: log and return the fallback. */
async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try { return await p; } catch (e) { if (process.env.NODE_ENV !== "production") console.warn("[api]", (e as Error).message); return fallback; }
}

const qs = (q: Record<string, unknown>) => {
  const sp = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => { if (v !== undefined && v !== "" && v !== false && v !== null) sp.set(k, String(v)); });
  const s = sp.toString();
  return s ? `?${s}` : "";
};

const EMPTY = <T,>(): Paged<T> => ({ items: [], total: 0, page: 1, pageSize: 24, totalPages: 1 });

export const api = {
  /* ───────── Public catalog (GET) ───────── */
  store: () => safe(request<unknown>("/api/v1/public/store", { revalidate: 300 }).then(toStore), toStore({})),
  categories: (): Promise<Category[]> => safe(request<unknown>("/api/v1/public/categories", { revalidate: 300 }).then((d) => toList(d, toCategory)), []),
  collections: (): Promise<Collection[]> => safe(request<unknown>("/api/v1/public/collections", { revalidate: 300 }).then((d) => toList(d, toCollection)), []),
  products: (q: ProductQuery = {}): Promise<Paged<Product>> =>
    safe(request<unknown>(`/api/v1/public/products${qs({ page: 1, pageSize: 24, sort: "newest", ...q })}`).then((d) => toPaged(d, toProduct)), EMPTY<Product>()),
  product: async (slug: string): Promise<Product | null> => {
    try { return toProduct(await request<unknown>(`/api/v1/public/products/${encodeURIComponent(slug)}`)); }
    catch (e) { if (e instanceof ApiError && e.status === 404) return null; throw e; }
  },

  /* ───────── Public blog (GET) ───────── */
  blogs: (page = 1, pageSize = 12): Promise<Paged<BlogPost>> =>
    safe(request<unknown>(`/api/v1/public/blogs${qs({ page, pageSize })}`).then((d) => toPaged(d, toBlog)), EMPTY<BlogPost>()),
  blog: async (slug: string): Promise<BlogPost | null> => {
    try { return toBlog(await request<unknown>(`/api/v1/public/blogs/${encodeURIComponent(slug)}`)); }
    catch (e) { if (e instanceof ApiError && e.status === 404) return null; throw e; }
  },

  /* ───────── Customer (browser only, cookie session) ───────── */
  me: async (): Promise<Customer | null> => {
    try { return toCustomer(await request<unknown>("/api/v1/customer/me", { cache: "no-store" })); }
    catch (e) { if (e instanceof ApiError && (e.status === 401 || e.status === 403)) return null; throw e; }
  },
  logout: (): Promise<void> => request<void>("/api/v1/customer/auth/logout", { method: "POST", cache: "no-store" }).then(() => undefined),
  /* ───────── Order flow (needs NEXT_PUBLIC_COMMERCE_API=on; contract in API_SPEC.md) ───────── */
  offers: (): Promise<Offer[]> => safe(request<{ items?: Offer[] } | Offer[]>("/api/v1/public/offers", { revalidate: 300 }).then((d) => (Array.isArray(d) ? d : d.items ?? [])), []),
  quote: (body: QuoteRequest): Promise<Quote> => request<Quote>("/api/v1/public/cart/quote", { method: "POST", body: JSON.stringify(body), cache: "no-store" }),
  pincode: (pin: string): Promise<PincodeInfo> => request<PincodeInfo>(`/api/v1/public/pincodes/${encodeURIComponent(pin)}`, { cache: "no-store" }),
  createOrder: async (body: OrderRequest, idempotencyKey: string): Promise<{ order: OrderView; payment: PaymentSession | null }> => {
    const d = await request<{ order: unknown; payment?: PaymentSession | null }>("/api/v1/orders", { method: "POST", body: JSON.stringify(body), headers: { "Idempotency-Key": idempotencyKey }, cache: "no-store" });
    return { order: toOrderView(d.order), payment: d.payment ?? null };
  },
  verifyPayment: async (orderId: string, body: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }): Promise<OrderView> =>
    toOrderView((await request<{ order: unknown }>(`/api/v1/orders/${encodeURIComponent(orderId)}/payment/verify`, { method: "POST", body: JSON.stringify(body), cache: "no-store" })).order),
  getOrder: async (orderNumber: string, token?: string): Promise<OrderView> =>
    toOrderView((await request<{ order: unknown }>(`/api/v1/orders/${encodeURIComponent(orderNumber)}${token ? `?token=${encodeURIComponent(token)}` : ""}`, { cache: "no-store" })).order),
  trackOrder: async (orderNumber: string, phone: string): Promise<OrderView> =>
    toOrderView((await request<{ order: unknown }>("/api/v1/orders/track", { method: "POST", body: JSON.stringify({ orderNumber, phone }), cache: "no-store" })).order),
  myOrders: async (page = 1): Promise<Paged<OrderView>> => {
    const d = await request<{ items: unknown[]; total: number; page: number; pageSize: number; totalPages: number }>(`/api/v1/customer/orders${qs({ page, pageSize: 20 })}`, { cache: "no-store" });
    return { ...d, items: d.items.map(toOrderView) };
  },
  cancelOrder: async (orderNumber: string, body: { token?: string; reason: string }): Promise<OrderView> =>
    toOrderView((await request<{ order: unknown }>(`/api/v1/orders/${encodeURIComponent(orderNumber)}/cancel`, { method: "POST", body: JSON.stringify(body), cache: "no-store" })).order),
  subscribe: (email: string) => request<{ subscribed: boolean }>("/api/v1/public/newsletter/subscribe", { method: "POST", body: JSON.stringify({ email, source: "web_footer" }), cache: "no-store" }),

  googleLoginUrl: (returnTo = "/account") => `/api/v1/customer/auth/google?returnTo=${encodeURIComponent(returnTo)}`,
};
