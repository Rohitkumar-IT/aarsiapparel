import { Plus } from "lucide-react";
import { getT } from "@/lib/i18n-server";
/** Native <details> accordion: zero JS, accessible, crawlable. */
export default function Faq({ items, title }: { items: { q: string; a: string }[]; title?: string }) {
  const t = getT();
  return (
    <section className="container-x grid gap-6 py-12 sm:py-16 lg:grid-cols-[1fr_1.6fr] lg:gap-16" aria-labelledby="faq-h">
      <h2 id="faq-h" className="h-display text-3xl sm:text-4xl">{title ?? t("Frequently asked questions")}</h2>
      <div className="max-w-2xl divide-y divide-rose/20 border-y border-rose/20">
        {items.map((f) => (
          <details key={f.q} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-cocoa [&::-webkit-details-marker]:hidden">{f.q}<Plus size={18} className="shrink-0 text-rose transition-transform group-open:rotate-45" /></summary>
            <p className="mt-3 leading-7 text-ink/75">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
