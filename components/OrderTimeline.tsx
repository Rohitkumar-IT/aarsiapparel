"use client";
import { Check } from "lucide-react";
import { formatDate } from "@/lib/format";
import type { OrderView } from "@/lib/types";
import { useT } from "@/components/I18nProvider";

export default function OrderTimeline({ order }: { order: OrderView }) {
  const t = useT();
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-cocoa">{t("Order progress")}</h2>
      <ol className="mt-4 space-y-4 border-l-2 border-rose/30 pl-6">
        {order.timeline.map((ev, i) => (
          <li key={i} className="relative">
            <span className="absolute -left-[33px] grid h-5 w-5 place-items-center rounded-full bg-rose text-white"><Check size={12} /></span>
            <p className="font-medium capitalize text-cocoa">{t(ev.label)}</p>{ev.at && <p className="text-xs text-ink/55">{formatDate(ev.at, t.locale)}</p>}
          </li>
        ))}
      </ol>
      {order.tracking?.awb && <p className="mt-5 text-sm">{t("Courier:")} <b>{order.tracking.carrier ?? "—"}</b> · {t("AWB")} <b>{order.tracking.awb}</b>{order.tracking.url && <> · <a className="text-rose-dark underline underline-offset-4" href={order.tracking.url} target="_blank" rel="noopener noreferrer">{t("Track shipment")}</a></>}</p>}
    </div>
  );
}
