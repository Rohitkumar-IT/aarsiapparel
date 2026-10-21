import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import type { ProductQuery } from "@/lib/types";
import ProductCard from "@/components/ProductCard";
import Pagination from "@/components/Pagination";
import ShopFilters from "@/components/ShopFilters";

export const revalidate = 60;
type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const hasFilter = Object.keys(searchParams).length > 0;
  return { title: "Shop all", description: "Browse the full Aarsi Apparel collection — filter by category, size, colour, fabric and price.", alternates: { canonical: "/shop" }, robots: hasFilter ? { index: false, follow: true } : undefined };
}

export default async function Shop({ searchParams }: { searchParams: SP }) {
  const g = (k: string) => one(searchParams[k]);
  const page = Math.max(1, Number(g("page")) || 1);
  const sort = (["newest", "name_asc", "name_desc"].includes(g("sort") ?? "") ? g("sort") : "newest") as ProductQuery["sort"];
  const n = (k: string) => { const v = Number(g(k)); return Number.isFinite(v) && v > 0 ? v : undefined; };
  const q: ProductQuery = {
    page, pageSize: 24, sort, search: g("search"), category: g("category"), collection: g("collection"), fabric: g("fabric"), size: g("size"), color: g("color"),
    minPricePaisa: n("minPricePaisa"), maxPricePaisa: n("maxPricePaisa"),
    featured: g("featured") === "true", newArrival: g("newArrival") === "true", bestSeller: g("bestSeller") === "true", trending: g("trending") === "true",
  };
  const [res, categories, collections] = await Promise.all([api.products(q), api.categories(), api.collections()]);

  const colors = Array.from(new Set(res.items.flatMap((p) => p.colors.map((c) => c.name)))).slice(0, 16);
  const fabrics = Array.from(new Set(res.items.map((p) => p.details.find((d) => d.label === "Fabric")?.value).filter(Boolean) as string[]));
  const sizes = Array.from(new Set([...DEFAULT_SIZES, ...res.items.flatMap((p) => p.sizes)]));
  const params = Object.fromEntries(Object.entries(searchParams).map(([k, v]) => [k, one(v)]));
  const title = q.search ? `Results for “${q.search}”` : categories.find((c) => c.slug === q.category)?.name ?? (q.newArrival ? "New arrivals" : q.bestSeller ? "Best sellers" : "All pieces");

  return (
    <div className="container-x py-10 sm:py-14">
      <h1 className="h-display mb-8 text-4xl sm:text-5xl">{title}</h1>
      <ShopFilters categories={categories} collections={collections} sizes={sizes} colors={colors} fabrics={fabrics} total={res.total}>
        {res.items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-rose/40 px-6 py-20 text-center">
            <p className="font-display text-3xl text-cocoa">Nothing matches those filters</p>
            <p className="mx-auto mt-2 max-w-sm text-ink/70">Try removing a filter or searching for something broader.</p>
            <Link href="/shop" className="btn-primary mt-6">Clear filters</Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 xl:grid-cols-4">{res.items.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 4} />)}</div>
            <Pagination page={res.page} totalPages={res.totalPages} basePath="/shop" params={params} />
          </>
        )}
      </ShopFilters>
    </div>
  );
}
