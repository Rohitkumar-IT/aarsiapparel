"use client";
import Image from "next/image";
import Link from "@/components/L";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { ChevronDown, Heart, Menu, Phone, Search, ShoppingBag, User, X } from "lucide-react";
import { useShop } from "@/lib/store";
import { STORE } from "@/lib/env";
import Logo from "./Logo";
import type { Category, Collection } from "@/lib/types";
import { useLocalePath, useT } from "@/components/I18nProvider";
import LanguageSwitcher from "./LanguageSwitcher";

const NAV = [
  { href: "/shop?sort=new", label: "New in" },
  { href: "/shop", label: "Shop", mega: true },
  { href: "/collections", label: "Collections" },
  { href: "/blog", label: "Journal" },
  { href: "/shop?sale=true", label: "Sale", accent: true },
];
const SORT_LINKS = [["New arrivals", "/shop?sort=new"], ["Price: low to high", "/shop?sort=price-low"], ["Price: high to low", "/shop?sort=price-high"], ["On sale", "/shop?sale=true"]];

export default function Header({ categories, collections }: { categories: Category[]; collections: Collection[] }) {
  const t = useT();
  const lp = useLocalePath();
  const { cartCount, wishlist, openDrawer, customer } = useShop();
  const [menu, setMenu] = useState(false);
  const [mega, setMega] = useState(false);
  const [searching, setSearching] = useState(false);
  const [q, setQ] = useState("");
  const [stuck, setStuck] = useState(false);
  useEffect(() => { const on = () => setStuck(window.scrollY > 8); on(); window.addEventListener("scroll", on, { passive: true }); return () => window.removeEventListener("scroll", on); }, []);
  const path = usePathname(); const router = useRouter();
  const closeT = useRef<number>();

  useEffect(() => { setMenu(false); setSearching(false); setMega(false); }, [path]);
  useEffect(() => { document.body.style.overflow = menu ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [menu]);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && setMega(false); document.addEventListener("keydown", k); return () => document.removeEventListener("keydown", k); }, []);

  const openMega = () => { window.clearTimeout(closeT.current); setMega(true); };
  const closeMega = () => { closeT.current = window.setTimeout(() => setMega(false), 120); };
  const submit = (e: React.FormEvent) => { e.preventDefault(); const s = q.trim(); if (s) router.push(lp(`/shop?search=${encodeURIComponent(s)}`)); };
  const roots = categories.filter((c) => !c.parentId);
  const kids = (id: string) => categories.filter((c) => c.parentId === id);

  return (
    <>
    <header className={`sticky top-0 z-40 border-b border-rose/20 bg-cream/95 backdrop-blur transition-shadow duration-300 ${stuck ? "shadow-soft" : ""}`} onMouseLeave={closeMega}>
      <div className="container-x hidden h-8 items-center justify-between text-[11px] text-ink/65 lg:flex">
        <span>{t("Ship to 🇮🇳 India (₹)")}</span><span className="flex items-center gap-4"><Suspense fallback={null}><LanguageSwitcher /></Suspense></span>
        <a href={`tel:${STORE.phone.replace(/\s/g, "")}`} className="flex items-center gap-1.5 hover:text-rose-dark"><Phone size={12} />{STORE.phone}</a>
      </div>

      <div className="container-x grid h-[66px] grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex items-center">
          <button className="-ml-2 grid h-11 w-11 place-items-center rounded-full lg:hidden" aria-label={t("Open menu")} aria-expanded={menu} onClick={() => setMenu(true)}><Menu size={22} /></button>
          <nav aria-label={t("Primary")} className="hidden items-center gap-7 lg:flex">
            {NAV.map((n) => n.mega ? (
              <div key={n.href} onMouseEnter={openMega} onFocus={openMega}>
                <Link href={n.href} aria-expanded={mega} aria-haspopup="true" className="flex items-center gap-1 text-[13px] font-medium uppercase tracking-[.14em] text-ink/85 hover:text-rose-dark">{t(n.label)}<ChevronDown size={14} className={`transition-transform ${mega ? "rotate-180" : ""}`} /></Link>
              </div>
            ) : <Link key={n.href} href={n.href} onMouseEnter={() => setMega(false)} className={`text-[13px] font-medium uppercase tracking-[.14em] hover:text-rose-dark ${n.accent ? "text-pink-dark" : "text-ink/85"}`}>{t(n.label)}</Link>)}
          </nav>
        </div>

        <Logo size={46} priority />

        <div className="flex items-center justify-end gap-0.5">
          <button className="grid h-11 w-11 place-items-center rounded-full hover:bg-blush/50" aria-label={t("Search")} onClick={() => setSearching((s) => !s)}><Search size={20} /></button>
          <Link href="/wishlist" className="relative hidden h-11 w-11 place-items-center rounded-full hover:bg-blush/50 sm:grid" aria-label={t("Wishlist, {n} items", { n: wishlist.length })}>
            <Heart size={20} />{wishlist.length > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose px-1 text-[10px] text-white">{wishlist.length}</span>}
          </Link>
          <Link href={customer ? "/account" : "/login"} className="grid h-11 w-11 place-items-center rounded-full hover:bg-blush/50" aria-label={customer ? t("My account") : t("Sign in")}>
            {customer?.avatarUrl ? <Image src={customer.avatarUrl} alt="" width={28} height={28} className="rounded-full" unoptimized /> : <User size={20} />}
          </Link>
          <button className="relative grid h-11 w-11 place-items-center rounded-full hover:bg-blush/50" aria-label={t("Open bag, {n} items", { n: cartCount })} onClick={openDrawer}>
            <ShoppingBag size={20} />{cartCount > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose px-1 text-[10px] text-white">{cartCount}</span>}
          </button>
        </div>
      </div>

      {mega && (
        <div onMouseEnter={openMega} className="absolute inset-x-0 top-full hidden border-b border-rose/20 bg-cream shadow-soft lg:block animate-fadeIn">
          <div className="container-x grid grid-cols-[1fr_1fr_1.6fr] gap-10 py-8">
            <div>
              <h3 className="mb-3 font-display text-lg font-semibold text-cocoa">{t("Category")}</h3>
              <ul className="space-y-1.5 text-sm">
                <li><Link href="/shop" className="hover:text-rose-dark">{t("Shop all")}</Link></li>
                {roots.slice(0, 10).map((c) => <li key={c.id}><Link href={`/shop?category=${c.slug}`} className="hover:text-rose-dark">{c.name}</Link>{kids(c.id).length > 0 && <span className="ml-1 text-xs text-ink/40">· {kids(c.id).length}</span>}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="mb-3 font-display text-lg font-semibold text-cocoa">{t("Collection")}</h3>
              <ul className="space-y-1.5 text-sm">{SORT_LINKS.map(([l, h]) => <li key={h}><Link href={h} className="hover:text-rose-dark">{t(l)}</Link></li>)}</ul>
            </div>
            <ul className="grid grid-cols-3 gap-3">
              {collections.slice(0, 3).map((c) => (
                <li key={c.id}><Link href={`/shop?collection=${c.slug}`} className="group relative block aspect-[3/4] overflow-hidden rounded-2xl bg-cocoa">
                  {c.imageUrl && <Image src={c.imageUrl} alt="" fill sizes="180px" className="object-cover opacity-85 transition-transform duration-500 group-hover:scale-105" />}
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-cocoa/90 to-transparent p-3 text-sm font-medium uppercase tracking-wider text-cream">{c.name}</span>
                </Link></li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {searching && (
        <form onSubmit={submit} role="search" className="border-t border-rose/15 bg-white/60">
          <div className="container-x flex items-center gap-3 py-3">
            <Search size={18} className="text-rose" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Search dresses, suits, fabrics…")} aria-label={t("Search products")} className="h-10 flex-1 bg-transparent text-base outline-none placeholder:text-ink/40" />
            <button type="submit" className="btn-primary px-5 py-2">{t("Search")}</button>
          </div>
        </form>
      )}

    </header>
      {menu && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t("Menu")}>
          <div className="absolute inset-0 animate-fadeIn bg-cocoa/50" onClick={() => setMenu(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm animate-slideIn flex-col overflow-y-auto bg-cream p-6">
            <div className="mb-4 flex items-center justify-between"><Logo size={40} href={null} /><button aria-label={t("Close menu")} className="grid h-10 w-10 place-items-center" onClick={() => setMenu(false)}><X size={22} /></button></div>
            <div className="mb-4"><Suspense fallback={null}><LanguageSwitcher /></Suspense></div>
            <ul>{NAV.map((n) => <li key={n.href}><Link href={n.href} className={`block rounded-xl px-3 py-3 font-display text-2xl hover:bg-blush/40 ${n.accent ? "text-pink-dark" : "text-cocoa"}`}>{t(n.label)}</Link></li>)}
              <li><Link href="/wishlist" className="block rounded-xl px-3 py-3 font-display text-2xl text-cocoa hover:bg-blush/40">{t("Wishlist")}</Link></li>
              <li><Link href="/track-order" className="block rounded-xl px-3 py-3 font-display text-2xl text-cocoa hover:bg-blush/40">{t("Track order")}</Link></li>
            </ul>
            {roots.length > 0 && (<><p className="mb-2 mt-8 px-3 text-sm text-rose-dark">{t("Shop by category")}</p><ul>{roots.map((c) => <li key={c.id}><Link href={`/shop?category=${c.slug}`} className="block px-3 py-2 text-ink/80 hover:text-rose-dark">{c.name}</Link></li>)}</ul></>)}
          </div>
        </div>
      )}
    </>
  );
}
