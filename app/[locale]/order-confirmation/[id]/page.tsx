"use client";
import Link from "@/components/L";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, MessageCircle } from "lucide-react";
import { api } from "@/lib/api";
import { COMMERCE_API } from "@/lib/env";
import { formatDate, formatPaisa } from "@/lib/format";
import { loadOrder, saveOrder, whatsappUrl } from "@/lib/orders";
import type { OrderView } from "@/lib/types";
import { LogoMark } from "@/components/Logo";
import OrderTimeline from "@/components/OrderTimeline";
import { useT } from "@/components/I18nProvider";

export default function Confirmation({ params }: { params: { id: string } }) {
  const t = useT();
  const id = decodeURIComponent(params.id); const token = useSearchParams().get("token") ?? undefined;
  const [order, setOrder] = useState<OrderView | null | undefined>(undefined);
  useEffect(() => {
    const local = loadOrder(id); if (local) setOrder(local);
    if (COMMERCE_API && local?.mode !== "whatsapp") api.getOrder(id, token ?? local?.trackingToken).then((o) => { saveOrder(o); setOrder(o); }).catch(() => setOrder((cur) => cur ?? null));
    else if (!local) setOrder(null);
  }, [id, token]);

  if (order === undefined) return <div className="container-x py-20"><div className="skeleton mx-auto h-64 max-w-xl rounded-3xl" /></div>;
  const paid = order?.paymentStatus === "paid";
  return (
    <div className="container-x max-w-2xl py-14 text-center">
      <LogoMark size={72} className="mx-auto" />
      <h1 className="h-display mt-5 text-4xl sm:text-5xl">{order?.mode === "whatsapp" ? t("Almost there") : t("Thank you")}</h1>
      {!order ? <p className="mt-4 text-ink/70">{t("We couldn’t find order {id} on this device.", { id })} <Link href="/track-order" className="text-rose-dark underline underline-offset-4">{t("Track it with your phone number")}</Link>.</p> : (
        <>
          <p className="mt-3 text-ink/75">
            {order.mode === "whatsapp" ? t("Order {n} is ready. Send it on WhatsApp so our team can confirm it.", { n: order.orderNumber }) : paid ? t("Order {n} is confirmed and paid. A confirmation will reach you on {phone}.", { n: order.orderNumber, phone: order.address.phone }) : order.paymentMethod === "cod" ? t("Order {n} is confirmed. Pay on delivery. A confirmation will reach you on {phone}.", { n: order.orderNumber, phone: order.address.phone }) : t("Order {n} has been placed. A confirmation will reach you on {phone}.", { n: order.orderNumber, phone: order.address.phone })}
          </p>
          <div className="mt-8 rounded-3xl bg-white/70 p-6 text-left ring-1 ring-rose/20">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm"><span className="inline-flex items-center gap-1.5 rounded-full bg-blush/60 px-3 py-1 font-medium capitalize text-cocoa"><Check size={14} />{t(order.status.replace(/_/g, " "))}</span><span className="text-ink/55">{formatDate(order.createdAt, t.locale)}</span></div>
            <ul className="mt-4 divide-y divide-rose/15 text-sm">{order.items.map((l, i) => <li key={i} className="flex justify-between gap-4 py-2.5"><span>{l.name}{l.size ? ` · ${l.size}` : ""}{l.color ? ` · ${l.color}` : ""} × {l.quantity}</span><span>{formatPaisa(l.unitPricePaisa * l.quantity)}</span></li>)}</ul>
            <dl className="mt-3 space-y-1.5 border-t border-rose/20 pt-3 text-sm">
              <div className="flex justify-between"><dt>{t("Subtotal")}</dt><dd>{formatPaisa(order.subtotalPaisa)}</dd></div>
              {order.discountPaisa > 0 && <div className="flex justify-between text-emerald-700"><dt>{t("Discounts")}</dt><dd>− {formatPaisa(order.discountPaisa)}</dd></div>}
              <div className="flex justify-between"><dt>{t("Delivery")}</dt><dd>{order.shippingPaisa ? formatPaisa(order.shippingPaisa) : t("Free")}</dd></div>
              {order.codFeePaisa > 0 && <div className="flex justify-between"><dt>{t("COD fee")}</dt><dd>{formatPaisa(order.codFeePaisa)}</dd></div>}
              <div className="flex justify-between pt-1 text-lg font-medium text-cocoa"><dt>{t("Total")}</dt><dd>{formatPaisa(order.totalPaisa)}</dd></div>
            </dl>
            <p className="mt-4 text-sm text-ink/70">{t("Deliver to")} {order.address.fullName}, {[order.address.line1, order.address.line2].filter(Boolean).join(", ")}, {order.address.city} – {order.address.pincode}</p>
          </div>
          {order.timeline.length > 0 && order.mode === "api" && <div className="mt-8 text-left"><OrderTimeline order={order} /></div>}
          {order.mode === "whatsapp" && <a href={whatsappUrl(order)} target="_blank" rel="noopener noreferrer" className="btn-primary mt-8"><MessageCircle size={18} />{t("Send order on WhatsApp")}</a>}
        </>
      )}
      <div className="mt-5 flex justify-center gap-6 text-sm"><Link href="/shop" className="text-rose-dark underline underline-offset-4">{t("Continue shopping")}</Link>{COMMERCE_API && <Link href="/track-order" className="text-rose-dark underline underline-offset-4">{t("Track order")}</Link>}</div>
    </div>
  );
}
