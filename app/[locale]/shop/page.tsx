import type { Metadata } from "next";
import Link from "@/components/L";
import { api } from "@/lib/api";
import type { Paged, Product, ProductQuery } from "@/lib/types";
import ProductCard from "@/components/ProductCard";
import Pagination from "@/components/Pagination";
import ShopFilters from "@/components/ShopFilters";
import type { Locale } from "@/lib/i18n";
import { getT, setLocale } from "@/lib/i18n-server";
import { localePath } from "@/lib/i18n";

export const revalidate = 60;
type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];

export async function generateMetadata({ params, searchParams }: { params: { locale: Locale }; searchParams: SP }): Promise<Metadata> {
  setLocale(params.locale); const t = getT();
  const hasFilter = Object.keys(searchParams).length > 0;
  return { title: t("Shop all"), description: t("Browse the full Aarsi Apparel collection — filter by category, size, colour, fabric and price."), alternates: { canonical: localePath(params.locale, "/shop"), languages: { en: "/shop", hi: "/hi/shop" } }, robots: hasFilter ? { index: false, follow: true } : undefined };
}

const PAGE = 24;
export default async function Shop({ params, searchParams }: { params: { locale: Locale }; searchParams: SP }) {
  setLocale(params.locale);
  const t = getT();
  const g = (k: string) => one(searchParams[k]);
  const page = Math.max(1, Number(g("page")) || 1);
  const sortParam = g("sort") ?? "new";
  const sale = g("sale") === "true";
  const priceSort = sortParam === "price-low" || sortParam === "price-high";
  const apiSort: ProductQuery["sort"] = sortParam === "name_asc" || sortParam === "name_desc" ? sortParam : "newest";
  const n = (k: string) => { const v = Number(g(k)); return Number.isFinite(v) && v > 0 ? v : undefined; };
  const base: ProductQuery = {
    sort: apiSort, search: g("search") ?? g("q"), category: g("category"), collection: g("collection"), fabric: g("fabric"), size: g("size"), color: g("color"),
    minPricePaisa: n("minPricePaisa"), maxPricePaisa: n("maxPricePaisa"),
    featured: g("featured") === "true", newArrival: g("newArrival") === "true", bestSeller: g("bestSeller") === "true", trending: g("trending") === "true",
  };

  // The API sorts by newest/name only and has no "sale" filter, so those two are resolved here
  // over the first 200 matches (see API_SPEC.md → proposed `sort=price_asc|price_desc` and `onSale=true`).
  let res: Paged<Product>;
  if (sale || priceSort) {
    const first = await api.products({ ...base, page: 1, pageSize: 50 });
    const more = await Promise.all(Array.from({ length: Math.min(first.totalPages, 4) - 1 }, (_, i) => api.products({ ...base, page: i + 2, pageSize: 50 })));
    let all = [first, ...more].flatMap((r) => r.items);
    if (sale) all = all.filter((p) => p.discount > 0);
    if (priceSort) all = [...all].sort((a, b) => (sortParam === "price-low" ? a.pricePaisa - b.pricePaisa : b.pricePaisa - a.pricePaisa));
    const totalPages = Math.max(1, Math.ceil(all.length / PAGE));
    res = { items: all.slice((page - 1) * PAGE, page * PAGE), total: all.length, page, pageSize: PAGE, totalPages };
  } else res = await api.products({ ...base, page, pageSize: PAGE });

  const [categories, collections] = await Promise.all([api.categories(), api.collections()]);
  const colors = Array.from(new Set(res.items.flatMap((p) => p.colors.map((c) => c.name)))).slice(0, 16);
  const fabrics = Array.from(new Set(res.items.map((p) => p.details.find((d) => d.label === "Fabric")?.value).filter(Boolean) as string[]));
  const sizes = Array.from(new Set([...DEFAULT_SIZES, ...res.items.flatMap((p) => p.sizes)]));
  const qparams = Object.fromEntries(Object.entries(searchParams).map(([k, v]) => [k, one(v)]));
  const title = base.search ? t("Results for “{q}”", { q: base.search }) : sale ? t("Sale") : categories.find((c) => c.slug === base.category)?.name ?? collections.find((c) => c.slug === base.collection)?.name ?? (sortParam === "new" && g("sort") ? t("New arrivals") : base.newArrival ? t("New arrivals") : base.bestSeller ? t("Best sellers") : t("All pieces"));

  return (
    <div className="container-x py-10 sm:py-14">
      <h1 className="h-display mb-8 text-4xl sm:text-5xl">{title}</h1>
      <ShopFilters categories={categories} collections={collections} sizes={sizes} colors={colors} fabrics={fabrics} total={res.total}>
        {res.items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-rose/40 px-6 py-20 text-center">
            <p className="font-display text-3xl text-cocoa">{t("Nothing matches those filters")}</p>
            <p className="mx-auto mt-2 max-w-sm text-ink/70">{t("Try removing a filter or searching for something broader.")}</p>
            <Link href="/shop" className="btn-primary mt-6">{t("Clear filters")}</Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 xl:grid-cols-4">{res.items.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 4} />)}</div>
            <Pagination page={res.page} totalPages={res.totalPages} basePath="/shop" params={qparams} />
          </>
        )}
      </ShopFilters>
    </div>
  );
}
