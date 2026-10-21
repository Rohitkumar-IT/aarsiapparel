import { Suspense } from "react";
import Link from "@/components/L";
import LanguageSwitcher from "./LanguageSwitcher";
import { Globe, Instagram, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { INSTAGRAM_URL, STORE } from "@/lib/env";
import { whatsappChatUrl } from "@/lib/orders";
import Logo from "./Logo";
import type { Category } from "@/lib/types";
import { getT } from "@/lib/i18n-server";

/** Mirrors the visiting card: cocoa field, rose-gold round icons, address / phone / mail / web rows. */
export default function Footer({ categories }: { categories: Category[] }) {
  const t = getT();
  const rows = [
    { Icon: MapPin, text: STORE.address, href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STORE.address)}` },
    { Icon: Phone, text: STORE.phone, href: `tel:${STORE.phone.replace(/\s/g, "")}` },
    { Icon: Mail, text: STORE.email, href: `mailto:${STORE.email}` },
    { Icon: Globe, text: STORE.web, href: `https://${STORE.web}` },
  ];
  const col = "font-display text-xl font-semibold text-white";
  return (
    <footer className="bg-cocoa text-blush/90">
      <div className="container-x grid gap-12 py-14 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Logo tone="light" size={60} href={null} />
          <div className="mt-5"><Suspense fallback={null}><LanguageSwitcher className="!border-blush/30 !bg-transparent [&_button]:!text-blush/80 [&_button[aria-pressed=true]]:!bg-blush [&_button[aria-pressed=true]]:!text-cocoa" /></Suspense></div>
          <p className="mt-5 max-w-xs text-sm leading-6 text-blush/75">{t("Style, quality and elegance — fashion, apparel and lifestyle from Greater Noida West.")}</p>
          <div className="mt-5 flex gap-3">
            <a href={whatsappChatUrl()} target="_blank" rel="noopener noreferrer" aria-label={t("WhatsApp")} className="grid h-10 w-10 place-items-center rounded-full border border-blush/30 hover:bg-blush/10"><MessageCircle size={18} /></a>
            {INSTAGRAM_URL && <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label={t("Instagram")} className="grid h-10 w-10 place-items-center rounded-full border border-blush/30 hover:bg-blush/10"><Instagram size={18} /></a>}
          </div>
        </div>
        <nav aria-label={t("Shop")}><h2 className={col}>{t("Shop")}</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link href="/shop" className="hover:text-white">{t("All collections")}</Link></li>
            <li><Link href="/shop?sort=new" className="hover:text-white">{t("New arrivals")}</Link></li>
            <li><Link href="/shop?bestSeller=true" className="hover:text-white">{t("Best sellers")}</Link></li>
            <li><Link href="/shop?sale=true" className="hover:text-white">{t("Sale")}</Link></li>
            {categories.filter((c) => !c.parentId).slice(0, 4).map((c) => <li key={c.id}><Link href={`/shop?category=${c.slug}`} className="hover:text-white">{c.name}</Link></li>)}
          </ul></nav>
        <nav aria-label={t("Customer care")}><h2 className={col}>{t("Customer care")}</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link href="/contact" className="hover:text-white">{t("Contact us")}</Link></li>
            <li><Link href="/track-order" className="hover:text-white">{t("Track order")}</Link></li>
            <li><Link href="/account" className="hover:text-white">{t("My account")}</Link></li>
            <li><Link href="/wishlist" className="hover:text-white">{t("Wishlist")}</Link></li>
            <li><Link href="/blog" className="hover:text-white">{t("Journal")}</Link></li>
          </ul></nav>
        <div><h2 className={col}>{t("Contact us")}</h2>
          <ul className="mt-4 space-y-4">
            {rows.map(({ Icon, text, href }) => (
              <li key={text}><a href={href} className="group flex items-start gap-3" {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blush to-rose-light text-cocoa"><Icon size={16} /></span>
                <span className="pt-1.5 text-sm leading-snug group-hover:text-white">{text}</span></a></li>
            ))}
          </ul></div>
      </div>
      <div className="border-t border-blush/15">
        <div className="container-x space-y-2 py-5 text-center text-xs text-blush/60">
          <p>© {new Date().getFullYear()} Aarsi Apparel. {t("All rights reserved.")}</p>
          <p className="mx-auto max-w-2xl">{t("Beware of spurious calls or offers asking for personal, payment or banking details. Aarsi Apparel never asks for these over the phone.")}</p>
        </div>
      </div>
    </footer>
  );
}
