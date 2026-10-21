const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const inr2 = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 });

/** All backend money is integer paisa. */
export function formatPaisa(paisa: number): string {
  const rupees = paisa / 100;
  return Number.isInteger(rupees) ? inr.format(rupees) : inr2.format(rupees);
}
export const rupeesToPaisa = (r: number) => Math.round(r * 100);
export const paisaToRupees = (p: number) => Math.round(p) / 100;
export const discountPct = (price: number, mrp?: number) =>
  mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
export const formatDate = (iso?: string, locale: string = "en") => {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString(locale === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short", year: "numeric" });
};
