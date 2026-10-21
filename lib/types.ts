export interface Media { url: string; alt: string; type: "image" | "video" }

export interface Variant {
  id: string;
  sku?: string;
  size?: string;
  color?: string;
  colorHex?: string;
  pricePaisa: number;
  mrpPaisa?: number;
  payablePaisa?: number;
  gstPaisa?: number;
  stock: number | null; // null = unknown/unlimited
  inStock: boolean;
}

export interface Review { id: string; rating: number; title?: string; body: string; author: string; createdAt?: string }

export interface Product {
  id: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  category?: { name: string; slug: string };
  media: Media[];
  image: Media | null;
  pricePaisa: number;
  mrpPaisa?: number;
  payablePaisa?: number;
  gstPaisa?: number;
  discount: number;
  sizes: string[];
  colors: { name: string; hex?: string }[];
  variants: Variant[];
  details: { label: string; value: string }[];
  flags: { featured: boolean; newArrival: boolean; bestSeller: boolean; trending: boolean };
  rating: number;
  reviewCount: number;
  reviews: Review[];
  inStock: boolean;
}

export interface Category { id: string; slug: string; name: string; parentId?: string; imageUrl: string; productCount: number }
export interface Collection { id: string; slug: string; name: string; description: string; imageUrl: string }

export interface StoreSettings {
  name: string;
  currency: string;
  gstRatePct?: number;
  shippingFeePaisa: number;
  freeShippingThresholdPaisa?: number;
  codAvailable?: boolean;
  deliveryNote?: string;
}

export interface Paged<T> { items: T[]; total: number; page: number; pageSize: number; totalPages: number }
export interface BlogPost { id: string; slug: string; title: string; excerpt: string; content: string; imageUrl: string; author: string; publishedAt?: string; tags: string[] }
export interface Customer { id: string; name: string; email: string; avatarUrl?: string; phone?: string }

export interface ProductQuery {
  page?: number; pageSize?: number; sort?: "newest" | "name_asc" | "name_desc";
  search?: string; category?: string; collection?: string; fabric?: string; size?: string; color?: string;
  minPricePaisa?: number; maxPricePaisa?: number;
  featured?: boolean; newArrival?: boolean; bestSeller?: boolean; trending?: boolean;
}

/* ───────── Order-flow contract (see API_SPEC.md) ───────── */
export type PaymentMethod = "cod" | "online";
export interface QuoteItemInput { productId: string; variantId?: string; quantity: number }
export interface QuoteRequest { items: QuoteItemInput[]; couponCode?: string; pincode?: string; paymentMethod?: PaymentMethod }
export interface QuoteLine {
  productId: string; variantId?: string; name: string; imageUrl?: string; size?: string; color?: string;
  quantity: number; unitPricePaisa: number; mrpPaisa?: number; lineTotalPaisa: number; available: boolean; maxQuantity?: number; issue?: string;
}
export interface Quote {
  lines: QuoteLine[]; subtotalPaisa: number;
  tierDiscount?: { label: string; percent: number; amountPaisa: number };
  couponDiscountPaisa: number; couponCode?: string; couponError?: string;
  prepaidDiscountPaisa: number; shippingPaisa: number; codFeePaisa: number; gstIncludedPaisa: number; totalPaisa: number;
  messages: string[];
}
export interface PincodeInfo { pincode: string; serviceable: boolean; codAvailable: boolean; city?: string; state?: string; etaDaysMin?: number; etaDaysMax?: number; shippingPaisa?: number }
export interface Offer { code: string; title: string; description: string; minOrderPaisa?: number }

export interface AddressInput { fullName: string; phone: string; email?: string; line1: string; line2?: string; landmark?: string; city: string; state: string; pincode: string }
export interface OrderRequest {
  items: QuoteItemInput[]; couponCode?: string; paymentMethod: PaymentMethod; shippingAddress: AddressInput; billingSameAsShipping: boolean; notes?: string; quoteTotalPaisa: number;
  source: "web";
}
export type OrderStatus = "pending_payment" | "confirmed" | "processing" | "shipped" | "out_for_delivery" | "delivered" | "cancelled" | "return_requested" | "returned";
export interface OrderView {
  id: string; orderNumber: string; status: OrderStatus | string; paymentStatus: string; paymentMethod: PaymentMethod | "whatsapp";
  items: { name: string; imageUrl?: string; size?: string; color?: string; quantity: number; unitPricePaisa: number }[];
  subtotalPaisa: number; discountPaisa: number; shippingPaisa: number; codFeePaisa: number; totalPaisa: number;
  address: AddressInput; createdAt: string; trackingToken?: string; mode: "api" | "whatsapp";
  timeline: { status: string; label: string; at?: string }[]; tracking?: { carrier?: string; awb?: string; url?: string };
}
export interface PaymentSession { provider: "razorpay"; keyId: string; providerOrderId: string; amountPaisa: number; currency: string }
