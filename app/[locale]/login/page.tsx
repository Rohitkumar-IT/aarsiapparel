import type { Metadata } from "next";
import Image from "next/image";
import { api } from "@/lib/api";
import type { Locale } from "@/lib/i18n";
import { getT, setLocale } from "@/lib/i18n-server";
import { localePath } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: { locale: Locale } }): Promise<Metadata> {
  setLocale(params.locale); return { title: getT()("Sign in"), robots: { index: false } };
}
const safe = (p?: string) => (p && p.startsWith("/") && !p.startsWith("//") ? p : "/account");

export default function Login({ params, searchParams }: { params: { locale: Locale }; searchParams: { returnTo?: string; error?: string } }) {
  setLocale(params.locale);
  const t = getT();
  return (
    <div className="container-x grid min-h-[70vh] place-items-center py-14">
      <div className="w-full max-w-md rounded-[2rem] bg-white/70 p-8 text-center ring-1 ring-rose/25 sm:p-10">
        <Image src="/brand/monogram.webp" alt="" width={84} height={84} className="mx-auto rounded-[26%]" priority />
        <h1 className="h-display mt-4 text-4xl">{t("Welcome back")}</h1>
        <p className="mt-2 text-sm text-ink/70">{t("Sign in to see your details and check out faster.")}</p>
        {searchParams.error && <p role="alert" className="mt-5 rounded-xl bg-pink-light px-4 py-3 text-sm text-pink-dark">{t("We couldn’t sign you in with Google. Please try again.")}</p>}
        {/* Plain anchor: Google login is a full-page redirect flow, not a JSON call */}
        <a href={api.googleLoginUrl(localePath(params.locale, safe(searchParams.returnTo)))} className="btn mt-8 w-full gap-3 border border-rose/40 bg-white py-3.5 text-ink hover:bg-blush/30">
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.2 5.5-4.7 7.2l7.6 5.9c4.4-4.1 6.9-10.2 6.9-17.6z"/><path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>
          {t("Continue with Google")}
        </a>
        <p className="mt-6 text-xs text-ink/55">{t("New here? Signing in with Google creates your account automatically.")}</p>
      </div>
    </div>
  );
}
