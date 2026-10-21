"use client";
import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { useT } from "./I18nProvider";

/** Appears after scrolling; smooth-scrolls to top (instant for reduced-motion users). */
export default function BackToTop() {
  const t = useT(); const [show, setShow] = useState(false);
  useEffect(() => {
    let ticking = false;
    const on = () => { if (ticking) return; ticking = true; requestAnimationFrame(() => { setShow(window.scrollY > 900); ticking = false; }); };
    window.addEventListener("scroll", on, { passive: true }); on();
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <button type="button" aria-label={t("Back to top")} tabIndex={show ? 0 : -1}
      onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}
      className={`fixed bottom-20 right-4 z-40 grid h-11 w-11 place-items-center rounded-full bg-cocoa text-cream shadow-soft transition-all duration-300 hover:bg-rose-dark lg:bottom-6 ${show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`}
      style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}><ArrowUp size={18} /></button>
  );
}
