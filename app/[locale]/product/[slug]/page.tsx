import type { Metadata } from "next";
import Link from "@/components/L";
import { notFound } from "next/navigation";
import { cache } from "react";
import { api } from "@/lib/api";
import { productFaq } from "@/lib/config";
import { breadcrumbJsonLd, faqJsonLd, productJsonLd } from "@/lib/seo";
import ProductDetailClient from "./ProductDetailClient";
import ProductCard from "@/components/ProductCard";
import Faq from "@/components/Faq";
import type { Locale } from "@/lib/i18n";
import { getT, setLocale } from "@/lib/i18n-server";
import { localePath } from "@/lib/i18n";

export const revalidate = 60;
const getProduct = cache((slug: string) => api.product(slug));

export async function generateMetadata({ params }: { params: { slug: string; locale: Locale } }): Promise<Metadata> {
  setLocale(params.locale); const t = getT();
  const p = await getProduct(params.slug).catch(() => null);
  if (!p) return { title: t("Product not found") };
  const desc = (p.summary || p.description || t("Buy {name} online from Aarsi Apparel.", { name: p.name })).replace(/\s+/g, " ").slice(0, 160);
  const title = `${p.name}${p.category ? ` – ${p.category.name}` : ""} | ${t("Buy online")}`;
  return {
    title, description: desc, alternates: { canonical: localePath(params.locale, `/product/${p.slug}`), languages: { en: `/product/${p.slug}`, hi: `/hi/product/${p.slug}` } }, keywords: [p.name, p.category?.name ?? "", ...p.colors.map((c) => c.name), "Aarsi Apparel"].filter(Boolean),
    openGraph: { title: p.name, description: desc, type: "website", images: p.image ? [{ url: p.image.url, alt: p.name }] : undefined },
    other: { "product:price:amount": ((p.payablePaisa ?? p.pricePaisa) / 100).toFixed(2), "product:price:currency": "INR", "product:availability": p.inStock ? "in stock" : "out of stock" },
  };
}

export default async function ProductPage({ params }: { params: { slug: string; locale: Locale } }) {
  setLocale(params.locale);
  const t = getT();
  const [p, settings] = await Promise.all([getProduct(params.slug), api.store()]);
  if (!p) notFound();
  const related = p.category ? (await api.products({ category: p.category.slug, pageSize: 5 })).items.filter((r) => r.id !== p.id).slice(0, 4) : [];
  const faq = productFaq(p, settings, t);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(p)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faq)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd([{ name: "Home", path: "/" }, ...(p.category ? [{ name: p.category.name, path: `/shop?category=${p.category.slug}` }] : []), { name: p.name, path: `/product/${p.slug}` }])) }} />
      <div className="container-x pt-6 text-sm text-ink/60">
        <nav aria-label={t("Breadcrumb")} className="flex flex-wrap items-center gap-1.5">
          <Link href="/" className="hover:text-rose-dark">{t("Home")}</Link><span aria-hidden>/</span>
          {p.category && <><Link href={`/shop?category=${p.category.slug}`} className="hover:text-rose-dark">{p.category.name}</Link><span aria-hidden>/</span></>}
          <span className="text-ink/90" aria-current="page">{p.name}</span>
        </nav>
      </div>
      <ProductDetailClient product={p} />
      <Faq items={faq} title={t("Questions about {name}", { name: p.name })} />
      {related.length > 0 && (
        <section className="container-x pb-14">
          <h2 className="h-display mb-8 text-3xl sm:text-4xl">{t("You may also like")}</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-9 lg:grid-cols-4">{related.map((r) => <ProductCard key={r.id} product={r} />)}</div>
        </section>
      )}
    </>
  );
}
