"use client";
import Image from "next/image";
import Link from "@/components/L";
import { useEffect, useState } from "react";
import { useShop } from "@/lib/store";
import { formatDate, formatPaisa } from "@/lib/format";
import { api } from "@/lib/api";
import { COMMERCE_API } from "@/lib/env";
import { loadOrders, whatsappUrl } from "@/lib/orders";
import type { OrderView } from "@/lib/types";
import { useT } from "@/components/I18nProvider";

export default function Account() {
  const t = useT();
  const { customer, authLoading, logout, wishlist } = useShop();
  const [orders, setOrders] = useState<OrderView[]>([]);
  useEffect(() => { setOrders(loadOrders()); if (COMMERCE_API && customer) api.myOrders().then((r) => setOrders(r.items)).catch(() => undefined); }, [customer]);

  if (authLoading) return <div className="container-x py-16"><div className="skeleton h-48 rounded-3xl" /></div>;
  if (!customer) return (
    <div className="container-x py-24 text-center"><h1 className="h-display text-4xl">{t("Sign in to view your account")}</h1><Link href="/login?returnTo=/account" className="btn-primary mt-8">{t("Sign in")}</Link></div>
  );
  return (
    <div className="container-x max-w-4xl py-12">
      <h1 className="h-display mb-8 text-4xl sm:text-5xl">{t("My account")}</h1>
      <section className="flex flex-wrap items-center gap-5 rounded-3xl bg-white/70 p-6 ring-1 ring-rose/20">
        {customer.avatarUrl ? <Image src={customer.avatarUrl} alt="" width={64} height={64} className="rounded-full" unoptimized /> : <span className="grid h-16 w-16 place-items-center rounded-full bg-blush font-display text-2xl text-cocoa">{customer.name.charAt(0).toUpperCase()}</span>}
        <div className="min-w-0 flex-1"><p className="font-display text-2xl font-semibold text-cocoa">{customer.name}</p><p className="truncate text-sm text-ink/65">{customer.email}</p></div>
        <button onClick={logout} className="btn-ghost">{t("Sign out")}</button>
      </section>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link href="/wishlist" className="rounded-2xl bg-blush/40 p-5 hover:bg-blush/60"><p className="font-display text-xl text-cocoa">{t("Wishlist")}</p><p className="text-sm text-ink/65">{t("{n} saved", { n: wishlist.length })}</p></Link>
        <Link href="/shop" className="rounded-2xl bg-blush/40 p-5 hover:bg-blush/60"><p className="font-display text-xl text-cocoa">{t("Keep shopping")}</p><p className="text-sm text-ink/65">{t("See what’s new")}</p></Link>
      </div>
      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold text-cocoa">{t("Recent orders")}</h2>
        {orders.length === 0 ? <p className="mt-3 text-sm text-ink/65">{t("No orders yet.")}</p> : (
          <ul className="mt-4 space-y-3">{orders.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose/20 bg-white/60 p-4">
              <div><Link href={`/order-confirmation/${encodeURIComponent(o.orderNumber)}${o.trackingToken ? `?token=${encodeURIComponent(o.trackingToken)}` : ""}`} className="font-medium text-cocoa underline underline-offset-4">{o.orderNumber}</Link><p className="text-xs capitalize text-ink/60">{formatDate(o.createdAt, t.locale)} · {o.items.reduce((s, l) => s + l.quantity, 0)} items · {t(o.status.replace(/_/g, " "))}</p></div>
              <div className="flex items-center gap-4"><span className="font-medium">{formatPaisa(o.totalPaisa)}</span>{o.mode === "whatsapp" && <a href={whatsappUrl(o)} target="_blank" rel="noopener noreferrer" className="text-sm text-rose-dark underline underline-offset-4">{t("Resend")}</a>}</div>
            </li>))}</ul>
        )}
      </section>
    </div>
  );
}
