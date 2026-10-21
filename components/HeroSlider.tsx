"use client";
import Image from "next/image";
import Link from "@/components/L";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Emblem } from "./Logo";
import { useT } from "./I18nProvider";

export interface Slide { id: string; kicker: string; title: string; text?: string; cta: { label: string; href: string }; image?: string; brand?: boolean }

/** Accessible carousel: autoplay pauses on hover/focus, honours reduced-motion, keyboard + dots. */
export default function HeroSlider({ slides }: { slides: Slide[] }) {
  const t = useT();
  const [i, setI] = useState(0); const [paused, setPaused] = useState(false);
  const reduced = useRef(false);
  useEffect(() => { reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches; }, []);
  const go = useCallback((n: number) => setI((n + slides.length) % slides.length), [slides.length]);
  useEffect(() => {
    if (paused || slides.length < 2 || reduced.current) return;
    const timer = setInterval(() => setI((x) => (x + 1) % slides.length), 6500);
    return () => clearInterval(timer);
  }, [paused, slides.length]);

  return (
    <section aria-roledescription="carousel" aria-label={t("Featured")} className="relative overflow-hidden bg-gradient-to-b from-blush/50 to-cream" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
      onKeyDown={(e) => { if (e.key === "ArrowRight") go(i + 1); if (e.key === "ArrowLeft") go(i - 1); }}>
      <div className="grid">
        {slides.map((s, idx) => (
          <div key={s.id} role="group" aria-roledescription="slide" aria-label={t("{a} of {b}", { a: idx + 1, b: slides.length })} aria-hidden={idx !== i} className={`col-start-1 row-start-1 transition-opacity duration-700 ${idx === i ? "z-10 opacity-100" : "pointer-events-none opacity-0"}`}>
            {s.brand ? (
              <div className="container-x grid h-full items-center gap-8 py-10 pb-14 sm:gap-10 lg:min-h-[620px] lg:grid-cols-[1.1fr_1fr]">
                <div className="order-2 lg:order-1">
                  <p className="text-sm font-medium uppercase tracking-[.3em] text-rose-dark">{s.kicker}</p>
                  <h1 className="h-display mt-4 text-[2.7rem] leading-[1.04] sm:text-6xl lg:text-7xl">{s.title}</h1>
                  {s.text && <p className="mt-5 max-w-md text-lg leading-8 text-ink/75">{s.text}</p>}
                  <Link href={s.cta.href} className="btn-primary mt-8 px-9" tabIndex={idx === i ? 0 : -1}>{s.cta.label}</Link>
                </div>
                <div className="order-1 px-5 lg:order-2"><Emblem size={470} priority={idx === 0} /></div>
              </div>
            ) : (
              <div className="relative h-full min-h-[460px] sm:min-h-[520px] lg:min-h-[620px]">
                {s.image && <Image src={s.image} alt="" fill sizes="100vw" className="object-cover object-[center_28%]" priority={idx === 0} />}
                <div className="absolute inset-0 bg-gradient-to-r from-cocoa/85 via-cocoa/45 to-transparent" />
                <div className="container-x relative flex h-full items-center py-10">
                  <div className="max-w-xl text-cream">
                    <p className="text-sm font-medium uppercase tracking-[.3em] text-blush">{s.kicker}</p>
                    <h2 className="mt-4 font-display text-5xl font-semibold leading-[1.05] sm:text-6xl">{s.title}</h2>
                    {s.text && <p className="mt-5 max-w-md text-lg leading-8 text-cream/85">{s.text}</p>}
                    <Link href={s.cta.href} className="btn mt-8 bg-blush px-9 text-cocoa hover:bg-white" tabIndex={idx === i ? 0 : -1}>{s.cta.label}</Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {slides.length > 1 && (
        <>
          <button aria-label={t("Previous slide")} onClick={() => go(i - 1)} className="absolute bottom-4 right-[4.25rem] z-20 hidden h-10 w-10 place-items-center rounded-full bg-cream/90 shadow-card hover:bg-white md:grid lg:right-24"><ChevronLeft size={20} /></button>
          <button aria-label={t("Next slide")} onClick={() => go(i + 1)} className="absolute bottom-4 right-4 z-20 hidden h-10 w-10 place-items-center rounded-full bg-cream/90 shadow-card hover:bg-white md:grid lg:right-8"><ChevronRight size={20} /></button>
          <div className="absolute inset-x-0 bottom-5 z-20 flex justify-center gap-2" role="tablist" aria-label={t("Choose slide")}>
            {slides.map((s, idx) => <button key={s.id} role="tab" aria-selected={idx === i} aria-label={t("Slide {n}", { n: idx + 1 })} onClick={() => setI(idx)} className={`h-2 rounded-full transition-all ${idx === i ? "w-8 bg-rose-dark" : "w-2 bg-rose/40"}`} />)}
          </div>
        </>
      )}
    </section>
  );
}
