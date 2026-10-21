"use client";
import Link from "next/link";
import { X } from "lucide-react";
import { useShop } from "@/lib/store";
import Media from "@/components/Media";
import Price from "@/components/Price";

export default function Wishlist() {
  const { ready, wishlist, toggleWish } = useShop();
  return (
    <div className="container-x py-12">
      <h1 className="h-display mb-8 text-4xl sm:text-5xl">Wishlist</h1>
      {!ready ? <div className="skeleton h-64 rounded-3xl" /> : wishlist.length === 0 ? (
        <div className="py-16 text-center"><p className="font-display text-3xl text-cocoa">Nothing saved yet</p><p className="mt-2 text-ink/70">Tap the heart on any piece to keep it here.</p><Link href="/shop" className="btn-primary mt-6">Browse the shop</Link></div>
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 lg:grid-cols-4">
          {wishlist.map((w) => (
            <li key={w.id} className="relative">
              <Link href={`/product/${w.slug}`} className="block">
                <div className="relative aspect-[3/4] overflow-hidden rounded-t-[999px] rounded-b-2xl bg-blush/40"><Media src={w.image} alt={w.name} sizes="(min-width:1024px) 25vw, 50vw" /></div>
                <h2 className="mt-3 line-clamp-2 font-display text-lg font-semibold text-cocoa">{w.name}</h2>
                <Price paisa={w.pricePaisa} mrp={w.mrpPaisa} />
              </Link>
              <button aria-label={`Remove ${w.name}`} onClick={() => toggleWish({ id: w.id } as never)} className="absolute right-2 top-[12%] grid h-9 w-9 place-items-center rounded-full bg-cream/90 shadow-card"><X size={16} /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
