"use client";
import { useCallback, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import Media from "@/components/Media";
import type { Media as M } from "@/lib/types";

/**
 * Product gallery.
 *  • Desktop: vertical thumbnail rail + large 4:5 image (arrow keys work).
 *  • Mobile: native scroll-snap swipe with dots (no JS drag code, smooth on low-end phones).
 * Only the first image is `priority`; the rest lazy-load.
 */
export default function Gallery({ media, name }: { media: M[]; name: string }) {
  const items = media.length ? media : [{ url: "", alt: name, type: "image" as const }];
  const [i, setI] = useState(0);
  const track = useRef<HTMLUListElement>(null);
  const go = useCallback((n: number) => {
    const next = (n + items.length) % items.length;
    setI(next);
    const el = track.current?.children[next] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [items.length]);
  const onScroll = () => {
    const t = track.current; if (!t) return;
    const idx = Math.round(t.scrollLeft / t.clientWidth);
    if (idx !== i) setI(Math.min(idx, items.length - 1));
  };
  const onKey = (e: React.KeyboardEvent) => { if (e.key === "ArrowRight") go(i + 1); if (e.key === "ArrowLeft") go(i - 1); };
  const cur = items[Math.min(i, items.length - 1)];

  const slide = (m: M, idx: number) => m.type === "video"
    ? <video src={m.url} controls playsInline preload="metadata" className="h-full w-full object-cover" />
    : <Media src={m.url} alt={m.alt || `${name} — view ${idx + 1}`} sizes="(min-width:1024px) 46vw, 100vw" priority={idx === 0} />;

  return (
    <div className="grid gap-4 lg:grid-cols-[84px_1fr]" onKeyDown={onKey}>
      {items.length > 1 && (
        <ul className="order-2 hidden max-h-[640px] flex-col gap-3 overflow-y-auto lg:order-1 lg:flex [scrollbar-width:none]" aria-label="Product images">
          {items.map((m, idx) => (
            <li key={m.url + idx}>
              <button type="button" onClick={() => go(idx)} aria-label={`Show image ${idx + 1}`} aria-current={idx === i} className={`relative block aspect-[4/5] w-full overflow-hidden rounded-lg ring-2 transition ${idx === i ? "ring-rose" : "ring-transparent opacity-70 hover:opacity-100"}`}>
                {m.type === "video" ? <span className="grid h-full place-items-center bg-cocoa text-cream"><Play size={16} /></span> : <Media src={m.url} alt="" sizes="84px" />}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative order-1 lg:order-2">
        {/* Mobile: swipe track. Desktop: shows the active slide only. */}
        <ul ref={track} onScroll={onScroll} className="flex snap-x snap-mandatory overflow-x-auto rounded-2xl [scrollbar-width:none] lg:block lg:overflow-hidden" aria-roledescription="carousel" aria-label={`${name} images`}>
          {items.map((m, idx) => (
            <li key={m.url + idx} className={`relative aspect-[4/5] w-full shrink-0 snap-center overflow-hidden bg-blush/40 ring-1 ring-rose/15 ${idx === i ? "" : "lg:hidden"}`} aria-roledescription="slide" aria-label={`${idx + 1} of ${items.length}`}>
              {slide(m, idx)}
            </li>
          ))}
        </ul>
        {items.length > 1 && (<>
          <button type="button" aria-label="Previous image" onClick={() => go(i - 1)} className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-cream/90 text-cocoa shadow-card hover:bg-white lg:grid"><ChevronLeft size={20} /></button>
          <button type="button" aria-label="Next image" onClick={() => go(i + 1)} className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-cream/90 text-cocoa shadow-card hover:bg-white lg:grid"><ChevronRight size={20} /></button>
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5 lg:hidden" aria-hidden>
            {items.map((_, idx) => <span key={idx} className={`h-1.5 rounded-full transition-all ${idx === i ? "w-5 bg-cocoa" : "w-1.5 bg-cocoa/35"}`} />)}
          </div>
        </>)}
        <span className="sr-only" aria-live="polite">Showing {cur.alt || name}, image {i + 1} of {items.length}</span>
      </div>
    </div>
  );
}
