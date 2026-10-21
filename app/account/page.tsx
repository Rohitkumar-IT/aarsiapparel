"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useShop } from "@/lib/store";
import { formatPaisa } from "@/lib/format";
import { loadOrders, whatsappUrl } from "@/lib/orders";

type LocalOrder = ReturnType<typeof loadOrders>[number];

export default function Account() {
  const { customer, authLoading, logout, wishlist } = useShop();
  const [orders, setOrders] = useState<LocalOrder[]>([]);
  useEffect(() => setOrders(loadOrders()), []);

  if (authLoading) return <div className="container-x py-16"><div className="skeleton h-48 rounded-3xl" /></div>;
  if (!customer) return (
    <div className="container-x py-24 text-center"><h1 className="h-display text-4xl">Sign in to view your account</h1><Link href="/login?returnTo=/account" className="btn-primary mt-8">Sign in</Link></div>
  );
  return (
    <div className="container-x max-w-4xl py-12">
      <h1 className="h-display mb-8 text-4xl sm:text-5xl">My account</h1>
      <section className="flex flex-wrap items-center gap-5 rounded-3xl bg-white/70 p-6 ring-1 ring-rose/20">
        {customer.avatarUrl ? <Image src={customer.avatarUrl} alt="" width={64} height={64} className="rounded-full" unoptimized /> : <span className="grid h-16 w-16 place-items-center rounded-full bg-blush font-display text-2xl text-cocoa">{customer.name.charAt(0).toUpperCase()}</span>}
        <div className="min-w-0 flex-1"><p className="font-display text-2xl font-semibold text-cocoa">{customer.name}</p><p className="truncate text-sm text-ink/65">{customer.email}</p></div>
        <button onClick={logout} className="btn-ghost">Sign out</button>
      </section>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link href="/wishlist" className="rounded-2xl bg-blush/40 p-5 hover:bg-blush/60"><p className="font-display text-xl text-cocoa">Wishlist</p><p className="text-sm text-ink/65">{wishlist.length} saved</p></Link>
        <Link href="/shop" className="rounded-2xl bg-blush/40 p-5 hover:bg-blush/60"><p className="font-display text-xl text-cocoa">Keep shopping</p><p className="text-sm text-ink/65">See what’s new</p></Link>
      </div>
      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold text-cocoa">Recent orders on this device</h2>
        {orders.length === 0 ? <p className="mt-3 text-sm text-ink/65">No orders yet.</p> : (
          <ul className="mt-4 space-y-3">{orders.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose/20 bg-white/60 p-4">
              <div><Link href={`/order-confirmation/${o.id}`} className="font-medium text-cocoa underline underline-offset-4">{o.id}</Link><p className="text-xs text-ink/60">{o.items.reduce((s, l) => s + l.quantity, 0)} items</p></div>
              <div className="flex items-center gap-4"><span className="font-medium">{formatPaisa(o.totalPaisa)}</span><a href={whatsappUrl(o)} target="_blank" rel="noopener noreferrer" className="text-sm text-rose-dark underline underline-offset-4">Resend</a></div>
            </li>))}</ul>
        )}
      </section>
    </div>
  );
}
