import { LogoMark } from "@/components/Logo";
import Link from "next/link";
export default function NotFound() {
  return (
    <div className="container-x py-24 text-center">
      <LogoMark size={80} className="mx-auto opacity-70" />
      <h1 className="h-display mt-4 text-5xl">We can’t find that page</h1>
      <p className="mt-3 text-ink/70">It may have moved or no longer exists.</p>
      <div className="mt-8 flex justify-center gap-3"><Link href="/" className="btn-primary">Go home</Link><Link href="/shop" className="btn-ghost">Shop all</Link></div>
    </div>
  );
}
