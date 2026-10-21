import Link from "@/components/L";
import type { ReactNode } from "react";
import { getT } from "@/lib/i18n-server";

export default function Section({ title, href, linkLabel, children, className = "" }: { title: string; href?: string; linkLabel?: string; children: ReactNode; className?: string }) {
  const t = getT();
  return (
    <section className={`container-x py-12 sm:py-16 ${className}`}>
      <div className="mb-8 flex items-end justify-between gap-4">
        <h2 className="h-display text-3xl sm:text-4xl">{title}</h2>
        {href && <Link href={href} className="shrink-0 text-sm font-medium text-rose-dark underline-offset-4 hover:underline">{linkLabel ?? t("View all")}</Link>}
      </div>
      {children}
    </section>
  );
}
