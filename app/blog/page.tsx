import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import Media from "@/components/Media";
import Pagination from "@/components/Pagination";

export const revalidate = 120;
export const metadata: Metadata = { title: "Journal", description: "Style notes, care guides and stories from Aarsi Apparel.", alternates: { canonical: "/blog" } };

export default async function Blog({ searchParams }: { searchParams: { page?: string } }) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const res = await api.blogs(page, 12);
  return (
    <div className="container-x py-12 sm:py-16">
      <h1 className="h-display text-4xl sm:text-6xl">Journal</h1>
      <p className="mt-3 max-w-lg text-ink/70">Style notes, care guides and stories from our studio.</p>
      {res.items.length === 0 ? <p className="mt-16 text-center text-ink/60">New stories are on the way.</p> : (
        <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {res.items.map((b, i) => (
            <li key={b.id}>
              <Link href={`/blog/${b.slug}`} className="group block">
                <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-blush/40"><Media src={b.imageUrl} alt="" sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" priority={i < 3} className="transition-transform duration-500 group-hover:scale-105" /></div>
                <p className="mt-4 text-xs text-rose-dark">{formatDate(b.publishedAt)}</p>
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
