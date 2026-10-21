"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { COMMERCE_API, STORE } from "@/lib/env";
import { validate } from "@/lib/orders";
import { useT } from "@/components/I18nProvider";

export default function Newsletter() {
  const t = useT();
  const [email, setEmail] = useState(""); const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle"); const [msg, setMsg] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !validate.email(email)) { setState("error"); setMsg(t("Enter a valid email address.")); return; }
    if (!COMMERCE_API) { window.location.href = `mailto:${STORE.email}?subject=${encodeURIComponent("Please add me to your mailing list")}&body=${encodeURIComponent(email)}`; return; }
    setState("busy");
    try { await api.subscribe(email); setState("done"); setMsg(t("You’re on the list. Thank you!")); setEmail(""); }
    catch (err) { setState("error"); setMsg((err as Error).message); }
  };
  return (
    <section aria-labelledby="nl" className="bg-blush/50">
      <div className="container-x grid items-center gap-6 py-12 md:grid-cols-2">
        <div><h2 id="nl" className="h-display text-3xl sm:text-4xl">{t("Join our newsletter")}</h2><p className="mt-2 text-ink/70">{t("New arrivals and style notes, straight to your inbox.")}</p></div>
        <form onSubmit={submit} noValidate className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor="nl-email" className="sr-only">{t("Email address")}</label>
          <input id="nl-email" type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setState("idle"); }} placeholder={t("Your email address")} className="field flex-1" aria-describedby="nl-msg" />
          <button className="btn-primary px-8" disabled={state === "busy"}>{state === "busy" ? t("Subscribing…") : t("Subscribe")}</button>
        </form>
        <p id="nl-msg" role="status" className={`text-sm md:col-start-2 ${state === "error" ? "text-pink-dark" : "text-rose-dark"}`}>{msg}</p>
      </div>
    </section>
  );
}
