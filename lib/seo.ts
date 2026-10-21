import { SITE_NAME, SITE_URL, STORE } from "./env";
import type { BlogPost, Product } from "./types";

const SCHEMA = "https://schema.org";

export const abs = (path: string): string => {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
};

/** Safely serialize JSON-LD for an HTML script element. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Organization and physical store information. */
export const organizationJsonLd = () => ({
  "@context": SCHEMA,
  "@type": ["Organization", "ClothingStore"],
  name: SITE_NAME,
  url: SITE_URL,
  logo: abs("/icon-512.png"),
  image: abs("/brand/og.jpg"),
  ...(STORE.phone ? { telephone: STORE.phone } : {}),
  ...(STORE.email ? { email: STORE.email } : {}),
  priceRange: "₹₹",
  address: {
    "@type": "PostalAddress",
    streetAddress: STORE.address,
    addressLocality: "Greater Noida West",
    addressRegion: "Uttar Pradesh",
    addressCountry: "IN",
  },
});

/** Website identity and search functionality. */
export const websiteJsonLd = () => ({
  "@context": SCHEMA,
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL.replace(/\/+$/, "")}/shop?search={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
});

/** Product details, pricing, availability, and genuine ratings. */
export const productJsonLd = (p: Product) => {
  const images = p.media
    .filter((media) => media.type === "image")
    .map((media) => media.url);

  const pricePaisa = p.payablePaisa ?? p.pricePaisa;

  return {
    "@context": SCHEMA,
    "@type": "Product",
    name: p.name,
    description: (p.summary || p.description || "").slice(0, 5000),
    ...(images.length ? { image: images } : {}),
    sku: p.variants[0]?.sku || p.id,
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    ...(p.category?.name ? { category: p.category.name } : {}),
    offers: {
      "@type": "Offer",
      url: abs(`/product/${p.slug}`),
      priceCurrency: "INR",
      price: (pricePaisa / 100).toFixed(2),
      availability: p.inStock ? `${SCHEMA}/InStock` : `${SCHEMA}/OutOfStock`,
      itemCondition: `${SCHEMA}/NewCondition`,
    },
    ...(p.reviewCount > 0 && p.rating > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: p.rating.toFixed(1),
            reviewCount: p.reviewCount,
          },
        }
      : {}),
  };
};

/** Breadcrumb navigation for search engines. */
export const breadcrumbJsonLd = (items: { name: string; path: string }[]) => ({
  "@context": SCHEMA,
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: abs(item.path),
  })),
});

/** Blog post structured data. */
export const blogJsonLd = (b: BlogPost) => ({
  "@context": SCHEMA,
  "@type": "BlogPosting",
  headline: b.title,
  description: b.excerpt,
  ...(b.imageUrl ? { image: abs(b.imageUrl) } : {}),
  datePublished: b.publishedAt,
  author: {
    "@type": "Person",
    name: b.author || SITE_NAME,
  },
  publisher: {
    "@type": "Organization",
    name: SITE_NAME,
    logo: {
      "@type": "ImageObject",
      url: abs("/icon-512.png"),
    },
  },
  mainEntityOfPage: abs(`/blog/${b.slug}`),
});

/** FAQ structured data. */
export const faqJsonLd = (items: { q: string; a: string }[]) => ({
  "@context": SCHEMA,
  "@type": "FAQPage",
  mainEntity: items.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
});
