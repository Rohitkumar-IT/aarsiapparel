"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { api } from "./api";
import type { Customer, Product, StoreSettings, Variant } from "./types";

/* ───────── localStorage helpers (cart + wishlist live in the browser) ───────── */
const K = { cart: "aarsi.cart.v1", wish: "aarsi.wishlist.v1" } as const;
function read<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
}
function write(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota/private mode */ } }

export interface CartLine {
  key: string; productId: string; slug: string; name: string; image: string;
  variantId: string; size?: string; color?: string;
  unitPaisa: number; mrpPaisa?: number; qty: number; maxQty: number;
}
export interface WishItem { id: string; slug: string; name: string; image: string; pricePaisa: number; mrpPaisa?: number }

interface Toast { id: number; message: string; tone: "ok" | "error" }

interface Ctx {
  settings: StoreSettings;
  ready: boolean;
  cart: CartLine[]; cartCount: number; subtotalPaisa: number; shippingPaisa: number; totalPaisa: number; freeShippingGapPaisa: number;
  addToCart: (p: Product, v: Variant | undefined, qty?: number) => void;
  setQty: (key: string, qty: number) => void; removeLine: (key: string) => void; clearCart: () => void;
  wishlist: WishItem[]; toggleWish: (p: Product) => void; isWished: (id: string) => boolean;
  drawerOpen: boolean; openDrawer: () => void; closeDrawer: () => void;
  customer: Customer | null; authLoading: boolean; logout: () => Promise<void>;
  toast: Toast | null; notify: (message: string, tone?: "ok" | "error") => void;
}
const C = createContext<Ctx | null>(null);
export const useShop = () => { const c = useContext(C); if (!c) throw new Error("useShop outside provider"); return c; };

export function ShopProvider({ children, settings }: { children: ReactNode; settings: StoreSettings }) {
  const [ready, setReady] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<WishItem[]>([]);
  const [drawerOpen, setDrawer] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<number>();

  useEffect(() => {
    setCart(read<CartLine[]>(K.cart, []));
    setWishlist(read<WishItem[]>(K.wish, []));
    setReady(true);
    const onStorage = (e: StorageEvent) => { // keep tabs in sync
      if (e.key === K.cart) setCart(read(K.cart, []));
      if (e.key === K.wish) setWishlist(read(K.wish, []));
    };
    window.addEventListener("storage", onStorage);
    let alive = true;
    api.me().then((c) => alive && setCustomer(c)).catch(() => undefined).finally(() => alive && setAuthLoading(false));
    return () => { alive = false; window.removeEventListener("storage", onStorage); };
  }, []);

  useEffect(() => { if (ready) write(K.cart, cart); }, [cart, ready]);
  useEffect(() => { if (ready) write(K.wish, wishlist); }, [wishlist, ready]);

  const notify = useCallback((message: string, tone: "ok" | "error" = "ok") => {
    setToast({ id: Date.now(), message, tone });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 2800);
  }, []);

  const addToCart = useCallback((p: Product, v: Variant | undefined, qty = 1) => {
    const variantId = v?.id ?? "default";
    const key = `${p.id}:${variantId}`;
    const maxQty = v?.stock ?? 10;
    const unit = v?.pricePaisa ?? p.pricePaisa;
    setCart((prev) => {
      const found = prev.find((l) => l.key === key);
      if (found) return prev.map((l) => (l.key === key ? { ...l, qty: Math.min(l.qty + qty, l.maxQty), unitPaisa: unit } : l));
      return [...prev, { key, productId: p.id, slug: p.slug, name: p.name, image: p.image?.url ?? "", variantId, size: v?.size, color: v?.color, unitPaisa: unit, mrpPaisa: v?.mrpPaisa ?? p.mrpPaisa, qty: Math.min(qty, maxQty), maxQty }];
    });
    setDrawer(true);
  }, []);
  const setQty = useCallback((key: string, qty: number) =>
    setCart((prev) => prev.flatMap((l) => (l.key !== key ? [l] : qty <= 0 ? [] : [{ ...l, qty: Math.min(qty, l.maxQty) }]))), []);
  const removeLine = useCallback((key: string) => setCart((p) => p.filter((l) => l.key !== key)), []);
  const clearCart = useCallback(() => setCart([]), []);

  const toggleWish = useCallback((p: Product) => {
    setWishlist((prev) => {
      if (prev.some((w) => w.id === p.id)) { notify("Removed from wishlist"); return prev.filter((w) => w.id !== p.id); }
      notify("Saved to wishlist");
      return [...prev, { id: p.id, slug: p.slug, name: p.name, image: p.image?.url ?? "", pricePaisa: p.pricePaisa, mrpPaisa: p.mrpPaisa }];
    });
  }, [notify]);
  const isWished = useCallback((id: string) => wishlist.some((w) => w.id === id), [wishlist]);

  const logout = useCallback(async () => {
    try { await api.logout(); } catch { /* idempotent; clear locally regardless */ }
    setCustomer(null); notify("Signed out");
  }, [notify]);

  const value = useMemo<Ctx>(() => {
    const subtotalPaisa = cart.reduce((s, l) => s + l.unitPaisa * l.qty, 0);
    const free = settings.freeShippingThresholdPaisa;
    const shippingPaisa = !cart.length ? 0 : free !== undefined && subtotalPaisa >= free ? 0 : settings.shippingFeePaisa;
    return {
      settings, ready, cart, cartCount: cart.reduce((s, l) => s + l.qty, 0), subtotalPaisa, shippingPaisa, totalPaisa: subtotalPaisa + shippingPaisa,
      freeShippingGapPaisa: free !== undefined && cart.length ? Math.max(0, free - subtotalPaisa) : 0,
      addToCart, setQty, removeLine, clearCart, wishlist, toggleWish, isWished,
      drawerOpen, openDrawer: () => setDrawer(true), closeDrawer: () => setDrawer(false),
      customer, authLoading, logout, toast, notify,
    };
  }, [ready, cart, wishlist, drawerOpen, customer, authLoading, toast, settings, addToCart, setQty, removeLine, clearCart, toggleWish, isWished, logout, notify]);

  return <C.Provider value={value}>{children}</C.Provider>;
}
