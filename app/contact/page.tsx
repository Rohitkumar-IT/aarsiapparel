import type { Metadata } from "next";
import Image from "next/image";
import { Globe, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { STORE } from "@/lib/env";
import { whatsappChatUrl } from "@/lib/orders";

export const metadata: Metadata = { title: "Visit us", description: "Find Aarsi Apparel in Greater Noida West — address, phone, email and WhatsApp.", alternates: { canonical: "/contact" } };

export default function Contact() {
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STORE.address)}`;
  const rows = [
    { Icon: MapPin, label: "Address", text: STORE.address, href: maps },
    { Icon: Phone, label: "Phone", text: STORE.phone, href: `tel:${STORE.phone.replace(/\s/g, "")}` },
    { Icon: Mail, label: "Email", text: STORE.email, href: `mailto:${STORE.email}` },
    { Icon: Globe, label: "Website", text: STORE.web, href: `https://${STORE.web}` },
  ];
  return (
    <div className="container-x grid gap-10 py-12 sm:py-16 lg:grid-cols-2 lg:items-center">
      <div>
        <h1 className="h-display text-4xl sm:text-6xl">Visit Aarsi Apparel</h1>
        <p className="mt-4 max-w-md text-ink/75">Come see the pieces in person, or message us and we’ll help you choose.</p>
        <ul className="mt-8 space-y-5">
          {rows.map(({ Icon, label, text, href }) => (
            <li key={label}><a href={href} className="group flex items-start gap-4" {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blush to-blush-deep text-cocoa"><Icon size={20} /></span>
              <span><span className="block text-xs text-ink/55">{label}</span><span className="text-lg text-cocoa group-hover:text-rose-dark">{text}</span></span>
            </a></li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={maps} target="_blank" rel="noopener noreferrer" className="btn-primary">Get directions</a>
          <a href={whatsappChatUrl()} target="_blank" rel="noopener noreferrer" className="btn-ghost"><MessageCircle size={18} />WhatsApp us</a>
        </div>
      </div>
      <div className="relative aspect-[3/2] overflow-hidden rounded-3xl shadow-soft"><Image src="/brand/card.webp" alt="Aarsi Apparel visiting card" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" /></div>
    </div>
  );
}
