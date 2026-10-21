import Link from "@/components/L";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getT } from "@/lib/i18n-server";

export default function Pagination({ page, totalPages, basePath, params }: { page: number; totalPages: number; basePath: string; params: Record<string, string | undefined> }) {
  const t = getT();
  if (totalPages <= 1) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && k !== "page" && sp.set(k, v));
    if (p > 1) sp.set("page", String(p));
    const s = sp.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1);
  return (
    <nav aria-label={t("Pagination")} className="mt-12 flex items-center justify-center gap-1.5">
      {page > 1 && <Link href={href(page - 1)} rel="prev" aria-label={t("Previous page")} className="grid h-10 w-10 place-items-center rounded-full border border-rose/30 hover:bg-blush/50"><ChevronLeft size={18} /></Link>}
      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && p - pages[i - 1] > 1 && <span className="px-1 text-ink/40">…</span>}
          <Link href={href(p)} aria-current={p === page ? "page" : undefined} className={`grid h-10 min-w-10 place-items-center rounded-full px-3 text-sm ${p === page ? "bg-cocoa text-cream" : "border border-rose/30 hover:bg-blush/50"}`}>{p}</Link>
        </span>
      ))}
      {page < totalPages && <Link href={href(page + 1)} rel="next" aria-label={t("Next page")} className="grid h-10 w-10 place-items-center rounded-full border border-rose/30 hover:bg-blush/50"><ChevronRight size={18} /></Link>}
    </nav>
  );
}
