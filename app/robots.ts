import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/env";
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/cart", "/checkout", "/account", "/login", "/wishlist", "/order-confirmation/", "/track-order", "/hi/cart", "/hi/checkout", "/hi/account", "/hi/login", "/hi/wishlist", "/hi/order-confirmation/", "/hi/track-order", "/api/"] }], sitemap: `${SITE_URL}/sitemap.xml`, host: SITE_URL };
}
