import Image from "next/image";
import Link from "@/components/L";
import { getT } from "@/lib/i18n-server";
export default function NotFound() {
  const t = getT();
  return (
    <div className="container-x py-24 text-center">
      <Image src="/brand/monogram.webp" alt="" width={80} height={80} className="mx-auto opacity-70" />
      <h1 className="h-display mt-4 text-5xl">{t("We can’t find that page")}</h1>
      <p className="mt-3 text-ink/70">{t("It may have moved or no longer exists.")}</p>
      <div className="mt-8 flex justify-center gap-3"><Link href="/" className="btn-primary">{t("Go home")}</Link><Link href="/shop" className="btn-ghost">{t("Shop all")}</Link></div>
    </div>
  );
}
