"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "./api";
import { COMMERCE_API } from "./env";
import { useShop, type CartLine } from "./store";
import type { PaymentMethod, Quote } from "./types";

/** Server-priced quote (tier/coupon/prepaid/shipping/GST) when the API is on; local estimate otherwise. */
export function useQuote(lines: CartLine[], opts: { coupon?: string; pincode?: string; payment: PaymentMethod }) {
  const { settings } = useShop();
  const [remote, setRemote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);
  const sig = JSON.stringify([lines.map((l) => [l.productId, l.variantId, l.qty]), opts.coupon, opts.pincode, opts.payment]);

  const local = useMemo<Quote>(() => {
    const subtotal = lines.reduce((s, l) => s + l.unitPaisa * l.qty, 0);
    const free = settings.freeShippingThresholdPaisa;
    const shipping = !lines.length ? 0 : free !== undefined && subtotal >= free ? 0 : settings.shippingFeePaisa;
    return { lines: lines.map((l) => ({ productId: l.productId, variantId: l.variantId, name: l.name, imageUrl: l.image, size: l.size, color: l.color, quantity: l.qty, unitPricePaisa: l.unitPaisa, mrpPaisa: l.mrpPaisa, lineTotalPaisa: l.unitPaisa * l.qty, available: true })),
      subtotalPaisa: subtotal, couponDiscountPaisa: 0, prepaidDiscountPaisa: 0, shippingPaisa: shipping, codFeePaisa: 0, gstIncludedPaisa: 0, totalPaisa: subtotal + shipping, messages: [] };
  }, [lines, settings]);

  useEffect(() => {
    if (!COMMERCE_API || !lines.length) { setRemote(null); return; }
    const id = ++seq.current;
    setLoading(true);
    const t = setTimeout(() => {
      api.quote({ items: lines.map((l) => ({ productId: l.productId, variantId: l.variantId === "default" ? undefined : l.variantId, quantity: l.qty })), couponCode: opts.coupon || undefined, pincode: opts.pincode || undefined, paymentMethod: opts.payment })
        .then((q) => { if (id === seq.current) { setRemote(q); setError(null); } })
        .catch((e: Error) => { if (id === seq.current) { setRemote(null); setError(e.message); } })
        .finally(() => id === seq.current && setLoading(false));
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  return { quote: remote ?? local, loading, error, isRemote: !!remote };
}
