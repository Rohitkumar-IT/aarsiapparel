import { Banknote, Truck, ShieldCheck } from "lucide-react";
import { formatPaisa } from "@/lib/format";
import type { StoreSettings } from "@/lib/types";

/** Reassurance row (mirrors the reference site). Every item is derived from real store settings. */
export default function TrustStrip({ settings }: { settings: StoreSettings }) {
  const items: { Icon: typeof Truck; label: string }[] = [];
  const free = settings.freeShippingThresholdPaisa;
  if (free) items.push({ Icon: Truck, label: `Free shipping above ${formatPaisa(free)}` });
  else if (settings.shippingFeePaisa === 0) items.push({ Icon: Truck, label: "Free shipping" });
  if (settings.codAvailable) items.push({ Icon: Banknote, label: "Cash on delivery" });
  items.push({ Icon: ShieldCheck, label: "Secure checkout" });
  return (
    <ul className="border-y border-rose/20 bg-white/50">
      <li className="container-x">
        <ul className="grid grid-cols-2 gap-y-3 py-4 text-xs text-cocoa sm:flex sm:justify-between sm:text-sm">
          {items.map(({ Icon, label }) => <li key={label} className="flex items-center justify-center gap-2.5"><Icon size={18} strokeWidth={1.4} className="shrink-0 text-rose" />{label}</li>)}
        </ul>
      </li>
    </ul>
  );
}
