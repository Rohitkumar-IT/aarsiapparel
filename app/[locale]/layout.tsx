import "./../globals.css";
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import Header from "@/components/Header";
import AnnouncementBar from "@/components/AnnouncementBar";
import TrustBar from "@/components/TrustBar";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import Toast from "@/components/Toast";
import BackToTop from "@/components/BackToTop";
import { I18nProvider } from "@/components/I18nProvider";
import { ShopProvider } from "@/lib/store";
import { api } from "@/lib/api";
import { buildAnnouncements } from "@/lib/config";
import { GA_ID, SITE_NAME, SITE_URL } from "@/lib/env";
import { LOCALES, LOCALE_LABEL, isLocale, localePath, type Locale } from "@/lib/i18n";
import { getMessages, getT, setLocale } from "@/lib/i18n-server";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";

export const dynamicParams = false;
export const generateStaticParams = () => LOCALES.map((locale) => ({ locale }));

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  if (!isLocale(params.locale)) return {};
  setLocale(params.locale); const t = getT();
  const title = t("Aarsi Apparel — Fashion, Apparel & Lifestyle");
  const description = t("Aarsi Apparel — fashion, apparel and lifestyle from Greater Noida West. Style, quality and elegance, delivered across India.");
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s | ${SITE_NAME}` }, description, applicationName: SITE_NAME,
    alternates: { canonical: localePath(params.locale, "/"), languages: { en: "/", hi: "/hi", "x-default": "/" } },
    openGraph: { type: "website", locale: LOCALE_LABEL[params.locale].html.replace("-", "_"), alternateLocale: ["en_IN", "hi_IN"], url: SITE_URL, siteName: SITE_NAME, title, description, images: [{ url: "/brand/og.jpg", width: 1200, height: 630, alt: SITE_NAME }] },
    twitter: { card: "summary_large_image", title: SITE_NAME, description, images: ["/brand/og.jpg"] },
    robots: { index: true, follow: true }, manifest: "/site.webmanifest", other: { "geo.region": "IN-UP", "geo.placename": "Greater Noida West" },
  };
}
export const viewport: Viewport = { themeColor: "#331609", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function RootLayout({ children, params }: { children: React.ReactNode; params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  setLocale(locale); const t = getT();
  const [settings, categories, collections] = await Promise.all([api.store(), api.categories(), api.collections()]);
  return (
    <html lang={LOCALE_LABEL[locale].html} className={locale === "hi" ? "lang-hi" : ""}>
      <body className="font-body antialiased">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }} />
        <I18nProvider locale={locale} messages={getMessages(locale)}>
          <ShopProvider settings={settings}>
            <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-full focus:bg-cocoa focus:px-4 focus:py-2 focus:text-cream">{t("Skip to content")}</a>
            <AnnouncementBar messages={buildAnnouncements(settings, t)} />
            <TrustBar settings={settings} />
            <Header categories={categories} collections={collections} />
            <main id="main" className="min-h-[60vh]">{children}</main>
            <Newsletter />
            <Footer categories={categories} />
            <CartDrawer />
            <Toast />
            <BackToTop />
          </ShopProvider>
        </I18nProvider>
        {GA_ID && (<>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}');`}</Script>
        </>)}
      </body>
    </html>
  );
}
