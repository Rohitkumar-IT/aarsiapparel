"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import type { Category, Collection } from "@/lib/types";
import { useT } from "@/components/I18nProvider";

const SORTS = [["new", "Newest"], ["price-low", "Price: low to high"], ["price-high", "Price: high to low"], ["name_asc", "Name A–Z"], ["name_desc", "Name Z–A"]];
const FLAGS = [["sale", "On sale"], ["newArrival", "New arrivals"], ["bestSeller", "Best sellers"], ["trending", "Trending"], ["featured", "Featured"]];

export default function ShopFilters({ children, categories, collections, sizes, colors, fabrics, total }: { children: React.ReactNode; categories: Category[]; collections: Collection[]; sizes: string[]; colors: string[]; fabrics: string[]; total: number }) {
  const t = useT();
  const router = useRouter(); const path = usePathname(); const sp = useSearchParams();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [min, setMin] = useState(sp.get("minPricePaisa") ? String(Number(sp.get("minPricePaisa")) / 100) : "");
  const [max, setMax] = useState(sp.get("maxPricePaisa") ? String(Number(sp.get("maxPricePaisa")) / 100) : "");
  const [search, setSearch] = useState(sp.get("search") ?? "");

  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);

  const push = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(sp.toString());
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    next.delete("page");
    start(() => router.push(`${path}${next.toString() ? `?${next}` : ""}`, { scroll: false }));
  };
  const toggle = (k: string, v: string) => push({ [k]: sp.get(k) === v ? undefined : v });
  const active = Array.from(sp.keys()).filter((k) => k !== "page" && k !== "sort").length;

  const group = (title: string, items: [string, string][], key: string, chip = false) => items.length === 0 ? null : (
    <fieldset className="border-b border-rose/15 py-5">
      <legend className="mb-3 font-display text-xl font-semibold text-cocoa">{t(title)}</legend>
      <div className={chip ? "flex flex-wrap gap-2" : "space-y-1"}>
        {items.map(([v, label]) => chip
          ? <button key={v} type="button" className="chip" aria-pressed={sp.get(key) === v} onClick={() => toggle(key, v)}>{label}</button>
          : <label key={v} className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-1.5 text-sm hover:bg-blush/30"><input type="radio" name={key} checked={sp.get(key) === v} onChange={() => toggle(key, v)} onClick={() => sp.get(key) === v && toggle(key, v)} className="accent-[#8C4A2D]" />{t(label)}</label>)}
      </div>
    </fieldset>
  );

  const panel = (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); push({ search: search.trim() || undefined }); }} role="search" className="pb-5">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("Search products")} aria-label={t("Search products")} className="field" />
      </form>
      {group("Category", categories.map((c) => [c.slug, c.name]), "category")}
      {group("Collection", collections.map((c) => [c.slug, c.name]), "collection")}
      {group("Size", sizes.map((s) => [s, s]), "size", true)}
      {group("Colour", colors.map((c) => [c, c]), "color", true)}
      {group("Fabric", fabrics.map((f) => [f, f]), "fabric", true)}
      <fieldset className="border-b border-rose/15 py-5">
        <legend className="mb-3 font-display text-xl font-semibold text-cocoa">{t("Price (₹)")}</legend>
        <div className="flex items-center gap-2">
          <input inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} placeholder={t("Min")} aria-label={t("Minimum price")} className="field" />
          <span aria-hidden>–</span>
          <input inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} placeholder={t("Max")} aria-label={t("Maximum price")} className="field" />
        </div>
        <button type="button" className="btn-ghost mt-3 w-full py-2" onClick={() => push({ minPricePaisa: min ? String(Number(min) * 100) : undefined, maxPricePaisa: max ? String(Number(max) * 100) : undefined })}>{t("Apply price")}</button>
      </fieldset>
      <fieldset className="py-5">
        <legend className="mb-3 font-display text-xl font-semibold text-cocoa">{t("Highlights")}</legend>
        {FLAGS.map(([k, label]) => (
          <label key={k} className="flex cursor-pointer items-center gap-3 py-1.5 text-sm"><input type="checkbox" checked={sp.get(k) === "true"} onChange={() => push({ [k]: sp.get(k) === "true" ? undefined : "true" })} className="accent-[#8C4A2D]" />{t(label)}</label>
        ))}
      </fieldset>
      {active > 0 && <button type="button" onClick={() => { setSearch(""); setMin(""); setMax(""); start(() => router.push(path, { scroll: false })); }} className="btn-ghost w-full">{t("Clear all filters")}</button>}
    </div>
  );

  return (
    <div className="grid gap-10 lg:grid-cols-[270px_1fr]">
      <aside className="hidden lg:block" aria-label={t("Filters")}>{panel}</aside>
      <div className={pending ? "opacity-60 transition-opacity" : "transition-opacity"}>
        <div className="mb-6 flex items-center justify-between gap-3">
          <button type="button" onClick={() => setOpen(true)} className="btn-ghost px-5 py-2.5 lg:hidden"><SlidersHorizontal size={16} />{t("Filters")}{active > 0 && ` (${active})`}</button>
          <p className="hidden text-sm text-ink/60 lg:block" aria-live="polite">{total === 1 ? t("1 piece") : t("{n} pieces", { n: total })}</p>
          <label className="ml-auto flex items-center gap-2 text-sm">{t("Sort")}
            <select value={sp.get("sort") ?? "new"} onChange={(e) => push({ sort: e.target.value === "new" ? undefined : e.target.value })} className="field !w-auto py-2">
              {SORTS.map(([v, l]) => <option key={v} value={v}>{t(l)}</option>)}
            </select>
          </label>
        </div>
        {children}
      </div>
      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label={t("Filters")}>
          <div className="absolute inset-0 bg-cocoa/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col bg-cream">
            <div className="flex items-center justify-between border-b border-rose/20 px-5 py-4"><h2 className="font-display text-2xl font-semibold">{t("Filters")}</h2><button aria-label={t("Close filters")} onClick={() => setOpen(false)}><X size={22} /></button></div>
            <div className="flex-1 overflow-y-auto px-5 py-4">{panel}</div>
            <div className="border-t border-rose/20 p-4"><button className="btn-primary w-full" onClick={() => setOpen(false)}>{t("Show {n} pieces", { n: total })}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
