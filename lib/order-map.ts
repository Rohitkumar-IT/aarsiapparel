import type { AddressInput, OrderView } from "./types";
import { mediaUrl } from "./media";

type R = Record<string, unknown>;
const r = (v: unknown): R => (typeof v === "object" && v !== null ? (v as R) : {});
const n = (v: unknown) => (typeof v === "number" && isFinite(v) ? v : 0);
const s = (v: unknown) => (typeof v === "string" ? v : "");

/** Maps the API_SPEC.md order object to the UI's OrderView. */
export function toOrderView(raw: unknown): OrderView {
  const o = r(raw); const p = r(o.pricing); const a = r(o.shippingAddress);
  const discount = n(p.tierDiscountPaisa) + n(p.couponDiscountPaisa) + n(p.prepaidDiscountPaisa);
  const items = (Array.isArray(o.items) ? o.items : []).map((i) => { const x = r(i); return {
    name: s(x.name), imageUrl: mediaUrl(s(x.imageUrl)) || undefined, size: s(x.size) || undefined, color: s(x.color) || undefined,
    quantity: n(x.quantity), unitPricePaisa: n(x.unitPricePaisa),
  }; });
  return {
    id: s(o.id) || s(o.orderNumber), orderNumber: s(o.orderNumber), status: s(o.status) || "confirmed", paymentStatus: s(o.paymentStatus),
    paymentMethod: (s(o.paymentMethod) as "cod" | "online") || "cod", items,
    subtotalPaisa: n(p.subtotalPaisa), discountPaisa: discount, shippingPaisa: n(p.shippingPaisa), codFeePaisa: n(p.codFeePaisa), totalPaisa: n(p.totalPaisa),
    address: { fullName: s(a.fullName), phone: s(a.phone), email: s(a.email) || undefined, line1: s(a.line1), line2: s(a.line2) || undefined, landmark: s(a.landmark) || undefined, city: s(a.city), state: s(a.state), pincode: s(a.pincode) } as AddressInput,
    createdAt: s(o.createdAt), trackingToken: s(o.trackingToken) || undefined, mode: "api",
    timeline: (Array.isArray(o.timeline) ? o.timeline : []).map((t) => { const x = r(t); return { status: s(x.status), label: s(x.label) || s(x.status), at: s(x.at) || undefined }; }),
    tracking: Object.keys(r(o.tracking)).length ? { carrier: s(r(o.tracking).carrier) || undefined, awb: s(r(o.tracking).awb) || undefined, url: s(r(o.tracking).url) || undefined } : undefined,
  };
}
