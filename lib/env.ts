/** Single source of truth for environment config. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export const API_BASE_URL = (process.env.API_BASE_URL || "https://admin.aarsiapparel.com").replace(/\/$/, "");
export const REVALIDATE = Number(process.env.CATALOG_REVALIDATE_SECONDS || 60);

export const SITE_NAME = "Aarsi Apparel";
export const TAGLINE = "Fashion · Apparel · Lifestyle";
export const SITE_DESCRIPTION =
  "Aarsi Apparel — fashion, apparel and lifestyle from Greater Noida West. Style, quality and elegance, delivered across India.";

export const STORE = {
  phone: process.env.NEXT_PUBLIC_STORE_PHONE || "+91 8745889898",
  email: process.env.NEXT_PUBLIC_STORE_EMAIL || "info@aarsiapparel.com",
  address:
    process.env.NEXT_PUBLIC_STORE_ADDRESS ||
    "G-47 C, Galaxy Blue Sapphire Plaza, Plot - C 03, Sector-4, Greater Noida West",
  whatsapp: (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "918745889898").replace(/\D/g, ""),
  web: "www.aarsiapparel.com",
};
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";

/** "on" once the backend exposes the order-flow APIs in API_SPEC.md. "off" = WhatsApp order hand-off. */
export const COMMERCE_API = process.env.NEXT_PUBLIC_COMMERCE_API === "on";
export const RETURN_DAYS = Number(process.env.NEXT_PUBLIC_RETURN_DAYS || 0);
export const INSTAGRAM_URL = process.env.NEXT_PUBLIC_INSTAGRAM_URL || "";
export const ANNOUNCEMENTS = (process.env.NEXT_PUBLIC_ANNOUNCEMENTS || "").split("|").map((s) => s.trim()).filter(Boolean);
