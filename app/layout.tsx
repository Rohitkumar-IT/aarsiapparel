import "./globals.css";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import Toast from "@/components/Toast";
import { ShopProvider } from "@/lib/store";
import { api } from "@/lib/api";
import { GA_ID, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/env";
import { jsonLd, organizationJsonLd, websiteJsonLd } from "@/lib/seo";

const TITLE = `${SITE_NAME} — Fashion, Apparel & Lifestyle`;
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: "en_IN", url: SITE_URL, siteName: SITE_NAME, title: TITLE, description: SITE_DESCRIPTION, images: [{ url: "/brand/og.jpg", width: 1200, height: 630, alt: SITE_NAME }] },
  twitter: { card: "summary_large_image", title: SITE_NAME, description: SITE_DESCRIPTION, images: ["/brand/og.jpg"] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  manifest: "/site.webmanifest",
  other: { "geo.region": "IN-UP", "geo.placename": "Greater Noida West" },
};
export const viewport: Viewport = { themeColor: "#3A1708", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories, collections] = await Promise.all([api.store(), api.categories(), api.collections()]);
  return (
    <html lang="en-IN">
      <body className="font-body antialiased">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(organizationJsonLd()) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(websiteJsonLd()) }} />
        <ShopProvider settings={settings}>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-full focus:bg-cocoa focus:px-4 focus:py-2 focus:text-cream">Skip to content</a>
          <Header categories={categories} collections={collections} />
          <main id="main" className="min-h-[60vh]">{children}</main>
          <Footer categories={categories} />
          <CartDrawer />
          <Toast />
        </ShopProvider>
        {GA_ID && (<>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}');`}</Script>
        </>)}
      </body>
    </html>
  );
}
