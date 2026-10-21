"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { COMMERCE_API } from "@/lib/env";
import { formatPaisa } from "@/lib/format";
import { loadOrders, normalizePhone, validate, whatsappChatUrl } from "@/lib/orders";
import type { OrderView } from "@/lib/types";
import OrderTimeline from "@/components/OrderTimeline";
import { useT } from "@/components/I18nProvider";

export default function TrackOrder() {
  const t = useT();
  const [num, setNum] = useState(""); const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<OrderView | null>(null); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setOrder(null);
    if (!num.trim()) return setErr(t("Enter your order number"));
    if (!validate.phone(phone)) return setErr(t("Enter the 10-digit mobile number used on the order"));
    if (!COMMERCE_API) { const o = loadOrders().find((x) => x.orderNumber.toLowerCase() === num.trim().toLowerCase()); return o ? setOrder(o) : setErr(t("We couldn’t find that order on this device. Message us on WhatsApp and we’ll check.")); }
    setBusy(true);
    try { setOrder(await api.trackOrder(num.trim(), normalizePhone(phone))); } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  };
  return (
    <div className="container-x max-w-xl py-14">
      <h1 className="h-display text-4xl sm:text-5xl">{t("Track your order")}</h1>
      <p className="mt-3 text-ink/70">{t("Enter your order number and the mobile number used at checkout.")}</p>
      <form onSubmit={submit} noValidate className="mt-8 grid gap-4">
        <div><label htmlFor="n" className="mb-1.5 block text-sm font-medium text-cocoa">{t("Order number")}</label><input id="n" className="field" value={num} onChange={(e) => setNum(e.target.value)} placeholder={t("AA-100234")} /></div>
        <div><label htmlFor="p" className="mb-1.5 block text-sm font-medium text-cocoa">{t("Mobile number")}</label><input id="p" className="field" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" /></div>
        {err && <p role="alert" className="text-sm text-pink-dark">{err}</p>}
        <button className="btn-primary" disabled={busy}>{busy ? t("Checking…") : t("Track order")}</button>
      </form>
      {order && (
        <div className="mt-10 rounded-3xl bg-white/70 p-6 ring-1 ring-rose/20">
          <p className="text-sm text-ink/60">{t("Order")} {order.orderNumber}</p>
          <p className="font-display text-3xl font-semibold capitalize text-cocoa">{t(order.status.replace(/_/g, " "))}</p>
          <p className="mt-1 text-sm text-ink/70">{t("{n} item(s)", { n: order.items.length })} · {formatPaisa(order.totalPaisa)}</p>
          {order.timeline.length > 0 && <div className="mt-6"><OrderTimeline order={order} /></div>}
        </div>
      )}
      <p className="mt-8 text-sm text-ink/60">{t("Need help?")} <a className="text-rose-dark underline underline-offset-4" href={whatsappChatUrl("Hello Aarsi Apparel, I need help with my order.")} target="_blank" rel="noopener noreferrer">{t("Message us on WhatsApp")}</a>.</p>
    </div>
  );
}
