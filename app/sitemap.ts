import type { MetadataRoute } from "next";
import { api } from "@/lib/api";
import { SITE_URL } from "@/lib/env";

export const revalidate = 3600;
type Freq = "daily" | "weekly" | "yearly";
/** Each page is listed in English and Hindi, cross-linked with hreflang alternates. */
const entry = (path: string, changeFrequency: Freq, priority: number, lastModified: Date): MetadataRoute.Sitemap => {
  const en = `${SITE_URL}${path === "/" ? "" : path}`, hi = `${SITE_URL}/hi${path === "/" ? "" : path}`;
  const alternates = { languages: { en, hi } };
  return [{ url: en, lastModified, changeFrequency, priority, alternates }, { url: hi, lastModified, changeFrequency, priority: priority * 0.9, alternates }];
};
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [first, cats, blogs] = await Promise.all([api.products({ pageSize: 50 }), api.categories(), api.blogs(1, 50)]);
  const rest = await Promise.all(Array.from({ length: Math.min(first.totalPages, 20) - 1 }, (_, i) => api.products({ pageSize: 50, page: i + 2 })));
  const products = [first, ...rest].flatMap((r) => r.items);
  const now = new Date();
  return [
    ...entry("/", "daily", 1, now), ...entry("/shop", "daily", 0.9, now), ...entry("/collections", "weekly", 0.6, now), ...entry("/blog", "weekly", 0.6, now), ...entry("/contact", "yearly", 0.5, now),
    ...cats.flatMap((c) => entry(`/shop?category=${c.slug}`, "weekly", 0.7, now)),
    ...products.flatMap((p) => entry(`/product/${p.slug}`, "weekly", 0.8, now)),
    ...blogs.items.flatMap((b) => entry(`/blog/${b.slug}`, "weekly", 0.5, b.publishedAt ? new Date(b.publishedAt) : now)),
  ];
}
