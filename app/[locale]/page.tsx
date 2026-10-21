import Image from "next/image";
import Link from "@/components/L";
import { Flower2, Gem, MapPin, Shirt } from "lucide-react";
import { api } from "@/lib/api";
import { COMMERCE_API, RETURN_DAYS, STORE } from "@/lib/env";
import { HOME_FAQ, OCCASIONS } from "@/lib/config";
import { formatDate, formatPaisa } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { getT, setLocale } from "@/lib/i18n-server";
import { faqJsonLd } from "@/lib/seo";
import ProductGrid from "@/components/ProductGrid";
import Section from "@/components/Section";
import Media from "@/components/Media";
import Faq from "@/components/Faq";
import HeroSlider, { type Slide } from "@/components/HeroSlider";

export const revalidate = 60;

export default async function Home({ params }: { params: { locale: Locale } }) {
  setLocale(params.locale);
  const t = getT();
  const [settings, cats, cols, fresh, best, blogs, offers] = await Promise.all([
    api.store(), api.categories(), api.collections(),
    api.products({ pageSize: 8, newArrival: true }), api.products({ pageSize: 4, bestSeller: true }), api.blogs(1, 3),
    COMMERCE_API ? api.offers() : Promise.resolve([]),
  ]);
  const latest = fresh.items.length ? fresh : await api.products({ pageSize: 8 });
  const featured = latest.items.filter((p) => p.flags.featured).slice(0, 3);
  const topCats = cats.filter((c) => !c.parentId);
  const faq = HOME_FAQ(settings, t);
  const same = (a?: string, b?: string) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

  const slides: Slide[] = [
    { id: "brand", brand: true, kicker: t("Fashion · Apparel · Lifestyle"), title: t("Style, quality, elegance."), text: t("Pieces made to be remembered, from Greater Noida West to your doorstep across India."), cta: { label: t("Shop now"), href: "/shop" } },
    ...cols.filter((c) => c.imageUrl).slice(0, 3).map((c): Slide => ({ id: c.slug, kicker: t("Collection"), title: c.name, text: same(c.description, c.name) ? undefined : c.description, cta: { label: t("Explore"), href: `/shop?collection=${c.slug}` }, image: c.imageUrl })),
  ];
  const stats = [
    latest.total >= 10 && { n: `${latest.total}+`, l: t("Styles") },
    { n: t("India-wide"), l: t("Delivery") },
    RETURN_DAYS > 0 && { n: `${RETURN_DAYS} ${t("days")}`, l: t("Easy returns") },
    { n: t("Secure"), l: t("Payments") },
  ].filter(Boolean) as { n: string; l: string }[];
  const colGrid = cols.length === 1 ? "grid-cols-1" : cols.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3";
  const colAspect = cols.length === 1 ? "aspect-[16/9] sm:aspect-[21/8]" : "aspect-[4/3]";

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faq)) }} />
      <HeroSlider slides={slides} />

      <div className="border-y border-rose/20 bg-cream">
        <ul className="container-x grid grid-cols-3 gap-2 py-5 text-center text-cocoa sm:gap-4">
          {([[Shirt, "Style"], [Gem, "Quality"], [Flower2, "Elegance"]] as const).map(([I, l]) => <li key={l} className="flex flex-col items-center gap-1.5 sm:flex-row sm:justify-center sm:gap-3"><I size={26} strokeWidth={1.3} className="text-rose" /><span className="font-display text-lg sm:text-xl">{t(l)}</span></li>)}
        </ul>
      </div>

      {topCats.length > 6 && (
        <nav aria-label={t("Categories")} className="container-x pt-10">
          <ul className="flex snap-x gap-5 overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] sm:justify-center">
            {topCats.slice(0, 10).map((c) => (
              <li key={c.id} className="snap-start"><Link href={`/shop?category=${c.slug}`} className="group flex w-[84px] flex-col items-center gap-2 text-center">
                <span className="relative block h-[72px] w-[72px] overflow-hidden rounded-full bg-blush/50 ring-1 ring-rose/30 ring-offset-2 ring-offset-cream"><Media src={c.imageUrl} alt="" sizes="72px" className="transition-transform duration-300 group-hover:scale-110" /></span>
                <span className="text-xs font-medium leading-tight text-cocoa group-hover:text-rose-dark">{c.name}</span></Link></li>
            ))}
          </ul>
        </nav>
      )}

      {featured.length > 0 && (
        <Section title={t("New drop")} href="/shop?sort=new"><ProductGrid items={featured} featured priorityCount={2} /></Section>
      )}

      {offers.length > 0 && (
        <section className="container-x" aria-label={t("Offers")}>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {offers.slice(0, 4).map((o) => (
              <li key={o.code} className="rounded-2xl border border-dashed border-rose/50 bg-blush/30 p-4">
                <p className="font-display text-xl font-semibold tracking-wider text-cocoa">{o.code}</p>
                <p className="mt-1 text-sm text-ink/75">{o.title}{o.minOrderPaisa ? ` · ${t("above {amount}", { amount: formatPaisa(o.minOrderPaisa) })}` : ""}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {topCats.length > 0 && (
        <Section title={t("Shop by category")} href="/shop">
          <ul className="flex flex-wrap justify-center gap-4 sm:gap-6">
            {topCats.slice(0, 8).map((c, i) => (
              <li key={c.id} className="w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-1rem)] lg:w-[calc(25%-1.125rem)] lg:max-w-[300px]"><Link href={`/shop?category=${c.slug}`} className="group block text-center">
                <div className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-2xl bg-blush/40 ring-1 ring-rose/25"><Media src={c.imageUrl} alt={c.name} sizes="(min-width:1024px) 22vw, (min-width:640px) 30vw, 45vw" priority={i < 2} className="transition-transform duration-500 group-hover:scale-105" /></div>
                <p className="mt-3 font-display text-xl font-semibold text-cocoa">{c.name}</p>
                {c.productCount > 0 && <p className="text-xs text-ink/55">{c.productCount === 1 ? t("1 piece") : t("{n} pieces", { n: c.productCount })}</p>}</Link></li>
            ))}
          </ul>
        </Section>
      )}

      {latest.items.length > 0 && (
        <Section title={t("New arrivals")} href="/shop?sort=new" className="!pt-0"><ProductGrid items={latest.items.slice(0, 8)} /></Section>
      )}

      {cols.length > 0 && (
        <section className="container-x pb-6"><ul className={`grid gap-4 sm:gap-5 ${colGrid}`}>
          {cols.slice(0, 3).map((c) => (
            <li key={c.id}><Link href={`/shop?collection=${c.slug}`} className={`group relative block overflow-hidden rounded-3xl bg-cocoa ${colAspect}`}>
              <Media src={c.imageUrl} alt="" sizes={cols.length === 1 ? "100vw" : "(min-width:768px) 33vw, 100vw"} className="opacity-80 transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-cocoa/85 via-cocoa/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-cream sm:p-8"><h3 className="font-display text-2xl font-semibold uppercase tracking-wide sm:text-4xl">{c.name}</h3>{c.description && !same(c.description, c.name) && <p className="mt-1 line-clamp-2 max-w-xl text-sm text-blush">{c.description}</p>}<span className="mt-3 inline-block text-xs font-medium uppercase tracking-[.2em]">{t("Shop now →")}</span></div>
            </Link></li>
          ))}
        </ul></section>
      )}

      <Section title={t("Shop by occasion")}>
        <ul className="flex flex-wrap justify-center gap-2.5 sm:gap-3">
          {OCCASIONS.map((o) => <li key={o}><Link href={`/shop?search=${encodeURIComponent(o.toLowerCase())}`} className="inline-flex rounded-full border border-rose/40 bg-white/70 px-5 py-2.5 font-display text-base text-cocoa transition-colors hover:border-cocoa hover:bg-cocoa hover:text-cream sm:px-7 sm:py-3 sm:text-lg">{t(o)}</Link></li>)}
        </ul>
      </Section>

      {best.items.length > 0 && (
        <Section title={t("Best sellers")} href="/shop?bestSeller=true" className="!pt-0"><ProductGrid items={best.items} /></Section>
      )}

      <section className="bg-cocoa text-blush"><ul className="container-x grid grid-cols-2 gap-6 py-10 text-center md:grid-cols-4 [&>li:last-child:nth-child(odd)]:col-span-2 md:[&>li:last-child:nth-child(odd)]:col-span-1">
        {stats.map((s) => <li key={s.l}><p className="font-display text-3xl font-semibold text-white sm:text-4xl">{s.n}</p><p className="mt-1 text-sm tracking-wide">{s.l}</p></li>)}
      </ul></section>

      {blogs.items.length > 0 && (
        <Section title={t("From the journal")} href="/blog">
          <ul className="grid gap-6 md:grid-cols-3">
            {blogs.items.map((b) => (
              <li key={b.id}><Link href={`/blog/${b.slug}`} className="group block">
                <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-blush/40"><Media src={b.imageUrl} alt="" sizes="(min-width:768px) 33vw, 100vw" className="transition-transform duration-500 group-hover:scale-105" /></div>
                <p className="mt-4 text-xs text-rose-dark">{formatDate(b.publishedAt, t.locale)}</p>
                <h3 className="mt-1 font-display text-2xl font-semibold leading-snug text-cocoa">{b.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-ink/70">{b.excerpt}</p></Link></li>
            ))}
          </ul>
        </Section>
      )}

      <section className="container-x grid gap-6 py-12 lg:grid-cols-[1fr_1.6fr] lg:gap-16 lg:py-16">
        <h2 className="h-display text-3xl sm:text-4xl">{t("Aarsi Apparel — fashion, apparel and lifestyle online")}</h2>
        <div className="prose-aarsi !mt-0 max-w-2xl">
          <p className="!mt-0">{t("Aarsi Apparel brings together style, quality and elegance in pieces designed for the moments that matter, from weddings and festivals to everyday dressing. Our studio is in Greater Noida West, and every order is delivered across India.")}</p>
          <p>{t("Browse by category, collection or occasion, filter by size, colour, fabric and price, and save favourites to your wishlist. Each product page carries a size guide, fabric details and delivery information so you can choose with confidence.")}</p>
          <p>{t("Prefer to see things in person? Visit our store, or message us on WhatsApp and we will help you find the right fit.")}</p>
        </div>
      </section>

      <Faq items={faq} />

      <section className="container-x pb-12">
        <div className="grid items-center gap-8 overflow-hidden rounded-3xl bg-cocoa p-6 text-blush sm:p-12 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">{t("Visit the store")}</h2>
            <p className="mt-4 flex items-start gap-3 text-sm leading-6"><MapPin size={18} className="mt-0.5 shrink-0 text-rose-light" />{STORE.address}</p>
            <div className="mt-6 flex flex-wrap gap-3"><Link href="/contact" className="btn bg-blush text-cocoa hover:bg-white">{t("Get directions")}</Link><a href={`tel:${STORE.phone.replace(/\s/g, "")}`} className="btn border border-blush/40 text-blush hover:bg-blush/10">{STORE.phone}</a></div>
          </div>
          <div className="relative hidden aspect-[3/2] overflow-hidden rounded-2xl lg:block"><Image src="/brand/card.webp" alt={t("Aarsi Apparel visiting card")} fill sizes="45vw" className="object-cover" /></div>
        </div>
      </section>
    </>
  );
}
