import type { Metadata } from "next";
import Link from "@/components/L";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import Media from "@/components/Media";
import Pagination from "@/components/Pagination";
import type { Locale } from "@/lib/i18n";
import { getT, setLocale } from "@/lib/i18n-server";
import { localePath } from "@/lib/i18n";

export const revalidate = 120;
export async function generateMetadata({ params }: { params: { locale: Locale } }): Promise<Metadata> {
  setLocale(params.locale); const t = getT();
  return { title: t("Journal"), description: t("Style notes, care guides and stories from our studio."), alternates: { canonical: localePath(params.locale, "/blog"), languages: { en: "/blog", hi: "/hi/blog" } } };
}

export default async function Blog({ params, searchParams }: { params: { locale: Locale }; searchParams: { page?: string } }) {
  setLocale(params.locale);
  const t = getT();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const res = await api.blogs(page, 12);
  return (
    <div className="container-x py-12 sm:py-16">
      <h1 className="h-display text-4xl sm:text-6xl">{t("Journal")}</h1>
      <p className="mt-3 max-w-lg text-ink/70">{t("Style notes, care guides and stories from our studio.")}</p>
      {res.items.length === 0 ? <p className="mt-16 text-center text-ink/60">{t("New stories are on the way.")}</p> : (
        <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {res.items.map((b, i) => (
            <li key={b.id}>
              <Link href={`/blog/${b.slug}`} className="group block">
                <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-blush/40"><Media src={b.imageUrl} alt="" sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" priority={i < 3} className="transition-transform duration-500 group-hover:scale-105" /></div>
                <p className="mt-4 text-xs text-rose-dark">{formatDate(b.publishedAt, t.locale)}</p>
                <h2 className="mt-1 font-display text-2xl font-semibold leading-snug text-cocoa">{b.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-ink/70">{b.excerpt}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Pagination page={res.page} totalPages={res.totalPages} basePath="/blog" params={{}} />
    </div>
  );
}
