import Link from "@/components/L";
import Media from "./Media";
import Price from "./Price";
import WishButton from "./WishButton";
import type { Product } from "@/lib/types";
import { getT } from "@/lib/i18n-server";

export default function ProductCard({ product: p, priority, featured }: { product: Product; priority?: boolean; featured?: boolean }) {
  const t = getT();
  const badge = !p.inStock ? t("Sold out") : featured && p.flags.featured ? t("Featured") : p.flags.newArrival ? t("New") : p.flags.bestSeller ? t("Best seller") : p.discount >= 10 && p.pricePaisa > 0 ? t("{n}% off", { n: p.discount }) : "";
  const second = p.media.filter((m) => m.type === "image")[1];
  return (
    <article className="group relative">
      <Link href={`/product/${p.slug}`} className="block" aria-label={p.name}>
        <div className="relative aspect-[3/4] overflow-hidden rounded-t-[999px] rounded-b-2xl bg-blush/40 ring-1 ring-rose/20">
          <Media src={p.image?.url} alt={p.image?.alt || p.name} sizes="(min-width:1024px) 22vw, (min-width:640px) 33vw, 50vw" priority={priority} className="transition-transform duration-500 group-hover:scale-[1.04]" />
          {second && <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"><Media src={second.url} alt="" sizes="(min-width:1024px) 22vw, 33vw" /></div>}
          {badge && <span className={`absolute left-1/2 top-[18%] -translate-x-1/2 rounded-full px-3 py-1 text-xs font-medium ${p.inStock ? "bg-cocoa text-cream" : "bg-white text-ink/70"}`}>{badge}</span>}
        </div>
        <div className="px-1 pt-3">
          {p.category && <p className="text-xs text-rose-dark">{p.category.name}</p>}
          <h3 className="mt-0.5 line-clamp-2 font-display text-lg font-semibold leading-snug text-cocoa">{p.name}</h3>
          <div className="mt-1"><Price paisa={p.pricePaisa} mrp={p.mrpPaisa} /></div>
        </div>
      </Link>
      <WishButton product={p} className="absolute right-2 top-[12%]" />
    </article>
  );
}

export function ProductGridSkeleton({ n = 8 }: { n?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4" aria-hidden>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i}><div className="skeleton aspect-[3/4] rounded-t-[999px] rounded-b-2xl" /><div className="skeleton mt-3 h-4 w-3/4 rounded" /><div className="skeleton mt-2 h-4 w-1/3 rounded" /></div>
      ))}
    </div>
  );
}
