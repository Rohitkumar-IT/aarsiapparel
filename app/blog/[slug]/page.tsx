import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import sanitizeHtml from "sanitize-html";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { blogJsonLd } from "@/lib/seo";
import Media from "@/components/Media";

export const revalidate = 120;
const getPost = cache((slug: string) => api.blog(slug));

/** Admin-authored content is sanitised server-side before it reaches the page. */
function renderContent(raw: string): string {
  const looksHtml = /<\/?(p|h[1-6]|ul|ol|li|div|br|img|a|strong|em|blockquote)\b/i.test(raw);
  const html = looksHtml ? raw : raw.split(/\n{2,}/).map((para) => `<p>${para.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string)).replace(/\n/g, "<br/>")}</p>`).join("");
  return sanitizeHtml(html, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, "img", "h1", "h2", "h3", "figure", "figcaption"],
    allowedAttributes: { a: ["href", "name", "target", "rel"], img: ["src", "alt", "width", "height", "loading"] },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: { a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }), img: sanitizeHtml.simpleTransform("img", { loading: "lazy" }) },
  });
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const b = await getPost(params.slug).catch(() => null);
  if (!b) return { title: "Article not found" };
  return { title: b.title, description: b.excerpt.slice(0, 160), alternates: { canonical: `/blog/${b.slug}` }, openGraph: { type: "article", title: b.title, description: b.excerpt, images: b.imageUrl ? [{ url: b.imageUrl }] : undefined } };
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const b = await getPost(params.slug);
  if (!b) notFound();
  return (
    <article className="container-x max-w-3xl py-12 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd(b)) }} />
      <Link href="/blog" className="text-sm text-rose-dark hover:underline">← Journal</Link>
      <h1 className="h-display mt-4 text-4xl leading-tight sm:text-6xl">{b.title}</h1>
      <p className="mt-4 text-sm text-ink/60">{[b.author, formatDate(b.publishedAt)].filter(Boolean).join(" · ")}</p>
      {b.imageUrl && <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-3xl bg-blush/40"><Media src={b.imageUrl} alt={b.title} sizes="(min-width:768px) 768px, 100vw" priority /></div>}
      <div className="prose-aarsi mt-8" dangerouslySetInnerHTML={{ __html: renderContent(b.content) }} />
    </article>
  );
}
