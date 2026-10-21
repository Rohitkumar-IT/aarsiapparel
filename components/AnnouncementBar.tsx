
import { getT } from "@/lib/i18n-server";/** Scrolling ticker (pauses on hover, static for reduced-motion). Messages come from real store settings + NEXT_PUBLIC_ANNOUNCEMENTS. */
export default function AnnouncementBar({ messages }: { messages: string[] }) {
  const t = getT();
  if (!messages.length) return null;
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {[...messages, ...messages].map((m, i) => <li key={i} className="flex items-center whitespace-nowrap px-6 text-[11px] font-medium uppercase tracking-[.18em]">{m}<span className="ml-12 text-rose-light" aria-hidden>✦</span></li>)}
    </ul>
  );
  return (
    <div className="group overflow-hidden bg-cocoa py-2.5 text-blush" role="region" aria-label={t("Store announcements")}>
      <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none">{row(false)}{row(true)}</div>
    </div>
  );
}
