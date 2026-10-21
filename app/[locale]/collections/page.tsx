import type { Metadata } from "next";
import Link from "@/components/L";
import { api } from "@/lib/api";
import Media from "@/components/Media";
import type { Locale } from "@/lib/i18n";
import { getT, setLocale } from "@/lib/i18n-server";
import { localePath } from "@/lib/i18n";

export const revalidate = 300;
export async function generateMetadata({ params }: { params: { locale: Locale } }): Promise<Metadata> {
  setLocale(params.locale); const t = getT();
  return { title: t("Collections"), description: t("Explore Aarsi Apparel collections."), alternates: { canonical: localePath(params.locale, "/collections"), languages: { en: "/collections", hi: "/hi/collections" } } };
}

export default async function Collections({ params }: { params: { locale: Locale } }) {
  setLocale(params.locale);
  const t = getT();
  const cols = await api.collections();
  return (
    <div className="container-x py-12 sm:py-16">
      <h1 className="h-display text-4xl sm:text-6xl">{t("Collections")}</h1>
      {cols.length === 0 ? <p className="mt-12 text-center text-ink/60">{t("New collections are on the way.")}</p> : (
        <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cols.map((c, i) => (
            <li key={c.id}><Link href={`/shop?collection=${c.slug}`} className="group relative block aspect-[4/5] overflow-hidden rounded-3xl bg-cocoa">
              <Media src={c.imageUrl} alt="" sizes="(min-width:1024px) 33vw, (min-width:768px) 50vw, 100vw" priority={i < 3} className="opacity-85 transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-cocoa/90 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-cream"><h2 className="font-display text-3xl font-semibold uppercase tracking-wide">{c.name}</h2>{c.description && <p className="mt-1 line-clamp-2 text-sm text-blush">{c.description}</p>}</div>
            </Link></li>
          ))}
        </ul>
      )}
    </div>
  );
}
