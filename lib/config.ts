/** Editable storefront content. Copy is translated through `t` so it follows the visitor's language. */
import { ANNOUNCEMENTS, RETURN_DAYS } from "./env";
import { formatPaisa } from "./format";
import type { TFn } from "./i18n";
import type { Product, StoreSettings } from "./types";

/** English values are used in the shop search query, so they stay English; display is translated with t(). */
export const OCCASIONS = ["Wedding", "Reception", "Festival", "Party", "Engagement", "Casual"];

/** Bust/waist/hip in inches. Edit to match your real size chart. */
export const SIZE_CHART: { size: string; bust: string; waist: string; hip: string }[] = [
  { size: "XS", bust: "32", waist: "26", hip: "35" },
  { size: "S", bust: "34", waist: "28", hip: "37" },
  { size: "M", bust: "36", waist: "30", hip: "39" },
  { size: "L", bust: "38", waist: "32", hip: "41" },
  { size: "XL", bust: "40", waist: "34", hip: "43" },
  { size: "XXL", bust: "42", waist: "36", hip: "45" },
];

/** Ticker + trust strip are generated from real store settings, never invented. */
export function buildPromises(s: StoreSettings, t: TFn) {
  const list: { key: string; title: string }[] = [];
  const free = s.freeShippingThresholdPaisa;
  list.push({ key: "ship", title: free ? t("Free shipping above {amount}", { amount: formatPaisa(free) }) : t("Delivered across India") });
  if (s.codAvailable) list.push({ key: "cod", title: t("Cash on delivery") });
  if (RETURN_DAYS > 0) list.push({ key: "ret", title: t("{n}-day easy returns", { n: RETURN_DAYS }) });
  list.push({ key: "sec", title: t("Secure payments") });
  return list;
}
export const buildAnnouncements = (s: StoreSettings, t: TFn) => [...ANNOUNCEMENTS, ...buildPromises(s, t).slice(0, 3).map((p) => p.title.toUpperCase())];

export const HOME_FAQ = (s: StoreSettings, t: TFn) => [
  { q: t("Do you deliver across India?"), a: s.freeShippingThresholdPaisa ? t("Yes, we ship across India. Delivery is free on orders above {amount}.", { amount: formatPaisa(s.freeShippingThresholdPaisa) }) : t("Yes, we ship across India. The delivery charge, if any, is shown at checkout before you pay.") },
  { q: t("Is cash on delivery available?"), a: s.codAvailable ? t("Yes, cash on delivery is available at checkout, along with UPI, cards and wallets.") : t("Online payment is available at checkout. Write to us on WhatsApp if you need other options.") },
  { q: t("What is your return policy?"), a: RETURN_DAYS > 0 ? t("You can request a return or exchange within {n} days of delivery. Items must be unworn with tags intact.", { n: RETURN_DAYS }) : t("Message us on WhatsApp within a few days of delivery and we will help with returns or exchanges.") },
  { q: t("How do I choose my size?"), a: t("Each product page has a size guide with bust, waist and hip measurements. If you are between sizes, choose the larger one or message us for advice.") },
  { q: t("Where can I see the pieces in person?"), a: t("Visit our store in Greater Noida West. The address and map link are on the Visit us page.") },
];

/** Per-product Q&A built only from the product's real data (price, sizes, colours) + store settings. */
export function productFaq(p: Product, s: StoreSettings, t: TFn) {
  const price = formatPaisa(p.pricePaisa);
  const out: { q: string; a: string }[] = [
    { q: t("What is the price of {name}?", { name: p.name }), a: p.pricePaisa > 0
      ? t("{name} is priced at {price} and is {stock}. The price is inclusive of all taxes.", { name: p.name, price: p.mrpPaisa && p.mrpPaisa > p.pricePaisa ? `${price} (MRP ${formatPaisa(p.mrpPaisa)})` : price, stock: p.inStock ? t("currently in stock") : t("currently out of stock") })
      : t("Please message us on WhatsApp for the price of {name}.", { name: p.name }) },
  ];
  if (p.sizes.length) out.push({ q: t("Which sizes are available for {name}?", { name: p.name }), a: t("Available sizes: {list}.", { list: p.sizes.join(", ") }) });
  if (p.colors.length) out.push({ q: t("Which colours does {name} come in?", { name: p.name }), a: t("Available colours: {list}.", { list: p.colors.map((c) => c.name).join(", ") }) });
  const home = HOME_FAQ(s, t);
  out.push(home[0], home[2]);
  return out;
}
