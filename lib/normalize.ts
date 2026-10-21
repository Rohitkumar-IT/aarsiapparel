/**
 * Defensive mappers: the API envelope is { success, data }, but exact field names inside `data`
 * may evolve. Each reader tries the likely names so the UI never crashes on a missing field.
 */
import type { BlogPost, Category, Collection, Customer, Media, Paged, Product, Review, StoreSettings, Variant } from "./types";
import { mediaUrl } from "./media";
import { discountPct } from "./format";

type R = Record<string, unknown>;
const isR = (v: unknown): v is R => typeof v === "object" && v !== null && !Array.isArray(v);
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const str = (...vs: unknown[]): string => {
  for (const v of vs) if (typeof v === "string" && v.trim()) return v.trim();
  for (const v of vs) if (typeof v === "number" && isFinite(v)) return String(v);
  return "";
};
const num = (...vs: unknown[]): number | undefined => {
  for (const v of vs) {
    const n = typeof v === "string" && v.trim() !== "" ? Number(v) : v;
    if (typeof n === "number" && isFinite(n)) return n;
  }
  return undefined;
};
const bool = (...vs: unknown[]): boolean | undefined => {
  for (const v of vs) if (typeof v === "boolean") return v;
  return undefined;
};
const get = (o: R, ...keys: string[]) => keys.map((k) => o[k]);

function toMedia(v: unknown, fallbackAlt: string): Media | null {
  if (typeof v === "string") return v ? { url: mediaUrl(v), alt: fallbackAlt, type: /\.(mp4|webm|mov)(\?|$)/i.test(v) ? "video" : "image" } : null;
  if (!isR(v)) return null;
  const url = str(...get(v, "url", "imageUrl", "src", "path", "objectPath"));
  if (!url) return null;
  const t = str(v.type, v.kind, v.mediaType).toLowerCase();
  return { url: mediaUrl(url), alt: str(v.alt, v.altText, v.caption) || fallbackAlt, type: t.includes("video") || /\.(mp4|webm|mov)(\?|$)/i.test(url) ? "video" : "image" };
}

function collectMedia(p: R, name: string): Media[] {
  const out: Media[] = [];
  const seen = new Set<string>();
  const push = (m: Media | null) => { if (m && !seen.has(m.url)) { seen.add(m.url); out.push(m); } };
  for (const key of ["media", "images", "gallery", "photos"]) arr(p[key]).forEach((m) => push(toMedia(m, name)));
  for (const key of ["primaryImage", "imageUrl", "thumbnailUrl", "image", "coverImage"]) if (p[key]) push(toMedia(p[key], name));
  return out;
}

function toVariant(v: unknown, i: number, fallbackPrice: number, fallbackMrp?: number): Variant | null {
  if (!isR(v)) return null;
  const options = isR(v.options) ? v.options : {};
  const pricePaisa = num(...get(v, "pricePaisa", "sellingPricePaisa", "salePricePaisa", "priceInPaisa", "price")) ?? fallbackPrice;
  const stock = num(v.stock, v.stockQuantity, v.quantity, v.inventory, v.availableQuantity);
  const inStockFlag = bool(v.inStock, v.available, v.isAvailable, v.isActive);
  return {
    id: str(v.id, v.variantId, v.sku) || `v${i}`,
    sku: str(v.sku) || undefined,
    size: str(v.size, options.size, options.Size) || undefined,
    color: str(v.color, v.colour, v.colorName, options.color, options.Color) || undefined,
    colorHex: str(v.colorHex, v.hex, v.colorCode) || undefined,
    pricePaisa,
    mrpPaisa: num(...get(v, "mrpPaisa", "compareAtPricePaisa", "originalPricePaisa", "mrp")) ?? fallbackMrp,
    payablePaisa: num(v.payablePaisa, v.totalPayablePaisa, v.finalPricePaisa),
    gstPaisa: num(v.gstPaisa, v.gstAmountPaisa, v.taxPaisa),
    stock: stock ?? null,
    inStock: inStockFlag ?? (stock === undefined ? true : stock > 0),
  };
}

function toReview(r: unknown, i: number): Review | null {
  if (!isR(r)) return null;
  const body = str(r.body, r.comment, r.content, r.text, r.review);
  const rating = num(r.rating, r.stars) ?? 0;
  if (!body && !rating) return null;
  return {
    id: str(r.id) || `r${i}`, rating, body, title: str(r.title) || undefined,
    author: str(r.customerName, r.author, r.name, r.reviewer) || "Verified buyer",
    createdAt: str(r.createdAt, r.date) || undefined,
  };
}

export function toProduct(raw: unknown): Product | null {
  if (!isR(raw)) return null;
  const name = str(raw.name, raw.title);
  const slug = str(raw.slug, raw.handle, raw.id);
  if (!name || !slug) return null;

  let basePrice = num(...get(raw, "pricePaisa", "sellingPricePaisa", "salePricePaisa", "priceInPaisa", "minPricePaisa", "price")) ?? 0;
  const baseMrp = num(...get(raw, "mrpPaisa", "compareAtPricePaisa", "originalPricePaisa", "maxMrpPaisa", "mrp"));
  const variants = arr(raw.variants).map((v, i) => toVariant(v, i, basePrice, baseMrp)).filter((v): v is Variant => !!v);
  if (!basePrice && variants.length) basePrice = Math.min(...variants.map((v) => v.pricePaisa));

  const cheapest = variants.length ? variants.reduce((a, b) => (b.pricePaisa < a.pricePaisa ? b : a)) : undefined;
  const mrpPaisa = baseMrp ?? cheapest?.mrpPaisa;
  const media = collectMedia(raw, name);

  const sizeSet = new Set<string>(arr(raw.sizes).map((s) => str(s)).filter(Boolean));
  variants.forEach((v) => v.size && sizeSet.add(v.size));
  const colorMap = new Map<string, { name: string; hex?: string }>();
  arr(raw.colors).forEach((c) => {
    const nm = isR(c) ? str(c.name, c.label) : str(c);
    if (nm) colorMap.set(nm, { name: nm, hex: isR(c) ? str(c.hex, c.code) || undefined : undefined });
  });
  variants.forEach((v) => v.color && !colorMap.has(v.color) && colorMap.set(v.color, { name: v.color, hex: v.colorHex }));

  const cat = isR(raw.category) ? raw.category : null;
  const catName = cat ? str(cat.name, cat.title) : str(raw.categoryName, typeof raw.category === "string" ? raw.category : "");
  const catSlug = cat ? str(cat.slug, cat.id) : str(raw.categorySlug);

  const detailKeys: [string, string][] = [["fabric", "Fabric"], ["material", "Material"], ["fit", "Fit"], ["pattern", "Pattern"], ["occasion", "Occasion"], ["care", "Care"], ["work", "Work"], ["origin", "Made in"]];
  const details = detailKeys.map(([k, label]) => ({ label, value: str(raw[k]) })).filter((d) => d.value);

  const reviews = arr(raw.reviews).map(toReview).filter((r): r is Review => !!r);
  const ratings = reviews.map((r) => r.rating).filter(Boolean);
  const rating = num(raw.rating, raw.averageRating, raw.avgRating) ?? (ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0);
  const stockFlag = bool(raw.inStock, raw.available);

  return {
    id: str(raw.id) || slug, slug, name,
    summary: str(raw.shortDescription, raw.summary, raw.subtitle),
    description: str(raw.description, raw.longDescription, raw.details),
    category: catName ? { name: catName, slug: catSlug } : undefined,
    media, image: media.find((m) => m.type === "image") ?? media[0] ?? null,
    pricePaisa: basePrice, mrpPaisa,
    payablePaisa: num(raw.payablePaisa, raw.totalPayablePaisa, raw.finalPricePaisa),
    gstPaisa: num(raw.gstPaisa, raw.gstAmountPaisa, raw.taxPaisa),
    discount: num(raw.discountPercent, raw.discountPct) ?? discountPct(basePrice, mrpPaisa),
    sizes: Array.from(sizeSet), colors: Array.from(colorMap.values()), variants, details,
    flags: {
      featured: !!bool(raw.featured, raw.isFeatured), newArrival: !!bool(raw.newArrival, raw.isNewArrival),
      bestSeller: !!bool(raw.bestSeller, raw.isBestSeller), trending: !!bool(raw.trending, raw.isTrending),
    },
    rating, reviewCount: num(raw.reviewCount, raw.reviewsCount, raw.ratingCount) ?? reviews.length, reviews,
    inStock: stockFlag ?? (variants.length ? variants.some((v) => v.inStock) : true),
  };
}

export function toPaged<T>(data: unknown, map: (r: unknown) => T | null): Paged<T> {
  const d = isR(data) ? data : {};
  const items = arr(d.items ?? d.products ?? d.posts ?? d.results ?? (Array.isArray(data) ? data : [])).map(map).filter((x): x is T => x !== null);
  const pageSize = num(d.pageSize, d.limit) ?? (items.length || 24);
  const total = num(d.total, d.totalCount, d.count) ?? items.length;
  return { items, total, page: num(d.page) ?? 1, pageSize, totalPages: num(d.totalPages) ?? Math.max(1, Math.ceil(total / pageSize)) };
}

export function toCategory(r: unknown): Category | null {
  if (!isR(r)) return null;
  const name = str(r.name, r.title); const slug = str(r.slug, r.id);
  if (!name || !slug) return null;
  return { id: str(r.id) || slug, slug, name, parentId: str(r.parentId) || undefined, imageUrl: mediaUrl(str(r.imageUrl, r.image)), productCount: num(r.productCount, r.count) ?? 0 };
}
export function toCollection(r: unknown): Collection | null {
  if (!isR(r)) return null;
  const name = str(r.name, r.title); const slug = str(r.slug, r.id);
  if (!name || !slug) return null;
  return { id: str(r.id) || slug, slug, name, description: str(r.description, r.subtitle), imageUrl: mediaUrl(str(r.imageUrl, r.bannerUrl, r.image)) };
}
export function toList<T>(data: unknown, map: (r: unknown) => T | null): T[] {
  const d = isR(data) ? (data.items ?? data.categories ?? data.collections ?? data) : data;
  return arr(d).map(map).filter((x): x is T => x !== null);
}

export function toStore(data: unknown): StoreSettings {
  const d = isR(data) ? data : {};
  const gst = isR(d.gst) ? d.gst : {};
  const ful = isR(d.fulfilment) ? d.fulfilment : isR(d.fulfillment) ? d.fulfillment : isR(d.shipping) ? d.shipping : {};
  return {
    name: str(d.name, d.storeName) || "Aarsi Apparel",
    currency: str(d.currency) || "INR",
    gstRatePct: num(d.gstRate, d.gstPercent, gst.rate, gst.ratePercent),
    shippingFeePaisa: num(d.shippingFeePaisa, d.shippingChargePaisa, d.flatShippingPaisa, ful.shippingFeePaisa, ful.flatRatePaisa, ful.feePaisa) ?? 0,
    freeShippingThresholdPaisa: num(d.freeShippingThresholdPaisa, d.freeShippingAbovePaisa, ful.freeShippingThresholdPaisa, ful.freeAbovePaisa),
    codAvailable: bool(d.codEnabled, d.codAvailable, ful.codEnabled),
    deliveryNote: str(d.deliveryNote, ful.note, ful.deliveryNote) || undefined,
  };
}

export function toBlog(r: unknown): BlogPost | null {
  if (!isR(r)) return null;
  const title = str(r.title); const slug = str(r.slug);
  if (!title || !slug) return null;
  return {
    id: str(r.id) || slug, slug, title,
    excerpt: str(r.excerpt, r.summary, r.description, r.subtitle),
    content: str(r.content, r.body, r.html, r.contentHtml, r.markdown),
    imageUrl: mediaUrl(str(r.coverImageUrl, r.imageUrl, r.featuredImage, r.thumbnailUrl, r.coverImage)),
    author: str(r.authorName, r.author), publishedAt: str(r.publishedAt, r.scheduledAt, r.createdAt) || undefined,
    tags: arr(r.tags).map((t) => str(isR(t) ? t.name : t)).filter(Boolean),
  };
}

export function toCustomer(data: unknown): Customer | null {
  const d = isR(data) ? (isR(data.customer) ? data.customer : isR(data.user) ? data.user : data) : null;
  if (!d) return null;
  const id = str(d.id, d.customerId, d.email);
  if (!id) return null;
  const name = str(d.name, d.fullName, [str(d.firstName), str(d.lastName)].filter(Boolean).join(" "), d.displayName) || str(d.email).split("@")[0];
  return { id, name, email: str(d.email), avatarUrl: str(d.avatarUrl, d.picture, d.photoUrl) || undefined, phone: str(d.phone) || undefined };
}
