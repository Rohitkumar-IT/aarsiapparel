import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { api } from "@/lib/api";
import { STORE } from "@/lib/env";
import { formatDate } from "@/lib/format";
import ProductCard from "@/components/ProductCard";
import Section from "@/components/Section";
import Media from "@/components/Media";
import TrustStrip from "@/components/TrustStrip";

export const revalidate = 60;

const OCCASIONS = ["Wedding", "Festive", "Party", "Casual", "Office"];

export default async function Home() {
  const [settings, cats, cols, fresh, featured, best, blogs] = await Promise.all([
    api.store(), api.categories(), api.collections(),
    api.products({ pageSize: 8, newArrival: true }), api.products({ pageSize: 4, featured: true }),
    api.products({ pageSize: 4, bestSeller: true }), api.blogs(1, 3),
  ]);
  const latest = fresh.items.length ? fresh : await api.products({ pageSize: 8 });
  const topCats = cats.filter((c) => !c.parentId).slice(0, 10);
  const hero = cols.find((c) => c.imageUrl);

  return (
    <>
      {/* HERO — full-bleed collection image when the backend has one, otherwise the brand monogram on blush */}
      <section className="relative isolate overflow-hidden bg-gradient-to-b from-blush/50 to-cream">
        <div className="container-x grid items-center gap-10 py-12 sm:py-16 lg:min-h-[560px] lg:grid-cols-[1.05fr_1fr] lg:py-20">
          <div className="order-2 lg:order-1">
            <p className="text-xs font-medium uppercase tracking-[.32em] text-rose-dark">Aarsi Apparel</p>
            <h1 className="h-display mt-4 text-[2.7rem] leading-[1.03] sm:text-6xl lg:text-7xl">Elegance that <span className="italic text-rose-dark">celebrates</span> you.</h1>
            <p className="mt-6 max-w-md text-lg leading-8 text-ink/75">Fashion, apparel and lifestyle from Greater Noida West — made for every special moment, delivered across India.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop?newArrival=true" className="btn-primary px-8">Shop new arrivals</Link>
              <Link href="/shop" className="btn-ghost px-8">Browse everything</Link>
            </div>
          </div>
          <div className="order-1 mx-auto w-full max-w-[400px] lg:order-2 lg:max-w-[460px]">
            {hero ? (
              <Link href={`/shop?collection=${hero.slug}`} className="group relative block aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-3xl bg-cocoa shadow-soft ring-1 ring-rose/30">
                <Media src={hero.imageUrl} alt={hero.name} sizes="(min-width:1024px) 460px, 90vw" priority className="transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-cocoa/80 to-transparent p-6 pt-20 text-center text-cream"><p className="font-display text-2xl">{hero.name}</p><p className="mt-1 text-xs uppercase tracking-[.25em] text-blush">Shop the collection</p></div>
              </Link>
            ) : (
              <div className="ring-frame mx-3 my-5 aspect-square bg-cream shadow-soft">
                <Image src="/brand/logo.webp" alt="Aarsi Apparel monogram" width={720} height={720} priority sizes="(min-width:1024px) 460px, 400px" className="h-full w-full rounded-full object-cover" />
              </div>
            )}
          </div>
        </div>
      </section>
      <TrustStrip settings={settings} />

      {topCats.length > 0 && (
        <Section title="Shop by category" href="/shop">
          <ul className="flex snap-x gap-5 overflow-x-auto pb-3 sm:grid sm:grid-cols-4 sm:overflow-visible lg:grid-cols-5 xl:grid-cols-10 [scrollbar-width:none]">
            {topCats.map((c, i) => (
              <li key={c.id} className="w-28 shrink-0 snap-start sm:w-auto">
                <Link href={`/shop?category=${c.slug}`} className="group block text-center">
                  <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-full bg-blush/40 ring-1 ring-rose/30 ring-offset-4 ring-offset-cream">
                    <Media src={c.imageUrl} alt="" sizes="(min-width:1280px) 9vw, (min-width:640px) 20vw, 112px" priority={i < 4} className="transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <p className="mt-4 text-sm font-medium leading-tight text-cocoa group-hover:text-rose-dark">{c.name}</p>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {featured.items.length > 0 && (
        <Section title="New drop" href="/shop?featured=true" className="!pt-0">
          <div className="grid grid-cols-2 gap-x-4 gap-y-9 lg:grid-cols-4">{featured.items.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </Section>
      )}

      {latest.items.length > 0 && (
        <Section title="New arrivals" href="/shop?sort=newest" className="!pt-0">
          <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 lg:grid-cols-4">{latest.items.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </Section>
      )}

      {cols.length > 0 && (
        <Section title="Collections" className="!pt-0">
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {cols.slice(0, 3).map((c) => (
              <li key={c.id}>
                <Link href={`/shop?collection=${c.slug}`} className="group relative block aspect-[4/3] overflow-hidden rounded-3xl bg-cocoa">
                  <Media src={c.imageUrl} alt="" sizes="(min-width:1024px) 33vw, 100vw" className="opacity-80 transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-cocoa/85 via-cocoa/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6 text-cream"><h3 className="font-display text-3xl font-semibold">{c.name}</h3>{c.description && <p className="mt-1 line-clamp-2 text-sm text-blush">{c.description}</p>}<span className="mt-3 inline-block text-xs font-medium uppercase tracking-[.2em] text-blush underline-offset-4 group-hover:underline">Shop now</span></div>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <section className="bg-blush/30 py-12 sm:py-14">
        <div className="container-x text-center">
          <p className="text-xs uppercase tracking-[.3em] text-rose-dark">For every moment</p>
          <h2 className="h-display mt-2 text-3xl sm:text-4xl">Shop by occasion</h2>
          <ul className="mt-8 flex flex-wrap justify-center gap-3">
            {OCCASIONS.map((o) => <li key={o}><Link href={`/shop?search=${encodeURIComponent(o.toLowerCase())}`} className="inline-flex rounded-full border border-rose/40 bg-cream px-6 py-3 text-sm text-cocoa transition-colors hover:border-cocoa hover:bg-cocoa hover:text-cream">{o}</Link></li>)}
          </ul>
        </div>
      </section>

      {best.items.length > 0 && (
        <Section title="Best sellers" href="/shop?bestSeller=true">
          <div className="grid grid-cols-2 gap-x-4 gap-y-9 lg:grid-cols-4">{best.items.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </Section>
      )}

      {blogs.items.length > 0 && (
        <Section title="From the journal" href="/blog" className="!pt-0">
          <ul className="grid gap-6 md:grid-cols-3">
            {blogs.items.map((b) => (
              <li key={b.id}>
                <Link href={`/blog/${b.slug}`} className="group block">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-blush/40"><Media src={b.imageUrl} alt="" sizes="(min-width:768px) 33vw, 100vw" className="transition-transform duration-500 group-hover:scale-105" /></div>
                  <p className="mt-4 text-xs text-rose-dark">{formatDate(b.publishedAt)}</p>
                  <h3 className="mt-1 font-display text-2xl font-semibold leading-snug text-cocoa">{b.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-ink/70">{b.excerpt}</p>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <section className="container-x pb-6">
        <div className="grid items-center gap-8 overflow-hidden rounded-3xl bg-cocoa p-8 text-blush sm:p-12 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 className="font-display text-4xl font-semibold text-white">Visit the store</h2>
            <p className="mt-4 flex items-start gap-3 text-sm leading-6"><MapPin size={18} className="mt-0.5 shrink-0 text-rose-light" />{STORE.address}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/contact" className="btn bg-blush text-cocoa hover:bg-white">Get directions</Link>
              <a href={`tel:${STORE.phone.replace(/\s/g, "")}`} className="btn border border-blush/40 text-blush hover:bg-blush/10">{STORE.phone}</a>
            </div>
          </div>
          <div className="relative hidden aspect-[3/2] overflow-hidden rounded-2xl lg:block"><Image src="/brand/card.webp" alt="Aarsi Apparel visiting card" fill sizes="45vw" className="object-cover" /></div>
        </div>
      </section>
    </>
  );
}
