import { Banknote, Package, RotateCcw, ShieldCheck } from "lucide-react";
import { buildPromises } from "@/lib/config";
import type { StoreSettings } from "@/lib/types";
import { getT } from "@/lib/i18n-server";

const ICONS = { ship: Package, cod: Banknote, ret: RotateCcw, sec: ShieldCheck } as const;
export default function TrustBar({ settings }: { settings: StoreSettings }) {
  const t = getT();
  const items = buildPromises(settings, t);
  return (
    <div className="hidden border-b border-rose/15 bg-blush/30 md:block">
      <ul className="container-x flex items-center justify-between gap-6 py-2 text-[12px] text-cocoa">
        {items.map((p) => { const I = ICONS[p.key as keyof typeof ICONS]; return <li key={p.key} className="flex items-center gap-2"><I size={15} className="text-rose" strokeWidth={1.6} /><span className="font-medium">{p.title}</span></li>; })}
      </ul>
    </div>
  );
}
