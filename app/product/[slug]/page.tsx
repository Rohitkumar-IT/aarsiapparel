import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { api } from "@/lib/api";
import { breadcrumbJsonLd, jsonLd, productJsonLd } from "@/lib/seo";
import ProductDetailClient from "./ProductDetailClient";
import ProductCard from "@/components/ProductCard";

export const revalidate = 60;
type Params = { params: { slug: string } };

/** One fetch per request, shared by generateMetadata and the page (React cache). */
const getProduct = cache((slug: string) => api.product(slug));

/** Pre-render the newest products at build time; everything else renders on first hit, then ISR. */
export async function generateStaticParams() {
  const { items } = await api.products({ pageSize: 48 });
  return items.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const p = await getProduct(params.slug).catch(() => null);
  if (!p) return { title: "Product not found", robots: { index: false } };
  const desc = (p.summary || p.description).replace(/\s+/g, " ").trim().slice(0, 160);
  const images = p.image ? [{ url: p.image.url, alt: p.name }] : undefined;
  return {
    title: p.name, description: desc, alternates: { canonical: `/product/${p.slug}` },
    openGraph: { title: p.name, description: desc, type: "website", url: `/product/${p.slug}`, images },
    twitter: { card: "summary_large_image", title: p.name, description: desc, images: images?.map((i) => i.url) },
  };
}

export default async function ProductPage({ params }: Params) {
  const p = await getProduct(params.slug);
  if (!p) notFound();
  const pool = (await api.products({ pageSize: 9, ...(p.category?.slug ? { category: p.category.slug } : {}) })).items;
  const related = pool.filter((r) => r.id !== p.id).slice(0, 4);
  const crumbs = [{ name: "Home", path: "/" }, { name: "Shop", path: "/shop" }, ...(p.category ? [{ name: p.category.name, path: `/shop?category=${p.category.slug}` }] : []), { name: p.name, path: `/product/${p.slug}` }];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(productJsonLd(p)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbJsonLd(crumbs)) }} />
      <div className="container-x pt-5 text-sm text-ink/60">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-x-2">
            <li><Link href="/" className="hover:text-rose-dark">Home</Link></li>
            <li aria-hidden>/</li><li><Link href="/shop" className="hover:text-rose-dark">Shop</Link></li>
            {p.category && <><li aria-hidden>/</li><li><Link href={`/shop?category=${p.category.slug}`} className="hover:text-rose-dark">{p.category.name}</Link></li></>}
            <li aria-hidden>/</li><li aria-current="page" className="max-w-[40ch] truncate text-cocoa">{p.name}</li>
          </ol>
        </nav>
      </div>
      <ProductDetailClient product={p} />
      {related.length > 0 && (
        <section className="container-x pb-20 pt-4" aria-labelledby="related">
          <h2 id="related" className="h-display mb-8 text-3xl sm:text-4xl">You may also like</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-9 lg:grid-cols-4">{related.map((r) => <ProductCard key={r.id} product={r} />)}</div>
        </section>
      )}
    </>
  );
}
