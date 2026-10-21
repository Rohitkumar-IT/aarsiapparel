import ProductCard from "./ProductCard";
import type { Product } from "@/lib/types";

/** ≥4 products → responsive grid. 1–3 products → centered row so the section never looks half-empty. */
export default function ProductGrid({ items, featured, priorityCount = 0 }: { items: Product[]; featured?: boolean; priorityCount?: number }) {
  if (items.length >= 4) {
    return <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4">{items.map((p, i) => <ProductCard key={p.id} product={p} featured={featured} priority={i < priorityCount} />)}</div>;
  }
  return (
    <div className="flex flex-wrap justify-center gap-x-3 gap-y-8 sm:gap-x-4">
      {items.map((p, i) => <div key={p.id} className="w-[calc(50%-0.375rem)] sm:w-[calc(33.333%-0.75rem)] lg:w-[calc(25%-0.75rem)]"><ProductCard product={p} featured={featured} priority={i < priorityCount} /></div>)}
    </div>
  );
}
