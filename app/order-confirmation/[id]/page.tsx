"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { loadOrder, whatsappUrl } from "@/lib/orders";
import { orderApi, type Order } from "@/lib/orderApi";
import { formatPaisa } from "@/lib/format";

export default function Confirmation({ params }: { params: { id: string } }) {
  const token = useSearchParams().get("t") ?? undefined;
  const [local, setLocal] = useState<ReturnType<typeof loadOrder> | undefined>(undefined);
  const [order, setOrder] = useState<Order | null | undefined>(undefined);

  useEffect(() => {
    orderApi.get(params.id, token).then(setOrder).catch(() => setOrder(null));
    setLocal(loadOrder(params.id));
  }, [params.id, token]);

  if (order === undefined || local === undefined) return <div className="container-x py-20"><div className="skeleton mx-auto h-64 max-w-xl rounded-3xl" /></div>;
  const rows = order ? order.lines.map((l) => ({ k: l.variantId, t: `${l.name} × ${l.qty}`, p: l.linePaisa })) : local ? local.items.map((l, i) => ({ k: `${l.name}-${l.size ?? ""}-${l.color ?? ""}-${i}`, t: `${l.name}${l.size ? ` · ${l.size}` : ""}${l.color ? ` · ${l.color}` : ""} × ${l.quantity}`, p: l.unitPricePaisa * l.quantity })) : [];
  const total = order?.totalPaisa ?? local?.totalPaisa ?? 0;
  const addr = order?.shippingAddress ?? local?.address;

  return (
    <div className="container-x max-w-xl py-16 text-center">
      <LogoMark size={72} className="mx-auto" />
      <h1 className="h-display mt-4 text-4xl sm:text-5xl">Thank you</h1>
      {!order && !local ? <p className="mt-4 text-ink/70">We couldn’t find order {params.id}.</p> : (
        <>
          <p className="mt-3 text-ink/75">
            {order ? <>Order <strong className="text-cocoa">{order.orderNumber}</strong> is {order.paymentStatus === "PAID" ? "confirmed and paid" : "placed"}. We’ll message you when it ships.</> : <>Order <strong className="text-cocoa">{local!.id}</strong> is ready. Send it on WhatsApp so our team can confirm it. If WhatsApp didn’t open, use the button below.</>}
          </p>
          <div className="mt-8 rounded-3xl bg-white/70 p-6 text-left ring-1 ring-rose/20">
            <ul className="divide-y divide-rose/15 text-sm">{rows.map((r) => <li key={r.k} className="flex justify-between gap-4 py-2.5"><span>{r.t}</span><span>{formatPaisa(r.p)}</span></li>)}</ul>
            <p className="mt-3 flex justify-between border-t border-rose/20 pt-3 text-lg font-medium text-cocoa"><span>Total</span><span>{formatPaisa(total)}</span></p>
            {order && <p className="mt-2 text-xs text-ink/60">Payment: {order.paymentMethod === "COD" ? "Cash on delivery" : order.paymentStatus === "PAID" ? "Paid online" : "Awaiting payment"}</p>}
            {addr && <p className="mt-4 text-sm text-ink/70">Deliver to {"name" in addr && addr.name ? `${addr.name}, ` : ""}{addr.line1}, {addr.city} – {addr.pincode}</p>}
          </div>
          {!order && local && <a href={whatsappUrl(local)} target="_blank" rel="noopener noreferrer" className="btn-primary mt-8"><MessageCircle size={18} />Send order on WhatsApp</a>}
          {order?.tracking?.url && <a href={order.tracking.url} target="_blank" rel="noopener noreferrer" className="btn-primary mt-8">Track shipment</a>}
        </>
      )}
      <div className="mt-4"><Link href="/shop" className="text-sm text-rose-dark underline underline-offset-4">Continue shopping</Link></div>
    </div>
  );
}
